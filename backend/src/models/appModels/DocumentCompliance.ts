// @ts-nocheck
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const DocumentComplianceSchema = new Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      unique: true,
    },
    complianceStatus: {
      type: String,
      enum: ['compliant', 'non_compliant', 'review_required', 'exempt'],
      default: 'review_required',
    },
    // Additional fields for test compatibility
    standard: {
      type: String,
    },
    status: {
      type: String,
      enum: ['compliant', 'non_compliant', 'review_required', 'exempt'],
    },
    checkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    checkedAt: {
      type: Date,
    },
    findings: {
      type: String,
    },
    expiryDate: {
      type: Date,
    },
    regulations: {
      gdpr: {
        applicable: { type: Boolean, default: false },
        status: {
          type: String,
          enum: ['compliant', 'non_compliant', 'review_required', 'exempt'],
          default: 'review_required',
        },
        details: { type: String },
        reviewDate: { type: Date },
      },
      hipaa: {
        applicable: { type: Boolean, default: false },
        status: {
          type: String,
          enum: ['compliant', 'non_compliant', 'review_required', 'exempt'],
          default: 'review_required',
        },
        details: { type: String },
        reviewDate: { type: Date },
      },
      custom: [
        {
          name: { type: String },
          applicable: { type: Boolean, default: false },
          status: {
            type: String,
            enum: ['compliant', 'non_compliant', 'review_required', 'exempt'],
          },
          details: { type: String },
          reviewDate: { type: Date },
        },
      ],
    },
    dataRetention: {
      policy: { type: String },
      expirationDate: { type: Date },
      autoDeleteEnabled: { type: Boolean, default: false },
    },
    containsSensitiveData: { type: Boolean, default: false },
    dataClassification: {
      type: String,
      enum: ['public', 'internal', 'confidential', 'restricted', 'unclassified'],
      default: 'unclassified',
    },
    lastReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    lastReviewedAt: { type: Date },
    created: {
      type: Date,
      default: Date.now,
    },
    updated: {
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

DocumentComplianceSchema.index({ companyID: 1 }, { sparse: true }); // Index for companyID

const exportedModel = mongoose.model('DocumentCompliance', DocumentComplianceSchema);
export default exportedModel;
