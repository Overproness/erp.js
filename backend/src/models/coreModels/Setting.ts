const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },

  // Main category - company_settings, app_settings, finance_settings, etc.
  category: {
    type: String,
    required: true,
    lowercase: true,
  },

  // Store the entire settings object for this category
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompanyOwner',
  },
  created: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompanyOwner',
  },
  updated: Date,
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompanyOwner',
  },
  companyID: {
    type: String,
          },
});

// Ensure one settings object per category per owner
settingSchema.index({ category: 1, owner: 1 }, { unique: true });
settingSchema.index({ companyID: 1 }, { sparse: true }); // Index for companyID

const Setting = mongoose.model('Setting', settingSchema);
module.exports = Setting;
export { };

