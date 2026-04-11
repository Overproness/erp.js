// @ts-nocheck
const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompanyOwner',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompanyOwner',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  companyID: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Add indexes for better performance
ChatMessageSchema.index({ companyID: 1, createdAt: -1 });
ChatMessageSchema.index({ sender: 1, receiver: 1 });

const exportedModel = mongoose.model('ChatMessage', ChatMessageSchema);
module.exports = exportedModel;
