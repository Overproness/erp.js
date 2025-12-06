const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const questionSchema = new Schema(
  {
    questionId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['rating', 'nps', 'text', 'multiple_choice', 'single_choice', 'scale', 'boolean'],
      required: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    required: {
      type: Boolean,
      default: false,
    },
    options: [
      {
        label: String,
        value: String,
      },
    ],
    placeholder: String,
    min: Number,
    max: Number,
    scaleLabels: {
      low: String,
      high: String,
    },
    conditionalLogic: {
      dependsOn: String, // questionId
      condition: String, // equals, not_equals, greater_than, etc.
      value: Schema.Types.Mixed,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const surveySchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['nps', 'csat', 'feedback', 'custom'],
      default: 'custom',
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'closed', 'archived'],
      default: 'draft',
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'CompanyOwner',
      required: true,
    },
    business: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
    },
    questions: [questionSchema],
    settings: {
      allowAnonymous: {
        type: Boolean,
        default: true,
      },
      requireEmail: {
        type: Boolean,
        default: false,
      },
      oneResponsePerUser: {
        type: Boolean,
        default: false,
      },
      showProgressBar: {
        type: Boolean,
        default: true,
      },
      showQuestionNumbers: {
        type: Boolean,
        default: true,
      },
      randomizeQuestions: {
        type: Boolean,
        default: false,
      },
      collectIpAddress: {
        type: Boolean,
        default: true,
      },
      customTheme: {
        primaryColor: String,
        backgroundColor: String,
        textColor: String,
        buttonColor: String,
      },
      thankYouMessage: {
        type: String,
        default: 'Thank you for your feedback!',
      },
      redirectUrl: String,
    },
    distribution: {
      channels: [
        {
          type: String,
          enum: ['email', 'sms', 'link', 'qr', 'embedded', 'social'],
        },
      ],
      startDate: Date,
      endDate: Date,
      targetAudience: {
        segments: [
          {
            type: Schema.Types.ObjectId,
            ref: 'CustomerSegment',
          },
        ],
        customerGroups: [String],
      },
      frequency: {
        type: String,
        enum: ['once', 'recurring'],
        default: 'once',
      },
      recurringSchedule: {
        interval: {
          type: String,
          enum: ['daily', 'weekly', 'monthly', 'quarterly'],
        },
        dayOfWeek: Number,
        dayOfMonth: Number,
        time: String,
      },
    },
    customUrl: {
      shortCode: {
        type: String,
        unique: true,
        sparse: true,
      },
      fullUrl: String,
      clicks: {
        type: Number,
        default: 0,
      },
    },
    analytics: {
      totalResponses: {
        type: Number,
        default: 0,
      },
      completedResponses: {
        type: Number,
        default: 0,
      },
      partialResponses: {
        type: Number,
        default: 0,
      },
      averageCompletionTime: Number, // in seconds
      completionRate: Number, // percentage
      npsScore: Number,
      csat: Number,
      lastResponseAt: Date,
    },
    tags: [String],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'CompanyOwner',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'CompanyOwner',
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

// Indexes
surveySchema.index({ owner: 1, status: 1 });
surveySchema.index({ 'customUrl.shortCode': 1 });
surveySchema.index({ createdAt: -1 });
surveySchema.index({ 'distribution.startDate': 1, 'distribution.endDate': 1 });

// Virtual for active status
surveySchema.virtual('isActive').get(function () {
  if (this.status !== 'active') return false;

  const now = new Date();
  const { startDate, endDate } = this.distribution;

  if (startDate && now < startDate) return false;
  if (endDate && now > endDate) return false;

  return true;
});

// Pre-save middleware to generate short code
surveySchema.pre('save', async function (next) {
  if (!this.customUrl.shortCode && this.isNew) {
    const { nanoid } = await import('nanoid');
    this.customUrl.shortCode = nanoid(10);
    this.customUrl.fullUrl = `/survey/${this.customUrl.shortCode}`;
  }
  next();
});

// Method to calculate NPS score
surveySchema.methods.calculateNPS = async function () {
  const SurveyResponse = mongoose.model('SurveyResponse');

  const responses = await SurveyResponse.find({
    survey: this._id,
    status: 'completed',
  });

  // Find NPS question
  const npsQuestion = this.questions.find((q) => q.type === 'nps');
  if (!npsQuestion) return null;

  const npsAnswers = responses
    .map((r) => {
      const answer = r.answers.find((a) => a.questionId === npsQuestion.questionId);
      return answer ? answer.value : null;
    })
    .filter((v) => v !== null && !isNaN(v));

  if (npsAnswers.length === 0) return 0;

  const promoters = npsAnswers.filter((v) => v >= 9).length;
  const detractors = npsAnswers.filter((v) => v <= 6).length;
  const total = npsAnswers.length;

  const nps = ((promoters - detractors) / total) * 100;
  return Math.round(nps);
};

// Method to calculate CSAT
surveySchema.methods.calculateCSAT = async function () {
  const SurveyResponse = mongoose.model('SurveyResponse');

  const responses = await SurveyResponse.find({
    survey: this._id,
    status: 'completed',
  });

  // Find rating questions
  const ratingQuestions = this.questions.filter((q) => q.type === 'rating' || q.type === 'scale');
  if (ratingQuestions.length === 0) return null;

  let totalScore = 0;
  let totalAnswers = 0;

  ratingQuestions.forEach((question) => {
    responses.forEach((response) => {
      const answer = response.answers.find((a) => a.questionId === question.questionId);
      if (answer && !isNaN(answer.value)) {
        totalScore += answer.value;
        totalAnswers++;
      }
    });
  });

  if (totalAnswers === 0) return 0;

  const avgScore = totalScore / totalAnswers;
  const maxScore = 5; // assuming 5-point scale
  const csat = (avgScore / maxScore) * 100;

  return Math.round(csat);
};

module.exports = mongoose.model('Survey', surveySchema);
