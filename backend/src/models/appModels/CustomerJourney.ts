// @ts-nocheck
const mongoose = require('mongoose');

/**
 * Customer Journey Model
 * Tracks the complete journey of a customer from awareness to advocacy
 */
const customerJourneySchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyOwner',
      required: true,
      index: true,
    },
    companyID: {
      type: String,
      required: true,
      index: true,
    },

    // Current journey stage
    currentStage: {
      type: String,
      enum: [
        'awareness',
        'consideration',
        'decision',
        'purchase',
        'retention',
        'advocacy',
        'churned',
      ],
      default: 'awareness',
      required: true,
    },

    // Journey stages history
    stages: [
      {
        stage: {
          type: String,
          enum: [
            'awareness',
            'consideration',
            'decision',
            'purchase',
            'retention',
            'advocacy',
            'churned',
          ],
          required: true,
        },
        enteredAt: {
          type: Date,
          default: Date.now,
          required: true,
        },
        exitedAt: Date,
        duration: Number, // Duration in milliseconds
        touchpoints: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Interaction',
          },
        ],
        notes: String,
        milestone: String, // Key achievement in this stage
        stageScore: {
          type: Number,
          min: 0,
          max: 100,
        },
      },
    ],

    // Journey milestones
    milestones: [
      {
        name: String,
        description: String,
        achievedAt: Date,
        relatedInteraction: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Interaction',
        },
      },
    ],

    // Journey metrics
    metrics: {
      totalTouchpoints: {
        type: Number,
        default: 0,
      },
      totalInteractions: {
        type: Number,
        default: 0,
      },
      journeyDuration: Number, // Total duration in days
      stageTransitions: {
        type: Number,
        default: 0,
      },
      averageStageTime: Number, // Average time per stage in days
      conversionRate: Number, // % of completed journey stages
      engagementScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      dropOffStage: String, // Stage where customer might drop off
      riskScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
    },

    // Journey path (sequence of channels/sources)
    journeyPath: [
      {
        source: String, // e.g., 'organic_search', 'social_media', 'email', 'referral'
        medium: String,
        campaign: String,
        timestamp: Date,
        interaction: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Interaction',
        },
      },
    ],

    // Next best actions
    recommendations: [
      {
        action: String,
        priority: {
          type: String,
          enum: ['low', 'medium', 'high', 'urgent'],
          default: 'medium',
        },
        reason: String,
        suggestedAt: {
          type: Date,
          default: Date.now,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        completedAt: Date,
      },
    ],

    // Journey start and end
    journeyStartDate: {
      type: Date,
      default: Date.now,
    },
    journeyEndDate: Date,

    // Status
    status: {
      type: String,
      enum: ['active', 'completed', 'stalled', 'churned'],
      default: 'active',
    },

    removed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
customerJourneySchema.index({ client: 1, owner: 1 });
customerJourneySchema.index({ currentStage: 1, status: 1 });
customerJourneySchema.index({ companyID: 1, removed: 1 });
customerJourneySchema.index({ 'metrics.riskScore': -1 }); // For finding at-risk customers

// Virtual for current stage object
customerJourneySchema.virtual('currentStageData').get(function () {
  return this.stages.find((s) => s.stage === this.currentStage && !s.exitedAt);
});

// Method to transition to new stage
customerJourneySchema.methods.transitionStage = function (newStage, notes, milestone) {
  const currentStageData = this.stages.find((s) => s.stage === this.currentStage && !s.exitedAt);

  if (currentStageData) {
    currentStageData.exitedAt = new Date();
    currentStageData.duration = currentStageData.exitedAt - currentStageData.enteredAt;
    if (notes) currentStageData.notes = notes;
    if (milestone) currentStageData.milestone = milestone;
  }

  this.stages.push({
    stage: newStage,
    enteredAt: new Date(),
    touchpoints: [],
  });

  this.currentStage = newStage;
  this.metrics.stageTransitions += 1;

  return this;
};

// Method to add touchpoint to current stage
customerJourneySchema.methods.addTouchpoint = function (interactionId) {
  const currentStageData = this.stages.find((s) => s.stage === this.currentStage && !s.exitedAt);

  if (currentStageData) {
    currentStageData.touchpoints.push(interactionId);
  }

  this.metrics.totalTouchpoints += 1;

  return this;
};

// Method to calculate journey metrics (sync version - for engagement use calculateMetricsAsync)
customerJourneySchema.methods.calculateMetrics = function () {
  // Calculate journey duration
  const start = this.journeyStartDate;
  const end = this.journeyEndDate || new Date();
  this.metrics.journeyDuration = Math.floor((end - start) / (1000 * 60 * 60 * 24));

  // Calculate average stage time
  const completedStages = this.stages.filter((s) => s.exitedAt);
  if (completedStages.length > 0) {
    const totalDuration = completedStages.reduce((sum, stage) => sum + (stage.duration || 0), 0);
    this.metrics.averageStageTime = Math.floor(
      totalDuration / completedStages.length / (1000 * 60 * 60 * 24)
    );
  }

  // Calculate conversion rate
  const totalStages = 7; // Total possible stages
  const completedStageCount = completedStages.length;
  this.metrics.conversionRate = Math.round((completedStageCount / totalStages) * 100);

  return this;
};

// Method to calculate journey metrics including engagement score (async version)
customerJourneySchema.methods.calculateMetricsAsync = async function () {
  // Calculate basic metrics first
  this.calculateMetrics();

  // Calculate engagement score based on interactions
  try {
    const Interaction = mongoose.model('Interaction');
    const interactions = await Interaction.find({
      client: this.client,
      removed: false,
    });

    let engagementScore = 0;

    // Total interactions (0-30 points)
    const interactionCount = interactions.length;
    engagementScore += Math.min(interactionCount * 3, 30);

    // Recent interactions in last 30 days (0-25 points)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentInteractions = interactions.filter(
      (int) => new Date(int.interactionDate) >= thirtyDaysAgo
    );
    engagementScore += Math.min(recentInteractions.length * 5, 25);

    // Multi-channel engagement (0-20 points)
    const uniqueChannels = new Set(interactions.map((int) => int.channel));
    engagementScore += Math.min(uniqueChannels.size * 4, 20);

    // Positive outcomes (0-15 points)
    const positiveOutcomes = interactions.filter(
      (int) =>
        int.outcome === 'positive' ||
        int.outcome === 'interested' ||
        int.outcome === 'closed_sale' ||
        int.outcome === 'scheduled_followup'
    );
    engagementScore += Math.min(positiveOutcomes.length * 3, 15);

    // Engagement consistency - interactions spread over time (0-10 points)
    if (interactions.length >= 3) {
      const sortedDates = interactions
        .map((int) => new Date(int.interactionDate))
        .sort((a, b) => a - b);
      const firstDate = sortedDates[0];
      const lastDate = sortedDates[sortedDates.length - 1];
      const daySpan = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
      const consistency = Math.min(daySpan / 10, 10); // 1 point per 10 days of engagement
      engagementScore += Math.round(consistency);
    }

    this.metrics.engagementScore = Math.min(Math.round(engagementScore), 100);

    // Calculate risk score
    let riskScore = 0;
    const daysSinceLastInteraction =
      recentInteractions.length === 0
        ? (new Date() -
            new Date(
              interactions[interactions.length - 1]?.interactionDate || this.journeyStartDate
            )) /
          (1000 * 60 * 60 * 24)
        : 0;

    // High risk if no recent interactions
    if (daysSinceLastInteraction > 60) {
      riskScore += 40;
    } else if (daysSinceLastInteraction > 30) {
      riskScore += 20;
    }

    // Risk increases if stuck in early stages for long time
    if (
      (this.currentStage === 'awareness' || this.currentStage === 'consideration') &&
      this.metrics.journeyDuration > 90
    ) {
      riskScore += 30;
    }

    // Risk from negative outcomes
    const negativeOutcomes = interactions.filter(
      (int) =>
        int.outcome === 'negative' ||
        int.outcome === 'not_interested' ||
        int.outcome === 'lost_opportunity'
    );
    if (negativeOutcomes.length > 0) {
      riskScore += Math.min(negativeOutcomes.length * 10, 30);
    }

    this.metrics.riskScore = Math.min(Math.round(riskScore), 100);
  } catch (error) {
    console.error('Error calculating engagement score:', error);
    this.metrics.engagementScore = 0;
    this.metrics.riskScore = 0;
  }

  return this;
};

customerJourneySchema.plugin(require('mongoose-autopopulate'));
const exportedModel = mongoose.model('CustomerJourney', customerJourneySchema);
module.exports = exportedModel;
