const mongoose = require('mongoose');

const aiAnalyticsSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    enum: ['usage', 'performance', 'insights', 'predictions', 'costs'],
    required: true,
  },
  module: {
    type: String,
    enum: ['client', 'invoice', 'quote', 'payment', 'document', 'team', 'workflow', 'task', 'general'],
  },
  aiAssistant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AiAssistant',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  data: {
    type: Object,
    required: true,
  },
  metrics: {
    accuracy: Number,
    responseTime: Number,
    userSatisfaction: Number,
    tokensUsed: Number,
    cost: Number,
  },
  insights: [{
    category: String,
    description: String,
    confidence: Number,
    actionable: Boolean,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
  }],
  predictions: [{
    type: String,
    value: mongoose.Schema.Types.Mixed,
    confidence: Number,
    timeframe: String,
    factors: [String],
  }],
  dateRange: {
    start: Date,
    end: Date,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
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
    // Used for list/summary methods
  },
});

aiAnalyticsSchema.pre('save', function (next) {
  this.updated = Date.now();
  next();
});

aiAnalyticsSchema.index({ type: 1, module: 1, created: -1 });
aiAnalyticsSchema.index({ owner: 1, type: 1 });
aiAnalyticsSchema.index({ companyID: 1 }); // Index for companyID

module.exports = mongoose.model('AiAnalytics', aiAnalyticsSchema);
