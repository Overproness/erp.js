// @ts-nocheck
import mongoose from 'mongoose';

export interface IAdCreative {
  headline: string;
  body: string;
  mediaUrl?: string;
  callToAction?: string;
  destinationUrl: string;
}

export interface IAdCampaignDocument extends mongoose.Document {
  name: string;
  description?: string;
  objective: 'OUTCOME_LEADS' | 'OUTCOME_SALES' | 'OUTCOME_TRAFFIC' | 'OUTCOME_AWARENESS' | 'OUTCOME_ENGAGEMENT';
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
  platforms: ('facebook' | 'google' | 'tiktok' | 'twitter' | 'linkedin')[];
  budget: {
    amount: number;
    type: 'DAILY' | 'LIFETIME';
    currency: string;
  };
  targeting: {
    geoLocations?: string[];
    ageMin?: number;
    ageMax?: number;
    genders?: string[];
    customAudienceIds?: string[];
    interests?: string[];
  };
  creatives: IAdCreative[];
  platformCampaignIds: Record<string, string>;
  platformAdSetIds: Record<string, string>;
  platformAdIds: Record<string, string>;
  telemetry: {
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
    cpc: number;
    cpm: number;
    ctr: number;
    roas: number;
    lastSyncedAt?: Date;
  };
  startDate?: Date;
  endDate?: Date;
  owner: mongoose.Types.ObjectId;
  companyID?: mongoose.Types.ObjectId;
  removed: boolean;
}

const adCampaignSchema = new mongoose.Schema(
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
    objective: {
      type: String,
      enum: ['OUTCOME_LEADS', 'OUTCOME_SALES', 'OUTCOME_TRAFFIC', 'OUTCOME_AWARENESS', 'OUTCOME_ENGAGEMENT'],
      default: 'OUTCOME_TRAFFIC',
      index: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'],
      default: 'DRAFT',
      index: true,
    },
    platforms: {
      type: [String],
      enum: ['facebook', 'google', 'tiktok', 'twitter', 'linkedin', 'instagram'],
      default: ['facebook'],
    },
    budget: {
      amount: { type: Number, default: 50 },
      type: { type: String, enum: ['DAILY', 'LIFETIME'], default: 'DAILY' },
      currency: { type: String, default: 'USD' },
    },
    targeting: {
      geoLocations: { type: [String], default: [] },
      ageMin: { type: Number, default: 18 },
      ageMax: { type: Number, default: 65 },
      genders: { type: [String], default: ['all'] },
      customAudienceIds: { type: [String], default: [] },
      interests: { type: [String], default: [] },
    },
    creatives: [
      {
        headline: { type: String, default: '' },
        body: { type: String, default: '' },
        mediaUrl: { type: String, default: '' },
        callToAction: { type: String, default: 'LEARN_MORE' },
        destinationUrl: { type: String, default: '' },
      },
    ],
    platformCampaignIds: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    platformAdSetIds: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    platformAdIds: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    telemetry: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      spend: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      cpc: { type: Number, default: 0 },
      cpm: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 },
      roas: { type: Number, default: 0 },
      lastSyncedAt: { type: Date, default: null },
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
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

adCampaignSchema.index({ owner: 1, removed: 1, status: 1 });

const AdCampaign = mongoose.models.AdCampaign || mongoose.model<IAdCampaignDocument>('AdCampaign', adCampaignSchema);
export default AdCampaign;
