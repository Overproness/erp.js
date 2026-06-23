// @ts-nocheck
import mongoose from 'mongoose';

const aiLearningDataSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.ObjectId, ref: 'CompanyOwner', required: true, index: true },

  // Interaction tracking
  interactionType: {
    type: String,
    enum: ['chat', 'suggestion', 'automation', 'analysis', 'recommendation'],
    required: true,
    index: true,
  },

  // Input data
  input: {
    message: String,
    context: mongoose.Schema.Types.Mixed,
    module: String,
    assistantId: String,
  },

  // Output data
  output: {
    response: String,
    suggestions: [String],
    confidence: Number, // 0-1 confidence score
    model: String,
  },

  // Feedback and learning
  feedback: {
    rating: { type: Number, min: 1, max: 5 }, // User rating 1-5 stars
    wasHelpful: Boolean,
    wasAccurate: Boolean,
    wasImplemented: Boolean, // For automation suggestions
    userComment: String,
    feedbackDate: Date,
  },

  // Business outcomes
  outcome: {
    actionTaken: String,
    timeSaved: Number, // in minutes
    revenuImpact: Number, // positive or negative
    customerSatisfactionDelta: Number,
    conversionResult: Boolean,
  },

  // Pattern identification
  patterns: {
    frequency: Number, // How often this pattern occurs
    category: String, // Business category
    tags: [String],
    relatedPatterns: [mongoose.Schema.ObjectId], // Reference to other similar patterns
  },

  // Machine learning metadata
  mlMetadata: {
    features: mongoose.Schema.Types.Mixed, // Extracted features for ML
    embedding: [Number], // Vector embedding if used
    cluster: String, // Cluster assignment
    anomalyScore: Number, // For anomaly detection
  },

  // Usage statistics
  usageStats: {
    timeOfDay: Number, // Hour (0-23)
    dayOfWeek: Number, // Day (0-6)
    durationMs: Number, // Response time
    tokenCount: Number,
    cost: Number,
  },

  // Success metrics
  successMetrics: {
    resolved: Boolean,
    followUpRequired: Boolean,
    escalated: Boolean,
    automationCreated: Boolean,
  },

  created: { type: Date, default: Date.now, index: true },
  updated: { type: Date, default: Date.now },
});

// Indexes for analytics and pattern recognition
aiLearningDataSchema.index({ owner: 1, interactionType: 1, created: -1 });
aiLearningDataSchema.index({ 'feedback.rating': 1, created: -1 });
aiLearningDataSchema.index({ 'patterns.category': 1, 'patterns.frequency': -1 });
aiLearningDataSchema.index({ owner: 1, 'patterns.tags': 1 });

// Auto-update timestamp
aiLearningDataSchema.pre('save', function (next) {
  this.updated = Date.now();
  next();
});

const exportedModel = mongoose.model('AILearningData', aiLearningDataSchema);
export default exportedModel;
