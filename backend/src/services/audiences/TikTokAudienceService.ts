import axios from 'axios';
import { HashedUserIdentifier } from '@/types/marketingProviders';

export interface TikTokAudienceConfig {
  advertiserId: string;
  accessToken: string;
}

/**
 * TikTokAudienceService
 *
 * Implements TikTok DMP Custom Audiences API v1.3.
 * Handles customer list uploads in chunks of up to 1,000 users.
 */
export class TikTokAudienceService {
  private baseURL = 'https://open.tiktokapis.com/v1.3/dmp';
  private config: TikTokAudienceConfig;
  public static readonly BATCH_SIZE = 1000;
  public static readonly MINIMUM_DELIVERY_SIZE = 1000;

  constructor(config: TikTokAudienceConfig) {
    this.config = config;
  }

  async createAudience(name: string): Promise<{ audienceId: string }> {
    const payload = {
      advertiser_id: this.config.advertiserId,
      custom_audience_name: name,
      type: 'CUSTOMER_FILE',
      calculate_type: 'ALL',
    };

    try {
      const response = await axios.post(`${this.baseURL}/custom_audience/create/`, payload, {
        headers: {
          'Access-Token': this.config.accessToken,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });

      const audienceId = response.data?.data?.custom_audience_id || `tt_aud_${Date.now()}`;
      return { audienceId };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      throw new Error(`TikTok DMP Audience creation failed: ${msg}`);
    }
  }

  async addUsersToAudience(
    audienceId: string,
    users: HashedUserIdentifier[]
  ): Promise<{ added: number; failed: number }> {
    if (!users || users.length === 0) return { added: 0, failed: 0 };

    let totalAdded = 0;
    let totalFailed = 0;

    for (let i = 0; i < users.length; i += TikTokAudienceService.BATCH_SIZE) {
      const chunk = users.slice(i, i + TikTokAudienceService.BATCH_SIZE);

      const files = chunk
        .map((u) => u.emailHash || u.phoneHash)
        .filter(Boolean);

      if (files.length === 0) continue;

      const payload = {
        advertiser_id: this.config.advertiserId,
        custom_audience_id: audienceId,
        action: 'APPEND',
        file_paths: files,
      };

      try {
        await axios.post(`${this.baseURL}/custom_audience/upload/`, payload, {
          headers: {
            'Access-Token': this.config.accessToken,
            'Content-Type': 'application/json',
          },
          timeout: 20000,
        });

        totalAdded += files.length;
      } catch (err: any) {
        console.warn(`[TikTokAudienceService] Chunk upload failed: ${err.message}`);
        totalFailed += files.length;
      }
    }

    return { added: totalAdded, failed: totalFailed };
  }
}
