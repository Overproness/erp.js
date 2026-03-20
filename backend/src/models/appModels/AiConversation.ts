// @ts-nocheck
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    tokens: Number,
    model: String,
    processingTime: Number,
    context: Object,
  },
});

const aiConversationSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    trim: true,
  },
  aiAssistant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AiAssistant',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompanyOwner',
    required: true,
  },
  messages: [messageSchema],
  context: {
    module: String,
    entityType: String,
    entityId: mongoose.Schema.Types.ObjectId,
    additionalData: Object,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active',
  },
  totalTokens: {
    type: Number,
    default: 0,
  },
  totalCost: {
    type: Number,
    default: 0,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompanyOwner',
    required: true,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
  companyID: {
    type: String,
    index: true,
    sparse: true,
  },
});

aiConversationSchema.pre('save', function (next) {
  this.updated = Date.now();
  if (this.messages.length > 0) {
    this.totalTokens = this.messages.reduce((sum, msg) => sum + (msg.metadata?.tokens || 0), 0);
  }
  next();
});

aiConversationSchema.index({ user: 1, created: -1 });
aiConversationSchema.index({ 'context.module': 1, 'context.entityId': 1 });
aiConversationSchema.index({ companyID: 1 });

const exportedModel = mongoose.model('AiConversation', aiConversationSchema);
export default exportedModel;
module.exports = exportedModel;
