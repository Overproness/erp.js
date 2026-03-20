// Social Media model type definitions

export interface ISocialAccount {
  _id: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok';
  platformAccountId: string;
  accountName: string;
  credentials: {
    accessToken: string;
    refreshToken: string;
    tokenExpiry: Date;
    pageId: string;
    businessAccountId: string;
    apiKey: string;
    apiSecret: string;
  };
  accountInfo: {
    username: string;
    displayName: string;
    profilePictureUrl: string;
    followerCount: number;
    followingCount: number;
    postsCount: number;
    verified: boolean;
    bio: string;
    website: string;
  };
  isActive: boolean;
  isVerified: boolean;
  lastConnected: Date;
  disconnectedAt: Date;
  settings: {
    autoPosting: boolean;
    notifications: { mentions: boolean; comments: boolean; messages: boolean };
    privacy: { trackMetrics: boolean; shareAnalytics: boolean };
  };
  limitations: {
    postsPerDay: number;
    postsPerHour: number;
    characterLimit: number;
    imageLimit: number;
    videoLimit: number;
  };
  lastSync: Date;
  syncStatus: 'synced' | 'pending' | 'error';
  errorLog: { error: string; timestamp: Date; resolved: boolean }[];
  owner: string;
  removed: boolean;
  created: Date;
  updated: Date;
  companyID: string;
}

export interface ISocialPost {
  _id: string;
  content: string;
  platforms: string[];
  mediaFiles: { type: string; url: string; filename: string; size: number; altText: string; optimized: any }[];
  urls: { original: string; shortened: string; trackingId: string; clicks: number }[];
  hashtags: string[];
  mentions: string[];
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
  scheduledFor: Date;
  publishedAt: Date;
  platformPosts: { platform: string; platformPostId: string; accountId: string; publishedUrl: string; publishedAt: Date; status: string; error: string }[];
  campaign: string;
  postType: 'text' | 'image' | 'video' | 'carousel' | 'story' | 'reel';
  targeting: any;
  settings: {
    allowComments: boolean;
    allowSharing: boolean;
    trackClicks: boolean;
    autoReply: { enabled: boolean; message: string };
  };
  analytics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
    reach: number;
    impressions: number;
    engagement: number;
    lastUpdated: Date;
  };
  publishResults: { platform: string; success: boolean; platformPostId: string; publishedUrl: string; error: string; timestamp: Date }[];
  aiGenerated: boolean;
  aiPrompt: string;
  aiModel: string;
  version: number;
  owner: string;
  createdBy: string;
  createdByModel: string;
  removed: boolean;
  created: Date;
  updated: Date;
  companyID: string;
}

export interface ISocialCampaign {
  _id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  type: 'awareness' | 'engagement' | 'traffic' | 'conversions' | 'sales';
  platforms: string[];
  startDate: Date;
  endDate: Date;
  budget: { total: number; spent: number; currency: string; dailyLimit: number };
  targetAudience: any;
  objectives: { primary: string; secondary: string[] };
  content: { theme: string; tone: string; keywords: string[]; hashtags: string[]; contentPillars: string[] };
  schedule: any;
  tracking: any;
  analytics: {
    posts: number;
    reach: number;
    impressions: number;
    engagement: number;
    clicks: number;
    conversions: number;
    revenue: number;
    costPerClick: number;
    costPerConversion: number;
    returnOnAdSpend: number;
    lastUpdated: Date;
    platformBreakdown: any;
  };
  approval: { required: boolean; approvers: any[]; status: string };
  collaboration: { team: any[]; comments: any[] };
  createdAt: Date;
  updatedAt: Date;
}

export interface ISocialMention {
  _id: string;
  platform: string;
  platformPostId: string;
  content: string;
  cleanContent: string;
  author: {
    username: string;
    displayName: string;
    profileUrl: string;
    avatarUrl: string;
    followerCount: number;
    isVerified: boolean;
    accountAge: number;
  };
  url: string;
  publishedAt: Date;
  detectedAt: Date;
  mentionType: 'direct' | 'indirect' | 'hashtag' | 'brand' | 'competitor';
  keywords: { keyword: string; relevance: number; context: string }[];
  sentiment: {
    overall: string;
    confidence: number;
    scores: { positive: number; neutral: number; negative: number };
    emotions: any[];
  };
  engagement: { likes: number; comments: number; shares: number; views: number; totalEngagement: number; engagementRate: number };
  influence: { reach: number; impressions: number; viralityScore: number; authorInfluenceScore: number };
  classification: { category: string; priority: string; topics: string[]; intent: string };
  response: any;
  tracking: any;
  alerts: any;
  verification: any;
  geo: { country: string; state: string; city: string; timezone: string; coordinates: { latitude: number; longitude: number } };
  metadata: { language: string; mediaType: string; mediaUrls: string[]; hashtags: string[] };
  createdAt: Date;
  updatedAt: Date;
}

export interface ISocialAnalytics {
  _id: string;
  post: string;
  campaign: string;
  account: string;
  platform: string;
  platformData: {
    reach: number;
    impressions: number;
    engagement: number;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
    saves: number;
    facebook?: any;
    instagram?: any;
    twitter?: any;
    linkedin?: any;
  };
  demographics: any;
  timeMetrics: any;
  competitorData: any;
  sentimentAnalysis: any;
  conversion: {
    clicks: number;
    conversions: number;
    conversion_rate: number;
    revenue: number;
    cost_per_click: number;
    cost_per_conversion: number;
    return_on_ad_spend: number;
  };
  urlTracking: any[];
  hashtags: { tag: string; reach: number; engagement: number; posts_count: number; trending_score: number }[];
  mentions: any[];
  createdAt: Date;
  updatedAt: Date;
}
