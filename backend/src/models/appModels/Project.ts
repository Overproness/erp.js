// @ts-nocheck
import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['planning', 'active', 'on-hold', 'completed', 'cancelled'],
    default: 'planning',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  deadline: {
    type: Date,
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
  projectManager: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  teams: [
    {
      team: {
        type: mongoose.Schema.ObjectId,
        ref: 'Team',
        required: false,
      },
      role: {
        type: String,
        enum: ['lead', 'contributor', 'reviewer'],
        default: 'contributor',
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  members: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
      },
      role: {
        type: String,
        enum: ['manager', 'lead', 'developer', 'designer', 'tester', 'contributor'],
        default: 'contributor',
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  budget: {
    amount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    spent: {
      type: Number,
      default: 0,
    },
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  tags: {
    type: [String],
    default: [],
  },
  attachments: [
    {
      fileName: String,
      filePath: String,
      fileSize: Number,
      uploadedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  settings: {
    allowCrossTeamCollaboration: {
      type: Boolean,
      default: true,
    },
    requireApprovalForChanges: {
      type: Boolean,
      default: false,
    },
    autoNotifyMembers: {
      type: Boolean,
      default: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'team-only'],
      default: 'team-only',
    },
  },
  companyID: {
    type: String,
          },
});

// Update the 'updated' field before saving
projectSchema.pre('save', function (next) {
  this.updated = Date.now();

  // Transform teams array if it contains ObjectIds directly
  if (this.teams && Array.isArray(this.teams)) {
    this.teams = this.teams.map((team) => {
      if (team.constructor.name === 'ObjectId' || typeof team === 'string') {
        return { team: team };
      }
      return team;
    });
  }

  next();
});

projectSchema.index({ companyID: 1 }, { sparse: true }); // Index for companyID

const exportedModel = mongoose.model('Project', projectSchema);
export default exportedModel;
module.exports = exportedModel;
