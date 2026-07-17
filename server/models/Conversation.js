const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String },
  type: { type: String, enum: ['text', 'audio', 'image'], default: 'text' },
  mediaUrl: { type: String }
}, { _id: false });

const conversationSchema = new mongoose.Schema({
  userId: { type: String, default: 'anonymous' },
  messages: [messageSchema],
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
