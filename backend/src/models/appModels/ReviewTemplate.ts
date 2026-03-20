// @ts-nocheck
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const reviewTemplateSchema = new Schema({
  business: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  platform: {
    type: String,
    enum: ['all', 'direct', 'google', 'facebook', 'yelp', 'tripadvisor', 'trustpilot'],
    default: 'all',
  },
  sentimentType: {
    type: String,
    enum: ['all', 'positive', 'neutral', 'negative'],
    default: 'all',
  },
  minRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  maxRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  templateText: {
    type: String,
    required: true,
    trim: true,
  },
  variables: [{
    name: String,
    defaultValue: String,
    description: String,
  }],
  tags: [String],
  isDefault: {
    type: Boolean,
    default: false,
  },
  useCount: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    enum: ['general', 'thanks', 'apology', 'follow-up', 'custom'],
    default: 'general',
  },
  lastUsed: Date,
  createdBy: {
    type: Schema.Types.ObjectId,
    refPath: 'createdByModel',
  },
  createdByModel: {
    type: String,
    enum: ['CompanyOwner', 'User'],
    default: 'CompanyOwner',
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
          },
});

// Indexes
reviewTemplateSchema.index({ business: 1, sentimentType: 1 });
reviewTemplateSchema.index({ business: 1, platform: 1 });
reviewTemplateSchema.index({ business: 1, isDefault: 1 });
reviewTemplateSchema.index({ owner: 1, removed: false });
reviewTemplateSchema.index({ companyID: 1 }, { sparse: true }); // Index for companyID

// Text index for searching templates
reviewTemplateSchema.index({ 
  name: 'text', 
  description: 'text', 
  templateText: 'text' 
});

// Pre-save middleware
reviewTemplateSchema.pre('save', function(next) {
  this.updated = new Date();
  next();
});

// Methods
reviewTemplateSchema.methods.incrementUseCount = function() {
  this.useCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

reviewTemplateSchema.methods.markAsDefault = async function() {
  // First, unmark all other default templates for this business and sentiment
  await this.constructor.updateMany(
    { 
      business: this.business,
      sentimentType: this.sentimentType,
      platform: this.platform,
      isDefault: true,
      _id: { $ne: this._id }
    },
    { isDefault: false }
  );
  
  // Then mark this one as default
  this.isDefault = true;
  return this.save();
};

// Fill template with variables
reviewTemplateSchema.methods.fillTemplate = function(data = {}) {
  let filledText = this.templateText;
  
  // Replace template variables with data
  for (const variable of this.variables) {
    const regex = new RegExp(`{{${variable.name}}}`, 'g');
    const value = data[variable.name] || variable.defaultValue || '';
    filledText = filledText.replace(regex, value);
  }
  
  // Replace standard variables
  const standardReplacements = {
    '{{businessName}}': data.businessName || '',
    '{{customerName}}': data.customerName || 'valued customer',
    '{{reviewRating}}': data.reviewRating || '',
    '{{responseDate}}': new Date().toLocaleDateString(),
    '{{respondentName}}': data.respondentName || '',
    '{{respondentTitle}}': data.respondentTitle || '',
  };
  
  Object.entries(standardReplacements).forEach(([key, value]) => {
    filledText = filledText.replace(new RegExp(key, 'g'), value);
  });
  
  return filledText;
};

// Static methods
reviewTemplateSchema.statics.findByBusinessAndSentiment = function(businessId, sentimentType, platform = 'all') {
  return this.find({ 
    business: businessId, 
    $or: [
      { sentimentType: sentimentType },
      { sentimentType: 'all' }
    ],
    $or: [
      { platform: platform },
      { platform: 'all' }
    ],
    removed: false 
  }).sort({ isDefault: -1, useCount: -1 });
};

reviewTemplateSchema.statics.findDefaultTemplate = function(businessId, sentimentType, platform = 'all') {
  return this.findOne({
    business: businessId,
    sentimentType: sentimentType,
    platform: platform,
    isDefault: true,
    removed: false
  });
};

reviewTemplateSchema.statics.findByRatingRange = function(businessId, rating) {
  return this.find({
    business: businessId,
    $or: [
      { minRating: { $lte: rating }, maxRating: { $gte: rating } },
      { minRating: { $exists: false }, maxRating: { $exists: false } }
    ],
    removed: false
  });
};

const ReviewTemplate = mongoose.model('ReviewTemplate', reviewTemplateSchema);
module.exports = ReviewTemplate;
