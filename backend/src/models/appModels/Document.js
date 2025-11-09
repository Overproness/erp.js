const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DocumentSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    documentType: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    expiryDate: {
      type: Date,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collaborators: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        permissions: {
          type: [String],
          enum: ['read', 'write', 'edit', 'comment', 'delete', 'share'],
          default: ['read'],
        },
        role: {
          type: String,
          enum: ['viewer', 'editor', 'admin'],
          default: 'viewer',
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    version: {
      type: Number,
      default: 1,
    },
    versionHistory: [
      {
        version: {
          type: Number,
          required: true,
        },
        modifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        modifiedAt: {
          type: Date,
          default: Date.now,
        },
        changes: {
          content: {
            type: String,
          },
          description: {
            type: String,
          },
        },
        content: {
          type: String,
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    created: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updated: {
      type: Date,
      default: Date.now,
    },
    removed: {
      type: Boolean,
      default: false,
    },
    removedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    removedAt: {
      type: Date,
    },
    companyID: {
      type: String,
      index: true,
      sparse: true,
      // Used for list/summary methods
    },
  },
  {
    timestamps: true,
  }
);

// Add text index for full-text search capabilities
DocumentSchema.index(
  {
    title: 'text',
    description: 'text',
    fileName: 'text',
    tags: 'text',
    documentType: 'text',
    'customFields.value': 'text',
  },
  {
    weights: {
      title: 10,
      fileName: 5,
      tags: 3,
      documentType: 2,
      description: 1,
      'customFields.value': 1,
    },
    name: 'document_text_index',
  }
);

DocumentSchema.index({ companyID: 1 }); // Index for companyID

// Export model with a different name to avoid conflict
module.exports = mongoose.model('AppDocument', DocumentSchema);

// Also register with the standard name for CRUD controller compatibility
try {
  mongoose.model('Document', DocumentSchema);
} catch (error) {
  // Model already registered, ignore error
}
