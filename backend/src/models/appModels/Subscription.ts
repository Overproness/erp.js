// @ts-nocheck
const mongoose = require('mongoose');
const { Schema } = mongoose;

const subscriptionSchema = new Schema({
  companyOwner: {
    type: Schema.Types.ObjectId,
    ref: 'CompanyOwner',
    required: true,
    unique: true,
  },
  plan: {
    type: String,
    enum: ['starter', 'professional', 'enterprise'],
    required: true,
  },
  status: {
    type: String,
    enum: ['trialing', 'active', 'past_due', 'canceled', 'paused'],
    default: 'trialing',
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'annual'],
    default: 'monthly',
  },
  trialStart: Date,
  trialEnd: Date,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: { type: Boolean, default: false },
  stripeCustomerId: { type: String, sparse: true },
  stripeSubscriptionId: { type: String, sparse: true },
  stripeProductId: String,
  stripePriceId: String,
  canceledAt: Date,
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
});

subscriptionSchema.pre('save', function (next) {
  this.updated = new Date();
  next();
});

subscriptionSchema.index({ companyOwner: 1 });
subscriptionSchema.index({ stripeCustomerId: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
