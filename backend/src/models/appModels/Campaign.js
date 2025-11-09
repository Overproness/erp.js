const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const campaignSchema = new Schema({
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
    enum: ['email', 'sms', 'push', 'social', 'retargeting', 'multi_channel'],
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'failed', 'archived'],
    default: 'draft',
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
  },
  isRecurring: {
    type: Boolean,
    default: false,
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom'],
    },
    interval: {
      type: Number,
      min: 1,
    },
    daysOfWeek: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    }],
    monthlyDay: {
      type: Number,
      min: 1,
      max: 31,
    },
    endAfterOccurrences: Number,
    endDate: Date,
  },
  targetSegments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerSegment',
  }],
  excludeSegments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerSegment',
  }],
  content: {
    subject: String,
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailTemplate',
    },
    customHtml: String,
    templateVariables: mongoose.Schema.Types.Mixed,
    mediaAttachments: [{
      type: String,
      url: String,
      name: String,
    }],
  },
  channels: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push', 'social', 'web'],
      required: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    configuration: mongoose.Schema.Types.Mixed,
    deliveryOrder: {
      type: Number,
      default: 0,
    },
    delayHours: {
      type: Number,
      default: 0,
    },
  }],
  triggers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TriggerRule',
  }],
  metrics: {
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    converted: { type: Number, default: 0 },
    bounced: { type: Number, default: 0 },
    unsubscribed: { type: Number, default: 0 },
    complained: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    lastUpdated: Date,
  },
  aiOptimization: {
    enabled: { type: Boolean, default: false },
    optimizeFor: {
      type: String,
      enum: ['clicks', 'conversions', 'revenue', 'engagement'],
    },
    testingPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 10,
    },
    variants: [{
      name: String,
      content: mongoose.Schema.Types.Mixed,
      metrics: {
        sent: Number,
        opened: Number,
        clicked: Number,
        converted: Number,
        revenue: Number,
      },
    }],
    winningVariant: String,
  },
  tracking: {
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    utmTerm: String,
    utmContent: String,
    googleAnalytics: {
      enabled: { type: Boolean, default: false },
      trackingId: String,
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
campaignSchema.index({ owner: 1, removed: 1 });
campaignSchema.index({ status: 1, startDate: 1, endDate: 1 });
campaignSchema.index({ 'channels.type': 1 });
campaignSchema.index({ companyID: 1 }); // Index for companyID

// Pre-save middleware
campaignSchema.pre('save', function(next) {
  this.updated = new Date();
  next();
});

// Virtual for campaign effectiveness
campaignSchema.virtual('effectiveness').get(function() {
  if (this.metrics.sent === 0) return 0;
  
  // Calculate based on engagement and conversion metrics
  const openRate = this.metrics.opened / this.metrics.sent;
  const clickRate = this.metrics.clicked / this.metrics.sent;
  const conversionRate = this.metrics.converted / this.metrics.sent;
  
  // Weight different factors - can be adjusted
  return Math.round(
    (openRate * 0.3 + clickRate * 0.3 + conversionRate * 0.4) * 100
  );
});

// Methods
campaignSchema.methods.updateMetrics = async function(newMetrics) {
  Object.keys(newMetrics).forEach(key => {
    if (this.metrics[key] !== undefined) {
      this.metrics[key] += newMetrics[key];
    }
  });
  
  this.metrics.lastUpdated = new Date();
  return this.save();
};

campaignSchema.methods.getPerformanceReport = async function() {
  // Generate detailed performance report
  const report = {
    campaign: {
      id: this._id,
      name: this.name,
      type: this.type,
      status: this.status,
    },
    metrics: this.metrics,
    effectiveness: this.effectiveness,
    channelBreakdown: {},
    segmentPerformance: {},
    timeAnalysis: {},
  };
  
  // Implementation for detailed reporting would go here
  
  return report;
};

// Static methods
campaignSchema.statics.getActiveCampaigns = function(ownerId) {
  return this.find({
    owner: ownerId,
    status: 'active',
    startDate: { $lte: new Date() },
    $or: [
      { endDate: { $gte: new Date() } },
      { endDate: { $exists: false } }
    ],
    removed: false,
  });
};

campaignSchema.statics.getDueCampaigns = function() {
  return this.find({
    status: 'active',
    startDate: { $lte: new Date() },
    $or: [
      { endDate: { $gte: new Date() } },
      { endDate: { $exists: false } }
    ],
    removed: false,
  }).populate('targetSegments triggers');
};

const Campaign = mongoose.model('Campaign', campaignSchema);
module.exports = Campaign;
