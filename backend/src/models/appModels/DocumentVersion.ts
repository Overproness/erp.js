// @ts-nocheck
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DocumentVersionSchema = new Schema(
  {
    document: {
      type: Schema.Types.ObjectId,
      ref: 'AppDocument',
      required: true,
    },
    version: {
      type: Number,
      required: true,
      default: 1,
    },
    versionNumber: {
      type: Number,
      required: true,
    },
    title: String,
    content: {
      type: String,
      required: true,
    },
    documentType: String,
    description: String,
    tags: [String],
    fileName: String,
    fileType: String,
    filePath: String,
    fileSize: Number,
    expiryDate: Date,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    changeDescription: {
      type: String,
      default: 'Document updated',
    },
    comment: String,
    changes: [
      {
        type: {
          type: String,
          enum: ['create', 'update', 'delete', 'format'],
          required: true,
        },
        description: String,
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        location: {
          start: Number,
          end: Number,
          length: Number,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: false,
    },
    conflictResolution: {
      hasConflicts: {
        type: Boolean,
        default: false,
      },
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      resolvedAt: Date,
      conflicts: [
        {
          type: String,
          location: {
            start: Number,
            end: Number,
          },
          authors: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
            },
          ],
          resolved: {
            type: Boolean,
            default: false,
          },
        },
      ],
    },
    removed: {
      type: Boolean,
      default: false,
    },
    companyID: {
      type: String,    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
DocumentVersionSchema.index({ document: 1, versionNumber: 1 }, { unique: true });
DocumentVersionSchema.index({ document: 1, version: 1 });
DocumentVersionSchema.index({ document: 1, createdAt: -1 });
DocumentVersionSchema.index({ author: 1 });
DocumentVersionSchema.index({ companyID: 1 }, { sparse: true }); // Index for companyID

// Virtual for getting the latest version
DocumentVersionSchema.virtual('isLatest').get(function () {
  return this.isActive;
});

// Static method to get latest version
DocumentVersionSchema.statics.getLatestVersion = function (documentId: string) {
  return this.findOne({ document: documentId, isActive: true });
};

// Static method to create new version
DocumentVersionSchema.statics.createVersion = async function (
  documentId: string,
  content: any,
  author: string,
  comment = ''
) {
  const lastVersion = await this.findOne({ document: documentId }).sort({ version: -1 });
  const version = lastVersion ? lastVersion.version + 1 : 1;

  // Deactivate previous versions
  await this.updateMany({ document: documentId }, { isActive: false });

  return this.create({
    document: documentId,
    version,
    versionNumber: version,
    content,
    author,
    createdBy: author,
    comment,
    isActive: true,
  });
};

// Instance method to resolve conflicts
DocumentVersionSchema.methods.resolveConflicts = function (resolvedBy: string) {
  this.conflictResolution.hasConflicts = false;
  this.conflictResolution.resolvedBy = resolvedBy;
  this.conflictResolution.resolvedAt = new Date();
  this.conflictResolution.conflicts.forEach((conflict: any) => {
    conflict.resolved = true;
  });
  return this.save();
};

const exportedModel = mongoose.model('DocumentVersion', DocumentVersionSchema);
module.exports = exportedModel;
