const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentModeSchema = new Schema({
  name: {                    // This should match the form field name
    type: String,
    required: true,
  },
  description: String,       // This is optional
  isDefault: {
    type: Boolean,
    default: false,
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
  removed: {
    type: Boolean,
    default: false,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  updated: Date,
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  companyID: {
    type: String,
    index: true,
    sparse: true,
    // Used for list/summary methods
  },
});

paymentModeSchema.index({ companyID: 1 }); // Index for companyID

module.exports = mongoose.model('PaymentMode', paymentModeSchema);
