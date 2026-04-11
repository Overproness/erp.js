// @ts-nocheck
const mongoose = require('mongoose');

const aiUserPreferenceSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
    unique: true,
  },
  preferences: {
    defaultAssistant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AiAssistant',
    },
    communicationStyle: {
      type: String,
      enum: ['formal', 'casual', 'technical', 'friendly'],
      default: 'friendly',
    },
    responseLength: {
      type: String,
      enum: ['brief', 'detailed', 'comprehensive'],
      default: 'detailed',
    },
    autoSuggestions: {
      type: Boolean,
      default: true,
    },
    contextAwareness: {
      type: Boolean,
      default: true,
    },
    learningFromInteractions: {
      type: Boolean,
      default: true,
    },
  },
  moduleSettings: {
    client: {
      enabled: { type: Boolean, default: true },
      priority: { type: Number, default: 5 },
      features: [String],
    },
    invoice: {
      enabled: { type: Boolean, default: true },
      priority: { type: Number, default: 5 },
      features: [String],
    },
    quote: {
      enabled: { type: Boolean, default: true },
      priority: { type: Number, default: 5 },
      features: [String],
    },
    document: {
      enabled: { type: Boolean, default: true },
      priority: { type: Number, default: 5 },
      features: [String],
    },
    workflow: {
      enabled: { type: Boolean, default: true },
      priority: { type: Number, default: 5 },
      features: [String],
    },
  },
  usage: {
    totalInteractions: {
      type: Number,
      default: 0,
    },
    lastUsed: Date,
    favoriteFeatures: [String],
    frequentQueries: [
      {
        query: String,
        count: Number,
        lastUsed: Date,
      },
    ],
  },
  privacy: {
    dataSharing: {
      type: Boolean,
      default: false,
    },
    analyticsOptIn: {
      type: Boolean,
      default: true,
    },
    conversationStorage: {
      type: Boolean,
      default: true,
    },
    retentionPeriod: {
      type: Number,
      default: 90, // days
    },
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
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
  companyID: {
    type: String,
          },
});

aiUserPreferenceSchema.pre('save', function (next) {
  this.updated = Date.now();
  next();
});

aiUserPreferenceSchema.index({ companyID: 1 }, { sparse: true }); // Index for companyID

const exportedModel = mongoose.model('AiUserPreference', aiUserPreferenceSchema);
module.exports = exportedModel;
