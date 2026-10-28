import mongoose from 'mongoose';
import {
  MarketingPlatform,
  ISocialPublishingProvider,
  IAdCampaignProvider,
  IAudienceSyncProvider,
  IConversionTrackingProvider,
  IReputationProvider,
} from '@/types/marketingProviders';
import { MockSandboxProvider } from './MockSandboxProvider';
import { MetaProvider } from './MetaProvider';
import { LinkedInProvider } from './LinkedInProvider';
import { TwitterProvider } from './TwitterProvider';
import { TikTokProvider } from './TikTokProvider';

/**
 * ProviderFactory
 *
 * Resolves appropriate live provider or MockSandboxProvider for a given
 * marketing platform based on the tenant's BYOC (Bring Your Own Credentials)
 * configuration and mode stored in MarketingIntegration.
 */
export class ProviderFactory {
  /**
   * Retrieves the configured Social Publishing Provider for an owner & platform
   */
  public static async getSocialPublishingProvider(
    platform: MarketingPlatform,
    ownerId?: string | mongoose.Types.ObjectId
  ): Promise<ISocialPublishingProvider> {
    if (!ownerId || mongoose.connection.readyState !== 1) {
      return new MockSandboxProvider(platform);
    }

    try {
      const MarketingIntegration = mongoose.model('MarketingIntegration');
      const integration = await MarketingIntegration.findOne({
        owner: ownerId,
        platform,
        removed: false,
      });

      if (!integration || integration.mode === 'SANDBOX_MOCK') {
        return new MockSandboxProvider(platform);
      }

      const credentials = integration.getDecryptedCredentials();
      if (!credentials || Object.keys(credentials).length === 0) {
        return new MockSandboxProvider(platform);
      }

      switch (platform) {
        case 'facebook':
        case 'instagram':
          return new MetaProvider({
            accessToken: credentials.accessToken || credentials.pageAccessToken,
            pageId: credentials.pageId,
            instagramId: credentials.instagramId,
          });

        case 'linkedin':
          return new LinkedInProvider({
            accessToken: credentials.accessToken,
            organizationId: credentials.organizationId,
          });

        case 'twitter':
          return new TwitterProvider({
            accessToken: credentials.accessToken,
            bearerToken: credentials.bearerToken,
          });

        case 'tiktok':
          return new TikTokProvider({
            accessToken: credentials.accessToken,
          });

        default:
          return new MockSandboxProvider(platform);
      }
    } catch {
      return new MockSandboxProvider(platform);
    }
  }

  /**
   * Retrieves Reputation Provider (Google Business, Trustpilot, Meta)
   */
  public static async getReputationProvider(
    platform: MarketingPlatform,
    ownerId?: string | mongoose.Types.ObjectId
  ): Promise<IReputationProvider> {
    return new MockSandboxProvider(platform);
  }

  /**
   * Retrieves Conversion Tracking Provider (Meta CAPI, TikTok Events, Google)
   */
  public static async getConversionTrackingProvider(
    platform: MarketingPlatform,
    ownerId?: string | mongoose.Types.ObjectId
  ): Promise<IConversionTrackingProvider> {
    return new MockSandboxProvider(platform);
  }

  /**
   * Retrieves Audience Sync Provider (Meta Custom Audiences, TikTok DMP, etc.)
   */
  public static async getAudienceSyncProvider(
    platform: MarketingPlatform,
    ownerId?: string | mongoose.Types.ObjectId
  ): Promise<IAudienceSyncProvider> {
    return new MockSandboxProvider(platform);
  }

  /**
   * Retrieves Ad Campaign Provider (Meta Marketing API, Google Ads)
   */
  public static async getAdCampaignProvider(
    platform: MarketingPlatform,
    ownerId?: string | mongoose.Types.ObjectId
  ): Promise<IAdCampaignProvider> {
    return new MockSandboxProvider(platform);
  }
}
