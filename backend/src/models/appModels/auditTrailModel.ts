import mongoose from 'mongoose';

const AuditTrailSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AppDocument',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'created',
        'updated',
        'deleted',
        'viewed',
        'downloaded',
        'edited',
        'signed',
        'reverted',
        'annotated',
        'compliance_checked',
        'version_created',
      ],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyOwner', // Using CompanyOwner model instead of Admin
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    companyID: {
      type: String,
                },
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: false } }
);

// Compound index for efficient querying
AuditTrailSchema.index({ documentId: 1, timestamp: -1 });
AuditTrailSchema.index({ companyID: 1 }, { sparse: true }); // Index for companyID

// Export the model - ensure it's only registered once
export default mongoose.models.AuditTrail || mongoose.model('AuditTrail', AuditTrailSchema);

