// @ts-nocheck
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const answerSchema = new Schema(
  {
    questionId: {
      type: String,
      required: true,
    },
    questionText: String,
    questionType: String,
    value: Schema.Types.Mixed, // Can be string, number, array, boolean
    skipped: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const surveyResponseSchema = new Schema(
  {
    survey: {
      type: Schema.Types.ObjectId,
      ref: 'Survey',
      required: true,
    },
    respondent: {
      name: String,
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
      phone: String,
      customerId: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
      },
      isAnonymous: {
        type: Boolean,
        default: false,
      },
    },
    status: {
      type: String,
      enum: ['started', 'in_progress', 'completed', 'abandoned'],
      default: 'started',
    },
    answers: [answerSchema],
    metadata: {
      ip: String,
      userAgent: String,
      location: {
        city: String,
        region: String,
        country: String,
        coordinates: {
          latitude: Number,
          longitude: Number,
        },
      },
      device: {
        type: String,
        enum: ['desktop', 'mobile', 'tablet', 'unknown'],
        default: 'unknown',
      },
      browser: String,
      source: {
        type: String,
        enum: ['email', 'sms', 'link', 'qr', 'embedded', 'social', 'direct'],
        default: 'direct',
      },
      referrer: String,
      utmParams: {
        source: String,
        medium: String,
        campaign: String,
        term: String,
        content: String,
      },
    },
    timing: {
      startedAt: {
        type: Date,
        default: Date.now,
      },
      completedAt: Date,
      timeSpent: Number, // in seconds
      pageViews: [
        {
          questionId: String,
          viewedAt: Date,
          timeSpent: Number,
        },
      ],
    },
    sentiment: {
      overall: {
        score: Number, // -1 to 1
        category: {
          type: String,
          enum: ['positive', 'neutral', 'negative'],
        },
      },
      byQuestion: [
        {
          questionId: String,
          score: Number,
          category: String,
          keywords: [String],
          emotions: [
            {
              emotion: String,
              confidence: Number,
            },
          ],
        },
      ],
    },
    nps: {
      score: Number, // 0-10
      category: {
        type: String,
        enum: ['promoter', 'passive', 'detractor'],
      },
    },
    aiAnalysis: {
      processed: {
        type: Boolean,
        default: false,
      },
      processedAt: Date,
      insights: [
        {
          type: String,
          content: String,
          confidence: Number,
          tags: [String],
        },
      ],
      summary: String,
      themes: [String],
      actionableItems: [
        {
          priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
          },
          category: String,
          description: String,
          suggestedAction: String,
        },
      ],
    },
    flags: {
      isNegative: {
        type: Boolean,
        default: false,
      },
      requiresFollowUp: {
        type: Boolean,
        default: false,
      },
      isSpam: {
        type: Boolean,
        default: false,
      },
      containsPII: {
        type: Boolean,
        default: false,
      },
    },
    followUp: {
      status: {
        type: String,
        enum: ['none', 'pending', 'contacted', 'resolved'],
        default: 'none',
      },
      assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'CompanyOwner',
      },
      notes: [String],
      contactedAt: Date,
      resolvedAt: Date,
    },
    tags: [String],
    notes: String,
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

// Indexes
surveyResponseSchema.index({ survey: 1, createdAt: -1 });
surveyResponseSchema.index({ 'respondent.email': 1 });
surveyResponseSchema.index({ 'respondent.customerId': 1 });
surveyResponseSchema.index({ status: 1 });
surveyResponseSchema.index({ 'timing.completedAt': -1 });
surveyResponseSchema.index({ 'nps.category': 1 });
surveyResponseSchema.index({ 'sentiment.overall.category': 1 });

// Virtual for completion percentage
surveyResponseSchema.virtual('completionPercentage').get(function () {
  const totalQuestions = this.answers.length;
  if (totalQuestions === 0) return 0;

  const answeredQuestions = this.answers.filter((a) => !a.skipped).length;
  return Math.round((answeredQuestions / totalQuestions) * 100);
});

// Pre-save middleware to calculate NPS category
surveyResponseSchema.pre('save', function (next) {
  // Calculate NPS category if NPS score exists
  if (this.nps && this.nps.score !== undefined) {
    const score = this.nps.score;
    if (score >= 9) {
      this.nps.category = 'promoter';
    } else if (score >= 7) {
      this.nps.category = 'passive';
    } else {
      this.nps.category = 'detractor';
    }
  }

  // Calculate time spent if completed
  if (this.status === 'completed' && this.timing.startedAt && !this.timing.completedAt) {
    this.timing.completedAt = new Date();
    this.timing.timeSpent = Math.floor((this.timing.completedAt - this.timing.startedAt) / 1000);
  }

  // Flag negative responses
  if (this.sentiment && this.sentiment.overall) {
    this.flags.isNegative = this.sentiment.overall.category === 'negative';
  }

  // Flag responses that require follow-up
  if (this.nps && this.nps.category === 'detractor') {
    this.flags.requiresFollowUp = true;
  }

  next();
});

// Post-save middleware to update survey analytics
surveyResponseSchema.post('save', async function (doc) {
  const Survey = mongoose.model('Survey');

  try {
    const survey = await Survey.findById(doc.survey);
    if (!survey) return;

    const SurveyResponse = mongoose.model('SurveyResponse');
    const responses = await SurveyResponse.find({ survey: doc.survey });

    const totalResponses = responses.length;
    const completedResponses = responses.filter((r) => r.status === 'completed').length;
    const partialResponses = responses.filter((r) => r.status === 'in_progress').length;

    const completedWithTime = responses.filter(
      (r) => r.status === 'completed' && r.timing.timeSpent
    );
    const averageCompletionTime =
      completedWithTime.length > 0
        ? completedWithTime.reduce((sum, r) => sum + r.timing.timeSpent, 0) /
          completedWithTime.length
        : 0;

    const completionRate = totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0;

    const lastResponse = responses.sort((a, b) => b.createdAt - a.createdAt)[0];

    survey.analytics = {
      totalResponses,
      completedResponses,
      partialResponses,
      averageCompletionTime: Math.round(averageCompletionTime),
      completionRate: Math.round(completionRate),
      npsScore: await survey.calculateNPS(),
      csat: await survey.calculateCSAT(),
      lastResponseAt: lastResponse ? lastResponse.createdAt : null,
    };

    await survey.save();
  } catch (error) {
    console.error('Error updating survey analytics:', error);
  }
});

const exportedModel = mongoose.model('SurveyResponse', surveyResponseSchema);
export default exportedModel;
