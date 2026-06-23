// @ts-nocheck
import autopopulate from 'mongoose-autopopulate';
import mongoose from 'mongoose';

/**
 * Interaction Model
 * Tracks all customer interactions across multiple channels
 */
const interactionSchema = new mongoose.Schema(
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

    // Interaction type and channel
    type: {
      type: String,
      enum: [
        'email',
        'phone_call',
        'sms',
        'chat',
        'meeting',
        'social_media',
        'website_visit',
        'form_submission',
        'purchase',
        'support_ticket',
        'quote_request',
        'demo_request',
        'newsletter_signup',
        'webinar_attendance',
        'content_download',
        'product_view',
        'cart_abandonment',
        'review',
        'referral',
        'other',
      ],
      required: true,
      index: true,
    },

    channel: {
      type: String,
      enum: [
        'email',
        'phone',
        'sms',
        'live_chat',
        'whatsapp',
        'facebook',
        'instagram',
        'twitter',
        'linkedin',
        'website',
        'mobile_app',
        'in_person',
        'direct_mail',
        'other',
      ],
      required: true,
      index: true,
    },

    // Interaction direction
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      required: true,
    },

    // Interaction details
    subject: String,
    description: {
      type: String,
      maxlength: 5000,
    },
    notes: {
      type: String,
      maxlength: 2000,
    },

    // Outcome and sentiment
    outcome: {
      type: String,
      enum: [
        'positive',
        'neutral',
        'negative',
        'interested',
        'not_interested',
        'scheduled_followup',
        'closed_sale',
        'lost_opportunity',
        'needs_nurturing',
        'escalated',
        'resolved',
        'pending',
      ],
    },

    sentiment: {
      type: String,
      enum: ['very_positive', 'positive', 'neutral', 'negative', 'very_negative'],
    },

    sentimentScore: {
      type: Number,
      min: -1,
      max: 1,
    },

    // Engagement metrics
    duration: Number, // Duration in seconds (for calls, meetings)
    responseTime: Number, // Time to respond in seconds
    engaged: {
      type: Boolean,
      default: false,
    },

    // Related entities
    relatedQuote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote',
    },
    relatedInvoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
    },
    relatedCampaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
    },
    relatedProduct: String,

    // Assignee and participants
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyOwner',
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CompanyOwner',
      },
    ],

    // Metadata
    interactionDate: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },

    // Source tracking
    source: {
      utm_source: String,
      utm_medium: String,
      utm_campaign: String,
      utm_term: String,
      utm_content: String,
      referrer: String,
      landing_page: String,
    },

    // Attachments
    attachments: [
      {
        filename: String,
        url: String,
        type: String,
        size: Number,
      },
    ],

    // Follow-up
    followUpRequired: {
      type: Boolean,
      default: false,
    },
    followUpDate: Date,
    followUpCompleted: {
      type: Boolean,
      default: false,
    },

    // Tags and categorization
    tags: [String],
    category: String,

    // AI/Automation flags
    automatedInteraction: {
      type: Boolean,
      default: false,
    },
    aiGenerated: {
      type: Boolean,
      default: false,
    },

    // Status
    status: {
      type: String,
      enum: ['completed', 'pending', 'scheduled', 'cancelled'],
      default: 'completed',
    },

    // Journey association
    customerJourney: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomerJourney',
    },
    journeyStage: {
      type: String,
      enum: ['awareness', 'consideration', 'decision', 'purchase', 'retention', 'advocacy'],
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
interactionSchema.index({ client: 1, interactionDate: -1 });
interactionSchema.index({ type: 1, channel: 1 });
interactionSchema.index({ owner: 1, removed: 1 });
interactionSchema.index({ companyID: 1, removed: 1 });
interactionSchema.index({ interactionDate: -1 });
interactionSchema.index({ followUpRequired: 1, followUpCompleted: 1 });
interactionSchema.index({ status: 1, assignedTo: 1 });

// Virtual for interaction age
interactionSchema.virtual('age').get(function () {
  return Math.floor((new Date() - this.interactionDate) / (1000 * 60 * 60 * 24));
});

// Method to mark follow-up as completed
interactionSchema.methods.completeFollowUp = function () {
  this.followUpCompleted = true;
  this.followUpDate = new Date();
  return this;
};

// Static method to get interaction summary for a client
interactionSchema.statics.getClientSummary = async function (clientId) {
  return this.aggregate([
    { $match: { client: mongoose.Types.ObjectId(clientId), removed: false } },
    {
      $group: {
        _id: null,
        totalInteractions: { $sum: 1 },
        byType: { $push: '$type' },
        byChannel: { $push: '$channel' },
        avgSentiment: { $avg: '$sentimentScore' },
        lastInteraction: { $max: '$interactionDate' },
      },
    },
  ]);
};

interactionSchema.plugin(autopopulate);
const exportedModel = mongoose.model('Interaction', interactionSchema);
export default exportedModel;
