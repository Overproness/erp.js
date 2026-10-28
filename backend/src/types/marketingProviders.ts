/**
 * Marketing Platform Provider Interfaces and Data Contracts
 * Defines standard abstraction across Meta, Google, LinkedIn, TikTok, X, and Review platforms.
 */

export type MarketingPlatform =
  | 'facebook'
  | 'instagram'
  | 'google'
  | 'linkedin'
  | 'tiktok'
  | 'twitter'
  | 'trustpilot'
  | 'yelp';

export type IntegrationStatus = 'CONNECTED' | 'DISCONNECTED' | 'EXPIRED' | 'ERROR' | 'SANDBOX_MOCK';

export interface PostMetrics {
  likes: number;
  comments: number;
  shares: number;
  impressions?: number;
  reach?: number;
  clicks?: number;
  engagementRate?: number;
}

export interface PageInsights {
  followers: number;
  followerGrowth: number;
  reach: number;
  impressions: number;
  engagement: number;
  videoViews?: number;
}

export interface AdTelemetry {
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  cpc: number;
  cpm: number;
  ctr?: number;
  roas: number;
  lastUpdated?: Date;
}

export interface HashedUserIdentifier {
  emailHash?: string; // SHA-256 lowercase trimmed
  phoneHash?: string; // SHA-256 E.164 without symbols
  firstNameHash?: string;
  lastNameHash?: string;
  externalId?: string;
}

export interface ServerConversionEvent {
  eventName: string; // e.g. 'Purchase', 'Lead', 'AddToCart'
  eventTime: number; // Unix timestamp in seconds
  eventId: string; // Deduplication ID
  eventSourceUrl?: string;
  actionSource: 'website' | 'system' | 'offline';
  userData: {
    emailHash?: string;
    phoneHash?: string;
    clientIp?: string;
    clientUserAgent?: string;
    fbp?: string; // Meta browser cookie
    fbc?: string; // Meta click ID fbclid
    ttclid?: string; // TikTok click ID
    gclid?: string; // Google click ID
  };
  customData?: {
    currency?: string;
    value?: number;
    orderId?: string;
    contents?: Array<{ id: string; quantity: number; itemPrice: number }>;
  };
}

export interface PlatformReview {
  id: string;
  platform: MarketingPlatform;
  rating: number; // 1 to 5
  title?: string;
  comment: string;
  authorName: string;
  authorAvatar?: string;
  publishedAt: Date;
  hasReply: boolean;
  replyText?: string;
  repliedAt?: Date;
}

/**
 * Organic Social Publishing Interface
 */
export interface ISocialPublishingProvider {
  validateCredentials(credentials: Record<string, any>): Promise<{ valid: boolean; accountInfo?: any }>;
  publishPost(
    account: any,
    postData: { content: string; mediaUrls?: string[]; scheduledFor?: Date; urls?: string[] }
  ): Promise<{ platformPostId: string; publishedUrl: string; status: string }>;
  deletePost(account: any, platformPostId: string): Promise<boolean>;
  getPostMetrics(account: any, platformPostId: string): Promise<PostMetrics>;
  getPageInsights?(account: any, options?: any): Promise<PageInsights>;
}

/**
 * Paid Ad Campaign Management Interface
 */
export interface IAdCampaignProvider {
  createCampaign(
    account: any,
    campaignData: {
      name: string;
      objective: string;
      budget: { amount: number; type: 'DAILY' | 'LIFETIME'; currency: string };
      targetAudienceId?: string;
    }
  ): Promise<{ externalCampaignId: string; status: string }>;
  updateCampaignBudget(
    account: any,
    externalCampaignId: string,
    budget: { amount: number; type: 'DAILY' | 'LIFETIME' }
  ): Promise<boolean>;
  toggleCampaignStatus(account: any, externalCampaignId: string, status: 'ACTIVE' | 'PAUSED'): Promise<boolean>;
  getCampaignTelemetry(account: any, externalCampaignId: string): Promise<AdTelemetry>;
}

/**
 * Audience Synchronization Interface (Retargeting / Customer Match)
 */
export interface IAudienceSyncProvider {
  createAudience(
    account: any,
    audienceData: { name: string; description?: string; retentionDays?: number }
  ): Promise<{ externalAudienceId: string }>;
  addUsersToAudience(
    account: any,
    externalAudienceId: string,
    users: HashedUserIdentifier[]
  ): Promise<{ added: number; failed: number }>;
  removeUsersFromAudience(
    account: any,
    externalAudienceId: string,
    users: HashedUserIdentifier[]
  ): Promise<{ removed: number; failed: number }>;
  getAudienceSize(account: any, externalAudienceId: string): Promise<number>;
}

/**
 * Server-to-Server Conversion Tracking Interface (CAPI / Events API)
 */
export interface IConversionTrackingProvider {
  sendServerEvent(
    account: any,
    event: ServerConversionEvent
  ): Promise<{ success: boolean; eventId: string; message?: string }>;
}

/**
 * Reputation & Review Management Interface
 */
export interface IReputationProvider {
  fetchReviews(account: any, options?: { limit?: number; since?: Date }): Promise<PlatformReview[]>;
  replyToReview(
    account: any,
    platformReviewId: string,
    replyText: string
  ): Promise<{ replyId: string; success: boolean }>;
  deleteReply?(account: any, platformReviewId: string, replyId?: string): Promise<boolean>;
}
