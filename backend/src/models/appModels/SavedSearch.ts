// @ts-nocheck
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const SavedSearchSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: ['Client', 'Invoice', 'Quote', 'Payment', 'Document', 'Task', 'User', 'Team'],
    },
    searchCriteria: {
      type: Schema.Types.Mixed,
      required: true,
    },
    filters: {
      type: Schema.Types.Mixed,
      default: {},
    },
    sortBy: {
      field: {
        type: String,
        default: 'created',
      },
      order: {
        type: String,
        enum: ['asc', 'desc'],
        default: 'desc',
      },
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    // Tenant isolation
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'CompanyOwner',
      required: true,
      index: true,
    },
    companyID: {
      type: String,
      index: true,
      sparse: true,
    },

    // Audit fields
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'CompanyOwner',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'CompanyOwner',
    },

    // Common fields
    enabled: {
      type: Boolean,
      default: true,
    },
    removed: {
      type: Boolean,
      default: false,
    },
    removedAt: {
      type: Date,
    },
    removedBy: {
      type: Schema.Types.ObjectId,
      ref: 'CompanyOwner',
    },
  },
  {
    timestamps: { createdAt: 'created', updatedAt: 'updated' },
    versionKey: '__v',
  }
);

// Indexes for performance
SavedSearchSchema.index({ owner: 1, entityType: 1 });
SavedSearchSchema.index({ owner: 1, isPublic: 1 });
SavedSearchSchema.index({ owner: 1, name: 1 });
SavedSearchSchema.index({ createdBy: 1 });
SavedSearchSchema.index({ companyID: 1 }); // Index for companyID

// Pre-save middleware to ensure owner is set
SavedSearchSchema.pre('save', function (next) {
  if (!this.owner) {
    return next(new Error('Owner field is required'));
  }
  next();
});

// Filter out removed items by default
SavedSearchSchema.pre(/^find/, function () {
  this.where({ removed: { $ne: true } });
});

const exportedModel = mongoose.model('SavedSearch', SavedSearchSchema);
export default exportedModel;
module.exports = exportedModel;
