const mongoose = require('mongoose');

const SubtaskSchema = new mongoose.Schema({
  title: String,
  done: { type: Boolean, default: false }
});

const TaskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: String,
  status: { type: String, default: 'todo' }, // todo, in-progress, done
  priority: { type: String, default: 'medium' }, // low, medium, high, urgent
  dueDate: Date,
  subtasks: [SubtaskSchema],
  aiGenerated: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});

TaskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Task', TaskSchema);
