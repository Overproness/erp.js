// @ts-nocheck
import mongoose from 'mongoose';

const urlClickSchema = new mongoose.Schema({
  // URL Reference
  url: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'URL',
    required: true,
    index: true
  },
  shortCode: {
    type: String,
    required: true,
    index: true
  },

  // Click Timing
  clickedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  responseTime: {
    type: Number, // milliseconds
    default: 0
  },

  // User Information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  },
  isAuthenticated: {
    type: Boolean,
    default: false
  },
  userId: {
    type: String, // For tracking anonymous users
    index: true
  },
  sessionId: {
    type: String,
    index: true
  },
  isUniqueClick: {
    type: Boolean,
    default: false,
    index: true
  },

  // Device and Browser Information
  userAgent: {
    type: String,
    trim: true
  },
  device: {
    type: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'unknown'],
      default: 'unknown'
    },
    name: String,
    brand: String,
    model: String
  },
  browser: {
    name: String,
    version: String,
    major: String
  },
  os: {
    name: String,
    version: String
  },
  screenResolution: {
    width: Number,
    height: Number
  },

  // Location Information
  ipAddress: {
    type: String,
    required: true,
    select: false // Don't include in queries by default for privacy
  },
  country: {
    type: String,
    trim: true,
    index: true
  },
  countryCode: {
    type: String,
    trim: true,
    uppercase: true,
    maxlength: 2
  },
  region: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  latitude: {
    type: Number,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    min: -180,
    max: 180
  },
  timezone: {
    type: String,
    trim: true
  },
  isp: {
    type: String,
    trim: true
  },

  // Referrer Information
  referrer: {
    type: String,
    trim: true
  },
  referrerDomain: {
    type: String,
    trim: true,
    index: true
  },
  referrerType: {
    type: String,
    enum: ['direct', 'search', 'social', 'email', 'paid', 'other'],
    default: 'direct',
    index: true
  },

  // UTM Parameters
  utmSource: {
    type: String,
    trim: true,
    index: true
  },
  utmMedium: {
    type: String,
    trim: true,
    index: true
  },
  utmCampaign: {
    type: String,
    trim: true,
    index: true
  },
  utmTerm: {
    type: String,
    trim: true
  },
  utmContent: {
    type: String,
    trim: true
  },

  // A/B Testing
  abTestGroup: {
    type: String,
    enum: ['control', 'variant_a', 'variant_b', 'variant_c'],
    index: true
  },
  abTestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ABTest',  },

  // Behavior Tracking
  timeOnSite: {
    type: Number, // seconds
    default: 0
  },
  pageViews: {
    type: Number,
    default: 1,
    min: 1
  },
  isBot: {
    type: Boolean,
    default: false,
    index: true
  },
  botType: {
    type: String,
    enum: ['search_engine', 'social_media', 'monitoring', 'malicious', 'other']
  },

  // Conversion Tracking
  isConversion: {
    type: Boolean,
    default: false,
    index: true
  },
  conversionType: {
    type: String,
    enum: ['purchase', 'signup', 'download', 'contact', 'subscribe', 'other']
  },
  conversionValue: {
    type: Number,
    default: 0
  },

  // Quality Metrics
  isValidClick: {
    type: Boolean,
    default: true,
    index: true
  },
  isSuspicious: {
    type: Boolean,
    default: false,
    index: true
  },
  fraudScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // Additional Context
  language: {
    type: String,
    trim: true
  },
  acceptLanguage: {
    type: String,
    trim: true
  },
  doNotTrack: {
    type: Boolean,
    default: false
  },

  // Metadata
  customData: {
    type: mongoose.Schema.Types.Mixed // For custom tracking data
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  companyID: {
    type: String,
          }
}, {
  timestamps: { createdAt: true, updatedAt: false }, // Only track creation time
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance and analytics
urlClickSchema.index({ url: 1, clickedAt: -1 });
urlClickSchema.index({ shortCode: 1, clickedAt: -1 });
urlClickSchema.index({ clickedAt: -1 });
urlClickSchema.index({ country: 1, clickedAt: -1 });
urlClickSchema.index({ referrerDomain: 1, clickedAt: -1 });
urlClickSchema.index({ 'device.type': 1, clickedAt: -1 });
urlClickSchema.index({ utmSource: 1, utmMedium: 1, utmCampaign: 1 });
urlClickSchema.index({ abTestGroup: 1, abTestId: 1 });
urlClickSchema.index({ userId: 1, sessionId: 1 });
urlClickSchema.index({ isBot: 1, isValidClick: 1 });
urlClickSchema.index({ companyID: 1 }, { sparse: true }); // Index for companyID

// Compound indexes for common queries
urlClickSchema.index({ url: 1, isValidClick: 1, isBot: 1, clickedAt: -1 });
urlClickSchema.index({ shortCode: 1, country: 1, clickedAt: -1 });

// TTL index for data retention (keep clicks for 2 years by default)
urlClickSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 }); // 2 years

// Virtual for click hour
urlClickSchema.virtual('clickHour').get(function() {
  return this.clickedAt.getHours();
});

// Virtual for click day of week
urlClickSchema.virtual('clickDayOfWeek').get(function() {
  return this.clickedAt.getDay();
});

// Virtual for click date (YYYY-MM-DD)
urlClickSchema.virtual('clickDate').get(function() {
  return this.clickedAt.toISOString().split('T')[0];
});

// Static method to get analytics for a URL
urlClickSchema.statics.getAnalytics = function(urlId, startDate, endDate) {
  const matchStage = {
    url: urlId,
    isValidClick: true,
    isBot: false
  };
  
  if (startDate || endDate) {
    matchStage.clickedAt = {};
    if (startDate) matchStage.clickedAt.$gte = new Date(startDate);
    if (endDate) matchStage.clickedAt.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalClicks: { $sum: 1 },
        uniqueClicks: { $addToSet: '$userId' },
        countries: { $addToSet: '$country' },
        devices: { $addToSet: '$device.type' },
        browsers: { $addToSet: '$browser.name' },
        referrers: { $addToSet: '$referrerDomain' },
        avgResponseTime: { $avg: '$responseTime' }
      }
    },
    {
      $project: {
        totalClicks: 1,
        uniqueClicks: { $size: '$uniqueClicks' },
        countries: 1,
        devices: 1,
        browsers: 1,
        referrers: 1,
        avgResponseTime: 1
      }
    }
  ]);
};

// Static method to get geographic distribution
urlClickSchema.statics.getGeographicData = function(urlId, startDate, endDate) {
  const matchStage = {
    url: urlId,
    isValidClick: true,
    isBot: false,
    country: { $exists: true, $ne: null }
  };
  
  if (startDate || endDate) {
    matchStage.clickedAt = {};
    if (startDate) matchStage.clickedAt.$gte = new Date(startDate);
    if (endDate) matchStage.clickedAt.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$country',
        clicks: { $sum: 1 },
        uniqueClicks: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        country: '$_id',
        clicks: 1,
        uniqueClicks: { $size: '$uniqueClicks' }
      }
    },
    { $sort: { clicks: -1 } }
  ]);
};

// Static method for bot detection
urlClickSchema.statics.detectBot = function(userAgent) {
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /facebook/i, /twitter/i, /linkedin/i,
    /google/i, /bing/i, /yahoo/i, /baidu/i,
    /curl/i, /wget/i, /python/i, /php/i
  ];
  
  return botPatterns.some(pattern => pattern.test(userAgent));
};

// Pre-save middleware
urlClickSchema.pre('save', function(next) {
  // Detect if this is a bot
  if (this.userAgent) {
    this.isBot = this.constructor.detectBot(this.userAgent);
  }
  
  // Extract referrer domain
  if (this.referrer) {
    try {
      const url = new URL(this.referrer);
      this.referrerDomain = url.hostname;
    } catch (error) {
      // Invalid URL, keep as is
    }
  }
  
  next();
});

const exportedModel = mongoose.model('URLClick', urlClickSchema);
export default exportedModel;
module.exports = exportedModel;
