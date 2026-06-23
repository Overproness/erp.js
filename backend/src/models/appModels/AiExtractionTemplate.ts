// @ts-nocheck
import mongoose from 'mongoose';

const fieldSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['text', 'number', 'currency', 'date', 'datetime', 'boolean', 'array', 'email', 'phone', 'url'],
  },
  required: {
    type: Boolean,
    default: false,
  },
  validation: {
    pattern: String,
    minLength: Number,
    maxLength: Number,
    min: Number,
    max: Number,
  },
  defaultValue: mongoose.Schema.Types.Mixed,
  options: [String], // For select/enum fields
  description: String,
});

const aiExtractionTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['invoice', 'receipt', 'contract', 'form', 'identity_document', 'business_card', 'general'],
    default: 'general',
  },
  documentType: {
    type: String,
    required: true,
    default: 'document',
  },
  fields: [fieldSchema],
  validationRules: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
  usage_count: {
    type: Number,
    default: 0,
  },
  last_used: {
    type: Date,
  },
  version: {
    type: Number,
    default: 1,
  },
  tags: [String],
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
aiExtractionTemplateSchema.index({ owner: 1, removed: 1 });
aiExtractionTemplateSchema.index({ category: 1, enabled: 1 });
aiExtractionTemplateSchema.index({ name: 1, owner: 1 }, { unique: true });
aiExtractionTemplateSchema.index({ companyID: 1 }, { sparse: true }); // Index for companyID

// Middleware
aiExtractionTemplateSchema.pre('save', function(next) {
  this.updated = new Date();
  next();
});

// Instance methods
aiExtractionTemplateSchema.methods.incrementUsage = function() {
  this.usage_count += 1;
  this.last_used = new Date();
  return this.save();
};

// Static methods
aiExtractionTemplateSchema.statics.findByOwner = function(ownerId, filters = {}) {
  return this.find({
    owner: ownerId,
    removed: false,
    ...filters,
  });
};

aiExtractionTemplateSchema.statics.findPopular = function(limit = 10) {
  return this.find({ enabled: true, removed: false })
    .sort({ usage_count: -1 })
    .limit(limit);
};

const exportedModel = mongoose.model('AiExtractionTemplate', aiExtractionTemplateSchema);
export default exportedModel;
