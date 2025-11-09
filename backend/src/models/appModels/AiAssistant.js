const mongoose = require('mongoose');

const aiAssistantSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
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
  type: {
    type: String,
    enum: ['general', 'document', 'workflow', 'analytics', 'customer', 'financial'],
    default: 'general',
  },
  capabilities: [{
    type: String,
    enum: [
      'nlp_processing',
      'pattern_recognition',
      'predictive_analysis',
      'document_analysis',
      'workflow_optimization',
      'customer_insights',
      'financial_forecasting',
      'automation_suggestions'
    ]
  }],
  model: {
    provider: {
      type: String,
      enum: ['openai', 'azure', 'custom'],
      default: 'openai',
    },
    modelName: {
      type: String,
      default: 'gpt-3.5-turbo',
    },
    version: String,
    parameters: {
      temperature: {
        type: Number,
        default: 0.7,
        min: 0,
        max: 2,
      },
      maxTokens: {
        type: Number,
        default: 1000,
      },
      topP: {
        type: Number,
        default: 1,
      },
      frequencyPenalty: {
        type: Number,
        default: 0,
      },
      presencePenalty: {
        type: Number,
        default: 0,
      },
    },
  },
  systemPrompt: {
    type: String,
    default: 'You are a helpful AI assistant for an ERP system.',
  },
  contextModules: [{
    type: String,
    enum: ['client', 'invoice', 'quote', 'payment', 'document', 'team', 'workflow', 'task'],
  }],
  knowledgeBase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AiKnowledgeBase',
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
  },
});

aiAssistantSchema.pre('save', function (next) {
  this.updated = Date.now();
  next();
});

aiAssistantSchema.index({ name: 'text', description: 'text' });
aiAssistantSchema.index({ companyID: 1 });

module.exports = mongoose.model('AiAssistant', aiAssistantSchema);
