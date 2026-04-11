// @ts-nocheck
const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['ocr_processing', 'data_extraction', 'validation', 'transformation', 'integration', 'notification'],
  },
  order: {
    type: Number,
    required: true,
  },
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  description: String,
  enabled: {
    type: Boolean,
    default: true,
  },
});

const executionSchema = new mongoose.Schema({
  execution_id: String,
  status: {
    type: String,
    enum: ['success', 'failed', 'running'],
  },
  execution_time: Number, // in milliseconds
  steps_completed: Number,
  total_steps: Number,
  executed_at: {
    type: Date,
    default: Date.now,
  },
  error_message: String,
});

const aiProcessingWorkflowSchema = new mongoose.Schema({
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
    required: true,
    enum: ['document_processing', 'data_extraction', 'validation', 'integration', 'custom'],
    default: 'document_processing',
  },
  triggerType: {
    type: String,
    required: true,
    enum: ['manual', 'automatic', 'scheduled', 'webhook'],
    default: 'manual',
  },
  steps: [stepSchema],
  enabled: {
    type: Boolean,
    default: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
  execution_count: {
    type: Number,
    default: 0,
  },
  success_count: {
    type: Number,
    default: 0,
  },
  error_count: {
    type: Number,
    default: 0,
  },
  last_executed: {
    type: Date,
  },
  recent_executions: [executionSchema],
  schedule: {
    type: {
      type: String,
      enum: ['cron', 'interval'],
    },
    expression: String, // Cron expression or interval in ms
    timezone: String,
    enabled: Boolean,
  },
  webhookUrl: String,
  tags: [String],
  version: {
    type: Number,
    default: 1,
  },
  removed: {
    type: Boolean,
    default: false,
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

// Indexes
aiProcessingWorkflowSchema.index({ owner: 1, removed: 1 });
aiProcessingWorkflowSchema.index({ category: 1, enabled: 1 });
aiProcessingWorkflowSchema.index({ triggerType: 1, enabled: 1 });
aiProcessingWorkflowSchema.index({ companyID: 1 }, { sparse: true }); // Index for companyID

// Virtual fields
aiProcessingWorkflowSchema.virtual('success_rate').get(function() {
  if (this.execution_count === 0) return 0;
  return (this.success_count / this.execution_count) * 100;
});

aiProcessingWorkflowSchema.virtual('average_execution_time').get(function() {
  if (this.recent_executions.length === 0) return 0;
  const totalTime = this.recent_executions.reduce((sum, exec) => sum + (exec.execution_time || 0), 0);
  return totalTime / this.recent_executions.length;
});

// Middleware
aiProcessingWorkflowSchema.pre('save', function(next) {
  this.updated = new Date();
  
  // Sort steps by order
  if (this.steps && this.steps.length > 0) {
    this.steps.sort((a, b) => a.order - b.order);
  }
  
  next();
});

// Instance methods
aiProcessingWorkflowSchema.methods.addExecution = function(executionData: Record<string, any>) {
  this.recent_executions.push(executionData);
  
  // Keep only last 20 executions
  if (this.recent_executions.length > 20) {
    this.recent_executions = this.recent_executions.slice(-20);
  }
  
  this.execution_count += 1;
  this.last_executed = new Date();
  
  if (executionData.status === 'success') {
    this.success_count += 1;
  } else if (executionData.status === 'failed') {
    this.error_count += 1;
  }
  
  return this.save();
};

aiProcessingWorkflowSchema.methods.getSuccessRate = function() {
  if (this.execution_count === 0) return 0;
  return (this.success_count / this.execution_count) * 100;
};

// Static methods
aiProcessingWorkflowSchema.statics.findByOwner = function(ownerId, filters = {}) {
  return this.find({
    owner: ownerId,
    removed: false,
    ...filters,
  });
};

aiProcessingWorkflowSchema.statics.findScheduled = function() {
  return this.find({
    enabled: true,
    removed: false,
    triggerType: 'scheduled',
    'schedule.enabled': true,
  });
};

const exportedModel = mongoose.model('AiProcessingWorkflow', aiProcessingWorkflowSchema);
module.exports = exportedModel;
