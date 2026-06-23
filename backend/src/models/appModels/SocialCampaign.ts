// @ts-nocheck
import mongoose from 'mongoose';

const socialCampaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'archived'],
    default: 'draft',
  },
  type: {
    type: String,
    enum: ['awareness', 'engagement', 'traffic', 'conversions', 'sales'],
    required: true,
  },
  platforms: [{
    type: String,
    enum: ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok'],
  }],
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  budget: {
    total: Number,
    spent: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    dailyLimit: Number,
  },
  targetAudience: {
    demographics: {
      ageRange: {
        min: { type: Number, min: 13, max: 100 },
        max: { type: Number, min: 13, max: 100 },
      },
      gender: {
        type: String,
        enum: ['all', 'male', 'female', 'other'],
        default: 'all',
      },
      location: {
        countries: [String],
        states: [String],
        cities: [String],
        radius: Number, // in kilometers
      },
      languages: [String],
      interests: [String],
      behaviors: [String],
    },
    customAudiences: [String],
    lookalikeSources: [String],
  },
  objectives: {
    primary: {
      type: String,
      enum: ['brand_awareness', 'reach', 'traffic', 'engagement', 'video_views', 'lead_generation', 'conversions'],
      required: true,
    },
    secondary: [String],
  },
  content: {
    theme: String,
    tone: {
      type: String,
      enum: ['professional', 'casual', 'humorous', 'inspirational', 'educational'],
    },
    keywords: [String],
    hashtags: [String],
    contentPillars: [String],
  },
  schedule: {
    timezone: String,
    postingFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'bi-weekly', 'monthly', 'custom'],
    },
    customSchedule: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      },
      times: [String], // Array of time strings like "09:00", "14:30"
    }],
    optimalTimes: {
      autoDetect: { type: Boolean, default: true },
      manual: [{
        platform: String,
        day: String,
        time: String,
      }],
    },
  },
  tracking: {
    utmParameters: {
      source: String,
      medium: String,
      campaign: String,
      term: String,
      content: String,
    },
    conversionGoals: [{
      name: String,
      type: {
        type: String,
        enum: ['page_view', 'sign_up', 'purchase', 'download', 'contact'],
      },
      value: Number,
      currency: String,
    }],
    customEvents: [String],
  },
  analytics: {
    posts: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    costPerClick: { type: Number, default: 0 },
    costPerConversion: { type: Number, default: 0 },
    returnOnAdSpend: { type: Number, default: 0 },
    lastUpdated: Date,
    platformBreakdown: {
      facebook: {
        reach: Number,
        engagement: Number,
        clicks: Number,
        spent: Number,
      },
      instagram: {
        reach: Number,
        engagement: Number,
        clicks: Number,
        spent: Number,
      },
      twitter: {
        reach: Number,
        engagement: Number,
        clicks: Number,
        spent: Number,
      },
    },
  },
  approval: {
    required: { type: Boolean, default: false },
    approvers: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'approval.approvers.userModel',
      },
      userModel: {
        type: String,
        enum: ['CompanyOwner', 'User'],
      },
      role: String,
      approved: { type: Boolean, default: false },
      approvedAt: Date,
      comments: String,
    }],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  collaboration: {
    team: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'collaboration.team.userModel',
      },
      userModel: {
        type: String,
        enum: ['CompanyOwner', 'User'],
      },
      role: {
        type: String,
        enum: ['manager', 'creator', 'reviewer', 'viewer'],
      },
      permissions: [String],
    }],
    comments: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'collaboration.comments.userModel',
      },
      userModel: {
        type: String,
        enum: ['CompanyOwner', 'User'],
      },
      content: String,
      timestamp: { type: Date, default: Date.now },
      resolved: { type: Boolean, default: false },
    }],
  },
  automation: {
    enabled: { type: Boolean, default: false },
    rules: [{
      trigger: {
        type: String,
        enum: ['time', 'engagement_threshold', 'budget_threshold', 'performance'],
      },
      condition: String,
      action: {
        type: String,
        enum: ['pause_campaign', 'increase_budget', 'send_notification', 'create_post'],
      },
      parameters: mongoose.Schema.Types.Mixed,
    }],
  },
  tags: [String],
  notes: String,
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
          },
});

// Indexes
socialCampaignSchema.index({ owner: 1, removed: 1 });
socialCampaignSchema.index({ status: 1, startDate: 1, endDate: 1 });
socialCampaignSchema.index({ platforms: 1 });
socialCampaignSchema.index({ companyID: 1 }, { sparse: true }); // Index for companyID

// Middleware
socialCampaignSchema.pre('save', function(next) {
  this.updated = new Date();
  next();
});

// Virtual fields
socialCampaignSchema.virtual('duration').get(function() {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

socialCampaignSchema.virtual('budgetUtilization').get(function() {
  if (this.budget.total === 0) return 0;
  return (this.budget.spent / this.budget.total) * 100;
});

socialCampaignSchema.virtual('averageCostPerDay').get(function() {
  const daysRunning = Math.max(1, Math.ceil((new Date() - this.startDate) / (1000 * 60 * 60 * 24)));
  return this.budget.spent / daysRunning;
});

// Instance methods
socialCampaignSchema.methods.updateAnalytics = function(newAnalytics) {
  Object.keys(newAnalytics).forEach(key => {
    if (this.analytics[key] !== undefined) {
      this.analytics[key] = newAnalytics[key];
    }
  });
  this.analytics.lastUpdated = new Date();
  return this.save();
};

socialCampaignSchema.methods.addBudgetSpend = function(amount, platform) {
  this.budget.spent += amount;
  
  if (platform && this.analytics.platformBreakdown[platform]) {
    this.analytics.platformBreakdown[platform].spent += amount;
  }
  
  return this.save();
};

socialCampaignSchema.methods.checkBudgetLimit = function() {
  return this.budget.spent >= this.budget.total;
};

// Static methods
socialCampaignSchema.statics.getActiveCampaigns = function(ownerId) {
  return this.find({
    owner: ownerId,
    status: 'active',
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
    removed: false,
  });
};

socialCampaignSchema.statics.getCampaignsByDateRange = function(ownerId, startDate, endDate) {
  return this.find({
    owner: ownerId,
    $or: [
      {
        startDate: { $gte: startDate, $lte: endDate }
      },
      {
        endDate: { $gte: startDate, $lte: endDate }
      },
      {
        startDate: { $lte: startDate },
        endDate: { $gte: endDate }
      }
    ],
    removed: false,
  });
};

const exportedModel = mongoose.model('SocialCampaign', socialCampaignSchema);
export default exportedModel;
