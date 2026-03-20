import mongoose from 'mongoose';

const DataRetentionPolicySchema = new mongoose.Schema(
  {
    dataType: {
      type: String,
      required: true,
      trim: true,
    },
    retentionPeriod: {
      type: Number, // days
      required: true,
      min: 1,
    },
    automaticDeletion: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
    },
    applicableRegions: [
      {
        type: String,
        trim: true,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    created: {
      type: Date,
      default: Date.now,
    },
    updated: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'draft'],
      default: 'active',
    },
    companyID: {
      type: String,
                },
  },
  { timestamps: { createdAt: 'created', updatedAt: 'updated' } }
);

// Add index for faster lookups by data type and status
DataRetentionPolicySchema.index({ dataType: 1, status: 1 });
DataRetentionPolicySchema.index({ companyID: 1 }, { sparse: true }); // Index for companyID

const exportedModel = mongoose.model('DataRetentionPolicy', DataRetentionPolicySchema);
export default exportedModel;
module.exports = exportedModel;
