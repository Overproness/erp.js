// @ts-nocheck
import mongoose from 'mongoose';
const Schema = mongoose.Schema;
import crypto from 'crypto';

const reviewLinkSchema = new Schema({
  business: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  linkId: {
    type: String,
    unique: true,
    required: true,
    default: () => crypto.randomBytes(8).toString('hex'),
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  targetPlatform: {
    type: String,
    enum: ['direct', 'google', 'facebook', 'choice'],
    default: 'direct',
  },
  expiresAt: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  customBranding: {
    enabled: {
      type: Boolean,
      default: false,
    },
    logo: String,
    primaryColor: String,
    secondaryColor: String,
    headerText: String,
    thankYouMessage: String,
  },
  prefilledData: {
    clientName: String,
    clientEmail: String,
    redirectUrl: String,
    productName: String,
  },
  analytics: {
    views: {
      type: Number,
      default: 0,
    },
    submissions: {
      type: Number,
      default: 0,
    },
    conversionRate: {
      type: Number,
      default: 0,
    },
    lastViewed: Date,
  },
  settings: {
    requireEmail: {
      type: Boolean,
      default: false,
    },
    askForContact: {
      type: Boolean,
      default: true,
    },
    redirectAfterSubmission: {
      type: Boolean, 
      default: false,
    },
    redirectUrl: String,
    sendThankYouEmail: {
      type: Boolean,
      default: false,
    },
    notificationEmail: String,
  },
  tags: [String],
  source: {
    type: String,
    enum: ['manual', 'campaign', 'integration', 'api'],
    default: 'manual',
  },
  campaignId: {
    type: Schema.Types.ObjectId,
    ref: 'Campaign',
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'CompanyOwner',
    required: true,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
  removed: {
    type: Boolean,
    default: false,
  },
  companyID: {
    type: String,  }
});

// Indexes

reviewLinkSchema.index({ business: 1, created: -1 });
reviewLinkSchema.index({ owner: 1, removed: false });
reviewLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
reviewLinkSchema.index({ companyID: 1 }, { sparse: true }); // Index for companyID

// Pre-save middleware
reviewLinkSchema.pre('save', function(next) {
  this.updated = new Date();
  
  // Calculate conversion rate
  if (this.analytics.views > 0) {
    this.analytics.conversionRate = (this.analytics.submissions / this.analytics.views) * 100;
  }
  
  next();
});

// Methods
reviewLinkSchema.methods.incrementViews = function() {
  this.analytics.views += 1;
  this.analytics.lastViewed = new Date();
  return this.save();
};

reviewLinkSchema.methods.incrementSubmissions = function() {
  this.analytics.submissions += 1;
  return this.save();
};

reviewLinkSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

// Check if link is expired
reviewLinkSchema.methods.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Static methods
reviewLinkSchema.statics.findByLinkId = function(linkId) {
  return this.findOne({ linkId, isActive: true, removed: false });
};

reviewLinkSchema.statics.findActiveLinksByBusiness = function(businessId) {
  const now = new Date();
  
  return this.find({
    business: businessId,
    isActive: true,
    removed: false,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: now } }
    ]
  }).sort({ created: -1 });
};

// Additional useful methods
reviewLinkSchema.statics.getAnalytics = function(businessId, startDate, endDate) {
  const dateFilter = {};
  
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);
  
  const analyticsQuery = [
    { 
      $match: { 
        business: mongoose.Types.ObjectId(businessId),
        removed: false,
        ...(Object.keys(dateFilter).length > 0 && { 'analytics.lastViewed': dateFilter })
      } 
    },
    { 
      $group: {
        _id: null,
        totalViews: { $sum: '$analytics.views' },
        totalSubmissions: { $sum: '$analytics.submissions' },
        avgConversionRate: { $avg: '$analytics.conversionRate' },
        linkCount: { $sum: 1 }
      } 
    }
  ];
  
  return this.aggregate(analyticsQuery);
};

// Get links by target platform
reviewLinkSchema.statics.findByTargetPlatform = function(businessId, platform) {
  return this.find({
    business: businessId,
    targetPlatform: platform,
    isActive: true,
    removed: false
  }).sort({ created: -1 });
};

const ReviewLink = mongoose.model('ReviewLink', reviewLinkSchema);
export default ReviewLink;
