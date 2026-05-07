const express = require('express');
const Task = require('../models/Task');
const auth = require('../utils/authMiddleware');
const ragService = require('../utils/ragService');

const router = express.Router();

router.use(auth);

// Get all tasks for user
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create task
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    data.userId = req.user._id;
    const task = new Task(data);
    await task.save();
    
    // Store embedding for RAG (don't wait for it to complete)
    ragService.storeTaskEmbedding(task).catch(err => {
      console.error('Failed to store task embedding:', err);
    });
    
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, req.body, { new: true });
    if (!task) return res.status(404).json({ message: 'Not found' });
    
    // Update embedding when task is modified (don't wait for it to complete)
    ragService.storeTaskEmbedding(task).catch(err => {
      console.error('Failed to update task embedding:', err);
    });
    
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!task) return res.status(404).json({ message: 'Not found' });
    
    // Delete embedding when task is deleted
    ragService.deleteTaskEmbedding(req.params.id).catch(err => {
      console.error('Failed to delete task embedding:', err);
    });
    
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
