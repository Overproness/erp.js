// @ts-nocheck
import mongoose from 'mongoose';

const socialPostSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 10000,
  },
  platforms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocialAccount',
    required: true,
  }],
  mediaFiles: [{
    type: {
      type: String,
      enum: ['image', 'video', 'gif'],
    },
    url: String,
    filename: String,
    size: Number,
    altText: String,
    optimized: {
      facebook: String,
      instagram: String,
      twitter: String,
    },
  }],
  urls: [{
    original: String,
    shortened: String,
    trackingId: String,
    clicks: { type: Number, default: 0 },
  }],
  hashtags: [String],
  mentions: [String],
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'publishing', 'published', 'failed'],
    default: 'draft',
  },
  scheduledFor: Date,
  publishedAt: Date,
  platformPosts: [{
    platform: String,
    platformPostId: String,
    accountId: mongoose.Schema.Types.ObjectId,
    publishedUrl: String,
    publishedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'published', 'failed'],
      default: 'pending',
    },
    error: String,
  }],
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocialCampaign',
  },
  postType: {
    type: String,
    enum: ['text', 'image', 'video', 'carousel', 'story', 'reel'],
    default: 'text',
  },
  targeting: {
    demographics: {
      ageRange: {
        min: Number,
        max: Number,
      },
      gender: {
        type: String,
        enum: ['all', 'male', 'female', 'other'],
        default: 'all',
      },
      location: [String],
      interests: [String],
    },
    budget: Number,
    objective: {
      type: String,
      enum: ['awareness', 'traffic', 'engagement', 'conversions'],
    },
  },
  settings: {
    allowComments: { type: Boolean, default: true },
    allowSharing: { type: Boolean, default: true },
    trackClicks: { type: Boolean, default: true },
    autoReply: {
      enabled: { type: Boolean, default: false },
      message: String,
    },
  },
  analytics: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    lastUpdated: Date,
  },
  publishResults: [{
    platform: String,
    success: Boolean,
    platformPostId: String,
    publishedUrl: String,
    error: String,
    timestamp: { type: Date, default: Date.now },
  }],
  aiGenerated: {
    type: Boolean,
    default: false,
  },
  aiPrompt: String,
  aiModel: String,
  version: {
    type: Number,
    default: 1,
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
socialPostSchema.index({ owner: 1, removed: 1 });
socialPostSchema.index({ status: 1, scheduledFor: 1 });
socialPostSchema.index({ campaign: 1 });
socialPostSchema.index({ platforms: 1 });
socialPostSchema.index({ companyID: 1 }); // Index for companyID

// Middleware
socialPostSchema.pre('save', function(next) {
  this.updated = new Date();
  next();
});

// Virtual fields
socialPostSchema.virtual('totalEngagement').get(function() {
  return this.analytics.likes + this.analytics.comments + this.analytics.shares;
});

socialPostSchema.virtual('engagementRate').get(function() {
  if (this.analytics.reach === 0) return 0;
  return (this.totalEngagement / this.analytics.reach) * 100;
});

// Instance methods
socialPostSchema.methods.updateAnalytics = function(platformAnalytics) {
  Object.keys(platformAnalytics).forEach(key => {
    if (this.analytics[key] !== undefined) {
      this.analytics[key] += platformAnalytics[key] || 0;
    }
  });
  this.analytics.lastUpdated = new Date();
  return this.save();
};

socialPostSchema.methods.markAsPublished = function(platform, result) {
  this.status = 'published';
  // Find the platform in the platforms array
  const platformIndex = this.platforms.findIndex(p => p.platform === platform);
  
  if (platformIndex !== -1) {
    this.platforms[platformIndex].status = 'published';
    this.platforms[platformIndex].publishedAt = new Date();
    this.platforms[platformIndex].publishedUrl = result.publishedUrl;
    this.platforms[platformIndex].platformPostId = result.platformPostId;
  }
  
  // Update analytics
  if (!this.analytics) {
    this.analytics = {
      likes: 0,
      comments: 0,
      shares: 0,
      reach: 0,
      impressions: 0,
      lastUpdated: new Date()
    };
  }
  
  return this.save();
};

// Static methods
socialPostSchema.statics.getScheduledPosts = function(ownerId) {
  return this.find({
    owner: ownerId,
    status: 'scheduled',
    scheduledFor: { $lte: new Date() },
    removed: false,
  }).populate('platforms campaign');
};

socialPostSchema.statics.getPostsByDateRange = function(ownerId, startDate, endDate) {
  return this.find({
    owner: ownerId,
    publishedAt: {
      $gte: startDate,
      $lte: endDate,
    },
    removed: false,
  }).populate('platforms campaign');
};

const exportedModel = mongoose.model('SocialPost', socialPostSchema);
export default exportedModel;
module.exports = exportedModel;
