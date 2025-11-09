const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
  },
});

const activitySchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  details: {
    type: Object,
  },
});

const taskSchema = new mongoose.Schema(
  {
    removed: {
      type: Boolean,
      default: false,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    assignedTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
    },
    collaborators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    deadline: {
      type: Date,
      get: (date) => (date ? date.toISOString() : null),
      set: (date) => (date ? new Date(date) : null),
    },
    dueDate: {
      type: Date,
      get: (date) => (date ? date.toISOString() : null),
      set: (date) => (date ? new Date(date) : null),
    },
    status: {
      type: String,
      enum: [
        'pending',
        'assigned',
        'in_progress',
        'completed',
        'cancelled',
        'pending_approval',
        'delegated',
      ],
      default: 'pending',
    },
    requiresApproval: {
      type: Boolean,
      default: false,
    },
    delegatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    delegatedAt: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    created: {
      type: Date,
      default: Date.now,
    },
    updated: {
      type: Date,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },

    // Progress Monitoring
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    startDate: {
      type: Date,
    },
    completedDate: {
      type: Date,
    },
    timeSpent: {
      type: Number, // in minutes
      default: 0,
    },

    // Team Collaboration
    watchers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    delegationHistory: [
      {
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        to: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        delegatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        delegatedAt: {
          type: Date,
          default: Date.now,
        },
        note: {
          type: String,
          trim: true,
        },
      },
    ],
    comments: [commentSchema],
    activityLog: [activitySchema],

    // Module Integration
    relatedTo: [
      {
        model: {
          type: String,
          enum: ['invoice', 'quote', 'client', 'document'],
        },
        id: {
          type: mongoose.Schema.Types.ObjectId,
        },
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    attachments: [
      {
        filename: String,
        path: String,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    companyID: {
      type: String,
      index: true,
      sparse: true,
      // Used for list/summary methods
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to automatically set status to 'assigned' when assignedTo is set
taskSchema.pre('save', function (next) {
  if (this.assignedTo && this.status === 'pending') {
    // Don't automatically assign if requires approval
    if (!this.requiresApproval) {
      this.status = 'assigned';
    }
  }
  next();
});

taskSchema.index({ companyID: 1 }); // Index for companyID

module.exports = mongoose.model('Task', taskSchema);
