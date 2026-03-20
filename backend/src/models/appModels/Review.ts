// @ts-nocheck
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
  business: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  title: {
    type: String,
    trim: true,
  },
  comment: {
    type: String,
    trim: true,
  },
  client: {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    avatarUrl: String,
  },
  platform: {
    type: String,
    enum: ['direct', 'google', 'facebook', 'yelp', 'tripadvisor', 'trustpilot', 'other'],
    default: 'direct',
  },
  platformReviewId: {
    type: String,
    sparse: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged', 'responded'],
    default: 'pending',
  },
  sentiment: {
    score: {
      type: Number,
      min: -1,
      max: 1,
      default: 0,
    },
    category: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'neutral',
    },
    keywords: [String],
  },
  source: {
    type: String,
    enum: ['web', 'email', 'sms', 'api', 'import', 'monitoring'],
    default: 'web',
  },
  sourceLink: {
    type: Schema.Types.ObjectId,
    ref: 'ReviewLink',
  },
  publishedAt: {
    type: Date,
    default: Date.now,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  hasResponse: {
    type: Boolean,
    default: false,
  },
  metadata: {
    ip: String,
    userAgent: String,
    location: {
      city: String,
      region: String,
      country: String,
      coordinates: {
        lat: Number,
        lng: Number,
      }
    },
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
    type: String,
    index: true,
    sparse: true,
  }
});

// Indexes for faster queries
reviewSchema.index({ business: 1, status: 1, created: -1 });
reviewSchema.index({ business: 1, platform: 1 });
reviewSchema.index({ business: 1, 'client.email': 1 });
reviewSchema.index({ business: 1, rating: 1 });
reviewSchema.index({ 'sentiment.category': 1, business: 1 });
reviewSchema.index({ companyID: 1 }); // Index for companyID

// Text index for searching review content
reviewSchema.index({ 
  'client.name': 'text',
  title: 'text', 
  comment: 'text'
});

// Pre-save middleware to update timestamps
reviewSchema.pre('save', function(next) {
  this.updated = new Date();
  next();
});

// Methods
reviewSchema.methods.markAsResponded = function() {
  this.status = 'responded';
  this.hasResponse = true;
  return this.save();
};

// Virtual field to get response
reviewSchema.virtual('response', {
  ref: 'ReviewResponse',
  localField: '_id',
  foreignField: 'review',
  justOne: true,
});

// Static methods
reviewSchema.statics.findByBusiness = function(businessId, options = {}) {
  const { status, platform, sort = { created: -1 }, limit = 50, skip = 0 } = options;
  
  const query = { business: businessId, removed: false };
  
  if (status) query.status = status;
  if (platform) query.platform = platform;
  
  return this.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('response');
};

reviewSchema.statics.getSentimentBreakdown = function(businessId) {
  return this.aggregate([
    { $match: { business: mongoose.Types.ObjectId(businessId), removed: false } },
    { $group: {
      _id: '$sentiment.category',
      count: { $sum: 1 },
      avgRating: { $avg: '$rating' }
    }},
    { $sort: { count: -1 } }
  ]);
};

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
