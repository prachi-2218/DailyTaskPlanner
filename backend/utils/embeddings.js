const { pipeline } = require('@xenova/transformers');

class EmbeddingService {
  constructor() {
    this.embeddingPipeline = null;
    this.chromaClient = null;
    this.collection = null;
    this.isInitialized = false;
    this.taskEmbeddings = new Map(); // Fallback in-memory storage
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize the embedding pipeline using a lightweight model
      this.embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      
      // Try to initialize ChromaDB, but fall back to in-memory if it fails
      try {
        const { ChromaClient } = await import('chromadb');
        this.chromaClient = new ChromaClient();
        
        // Create collection without embedding function (we'll provide embeddings manually)
        try {
          this.collection = await this.chromaClient.getCollection({ name: "tasks" });
        } catch (error) {
          this.collection = await this.chromaClient.createCollection({ name: "tasks" });
        }
        console.log('ChromaDB initialized successfully');
      } catch (chromaError) {
        console.warn('ChromaDB initialization failed, using in-memory fallback:', chromaError.message);
        this.chromaClient = null;
        this.collection = null;
      }
      
      this.isInitialized = true;
      console.log('Embedding service initialized successfully');
      
      // Load existing embeddings from database
      if (!this.chromaClient) {
        // Only load from database if using in-memory storage
        const embeddingPersistence = require('./embeddingPersistence.js');
        await embeddingPersistence.loadAllEmbeddings();
      }
    } catch (error) {
      console.error('Failed to initialize embedding service:', error);
      throw error;
    }
  }

  async generateEmbedding(text) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Generate embedding using the transformer pipeline
      const result = await this.embeddingPipeline(text, { pooling: 'mean', normalize: true });
      return Array.from(result.data);
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  async storeTaskEmbedding(taskId, userId, title, description, embedding) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const documentText = `${title}. ${description || ''}`;
      
      if (this.collection) {
        // Use ChromaDB
        await this.collection.add({
          ids: [taskId.toString()],
          embeddings: [embedding],
          metadatas: [{
            taskId: taskId.toString(),
            userId: userId.toString(),
            title,
            description: description || '',
            createdAt: new Date().toISOString()
          }],
          documents: [documentText]
        });
      } else {
        // Fallback to in-memory storage
        this.taskEmbeddings.set(taskId.toString(), {
          taskId: taskId.toString(),
          userId: userId.toString(),
          title,
          description: description || '',
          embedding,
          documentText,
          createdAt: new Date().toISOString()
        });
      }
      
      console.log(`Stored embedding for task ${taskId}`);
    } catch (error) {
      console.error('Error storing task embedding:', error);
      throw error;
    }
  }

  async findSimilarTasks(userId, queryText, limit = 5) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(queryText);
      
      if (this.collection) {
        // Use ChromaDB
        const results = await this.collection.query({
          queryEmbeddings: [queryEmbedding],
          nResults: limit,
          where: { userId: userId.toString() }
        });
        
        // Format results
        const similarTasks = results.metadatas[0].map((metadata, index) => ({
          taskId: metadata.taskId,
          title: metadata.title,
          description: metadata.description,
          similarity: 1 - results.distances[0][index], // Convert distance to similarity
          createdAt: metadata.createdAt
        }));
        
        return similarTasks;
      } else {
        // Fallback to in-memory similarity search
        const userTasks = Array.from(this.taskEmbeddings.values())
          .filter(task => task.userId === userId.toString());
        
        // Calculate cosine similarity
        const similarities = userTasks.map(task => {
          const similarity = this.cosineSimilarity(queryEmbedding, task.embedding);
          return {
            taskId: task.taskId,
            title: task.title,
            description: task.description,
            similarity,
            createdAt: task.createdAt
          };
        });
        
        // Sort by similarity and return top results
        return similarities
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, limit);
      }
    } catch (error) {
      console.error('Error finding similar tasks:', error);
      return [];
    }
  }

  async deleteTaskEmbedding(taskId) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      if (this.collection) {
        await this.collection.delete({
          ids: [taskId.toString()]
        });
      } else {
        this.taskEmbeddings.delete(taskId.toString());
      }
      console.log(`Deleted embedding for task ${taskId}`);
    } catch (error) {
      console.error('Error deleting task embedding:', error);
    }
  }

  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    return dotProduct / (normA * normB);
  }
}

module.exports = new EmbeddingService();
