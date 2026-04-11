// @ts-nocheck
const mongoose = require('mongoose');

const customerFollowUpSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.ObjectId, ref: 'CompanyOwner', required: true, index: true },
  customer: { type: mongoose.Schema.ObjectId, ref: 'Client', required: true, index: true },

  // Follow-up configuration
  type: {
    type: String,
    enum: ['email', 'sms', 'call', 'task', 'notification'],
    required: true,
  },
  reason: {
    type: String,
    enum: [
      'quote_follow_up',
      'invoice_reminder',
      'payment_overdue',
      'abandoned_cart',
      'inactive_customer',
      'post_purchase',
      'renewal_reminder',
      'feedback_request',
      'custom',
    ],
    required: true,
  },

  // Related entities
  relatedEntity: {
    entityType: { type: String, enum: ['quote', 'invoice', 'payment', 'order', 'campaign'] },
    entityId: mongoose.Schema.ObjectId,
  },

  // Scheduling
  scheduledDate: { type: Date, required: true, index: true },
  executedAt: Date,
  nextFollowUpDate: Date,

  // Content
  subject: String,
  message: String,
  template: String, // Template ID if using email template

  // Status tracking
  status: {
    type: String,
    enum: [
      'scheduled',
      'sent',
      'delivered',
      'opened',
      'clicked',
      'responded',
      'failed',
      'cancelled',
    ],
    default: 'scheduled',
    index: true,
  },

  // Response tracking
  customerResponse: {
    responded: { type: Boolean, default: false },
    responseDate: Date,
    responseText: String,
    sentiment: { type: String, enum: ['positive', 'neutral', 'negative'] },
  },

  // Automation settings
  isAutomated: { type: Boolean, default: true },
  automationRule: String,
  sequenceId: String,
  sequenceStep: Number,

  // Metrics
  metrics: {
    opened: { type: Boolean, default: false },
    openedAt: Date,
    clicked: { type: Boolean, default: false },
    clickedAt: Date,
    converted: { type: Boolean, default: false },
    convertedAt: Date,
  },

  // Retry logic
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 3 },
  lastError: String,

  // Priority
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },

  removed: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
});

// Compound indexes for efficient queries
customerFollowUpSchema.index({ owner: 1, status: 1, scheduledDate: 1 });
customerFollowUpSchema.index({ owner: 1, customer: 1, type: 1 });
customerFollowUpSchema.index({ scheduledDate: 1, status: 1 });

// Auto-update timestamp
customerFollowUpSchema.pre('save', function (next) {
  this.updated = Date.now();
  next();
});

const exportedModel = mongoose.model('CustomerFollowUp', customerFollowUpSchema);
module.exports = exportedModel;
