const mongoose = require('mongoose');

const ConsentRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    purpose: {
      type: String,
      required: true,
      trim: true,
    },
    consentGiven: {
      type: Boolean,
      required: true,
    },
    dataCategories: [
      {
        type: String,
        trim: true,
      },
    ],
    expiration: {
      type: Date,
      default: null,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    created: {
      type: Date,
      default: Date.now,
    },
    updated: {
      type: Date,
      default: Date.now,
    },
    additionalInformation: {
      type: mongoose.Schema.Types.Mixed,
    },
    companyID: {
      type: String,
                },
  },
  { timestamps: { createdAt: 'created', updatedAt: 'updated' } }
);

// Add indexes for faster lookups
ConsentRecordSchema.index({ user: 1, purpose: 1 });
ConsentRecordSchema.index({ expiration: 1 }, { sparse: true }); // For finding expired consents
ConsentRecordSchema.index({ companyID: 1 }, { sparse: true }); // Index for companyID

const exportedModel = mongoose.model('ConsentRecord', ConsentRecordSchema);
module.exports = exportedModel;
