const mongoose = require('mongoose');

const processStepSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
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
    enum: [
      'manual',
      'automated',
      'approval',
      'notification',
      'condition',
      'parallel',
      'delay',
      'integration',
    ],
    default: 'manual',
  },
  order: {
    type: Number,
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  assignedTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
  },
  estimatedDuration: {
    type: Number, // In minutes
  },
  deadline: {
    type: Number, // Days from process start
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'skipped', 'failed', 'on-hold'],
    default: 'pending',
  },
  configuration: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  conditions: {
    skipIf: {
      type: String, // JavaScript expression
    },
    requiredFields: [String],
  },
  automation: {
    enabled: {
      type: Boolean,
      default: false,
    },
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EnhancedWorkflow',
    },
    triggerConditions: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  notifications: {
    onStart: {
      type: Boolean,
      default: false,
    },
    onComplete: {
      type: Boolean,
      default: false,
    },
    onDelay: {
      type: Boolean,
      default: true,
    },
  },
  dependencies: [
    {
      type: String, // Step IDs that must be completed first
    },
  ],
  outputs: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  completedAt: Date,
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  notes: {
    type: String,
  },
});

const processExecutionSchema = new mongoose.Schema({
  startedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: Date,
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'failed', 'paused'],
    default: 'active',
  },
  currentStepId: String,
  completedSteps: [String],
  startedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  errors: [
    {
      stepId: String,
      error: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  logs: [
    {
      stepId: String,
      action: String,
      message: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
  ],
});

const businessProcessSchema = new mongoose.Schema(
  {
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
      enum: [
        'sales',
        'marketing',
        'support',
        'operations',
        'hr',
        'finance',
        'project-management',
        'onboarding',
        'custom',
      ],
      default: 'custom',
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'inactive', 'archived'],
      default: 'draft',
    },
    version: {
      type: Number,
      default: 1,
    },
    steps: [processStepSchema],
    triggers: {
      manual: {
        type: Boolean,
        default: true,
      },
      scheduled: {
        enabled: {
          type: Boolean,
          default: false,
        },
        cron: String, // Cron expression
      },
      eventBased: {
        enabled: {
          type: Boolean,
          default: false,
        },
        events: [
          {
            type: String,
            enum: [
              'appointment_created',
              'appointment_completed',
              'task_completed',
              'lead_created',
              'client_created',
              'quote_sent',
              'invoice_paid',
              'custom',
            ],
          },
        ],
        conditions: {
          type: mongoose.Schema.Types.Mixed,
        },
      },
      apiTrigger: {
        enabled: {
          type: Boolean,
          default: false,
        },
        webhookUrl: String,
        apiKey: String,
      },
    },
    executions: [processExecutionSchema],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
    },
    permissions: {
      canExecute: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      canEdit: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      canView: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
    },
    sla: {
      enabled: {
        type: Boolean,
        default: false,
      },
      targetDuration: Number, // In hours
      urgency: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
      },
    },
    notifications: {
      onStart: {
        enabled: Boolean,
        recipients: [String], // Email addresses
      },
      onComplete: {
        enabled: Boolean,
        recipients: [String],
      },
      onError: {
        enabled: Boolean,
        recipients: [String],
      },
      onDelay: {
        enabled: Boolean,
        threshold: Number, // Hours
        recipients: [String],
      },
    },
    integrations: {
      appointments: {
        enabled: {
          type: Boolean,
          default: false,
        },
        autoCreateAppointment: Boolean,
        appointmentTemplate: {
          type: mongoose.Schema.Types.Mixed,
        },
      },
      tasks: {
        enabled: {
          type: Boolean,
          default: false,
        },
        autoCreateTasks: Boolean,
      },
      workflows: {
        enabled: {
          type: Boolean,
          default: false,
        },
        linkedWorkflows: [
          {
            workflowId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'EnhancedWorkflow',
            },
            triggerOn: String, // 'start', 'complete', 'step_complete'
            stepId: String,
          },
        ],
      },
    },
    analytics: {
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
      averageDuration: {
        type: Number,
        default: 0,
      },
      lastExecutedAt: Date,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    customFields: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    template: {
      isTemplate: {
        type: Boolean,
        default: false,
      },
      templateCategory: String,
      isPublic: {
        type: Boolean,
        default: false,
      },
    },
    created: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updated: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
businessProcessSchema.index({ owner: 1, status: 1 });
businessProcessSchema.index({ category: 1, status: 1 });
businessProcessSchema.index({ 'template.isTemplate': 1, 'template.isPublic': 1 });
businessProcessSchema.index({ 'executions.status': 1 });
businessProcessSchema.index({ tags: 1 });

// Virtual for active executions
businessProcessSchema.virtual('activeExecutions').get(function () {
  return this.executions.filter((ex) => ex.status === 'active').length;
});

// Virtual for completion rate
businessProcessSchema.virtual('completionRate').get(function () {
  if (this.analytics.totalExecutions === 0) return 0;
  return ((this.analytics.successfulExecutions / this.analytics.totalExecutions) * 100).toFixed(2);
});

// Pre-save middleware
businessProcessSchema.pre('save', function (next) {
  this.updated = new Date();
  next();
});

// Method to start a new execution
businessProcessSchema.methods.startExecution = function (userId, initialData = {}) {
  const execution = {
    startedAt: new Date(),
    status: 'active',
    currentStepId: this.steps[0]?.id,
    completedSteps: [],
    startedBy: userId,
    data: initialData,
    errors: [],
    logs: [
      {
        stepId: null,
        action: 'start',
        message: 'Process execution started',
        timestamp: new Date(),
        userId: userId,
      },
    ],
  };

  this.executions.push(execution);
  this.analytics.totalExecutions += 1;
  this.analytics.lastExecutedAt = new Date();

  return execution;
};

// Method to complete a step
businessProcessSchema.methods.completeStep = function (
  executionIndex,
  stepId,
  userId,
  output = {}
) {
  const execution = this.executions[executionIndex];
  if (!execution) throw new Error('Execution not found');

  const stepIndex = this.steps.findIndex((s) => s.id === stepId);
  if (stepIndex === -1) throw new Error('Step not found');

  this.steps[stepIndex].status = 'completed';
  this.steps[stepIndex].completedAt = new Date();
  this.steps[stepIndex].completedBy = userId;
  this.steps[stepIndex].outputs = output;

  execution.completedSteps.push(stepId);
  execution.logs.push({
    stepId: stepId,
    action: 'complete',
    message: `Step ${this.steps[stepIndex].name} completed`,
    timestamp: new Date(),
    userId: userId,
  });

  // Find next step
  const nextStep = this.steps.find(
    (step) =>
      step.order > this.steps[stepIndex].order &&
      step.status === 'pending' &&
      this.checkStepDependencies(step, execution.completedSteps)
  );

  if (nextStep) {
    execution.currentStepId = nextStep.id;
  } else {
    // All steps completed
    execution.status = 'completed';
    execution.completedAt = new Date();
    this.analytics.successfulExecutions += 1;

    execution.logs.push({
      stepId: null,
      action: 'complete',
      message: 'Process execution completed',
      timestamp: new Date(),
      userId: userId,
    });
  }

  return execution;
};

// Method to check if step dependencies are met
businessProcessSchema.methods.checkStepDependencies = function (step, completedSteps) {
  if (!step.dependencies || step.dependencies.length === 0) return true;
  return step.dependencies.every((depId) => completedSteps.includes(depId));
};

// Static method to find processes by trigger event
businessProcessSchema.statics.findByTriggerEvent = function (eventType) {
  return this.find({
    removed: false,
    enabled: true,
    status: 'active',
    'triggers.eventBased.enabled': true,
    'triggers.eventBased.events': eventType,
  });
};

// Static method to find scheduled processes
businessProcessSchema.statics.findScheduled = function () {
  return this.find({
    removed: false,
    enabled: true,
    status: 'active',
    'triggers.scheduled.enabled': true,
    'triggers.scheduled.cron': { $exists: true, $ne: null },
  });
};

module.exports = mongoose.model('BusinessProcess', businessProcessSchema);
