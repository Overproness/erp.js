import mongoose from 'mongoose';
const commonFields = require('../utils/commonFields');

const paymentSchema = new mongoose.Schema({
  ...commonFields,

  number: {
    type: Number,
    required: true,
  },
  client: {
    type: mongoose.Schema.ObjectId,
    ref: 'Client',
    autopopulate: true,
    required: true,
  },
  invoice: {
    type: mongoose.Schema.ObjectId,
    ref: 'Invoice',
    required: true,
    autopopulate: true,
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'NA',
    uppercase: true,
    required: true,
  },
  paymentMode: {
    type: mongoose.Schema.ObjectId,
    ref: 'PaymentMode',
    autopopulate: true,
  },
  ref: {
    type: String,
  },
  description: {
    type: String,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  companyID: {
    type: String,
          },
});
paymentSchema.plugin(require('mongoose-autopopulate'));

paymentSchema.pre('save', async function(next) {
  if (this.isNew) {
    if (!this.owner) {
      throw new Error('Owner field is required');
    }
  }
  next();
});

paymentSchema.index({ companyID: 1 }, { sparse: true }); // Index for companyID

const exportedModel = mongoose.model('Payment', paymentSchema);
export default exportedModel;
module.exports = exportedModel;
