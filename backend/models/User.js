const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  settings: {
    timezone: { type: String, default: 'Asia/Kolkata' }
  }
});

module.exports = mongoose.model('User', UserSchema);
