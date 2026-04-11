// @ts-nocheck
const mongoose = require('mongoose');

// Node Definition Schema for workflow nodes
const nodeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      'trigger',
      'httpRequest',
      'dataTransform',
      'condition',
      'delay',
      'email',
      'webhook',
      'database',
      'customScript',
      'notification',
      'fileOperation',
      'dataValidation',
      'loop',
      'merge',
      'split',
    ],
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  configuration: {
    type: mongoose.Schema.Types.Mixed, // Flexible configuration object
    default: {},
  },
  inputs: [
    {
      name: String,
      type: String,
      required: Boolean,
      description: String,
    },
  ],
  outputs: [
    {
      name: String,
      type: String,
      description: String,
    },
  ],
  isDisabled: {
    type: Boolean,
    default: false,
  },
  retryPolicy: {
    maxRetries: { type: Number, default: 3 },
    retryDelay: { type: Number, default: 1000 }, // milliseconds
    backoffMultiplier: { type: Number, default: 2 },
  },
  timeout: {
    type: Number,
    default: 30000, // 30 seconds
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Connection Schema for node connections
const connectionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  source: {
    nodeId: { type: String, required: true },
    outputName: { type: String, default: 'default' },
  },
  target: {
    nodeId: { type: String, required: true },
    inputName: { type: String, default: 'default' },
  },
  condition: {
    type: String, // Optional condition for conditional connections
  },
  label: {
    type: String,
  },
});

// Enhanced Workflow Schema
const enhancedWorkflowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    version: {
      type: String,
      default: '1.0.0',
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'inactive', 'archived', 'error'],
      default: 'draft',
      index: true,
    },
    category: {
      type: String,
      enum: ['automation', 'integration', 'notification', 'data-processing', 'custom'],
      default: 'automation',
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: 50,
      },
    ],

    // Workflow Definition
    nodes: [nodeSchema],
    connections: [connectionSchema],

    // Trigger Configuration
    triggers: [
      {
        type: {
          type: String,
          enum: ['webhook', 'schedule', 'manual', 'event', 'database'],
          required: true,
        },
        configuration: {
          type: mongoose.Schema.Types.Mixed,
          required: true,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],

    // Execution Settings
    executionSettings: {
      concurrent: {
        type: Boolean,
        default: false,
      },
      maxConcurrency: {
        type: Number,
        default: 1,
      },
      timeout: {
        type: Number,
        default: 300000, // 5 minutes
      },
      retryPolicy: {
        enabled: { type: Boolean, default: true },
        maxRetries: { type: Number, default: 3 },
        retryDelay: { type: Number, default: 5000 },
      },
      errorHandling: {
        onError: {
          type: String,
          enum: ['stop', 'continue', 'retry', 'notify'],
          default: 'stop',
        },
        notifyOnError: { type: Boolean, default: false },
        errorNotificationEmail: String,
      },
    },

    // Statistics
    statistics: {
      totalExecutions: { type: Number, default: 0 },
      successfulExecutions: { type: Number, default: 0 },
      failedExecutions: { type: Number, default: 0 },
      averageExecutionTime: { type: Number, default: 0 },
      lastExecutedAt: Date,
      lastSuccessAt: Date,
      lastFailureAt: Date,
    },

    // Access Control
    permissions: {
      owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true,
      },
      editors: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
          permissions: [{ type: String, enum: ['view', 'edit', 'execute', 'delete'] }],
        },
      ],
      isPublic: { type: Boolean, default: false },
    },

    // Metadata
    metadata: {
      environment: {
        type: String,
        enum: ['development', 'staging', 'production'],
        default: 'development',
      },
      apiVersion: { type: String, default: '1.0' },
      dependencies: [String], // External dependencies required
      customVariables: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for performance
enhancedWorkflowSchema.index({ 'permissions.owner': 1, status: 1 });
enhancedWorkflowSchema.index({ status: 1, 'statistics.lastExecutedAt': -1 });
enhancedWorkflowSchema.index({ tags: 1 });
enhancedWorkflowSchema.index({ category: 1, status: 1 });

// Virtual for execution success rate
enhancedWorkflowSchema.virtual('successRate').get(function () {
  if (this.statistics.totalExecutions === 0) return 0;
  return ((this.statistics.successfulExecutions / this.statistics.totalExecutions) * 100).toFixed(
    2
  );
});

// Pre-save middleware to update timestamps
enhancedWorkflowSchema.pre('save', function (next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// Instance methods
enhancedWorkflowSchema.methods.incrementExecutionCount = function (
  success = true,
  executionTime = 0
) {
  this.statistics.totalExecutions += 1;
  this.statistics.lastExecutedAt = new Date();

  if (success) {
    this.statistics.successfulExecutions += 1;
    this.statistics.lastSuccessAt = new Date();
  } else {
    this.statistics.failedExecutions += 1;
    this.statistics.lastFailureAt = new Date();
  }

  // Update average execution time
  if (executionTime > 0) {
    const totalTime = this.statistics.averageExecutionTime * (this.statistics.totalExecutions - 1);
    this.statistics.averageExecutionTime =
      (totalTime + executionTime) / this.statistics.totalExecutions;
  }

  return this.save();
};

enhancedWorkflowSchema.methods.activate = function () {
  this.status = 'active';
  return this.save();
};

enhancedWorkflowSchema.methods.deactivate = function () {
  this.status = 'inactive';
  return this.save();
};

enhancedWorkflowSchema.methods.hasPermission = function (userId, permission) {
  // Check if user is owner
  if (this.permissions.owner.toString() === userId.toString()) {
    return true;
  }

  // Check if user has specific permission
  const userPermission = this.permissions.editors.find(
    (editor) => editor.user.toString() === userId.toString()
  );

  return userPermission && userPermission.permissions.includes(permission);
};

// Static methods
enhancedWorkflowSchema.statics.findByOwner = function (ownerId, status = null) {
  const query = { 'permissions.owner': ownerId };
  if (status) query.status = status;
  return this.find(query).sort({ updatedAt: -1 });
};

enhancedWorkflowSchema.statics.findActiveWorkflows = function () {
  return this.find({ status: 'active' });
};

enhancedWorkflowSchema.statics.getWorkflowStats = function (ownerId) {
  return this.aggregate([
    { $match: { 'permissions.owner': mongoose.Types.ObjectId(ownerId) } },
    {
      $group: {
        _id: null,
        totalWorkflows: { $sum: 1 },
        activeWorkflows: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
        },
        totalExecutions: { $sum: '$statistics.totalExecutions' },
        successfulExecutions: { $sum: '$statistics.successfulExecutions' },
        failedExecutions: { $sum: '$statistics.failedExecutions' },
      },
    },
  ]);
};

const exportedModel = mongoose.model('EnhancedWorkflow', enhancedWorkflowSchema);
module.exports = exportedModel;
