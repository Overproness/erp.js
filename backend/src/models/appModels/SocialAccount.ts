import mongoose from 'mongoose';

const socialAccountSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
    enum: ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok'],
  },
  platformAccountId: {
    type: String,
    required: true,
  },
  accountName: {
    type: String,
    required: true,
  },
  credentials: {
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: String,
    tokenExpiry: Date,
    pageId: String, // For Facebook pages
    businessAccountId: String, // For Instagram business accounts
    apiKey: String,
    apiSecret: String,
  },
  accountInfo: {
    username: String,
    displayName: String,
    profilePictureUrl: String,
    followerCount: Number,
    followingCount: Number,
    postsCount: Number,
    verified: Boolean,
    bio: String,
    website: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  lastConnected: {
    type: Date,
    default: Date.now,
  },
  disconnectedAt: Date,
  settings: {
    autoPosting: {
      type: Boolean,
      default: false,
    },
    notifications: {
      mentions: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
    },
    privacy: {
      trackMetrics: { type: Boolean, default: true },
      shareAnalytics: { type: Boolean, default: false },
    },
  },
  limitations: {
    postsPerDay: Number,
    postsPerHour: Number,
    characterLimit: Number,
    imageLimit: Number,
    videoLimit: Number,
  },
  lastSync: Date,
  syncStatus: {
    type: String,
    enum: ['synced', 'pending', 'error'],
    default: 'pending',
  },
  errorLog: [{
    error: String,
    timestamp: { type: Date, default: Date.now },
    resolved: { type: Boolean, default: false },
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompanyOwner',
    required: true,
  },
  removed: {
    type: Boolean,
    default: false,
  },
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
});

// Indexes
socialAccountSchema.index({ owner: 1, removed: 1 });
socialAccountSchema.index({ platform: 1, platformAccountId: 1 }, { unique: true });
socialAccountSchema.index({ owner: 1, platform: 1 });
socialAccountSchema.index({ companyID: 1 }, { sparse: true }); // Index for companyID

// Middleware
socialAccountSchema.pre('save', function(this: any, next: (err?: Error) => void) {
  this.updated = new Date();
  next();
});

// Instance methods
socialAccountSchema.methods.refreshCredentials = async function(newCredentials: Record<string, any>) {
  this.credentials = { ...this.credentials, ...newCredentials };
  this.lastSync = new Date();
  this.syncStatus = 'synced';
  return this.save();
};

socialAccountSchema.methods.logError = function(error: Error | string) {
  this.errorLog.push({
    error: error instanceof Error ? error.message : error,
    timestamp: new Date(),
    resolved: false,
  });
  
  // Keep only last 10 errors
  if (this.errorLog.length > 10) {
    this.errorLog = this.errorLog.slice(-10);
  }
  
  return this.save();
};

// Static methods
socialAccountSchema.statics.findByOwnerAndPlatform = function(ownerId: string, platform: string) {
  return this.find({
    owner: ownerId,
    platform,
    removed: false,
    isActive: true,
  });
};

const exportedModel = mongoose.model('SocialAccount', socialAccountSchema);
export default exportedModel;

