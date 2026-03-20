// @ts-nocheck
import mongoose from 'mongoose';

// Node execution result schema
const nodeExecutionSchema = new mongoose.Schema({
  nodeId: {
    type: String,
    required: true,
  },
  nodeName: {
    type: String,
    required: true,
  },
  nodeType: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'success', 'error', 'skipped', 'cancelled'],
    default: 'pending',
  },
  startedAt: {
    type: Date,
  },
  finishedAt: {
    type: Date,
  },
  executionTime: {
    type: Number, // milliseconds
  },
  inputData: {
    type: mongoose.Schema.Types.Mixed,
  },
  outputData: {
    type: mongoose.Schema.Types.Mixed,
  },
  errorMessage: {
    type: String,
  },
  errorStack: {
    type: String,
  },
  retryCount: {
    type: Number,
    default: 0,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
});

// Main workflow execution schema
const workflowExecutionSchema = new mongoose.Schema(
  {
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EnhancedWorkflow',
      required: true,
      index: true,
    },
    workflowName: {
      type: String,
      required: true,
    },
    workflowVersion: {
      type: String,
      default: '1.0.0',
    },
    executionId: {
      type: String,
      unique: true,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'success', 'error', 'cancelled', 'timeout'],
      default: 'pending',
      index: true,
    },
    trigger: {
      type: {
        type: String,
        enum: ['manual', 'webhook', 'schedule', 'event', 'api'],
        required: true,
      },
      source: {
        type: String, // IP address, user ID, or system
      },
      data: {
        type: mongoose.Schema.Types.Mixed, // Trigger data/payload
      },
    },
    startedAt: {
      type: Date,
      index: true,
    },
    finishedAt: {
      type: Date,
    },
    executionTime: {
      type: Number, // Total execution time in milliseconds
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },

    // Input data for the workflow
    inputData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Final output data
    outputData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Node executions
    nodeExecutions: [nodeExecutionSchema],

    // Execution context and variables
    context: {
      variables: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      environment: {
        type: String,
        enum: ['development', 'staging', 'production'],
        default: 'development',
      },
      sessionId: String,
      traceId: String,
    },

    // Error information
    error: {
      message: String,
      stack: String,
      nodeId: String, // Node where error occurred
      code: String,
      type: String,
    },

    // Performance metrics
    metrics: {
      totalNodes: { type: Number, default: 0 },
      successfulNodes: { type: Number, default: 0 },
      failedNodes: { type: Number, default: 0 },
      skippedNodes: { type: Number, default: 0 },
      memoryUsage: { type: Number }, // Peak memory usage in MB
      cpuUsage: { type: Number }, // CPU usage percentage
      networkCalls: { type: Number, default: 0 },
      dataProcessed: { type: Number, default: 0 }, // Amount of data processed
    },

    // Execution logs
    logs: [
      {
        timestamp: { type: Date, default: Date.now },
        level: {
          type: String,
          enum: ['debug', 'info', 'warn', 'error'],
          default: 'info',
        },
        message: String,
        nodeId: String,
        data: mongoose.Schema.Types.Mixed,
      },
    ],

    // Retry information
    retryInfo: {
      isRetry: { type: Boolean, default: false },
      originalExecutionId: String,
      retryCount: { type: Number, default: 0 },
      maxRetries: { type: Number, default: 3 },
      nextRetryAt: Date,
    },

    // Queue information
    queueInfo: {
      queuedAt: Date,
      priority: { type: Number, default: 0 },
      delayUntil: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound indexes for performance
workflowExecutionSchema.index({ workflowId: 1, status: 1, createdAt: -1 });
workflowExecutionSchema.index({ status: 1, createdAt: -1 });
workflowExecutionSchema.index({ initiatedBy: 1, createdAt: -1 });
workflowExecutionSchema.index({ 'trigger.type': 1, createdAt: -1 });


// Virtual for execution duration in human readable format
workflowExecutionSchema.virtual('duration').get(function () {
  if (!this.startedAt || !this.finishedAt) return null;
  const duration = this.finishedAt - this.startedAt;
  if (duration < 1000) return `${duration}ms`;
  if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
  return `${(duration / 60000).toFixed(1)}m`;
});

// Virtual for success rate of nodes
workflowExecutionSchema.virtual('nodeSuccessRate').get(function () {
  if (this.metrics.totalNodes === 0) return 0;
  return ((this.metrics.successfulNodes / this.metrics.totalNodes) * 100).toFixed(2);
});

// Pre-save middleware
workflowExecutionSchema.pre('save', function (next) {
  // Calculate execution time if both start and finish times are set
  if (this.startedAt && this.finishedAt && !this.executionTime) {
    this.executionTime = this.finishedAt - this.startedAt;
  }

  // Update node metrics
  if (this.nodeExecutions && this.nodeExecutions.length > 0) {
    this.metrics.totalNodes = this.nodeExecutions.length;
    this.metrics.successfulNodes = this.nodeExecutions.filter(
      (ne) => ne.status === 'success'
    ).length;
    this.metrics.failedNodes = this.nodeExecutions.filter((ne) => ne.status === 'error').length;
    this.metrics.skippedNodes = this.nodeExecutions.filter((ne) => ne.status === 'skipped').length;
  }

  next();
});

// Instance methods
workflowExecutionSchema.methods.start = function () {
  this.status = 'running';
  this.startedAt = new Date();
  this.context.traceId = this.context.traceId || this.executionId;
  return this.save();
};

workflowExecutionSchema.methods.complete = function (outputData = null) {
  this.status = 'success';
  this.finishedAt = new Date();
  if (outputData) this.outputData = outputData;
  return this.save();
};

workflowExecutionSchema.methods.fail = function (error) {
  this.status = 'error';
  this.finishedAt = new Date();

  if (error) {
    this.error = {
      message: error.message || error,
      stack: error.stack,
      code: error.code,
      type: error.constructor.name,
    };
  }

  return this.save();
};

workflowExecutionSchema.methods.cancel = function () {
  this.status = 'cancelled';
  this.finishedAt = new Date();
  return this.save();
};

workflowExecutionSchema.methods.addLog = function (level, message, nodeId = null, data = null) {
  this.logs.push({
    timestamp: new Date(),
    level,
    message,
    nodeId,
    data,
  });

  // Keep only last 1000 logs to prevent document size issues
  if (this.logs.length > 1000) {
    this.logs = this.logs.slice(-1000);
  }

  return this.save();
};

workflowExecutionSchema.methods.updateNodeExecution = function (nodeId, updates) {
  const nodeExecution = this.nodeExecutions.find((ne) => ne.nodeId === nodeId);
  if (nodeExecution) {
    Object.assign(nodeExecution, updates);
    return this.save();
  }
  return Promise.resolve(this);
};

workflowExecutionSchema.methods.addNodeExecution = function (nodeData) {
  this.nodeExecutions.push(nodeData);
  return this.save();
};

// Static methods
workflowExecutionSchema.statics.findByWorkflow = function (workflowId, limit = 50) {
  return this.find({ workflowId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('workflowId', 'name description')
    .populate('initiatedBy', 'name email');
};

workflowExecutionSchema.statics.findRunning = function () {
  return this.find({ status: 'running' });
};

workflowExecutionSchema.statics.getExecutionStats = function (workflowId = null, dateRange = null) {
  const match = {};
  if (workflowId) match.workflowId = mongoose.Types.ObjectId(workflowId);
  if (dateRange && dateRange.start && dateRange.end) {
    match.createdAt = {
      $gte: new Date(dateRange.start),
      $lte: new Date(dateRange.end),
    };
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalExecutions: { $sum: 1 },
        successfulExecutions: {
          $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
        },
        failedExecutions: {
          $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] },
        },
        cancelledExecutions: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
        },
        averageExecutionTime: { $avg: '$executionTime' },
        totalExecutionTime: { $sum: '$executionTime' },
      },
    },
  ]);
};

workflowExecutionSchema.statics.getExecutionTrends = function (workflowId = null, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const match = { createdAt: { $gte: startDate } };
  if (workflowId) match.workflowId = mongoose.Types.ObjectId(workflowId);

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        },
        date: { $first: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } },
        total: { $sum: 1 },
        successful: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] } },
        avgExecutionTime: { $avg: '$executionTime' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
  ]);
};

const exportedModel = mongoose.model('WorkflowExecution', workflowExecutionSchema);
export default exportedModel;
module.exports = exportedModel;
