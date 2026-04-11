const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DocumentAuditSchema = new Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'created',
        'viewed',
        'downloaded',
        'updated',
        'deleted',
        'restored',
        'permission_changed',
        'version_created',
        'reverted',
        'compliance_updated',
        'signed',
      ],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    details: {
      type: Object,
    },
    created: {
      type: Date,
      default: Date.now,
    },
    companyID: {
      type: String,
                },
  },
  {
    timestamps: true,
  }
);

DocumentAuditSchema.index({ companyID: 1 }, { sparse: true }); // Index for companyID

const exportedModel = mongoose.model('DocumentAudit', DocumentAuditSchema);
module.exports = exportedModel;
