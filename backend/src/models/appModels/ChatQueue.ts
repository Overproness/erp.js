// @ts-nocheck
const mongoose = require('mongoose');

const chatQueueSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.ObjectId, ref: 'CompanyOwner', required: true, index: true },
  user: { type: mongoose.Schema.ObjectId, ref: 'User' }, // Optional: if from team member
  message: { type: String, required: true },
  context: {
    module: String,
    entityId: String,
    data: mongoose.Schema.Types.Mixed,
  },
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    index: true,
  },
  response: String,
  error: String,
  assistantId: { type: String, default: 'default' },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 3 },
  processedAt: Date,

  removed: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
});

chatQueueSchema.index({ owner: 1, status: 1, priority: 1 });
chatQueueSchema.index({ created: 1 });

const exportedModel = mongoose.model('ChatQueue', chatQueueSchema);
module.exports = exportedModel;
