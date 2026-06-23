// @ts-nocheck
import mongoose from 'mongoose';

const workflowSchema = new mongoose.Schema({
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
  category: {
    type: String,
    enum: ['data_processing', 'document_analysis', 'automation', 'integration'],
    default: 'data_processing',
  },
  triggerType: {
    type: String,
    enum: ['manual', 'automatic', 'scheduled', 'event'],
    default: 'manual',
  },
  steps: [{
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['ocr', 'extraction', 'validation', 'transformation', 'integration', 'notification'],
      required: true,
    },
    config: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    order: {
      type: Number,
      required: true,
    },
  }],
  schedule: {
    frequency: {
      type: String,
      enum: ['once', 'daily', 'weekly', 'monthly', 'custom'],
    },
    cronExpression: String,
    timezone: {
      type: String,
      default: 'UTC',
    },
  },
  conditions: [{
    field: String,
    operator: {
      type: String,
      enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'exists'],
    },
    value: mongoose.Schema.Types.Mixed,
  }],
  outputSettings: {
    format: {
      type: String,
      enum: ['json', 'csv', 'pdf', 'email'],
      default: 'json',
    },
    destination: {
      type: String,
      enum: ['database', 'file', 'email', 'api'],
      default: 'database',
    },
    config: mongoose.Schema.Types.Mixed,
  },
  executionStats: {
    totalExecutions: {
      type: Number,
      default: 0,
    },
    successfulExecutions: {
      type: Number,
      default: 0,
    },
    failedExecutions: {
      type: Number,
      default: 0,
    },
    lastExecuted: Date,
    averageExecutionTime: Number,
  },
  owner: {
    type: mongoose.Schema.ObjectId,
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
    type: String,  },
});

// Update the updated field before saving
workflowSchema.pre('save', function() {
  this.updated = Date.now();
});

// Indexes for performance
workflowSchema.index({ owner: 1, removed: 1 });
workflowSchema.index({ category: 1, enabled: 1 });
workflowSchema.index({ triggerType: 1 });
workflowSchema.index({ companyID: 1 }, { sparse: true }); // Index for companyID

const AiWorkflow = mongoose.model('AiWorkflow', workflowSchema);

export default AiWorkflow;
