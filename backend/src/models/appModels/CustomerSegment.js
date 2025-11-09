const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const customerSegmentSchema = new Schema({
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
    enum: ['static', 'dynamic', 'behavioral', 'ai_generated'],
    default: 'dynamic',
  },
  conditions: [{
    field: {
      type: String,
      required: true,
    },
    operator: {
      type: String,
      enum: [
        'equals', 'not_equals', 'contains', 'not_contains',
        'starts_with', 'ends_with', 'greater_than', 'less_than',
        'between', 'in_list', 'not_in_list', 'exists', 'not_exists',
        'regex', 'has_performed', 'has_not_performed'
      ],
      required: true,
    },
    value: mongoose.Schema.Types.Mixed,
    valueList: [mongoose.Schema.Types.Mixed],
    minValue: mongoose.Schema.Types.Mixed,
    maxValue: mongoose.Schema.Types.Mixed,
    lookbackDays: Number,
    frequency: {
      count: Number,
      operator: {
        type: String,
        enum: ['exactly', 'at_least', 'at_most', 'between'],
      },
      minCount: Number,
      maxCount: Number,
    },
  }],
  conditionLogic: {
    type: String,
    enum: ['and', 'or', 'custom'],
    default: 'and',
  },
  customLogicExpression: {
    type: String,
    validate: {
      validator: function(v) {
        // Only required if conditionLogic is 'custom'
        return this.conditionLogic !== 'custom' || (v && v.trim().length > 0);
      },
      message: 'Custom logic expression is required when condition logic is set to "custom"'
    },
  },
  tags: [{
    type: String,
    trim: true,
  }],
  isSystem: {
    type: Boolean,
    default: false,
  },
  customerCount: {
    type: Number,
    default: 0,
  },
  lastCalculated: {
    type: Date,
  },
  calculationStatus: {
    type: String,
    enum: ['pending', 'calculating', 'ready', 'failed'],
    default: 'pending',
  },
  calculationError: String,
  refreshSchedule: {
    frequency: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'monthly', 'never'],
      default: 'daily',
    },
    lastRefresh: Date,
    nextRefresh: Date,
  },
  staticCustomers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
  }],
  excludedCustomers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
  }],
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
customerSegmentSchema.index({ owner: 1, removed: 1 });
customerSegmentSchema.index({ owner: 1, name: 1 });
customerSegmentSchema.index({ owner: 1, tags: 1 });
customerSegmentSchema.index({ companyID: 1 }); // Index for companyID

// Pre-save middleware
customerSegmentSchema.pre('save', function(next) {
  this.updated = new Date();
  next();
});

// Methods
customerSegmentSchema.methods.markCalculating = function() {
  this.calculationStatus = 'calculating';
  this.lastCalculated = new Date();
  return this.save();
};

customerSegmentSchema.methods.markReady = function(count) {
  this.calculationStatus = 'ready';
  this.customerCount = count;
  this.lastCalculated = new Date();
  
  // Set next refresh date
  if (this.refreshSchedule && this.refreshSchedule.frequency !== 'never') {
    const nextRefresh = new Date();
    switch (this.refreshSchedule.frequency) {
      case 'hourly':
        nextRefresh.setHours(nextRefresh.getHours() + 1);
        break;
      case 'daily':
        nextRefresh.setDate(nextRefresh.getDate() + 1);
        break;
      case 'weekly':
        nextRefresh.setDate(nextRefresh.getDate() + 7);
        break;
      case 'monthly':
        nextRefresh.setMonth(nextRefresh.getMonth() + 1);
        break;
    }
    this.refreshSchedule.lastRefresh = new Date();
    this.refreshSchedule.nextRefresh = nextRefresh;
  }
  
  return this.save();
};

customerSegmentSchema.methods.markFailed = function(error) {
  this.calculationStatus = 'failed';
  this.calculationError = error.message || String(error);
  this.lastCalculated = new Date();
  return this.save();
};

// Static methods
customerSegmentSchema.statics.findByOwnerAndTags = function(ownerId, tags) {
  return this.find({
    owner: ownerId,
    tags: { $in: tags },
    removed: false
  });
};

customerSegmentSchema.statics.findSegmentsNeedingRefresh = function() {
  return this.find({
    type: 'dynamic',
    removed: false,
    'refreshSchedule.frequency': { $ne: 'never' },
    'refreshSchedule.nextRefresh': { $lte: new Date() }
  });
};

const CustomerSegment = mongoose.model('CustomerSegment', customerSegmentSchema);
module.exports = CustomerSegment;
