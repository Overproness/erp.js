// @ts-nocheck
import mongoose from 'mongoose';

const socialAnalyticsSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocialPost',
  },
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocialCampaign',
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocialAccount',
  },
  platform: {
    type: String,
    enum: ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok'],
    required: true,
  },
  platformData: {
    // Core metrics available across all platforms
    reach: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    
    // Platform-specific metrics
    facebook: {
      reactions: {
        like: Number,
        love: Number,
        haha: Number,
        wow: Number,
        sad: Number,
        angry: Number,
      },
      videoViews: Number,
      pageViews: Number,
      postClicks: Number,
      otherClicks: Number,
    },
    instagram: {
      profile_visits: Number,
      website_clicks: Number,
      story_views: Number,
      story_exits: Number,
      story_replies: Number,
      reel_plays: Number,
      reel_shares: Number,
    },
    twitter: {
      retweets: Number,
      quote_tweets: Number,
      replies: Number,
      profile_clicks: Number,
      url_clicks: Number,
      hashtag_clicks: Number,
      media_views: Number,
      poll_votes: Number,
    },
    linkedin: {
      total_engagement: Number,
      unique_impressions: Number,
      clicks_unique: Number,
      shares_unique: Number,
      comments_unique: Number,
      likes_unique: Number,
    },
  },
  demographics: {
    gender: {
      male: { type: Number, default: 0 },
      female: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    age: {
      '13-17': { type: Number, default: 0 },
      '18-24': { type: Number, default: 0 },
      '25-34': { type: Number, default: 0 },
      '35-44': { type: Number, default: 0 },
      '45-54': { type: Number, default: 0 },
      '55-64': { type: Number, default: 0 },
      '65+': { type: Number, default: 0 },
    },
    location: [{
      country: String,
      percentage: Number,
    }],
    devices: {
      mobile: { type: Number, default: 0 },
      desktop: { type: Number, default: 0 },
      tablet: { type: Number, default: 0 },
    },
  },
  timeMetrics: {
    hourlyBreakdown: [{
      hour: { type: Number, min: 0, max: 23 },
      engagement: Number,
      reach: Number,
    }],
    dailyBreakdown: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      },
      engagement: Number,
      reach: Number,
    }],
    bestPostingTimes: [{
      day: String,
      hour: Number,
      score: Number,
    }],
  },
  competitorData: {
    competitors: [{
      name: String,
      platform: String,
      metrics: {
        followers: Number,
        engagement_rate: Number,
        posts_per_week: Number,
        avg_likes: Number,
        avg_comments: Number,
      },
      lastUpdated: Date,
    }],
    marketShare: {
      total_market_size: Number,
      our_share: Number,
      percentage: Number,
    },
  },
  sentimentAnalysis: {
    overall: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'neutral',
    },
    scores: {
      positive: { type: Number, default: 0 },
      neutral: { type: Number, default: 0 },
      negative: { type: Number, default: 0 },
    },
    keywords: [{
      word: String,
      sentiment: String,
      frequency: Number,
    }],
    comments: [{
      text: String,
      sentiment: String,
      score: Number,
      platform_id: String,
    }],
  },
  conversion: {
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    conversion_rate: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    cost_per_click: { type: Number, default: 0 },
    cost_per_conversion: { type: Number, default: 0 },
    return_on_ad_spend: { type: Number, default: 0 },
  },
  urlTracking: [{
    original_url: String,
    short_url: String,
    clicks: Number,
    unique_clicks: Number,
    referrers: [{
      source: String,
      clicks: Number,
    }],
    geographic_data: [{
      country: String,
      clicks: Number,
    }],
  }],
  hashtags: [{
    tag: String,
    reach: Number,
    engagement: Number,
    posts_count: Number,
    trending_score: Number,
  }],
  mentions: [{
    text: String,
    author: String,
    platform_id: String,
    sentiment: String,
    followers: Number,
    engagement: Number,
    timestamp: Date,
  }],
  recordedAt: {
    type: Date,
    default: Date.now,
  },
  reportPeriod: {
    start: Date,
    end: Date,
  },
  dataFreshness: {
    lastUpdate: { type: Date, default: Date.now },
    nextUpdate: Date,
    updateFrequency: {
      type: String,
      enum: ['real-time', 'hourly', 'daily', 'weekly'],
      default: 'daily',
    },
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompanyOwner',
    required: true,
  },
  removed: {
    type: Boolean,
    default: false,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  companyID: {
    type: String,
          },
});

// Indexes
socialAnalyticsSchema.index({ owner: 1, removed: 1 });
socialAnalyticsSchema.index({ post: 1, platform: 1 });
socialAnalyticsSchema.index({ campaign: 1, platform: 1 });
socialAnalyticsSchema.index({ account: 1, recordedAt: -1 });
socialAnalyticsSchema.index({ platform: 1, recordedAt: -1 });
socialAnalyticsSchema.index({ companyID: 1 }, { sparse: true }); // Index for companyID

// Virtual fields
socialAnalyticsSchema.virtual('engagementRate').get(function() {
  if (this.platformData.reach === 0) return 0;
  return (this.platformData.engagement / this.platformData.reach) * 100;
});

socialAnalyticsSchema.virtual('clickThroughRate').get(function() {
  if (this.platformData.impressions === 0) return 0;
  return (this.platformData.clicks / this.platformData.impressions) * 100;
});

socialAnalyticsSchema.virtual('costPerEngagement').get(function() {
  if (this.platformData.engagement === 0) return 0;
  return this.conversion.cost_per_click / this.platformData.engagement;
});

// Instance methods
socialAnalyticsSchema.methods.calculatePerformanceScore = function() {
  const weights = {
    engagement: 0.3,
    reach: 0.2,
    clicks: 0.2,
    conversions: 0.3,
  };

  let score = 0;
  score += this.engagementRate * weights.engagement;
  score += (this.platformData.reach / 1000) * weights.reach;
  score += this.clickThroughRate * weights.clicks;
  score += (this.conversion.conversion_rate * 100) * weights.conversions;

  return Math.min(100, Math.round(score));
};

socialAnalyticsSchema.methods.updateMetrics = function(newMetrics) {
  Object.keys(newMetrics).forEach(key => {
    if (this.platformData[key] !== undefined) {
      this.platformData[key] = newMetrics[key];
    }
  });
  this.dataFreshness.lastUpdate = new Date();
  return this.save();
};

// Static methods
socialAnalyticsSchema.statics.getAnalyticsByDateRange = function(ownerId, startDate, endDate, platform = null) {
  const filter = {
    owner: ownerId,
    recordedAt: { $gte: startDate, $lte: endDate },
    removed: false,
  };

  if (platform) {
    filter.platform = platform;
  }

  return this.find(filter).populate('post campaign account');
};

socialAnalyticsSchema.statics.getTopPerformingPosts = function(ownerId, platform, limit = 10) {
  return this.aggregate([
    {
      $match: {
        owner: ownerId,
        platform: platform,
        removed: false,
      }
    },
    {
      $addFields: {
        performanceScore: {
          $add: [
            { $multiply: ['$platformData.engagement', 0.4] },
            { $multiply: ['$platformData.reach', 0.3] },
            { $multiply: ['$platformData.clicks', 0.3] },
          ]
        }
      }
    },
    { $sort: { performanceScore: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'socialposts',
        localField: 'post',
        foreignField: '_id',
        as: 'postData'
      }
    }
  ]);
};

const exportedModel = mongoose.model('SocialAnalytics', socialAnalyticsSchema);
export default exportedModel;
