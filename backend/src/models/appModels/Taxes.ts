const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const taxesSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  taxValue: {
    type: Number,
    required: true,
  },
  taxRate: {
    type: Number,
    required: true,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  // Add owner fields
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
          },
});

taxesSchema.index({ companyID: 1 }, { sparse: true }); // Index for companyID

const exportedModel = mongoose.model('Taxes', taxesSchema);
module.exports = exportedModel;
export {};
