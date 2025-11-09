const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const triggerRuleSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  priority: {
    type: Number,
    default: 10,  // Higher number = higher priority
    min: 1,
    max: 100,
  },
  triggerType: {
    type: String,
    enum: [
      'behavior', 'segment_entry', 'segment_exit', 'time_based', 
      'campaign_event', 'api_call', 'custom'
    ],
    required: true,
  },
  eventConditions: [{
    eventType: {
      type: String,
      required: function() {
        return this.triggerType === 'behavior';
      },
    },
    eventName: String,
    propertyConditions: [{
      property: String,
      operator: {
        type: String,
        enum: [
          'equals', 'not_equals', 'contains', 'not_contains', 
          'greater_than', 'less_than', 'exists', 'not_exists',
          'between', 'in_list', 'not_in_list'
        ],
      },
      value: mongoose.Schema.Types.Mixed,
      valueList: [mongoose.Schema.Types.Mixed],
      minValue: mongoose.Schema.Types.Mixed,
      maxValue: mongoose.Schema.Types.Mixed,
    }],
    frequency: {
      count: Number,
      timeframe: {
        value: Number,
        unit: {
          type: String,
          enum: ['minutes', 'hours', 'days', 'weeks', 'months'],
        },
      },
      operator: {
        type: String,
        enum: ['exactly', 'at_least', 'at_most', 'between'],
      },
      minCount: Number,
      maxCount: Number,
    },
  }],
  segmentCondition: {
    segment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomerSegment',
      required: function() {
        return ['segment_entry', 'segment_exit'].includes(this.triggerType);
      },
    },
    event: {
      type: String,
      enum: ['entered', 'exited'],
      required: function() {
        return ['segment_entry', 'segment_exit'].includes(this.triggerType);
      },
    },
  },
  timeCondition: {
    specificDate: Date,
    recurrence: {
      pattern: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
      },
      daysOfWeek: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      }],
      dayOfMonth: Number,
      month: Number,
      time: String, // HH:MM format
      timezone: String,
    },
  },
  campaignCondition: {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
    },
    event: {
      type: String,
      enum: ['sent', 'opened', 'clicked', 'converted', 'bounced', 'complained'],
    },
  },
  delayExecution: {
    enabled: {
      type: Boolean,
      default: false,
    },
    delay: {
      value: Number,
      unit: {
        type: String,
        enum: ['minutes', 'hours', 'days'],
        default: 'minutes',
      },
    },
  },
  actions: [{
    actionType: {
      type: String,
      enum: [
        'send_email', 'send_sms', 'send_push', 'add_to_segment', 
        'remove_from_segment', 'execute_campaign', 'update_customer', 
        'webhook', 'custom_api', 'notify_team', 'create_task'
      ],
      required: true,
    },
    config: mongoose.Schema.Types.Mixed,
    executionOrder: {
      type: Number,
      default: 0,
    },
  }],
  filterConditions: {
    requiredSegments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomerSegment',
    }],
    excludedSegments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomerSegment',
    }],
    customerProperties: [{
      property: String,
      operator: {
        type: String,
        enum: [
          'equals', 'not_equals', 'contains', 'not_contains', 
          'greater_than', 'less_than', 'exists', 'not_exists'
        ],
      },
      value: mongoose.Schema.Types.Mixed,
    }],
  },
  limits: {
    maxExecutionsPerCustomer: {
      count: Number,
      timeframe: {
        value: Number,
        unit: {
          type: String,
          enum: ['hours', 'days', 'weeks', 'months', 'all_time'],
        },
      },
    },
    maxTotalExecutions: Number,
    coolingPeriod: {
      value: Number,
      unit: {
        type: String,
        enum: ['minutes', 'hours', 'days'],
      },
    },
  },
  metrics: {
    timesTriggered: {
      type: Number,
      default: 0,
    },
    actionsExecuted: {
      type: Number,
      default: 0,
    },
    lastTriggered: Date,
    successRate: {
      type: Number,
      default: 0,
    },
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompanyOwner',
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'createdByModel',
  },
  createdByModel: {
    type: String,
    enum: ['CompanyOwner', 'User'],
    default: 'CompanyOwner',
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
    type: String,
    index: true,
    sparse: true,
    // Used for list/summary methods
  },
});

// Indexes
triggerRuleSchema.index({ owner: 1, removed: 1, isActive: 1 });
triggerRuleSchema.index({ triggerType: 1, isActive: 1 });
triggerRuleSchema.index({ 'eventConditions.eventType': 1, isActive: 1 });
triggerRuleSchema.index({ companyID: 1 }); // Index for companyID

// Pre-save middleware
triggerRuleSchema.pre('save', function(next) {
  this.updated = new Date();
  next();
});

// Add a validation check for timeCondition when triggerType is time_based
triggerRuleSchema.pre('validate', function(next) {
  if (this.triggerType === 'time_based' && 
      !this.timeCondition.specificDate && 
      !this.timeCondition.recurrence) {
    this.invalidate('timeCondition', 
      'Time condition must be specified for time-based triggers', 
      this.timeCondition);
  }
  
  // Check campaign condition requirements
  if (this.triggerType === 'campaign_event') {
    if (!this.campaignCondition.campaign) {
      this.invalidate('campaignCondition.campaign', 
        'Campaign is required for campaign event triggers',
        this.campaignCondition.campaign);
    }
    if (!this.campaignCondition.event) {
      this.invalidate('campaignCondition.event', 
        'Event type is required for campaign event triggers',
        this.campaignCondition.event);
    }
  }
  
  next();
});

// Methods
triggerRuleSchema.methods.incrementTriggered = function(success = true) {
  this.metrics.timesTriggered += 1;
  this.metrics.lastTriggered = new Date();
  
  if (success) {
    this.metrics.actionsExecuted += 1;
  }
  
  // Recalculate success rate
  if (this.metrics.timesTriggered > 0) {
    this.metrics.successRate = (this.metrics.actionsExecuted / this.metrics.timesTriggered) * 100;
  }
  
  return this.save();
};

// Static methods
triggerRuleSchema.statics.findActiveByEventType = function(ownerId, eventType) {
  return this.find({
    owner: ownerId,
    isActive: true,
    triggerType: 'behavior',
    'eventConditions.eventType': eventType,
    removed: false,
  }).sort({ priority: -1 }); // Sort by priority descending
};

triggerRuleSchema.statics.findActiveBySegment = function(ownerId, segmentId) {
  return this.find({
    owner: ownerId,
    isActive: true,
    triggerType: { $in: ['segment_entry', 'segment_exit'] },
    'segmentCondition.segment': segmentId,
    removed: false,
  }).sort({ priority: -1 });
};

triggerRuleSchema.statics.findDueTimeBasedTriggers = function() {
  const now = new Date();
  
  return this.find({
    isActive: true,
    triggerType: 'time_based',
    removed: false,
    $or: [
      // For specific date triggers
      {
        'timeCondition.specificDate': { 
          $lte: now, 
          $gte: new Date(now - 5 * 60 * 1000) // Within the last 5 minutes
        }
      },
      // For recurring triggers - this would need additional logic in application code
      // to properly check recurrence patterns
      {
        'timeCondition.recurrence': { $exists: true }
      }
    ]
  });
};

const TriggerRule = mongoose.model('TriggerRule', triggerRuleSchema);
module.exports = TriggerRule;
