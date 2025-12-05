const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const customerBehaviorSchema = new Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      index: true,
    },
    anonymousId: {
      type: String,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        'page_view',
        'product_view',
        'add_to_cart',
        'checkout_start',
        'purchase',
        'form_submit',
        'email_open',
        'email_click',
        'search',
        'login',
        'signup',
        'account_update',
        'review_submit',
        'social_share',
        'download',
        'video_play',
        'api_get',
        'api_create',
        'api_update',
        'api_delete',
        'api_other',
        'custom',
      ],
      index: true,
    },
    eventName: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    properties: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    url: {
      type: String,
      trim: true,
    },
    urlPath: {
      type: String,
      trim: true,
      index: true,
    },
    referrer: {
      type: String,
      trim: true,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      sparse: true,
    },
    source: {
      type: String,
      trim: true,
      index: true,
    },
    medium: {
      type: String,
      trim: true,
      index: true,
    },
    context: {
      ip: String,
      userAgent: String,
      device: {
        type: String,
        enum: ['desktop', 'mobile', 'tablet', 'other'],
      },
      browser: String,
      os: String,
      country: String,
      region: String,
      city: String,
      language: String,
    },
    sessionId: {
      type: String,
      index: true,
    },
    previousEvents: [
      {
        eventType: String,
        timestamp: Date,
        timeSincePrevious: Number, // in seconds
      },
    ],
    valueData: {
      currency: String,
      revenue: Number,
      value: Number,
      items: [
        {
          id: String,
          name: String,
          category: String,
          price: Number,
          quantity: Number,
        },
      ],
    },
    processingStatus: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'pending',
    },
    triggeredActions: [
      {
        triggerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'TriggerRule',
        },
        actionType: String,
        executedAt: Date,
        success: Boolean,
        details: mongoose.Schema.Types.Mixed,
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyOwner',
      required: true,
      index: true,
    },
    removed: {
      type: Boolean,
      default: false,
    },
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

// Create compound indexes for efficient querying
customerBehaviorSchema.index({ owner: 1, customer: 1, eventType: 1, timestamp: -1 });
customerBehaviorSchema.index({ owner: 1, anonymousId: 1, timestamp: -1 });
customerBehaviorSchema.index({ campaign: 1, eventType: 1, timestamp: -1 });
customerBehaviorSchema.index({ companyID: 1 }); // Index for companyID

// Methods
customerBehaviorSchema.methods.markAsProcessed = function () {
  this.processingStatus = 'processed';
  return this.save();
};

customerBehaviorSchema.methods.addTriggeredAction = function (
  triggerId,
  actionType,
  success,
  details
) {
  this.triggeredActions.push({
    triggerId,
    actionType,
    executedAt: new Date(),
    success,
    details,
  });
  return this.save();
};

// Static methods
customerBehaviorSchema.statics.findByCustomer = function (customerId, limit = 50) {
  return this.find({ customer: customerId }).sort({ timestamp: -1 }).limit(limit);
};

customerBehaviorSchema.statics.findByAnonymousId = function (anonymousId, limit = 50) {
  return this.find({ anonymousId }).sort({ timestamp: -1 }).limit(limit);
};

customerBehaviorSchema.statics.getCustomerTimeline = function (customerId, startDate, endDate) {
  const query = { customer: customerId };
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }

  return this.find(query).sort({ timestamp: -1 });
};

customerBehaviorSchema.statics.getBehaviorFrequency = async function (
  customerId,
  eventType,
  days = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const events = await this.find({
    customer: customerId,
    eventType,
    timestamp: { $gte: startDate },
  });

  return events.length;
};

const CustomerBehavior = mongoose.model('CustomerBehavior', customerBehaviorSchema);
module.exports = CustomerBehavior;
