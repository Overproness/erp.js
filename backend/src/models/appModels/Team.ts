// @ts-nocheck
import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
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
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'CompanyOwner',
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'CompanyOwner',
  },
  teamLead: {
    type: mongoose.Schema.ObjectId,
    ref: 'CompanyOwner',
  },
  members: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
      },
      role: {
        type: String,
        enum: ['member', 'lead', 'admin', 'manager'],
        default: 'member',
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  permissions: {
    view: {
      type: [String],
      default: [],
    },
    edit: {
      type: [String],
      default: [],
    },
    create: {
      type: [String],
      default: [],
    },
    delete: {
      type: [String],
      default: [],
    },
  },
  settings: {
    allowCrossTeamCollaboration: {
      type: Boolean,
      default: true,
    },
    requireApprovalForTasks: {
      type: Boolean,
      default: false,
    },
    autoAssignTasks: {
      type: Boolean,
      default: false,
    },
    requiresApproval: {
      type: Boolean,
      default: false,
    },
  },
  companyID: {
    type: String,
    index: true,
    sparse: true,
    // Used for list/summary methods
  },
});

// Update the 'updated' field before saving
teamSchema.pre('save', function (next) {
  this.updated = Date.now();
  next();
});

// Create text index for search
teamSchema.index({ name: 'text', description: 'text' });
teamSchema.index({ companyID: 1 }); // Index for companyID

const exportedModel = mongoose.model('Team', teamSchema);
export default exportedModel;
module.exports = exportedModel;
