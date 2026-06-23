// @ts-nocheck
import mongoose from 'mongoose';

const socialMentionSchema = new mongoose.Schema({
  platform: {
    type: String,
    enum: ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'reddit', 'news', 'blog'],
    required: true,
  },
  platformPostId: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000,
  },
  cleanContent: String, // Content with URLs, mentions, hashtags cleaned
  author: {
    username: String,
    displayName: String,
    profileUrl: String,
    avatarUrl: String,
    followerCount: Number,
    isVerified: Boolean,
    accountAge: Number, // Days since account creation
  },
  url: {
    type: String,
    required: true,
  },
  publishedAt: {
    type: Date,
    required: true,
  },
  detectedAt: {
    type: Date,
    default: Date.now,
  },
  mentionType: {
    type: String,
    enum: ['direct', 'indirect', 'hashtag', 'brand', 'competitor'],
    required: true,
  },
  keywords: [{
    keyword: String,
    relevance: Number, // 0-1 relevance score
    context: String,
  }],
  sentiment: {
    overall: {
      type: String,
      enum: ['positive', 'neutral', 'negative', 'mixed'],
      default: 'neutral',
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
    },
    scores: {
      positive: { type: Number, default: 0 },
      neutral: { type: Number, default: 0 },
      negative: { type: Number, default: 0 },
    },
    emotions: [{
      emotion: {
        type: String,
        enum: ['joy', 'sadness', 'anger', 'fear', 'surprise', 'trust', 'anticipation', 'disgust'],
      },
      intensity: { type: Number, min: 0, max: 1 },
    }],
  },
  engagement: {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    totalEngagement: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
  },
  influence: {
    reach: Number,
    impressions: Number,
    viralityScore: { type: Number, default: 0 }, // Potential for content to go viral
    authorInfluenceScore: { type: Number, default: 0 }, // Author's influence rating
  },
  classification: {
    category: {
      type: String,
      enum: ['complaint', 'compliment', 'question', 'suggestion', 'neutral_mention', 'spam'],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    topics: [String], // AI-extracted topics
    intent: {
      type: String,
      enum: ['purchase', 'support', 'feedback', 'inquiry', 'recommendation'],
    },
  },
  response: {
    status: {
      type: String,
      enum: ['pending', 'responded', 'ignored', 'escalated'],
      default: 'pending',
    },
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'response.respondedByModel',
    },
    respondedByModel: {
      type: String,
      enum: ['CompanyOwner', 'User'],
    },
    responseText: String,
    responseUrl: String,
    responseType: {
      type: String,
      enum: ['public_reply', 'private_message', 'like', 'repost', 'ignore'],
    },
    followUpRequired: { type: Boolean, default: false },
    followUpDate: Date,
  },
  tracking: {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SocialCampaign',
    },
    tags: [String],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'tracking.assignedToModel',
    },
    assignedToModel: {
      type: String,
      enum: ['CompanyOwner', 'User'],
    },
    notes: [{
      text: String,
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'tracking.notes.addedByModel',
      },
      addedByModel: {
        type: String,
        enum: ['CompanyOwner', 'User'],
      },
      addedAt: { type: Date, default: Date.now },
    }],
  },
  alerts: {
    notificationSent: { type: Boolean, default: false },
    alertType: {
      type: String,
      enum: ['real_time', 'daily_digest', 'weekly_summary'],
    },
    escalationLevel: {
      type: String,
      enum: ['none', 'supervisor', 'manager', 'executive'],
      default: 'none',
    },
  },
  verification: {
    isVerified: { type: Boolean, default: false },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'verification.verifiedByModel',
    },
    verifiedByModel: {
      type: String,
      enum: ['CompanyOwner', 'User'],
    },
    verifiedAt: Date,
    isSpam: { type: Boolean, default: false },
    isRelevant: { type: Boolean, default: true },
  },
  geo: {
    country: String,
    state: String,
    city: String,
    timezone: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  metadata: {
    language: String,
    mediaType: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'mixed'],
      default: 'text',
    },
    mediaUrls: [String],
    hashtags: [String],
    mentions: [String],
    urls: [String],
    processingVersion: String,
    rawData: mongoose.Schema.Types.Mixed, // Store original API response
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
  updated: {
    type: Date,
    default: Date.now,
  },
  companyID: {
    type: String,
          },
});

// Indexes
socialMentionSchema.index({ owner: 1, removed: 1 });
socialMentionSchema.index({ platform: 1, publishedAt: -1 });
socialMentionSchema.index({ sentiment: 1, priority: 1 });
socialMentionSchema.index({ keywords: 1 });
socialMentionSchema.index({ 'response.status': 1 });
socialMentionSchema.index({ mentionType: 1, detectedAt: -1 });
socialMentionSchema.index({ companyID: 1 }, { sparse: true }); // Index for companyID

// Text search index
socialMentionSchema.index({
  content: 'text',
  cleanContent: 'text',
  'author.username': 'text',
  'author.displayName': 'text',
});

// Middleware
socialMentionSchema.pre('save', function(next) {
  this.updated = new Date();
  
  // Calculate total engagement
  this.engagement.totalEngagement = 
    this.engagement.likes + 
    this.engagement.comments + 
    this.engagement.shares;
  
  // Calculate engagement rate if we have follower count
  if (this.author.followerCount > 0) {
    this.engagement.engagementRate = 
      (this.engagement.totalEngagement / this.author.followerCount) * 100;
  }
  
  next();
});

// Virtual fields
socialMentionSchema.virtual('urgencyScore').get(function() {
  let score = 0;
  
  // Sentiment weight
  if (this.sentiment.overall === 'negative') score += 30;
  else if (this.sentiment.overall === 'positive') score += 10;
  
  // Engagement weight
  if (this.engagement.totalEngagement > 100) score += 20;
  else if (this.engagement.totalEngagement > 10) score += 10;
  
  // Author influence weight
  if (this.author.followerCount > 10000) score += 25;
  else if (this.author.followerCount > 1000) score += 15;
  
  // Verified account weight
  if (this.author.isVerified) score += 15;
  
  // Time weight (newer = more urgent)
  const hoursSincePublished = (Date.now() - this.publishedAt) / (1000 * 60 * 60);
  if (hoursSincePublished < 1) score += 10;
  else if (hoursSincePublished < 24) score += 5;
  
  return Math.min(100, score);
});

socialMentionSchema.virtual('responseTimeRequired').get(function() {
  const urgency = this.urgencyScore;
  
  if (urgency >= 80) return '1 hour';
  else if (urgency >= 60) return '4 hours';
  else if (urgency >= 40) return '24 hours';
  else return '72 hours';
});

// Instance methods
socialMentionSchema.methods.markAsResponded = function(responseData) {
  this.response.status = 'responded';
  this.response.respondedAt = new Date();
  this.response.respondedBy = responseData.userId;
  this.response.respondedByModel = responseData.userModel;
  this.response.responseText = responseData.text;
  this.response.responseUrl = responseData.url;
  this.response.responseType = responseData.type;
  
  return this.save();
};

socialMentionSchema.methods.addNote = function(noteData) {
  this.tracking.notes.push({
    text: noteData.text,
    addedBy: noteData.userId,
    addedByModel: noteData.userModel,
    addedAt: new Date(),
  });
  
  return this.save();
};

socialMentionSchema.methods.assignTo = function(userId, userModel) {
  this.tracking.assignedTo = userId;
  this.tracking.assignedToModel = userModel;
  
  return this.save();
};

// Static methods
socialMentionSchema.statics.findByKeywords = function(ownerId, keywords, dateRange = null) {
  const filter = {
    owner: ownerId,
    removed: false,
    'keywords.keyword': { $in: keywords },
  };
  
  if (dateRange) {
    filter.publishedAt = {
      $gte: dateRange.start,
      $lte: dateRange.end,
    };
  }
  
  return this.find(filter).sort({ publishedAt: -1 });
};

socialMentionSchema.statics.getUnrespondedMentions = function(ownerId, priority = null) {
  const filter = {
    owner: ownerId,
    removed: false,
    'response.status': 'pending',
  };
  
  if (priority) {
    filter['classification.priority'] = priority;
  }
  
  return this.find(filter).sort({ urgencyScore: -1, publishedAt: -1 });
};

socialMentionSchema.statics.getSentimentAnalysis = function(ownerId, dateRange) {
  return this.aggregate([
    {
      $match: {
        owner: ownerId,
        removed: false,
        publishedAt: {
          $gte: dateRange.start,
          $lte: dateRange.end,
        },
      }
    },
    {
      $group: {
        _id: '$sentiment.overall',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$sentiment.confidence' },
        avgEngagement: { $avg: '$engagement.totalEngagement' },
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

const exportedModel = mongoose.model('SocialMention', socialMentionSchema);
export default exportedModel;
