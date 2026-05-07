const embeddingService = require('./embeddings');
const Task = require('../models/Task');

class RAGService {
  async getRelevantTaskContext(userId, userPrompt, maxContextTasks = 3) {
    try {
      // Find similar tasks using embeddings
      const similarTasks = await embeddingService.findSimilarTasks(userId, userPrompt, maxContextTasks);
      
      if (similarTasks.length === 0) {
        return {
          hasContext: false,
          contextMessage: "No similar previous tasks found."
        };
      }

      // Get full task details from database
      const taskIds = similarTasks.map(task => task.taskId);
      const fullTasks = await Task.find({ 
        _id: { $in: taskIds },
        userId: userId 
      }).lean();

      // Format context for AI
      const contextTasks = fullTasks.map(task => {
        const similarityScore = similarTasks.find(st => st.taskId === task._id.toString())?.similarity || 0;
        return {
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status,
          subtasks: task.subtasks,
          similarity: similarityScore,
          createdAt: task.createdAt
        };
      });

      // Build context message for AI
      const contextMessage = this.buildContextMessage(contextTasks);

      return {
        hasContext: true,
        contextTasks,
        contextMessage,
        similarTasks: similarTasks
      };
    } catch (error) {
      console.error('Error getting RAG context:', error);
      return {
        hasContext: false,
        contextMessage: "Error retrieving previous task context."
      };
    }
  }

  buildContextMessage(contextTasks) {
    if (contextTasks.length === 0) return "";

    let contextMessage = "Here are some similar tasks you've created before:\n\n";
    
    contextTasks.forEach((task, index) => {
      contextMessage += `${index + 1}. **${task.title}** (Priority: ${task.priority}, Status: ${task.status})\n`;
      if (task.description) {
        contextMessage += `   Description: ${task.description}\n`;
      }
      if (task.subtasks && task.subtasks.length > 0) {
        contextMessage += `   Subtasks: ${task.subtasks.map(st => st.title).join(', ')}\n`;
      }
      contextMessage += `   Created: ${new Date(task.createdAt).toLocaleDateString()}\n`;
      contextMessage += `   Similarity: ${(task.similarity * 100).toFixed(1)}%\n\n`;
    });

    contextMessage += "Use these previous tasks as inspiration to create a personalized and relevant task plan. Consider the user's preferences, work patterns, and task structure from these examples.";
    
    return contextMessage;
  }

  async enhancePromptWithRAG(userId, userPrompt, userInfo) {
    try {
      // Get relevant context
      const ragContext = await this.getRelevantTaskContext(userId, userPrompt, 3);
      
      // Build enhanced prompt
      let enhancedPrompt = `You are a helpful productivity assistant creating personalized task plans for ${userInfo.name}.\n\n`;
      
      if (ragContext.hasContext) {
        enhancedPrompt += ragContext.contextMessage + "\n\n";
      } else {
        enhancedPrompt += "No previous similar tasks found. Create a new task plan based on best practices.\n\n";
      }
      
      enhancedPrompt += `Now create a task plan for: "${userPrompt}"\n\n`;
      
      enhancedPrompt += `Return only a JSON object with keys:
- title (string)
- description (string)
- priority (one of "low","medium","high","urgent")
- estimatedEffortHours (number)
- subtasks (array of short strings)

${ragContext.hasContext ? 'Consider the user\'s previous task patterns and preferences from the context above.' : 'Follow standard task planning best practices.'}

Do not include any commentary or markdown — only the JSON object.`;

      return {
        enhancedPrompt,
        hasContext: ragContext.hasContext,
        contextTasks: ragContext.contextTasks || []
      };
    } catch (error) {
      console.error('Error enhancing prompt with RAG:', error);
      // Fallback to original prompt without RAG
      return {
        enhancedPrompt: `You are a helpful productivity assistant. Create a task plan for: "${userPrompt}"
        
Return only a JSON object with keys:
- title (string)
- description (string)
- priority (one of "low","medium","high","urgent")
- estimatedEffortHours (number)
- subtasks (array of short strings)

Do not include any commentary or markdown — only the JSON object.`,
        hasContext: false,
        contextTasks: []
      };
    }
  }

  async storeTaskEmbedding(task) {
    try {
      // Generate embedding for the task
      const textToEmbed = `${task.title}. ${task.description || ''}`;
      const embedding = await embeddingService.generateEmbedding(textToEmbed);
      
      // Store the embedding
      await embeddingService.storeTaskEmbedding(
        task._id,
        task.userId,
        task.title,
        task.description,
        embedding
      );
      
      console.log(`Successfully stored embedding for task: ${task.title}`);
    } catch (error) {
      console.error('Error storing task embedding:', error);
      // Don't throw error - embedding failure shouldn't break task creation
    }
  }

  async deleteTaskEmbedding(taskId) {
    try {
      await embeddingService.deleteTaskEmbedding(taskId);
    } catch (error) {
      console.error('Error deleting task embedding:', error);
    }
  }
}

module.exports = new RAGService();
