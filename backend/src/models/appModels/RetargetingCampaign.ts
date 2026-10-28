// @ts-nocheck
import mongoose from 'mongoose';

export interface IRetargetingCampaignDocument extends mongoose.Document {
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  targetAudience: Record<string, any>;
  triggers: any[];
  content: Record<string, any>;
  channels: string[];
  platformSyncStatus: Record<string, {
    status: 'pending' | 'syncing' | 'synced' | 'failed';
    lastSyncedAt?: Date;
    memberCount?: number;
    externalAudienceId?: string;
    errorMessage?: string;
  }>;
  budget?: number;
  spent?: number;
  metrics: {
    impressions?: number;
    clicks?: number;
    conversions?: number;
    spend?: number;
    roas?: number;
  };
  startDate?: Date;
  endDate?: Date;
  owner: mongoose.Types.ObjectId;
  companyID?: mongoose.Types.ObjectId;
  removed: boolean;
}

const retargetingCampaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed'],
      default: 'draft',
      index: true,
    },
    targetAudience: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    triggers: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    channels: {
      type: [String],
      default: ['facebook', 'google'],
    },
    platformSyncStatus: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        facebook: { status: 'pending', memberCount: 0 },
        google: { status: 'pending', memberCount: 0 },
        linkedin: { status: 'pending', memberCount: 0 },
        tiktok: { status: 'pending', memberCount: 0 },
      },
    },
    budget: {
      type: Number,
      default: 0,
    },
    spent: {
      type: Number,
      default: 0,
    },
    metrics: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      spend: { type: Number, default: 0 },
      roas: { type: Number, default: 0 },
    },
    startDate: Date,
    endDate: Date,
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyOwner',
      required: true,
      index: true,
    },
    companyID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
    },
    removed: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

retargetingCampaignSchema.index({ owner: 1, removed: 1 });

const RetargetingCampaign =
  mongoose.models.RetargetingCampaign ||
  mongoose.model<IRetargetingCampaignDocument>('RetargetingCampaign', retargetingCampaignSchema);

export { RetargetingCampaign };
export default RetargetingCampaign;
