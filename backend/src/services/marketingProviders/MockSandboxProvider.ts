import {
  ISocialPublishingProvider,
  IAdCampaignProvider,
  IAudienceSyncProvider,
  IConversionTrackingProvider,
  IReputationProvider,
  PostMetrics,
  PageInsights,
  AdTelemetry,
  HashedUserIdentifier,
  ServerConversionEvent,
  PlatformReview,
  MarketingPlatform,
} from '@/types/marketingProviders';

/**
 * MockSandboxProvider
 *
 * Implements the full suite of marketing provider interfaces in a zero-network,
 * deterministic sandbox environment. Used for local testing, CI/CD, and previewing
 * workflows when Bring-Your-Own-Credentials (BYOC) are not yet connected or are set to SANDBOX_MOCK mode.
 */
export class MockSandboxProvider
  implements
    ISocialPublishingProvider,
    IAdCampaignProvider,
    IAudienceSyncProvider,
    IConversionTrackingProvider,
    IReputationProvider
{
  private platform: MarketingPlatform;

  constructor(platform: MarketingPlatform = 'facebook') {
    this.platform = platform;
  }

  // ==========================================
  // ISocialPublishingProvider
  // ==========================================

  async validateCredentials(credentials: Record<string, any>): Promise<{ valid: boolean; accountInfo?: any }> {
    if (!credentials || Object.keys(credentials).length === 0) {
      return { valid: false };
    }
    const accountId = credentials.pageId || credentials.accountId || credentials.adAccountId || 'mock_account_101';
    return {
      valid: true,
      accountInfo: {
        id: accountId,
        platform: this.platform,
        name: `Sandbox ${this.platform.charAt(0).toUpperCase() + this.platform.slice(1)} Business`,
        username: `@sandbox_${this.platform}_biz`,
        followersCount: 12450,
        isVerified: true,
        mode: 'SANDBOX_MOCK',
      },
    };
  }

  async publishPost(
    account: any,
    postData: { content: string; mediaUrls?: string[]; scheduledFor?: Date; urls?: string[] }
  ): Promise<{ platformPostId: string; publishedUrl: string; status: string }> {
    const timestamp = Date.now();
    const platformPostId = `mock_post_${this.platform}_${timestamp}`;
    const publishedUrl = `https://mock.${this.platform}.com/posts/${platformPostId}`;

    return {
      platformPostId,
      publishedUrl,
      status: postData.scheduledFor && postData.scheduledFor > new Date() ? 'SCHEDULED' : 'PUBLISHED',
    };
  }

  async deletePost(account: any, platformPostId: string): Promise<boolean> {
    return true;
  }

  async getPostMetrics(account: any, platformPostId: string): Promise<PostMetrics> {
    // Generate deterministic yet dynamic-looking metrics
    const base = Math.floor(Math.random() * 200) + 100;
    return {
      likes: base * 3,
      comments: Math.floor(base * 0.4),
      shares: Math.floor(base * 0.15),
      impressions: base * 25,
      reach: base * 18,
      clicks: Math.floor(base * 0.8),
      engagementRate: 0.052,
    };
  }

  async getPageInsights(account: any, options?: any): Promise<PageInsights> {
    return {
      followers: 14820,
      followerGrowth: 340,
      reach: 58900,
      impressions: 94200,
      engagement: 7420,
      videoViews: 12300,
    };
  }

  // ==========================================
  // IAdCampaignProvider
  // ==========================================

  async createCampaign(
    account: any,
    campaignData: {
      name: string;
      objective: string;
      budget: { amount: number; type: 'DAILY' | 'LIFETIME'; currency: string };
      targetAudienceId?: string;
    }
  ): Promise<{ externalCampaignId: string; status: string }> {
    const externalCampaignId = `mock_camp_${this.platform}_${Date.now()}`;
    return {
      externalCampaignId,
      status: 'ACTIVE',
    };
  }

  async updateCampaignBudget(
    account: any,
    externalCampaignId: string,
    budget: { amount: number; type: 'DAILY' | 'LIFETIME' }
  ): Promise<boolean> {
    return true;
  }

  async toggleCampaignStatus(
    account: any,
    externalCampaignId: string,
    status: 'ACTIVE' | 'PAUSED'
  ): Promise<boolean> {
    return true;
  }

  async getCampaignTelemetry(account: any, externalCampaignId: string): Promise<AdTelemetry> {
    return {
      impressions: 48500,
      clicks: 1940,
      spend: 485.25,
      conversions: 84,
      cpc: 0.25,
      cpm: 10.0,
      roas: 4.12,
      lastUpdated: new Date(),
    };
  }

  // ==========================================
  // IAudienceSyncProvider
  // ==========================================

  async createAudience(
    account: any,
    audienceData: { name: string; description?: string; retentionDays?: number }
  ): Promise<{ externalAudienceId: string }> {
    const externalAudienceId = `mock_aud_${this.platform}_${Date.now()}`;
    return { externalAudienceId };
  }

  async addUsersToAudience(
    account: any,
    externalAudienceId: string,
    users: HashedUserIdentifier[]
  ): Promise<{ added: number; failed: number }> {
    return {
      added: users.length,
      failed: 0,
    };
  }

  async removeUsersFromAudience(
    account: any,
    externalAudienceId: string,
    users: HashedUserIdentifier[]
  ): Promise<{ removed: number; failed: number }> {
    return {
      removed: users.length,
      failed: 0,
    };
  }

  async getAudienceSize(account: any, externalAudienceId: string): Promise<number> {
    return 1540;
  }

  // ==========================================
  // IConversionTrackingProvider
  // ==========================================

  async sendServerEvent(
    account: any,
    event: ServerConversionEvent
  ): Promise<{ success: boolean; eventId: string; message?: string }> {
    return {
      success: true,
      eventId: event.eventId,
      message: `[Sandbox] Event ${event.eventName} acknowledged and verified for ${this.platform}.`,
    };
  }

  // ==========================================
  // IReputationProvider
  // ==========================================

  async getReviews(account?: any, options?: { limit?: number; since?: Date }): Promise<PlatformReview[]> {
    return this.fetchReviews(account, options);
  }

  async fetchReviews(account: any, options?: { limit?: number; since?: Date }): Promise<PlatformReview[]> {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;

    return [
      {
        id: `mock_rev_${this.platform}_1`,
        platform: this.platform,
        rating: 5,
        title: 'Outstanding customer experience!',
        comment:
          'The team was responsive, transparent with pricing, and completed the delivery ahead of schedule. Highly recommended.',
        authorName: 'Sarah Jenkins',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
        publishedAt: new Date(now.getTime() - oneDay * 2),
        hasReply: true,
        replyText: 'Thank you Sarah! We are thrilled to hear your feedback.',
        repliedAt: new Date(now.getTime() - oneDay),
      },
      {
        id: `mock_rev_${this.platform}_2`,
        platform: this.platform,
        rating: 4,
        title: 'Great service with fast onboarding',
        comment:
          'Set up everything within an afternoon. Interface is clean and intuitive. Minor question on billing was resolved within minutes.',
        authorName: 'David Chen',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
        publishedAt: new Date(now.getTime() - oneDay * 5),
        hasReply: false,
      },
      {
        id: `mock_rev_${this.platform}_3`,
        platform: this.platform,
        rating: 5,
        title: 'Best ERP & CRM integration we have used',
        comment:
          'All our social channels and customer followups are now automated. Saved our marketing team 15+ hours weekly.',
        authorName: 'Elena Rostova',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
        publishedAt: new Date(now.getTime() - oneDay * 9),
        hasReply: true,
        replyText: 'Thank you Elena! Great to have you on board.',
        repliedAt: new Date(now.getTime() - oneDay * 8),
      },
    ];
  }

  async replyToReview(
    account: any,
    platformReviewId: string,
    replyText: string
  ): Promise<{ replyId: string; success: boolean }> {
    return {
      replyId: `mock_reply_${Date.now()}`,
      success: true,
    };
  }

  async deleteReply(account: any, platformReviewId: string, replyId?: string): Promise<boolean> {
    return true;
  }
}
