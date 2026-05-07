const Task = require('../models/Task');
const embeddingService = require('./embeddings');

class EmbeddingPersistence {
  async loadAllEmbeddings() {
    try {
      console.log('Loading embeddings from database...');
      
      // Get all tasks from database
      const tasks = await Task.find({});
      console.log(`Found ${tasks.length} tasks in database`);
      
      let loadedCount = 0;
      for (const task of tasks) {
        try {
          // Generate embedding for this task
          const textToEmbed = `${task.title}. ${task.description || ''}`;
          const embedding = await embeddingService.generateEmbedding(textToEmbed);
          
          // Store in memory
          embeddingService.taskEmbeddings.set(task._id.toString(), {
            taskId: task._id.toString(),
            userId: task.userId.toString(),
            title: task.title,
            description: task.description || '',
            embedding,
            documentText: textToEmbed,
            createdAt: task.createdAt.toISOString()
          });
          
          loadedCount++;
        } catch (error) {
          console.error(`Failed to load embedding for task "${task.title}":`, error.message);
        }
      }
      
      console.log(`✅ Successfully loaded ${loadedCount} embeddings into memory`);
      return loadedCount;
    } catch (error) {
      console.error('Error loading embeddings:', error);
      return 0;
    }
  }
}

module.exports = new EmbeddingPersistence();
