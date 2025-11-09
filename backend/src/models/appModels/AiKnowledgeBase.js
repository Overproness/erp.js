const mongoose = require('mongoose');

const knowledgeEntrySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['procedure', 'faq', 'troubleshooting', 'best_practice', 'regulation', 'template'],
    required: true,
  },
  tags: [String],
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10,
  },
  confidence: {
    type: Number,
    default: 1,
    min: 0,
    max: 1,
  },
  embedding: [Number], // Vector embeddings for semantic search
  usageCount: {
    type: Number,
    default: 0,
  },
  lastUsed: Date,
  created: {
    type: Date,
    default: Date.now,
  },
  updated: Date,
});

const aiKnowledgeBaseSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  domain: {
    type: String,
    enum: ['general', 'finance', 'hr', 'sales', 'operations', 'compliance'],
    default: 'general',
  },
  entries: [knowledgeEntrySchema],
  metadata: {
    totalEntries: {
      type: Number,
      default: 0,
    },
    averageConfidence: Number,
    lastTrained: Date,
    version: {
      type: String,
      default: '1.0.0',
    },
  },
  settings: {
    autoUpdate: {
      type: Boolean,
      default: true,
    },
    learningEnabled: {
      type: Boolean,
      default: true,
    },
    confidenceThreshold: {
      type: Number,
      default: 0.8,
    },
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
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

aiKnowledgeBaseSchema.pre('save', function (next) {
  this.updated = Date.now();
  this.metadata.totalEntries = this.entries.length;
  
  if (this.entries.length > 0) {
    const avgConfidence = this.entries.reduce((sum, entry) => sum + entry.confidence, 0) / this.entries.length;
    this.metadata.averageConfidence = avgConfidence;
  }
  
  next();
});

aiKnowledgeBaseSchema.index({ 'entries.title': 'text', 'entries.content': 'text', 'entries.tags': 'text' });
aiKnowledgeBaseSchema.index({ domain: 1, owner: 1 });
aiKnowledgeBaseSchema.index({ companyID: 1 }); // Index for companyID

module.exports = mongoose.model('AiKnowledgeBase', aiKnowledgeBaseSchema);
