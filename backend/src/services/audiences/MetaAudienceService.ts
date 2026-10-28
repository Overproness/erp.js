import axios from 'axios';
import { HashedUserIdentifier } from '@/types/marketingProviders';

export interface MetaAudienceConfig {
  adAccountId: string;
  accessToken: string;
}

/**
 * MetaAudienceService
 *
 * Implements Meta Custom Audiences API v21.0.
 * Handles audience creation and chunked batch streaming of SHA-256 hashed customer identifiers.
 */
export class MetaAudienceService {
  private baseURL = 'https://graph.facebook.com/v21.0';
  private config: MetaAudienceConfig;
  public static readonly BATCH_SIZE = 10000;

  constructor(config: MetaAudienceConfig) {
    this.config = config;
  }

  /**
   * Creates a new Custom Audience on Meta Ads
   */
  async createCustomAudience(name: string, description?: string): Promise<{ audienceId: string }> {
    const actId = this.config.adAccountId.startsWith('act_')
      ? this.config.adAccountId
      : `act_${this.config.adAccountId}`;

    const payload = {
      name,
      description: description || `ERP.js Retargeting Audience - ${name}`,
      subtype: 'CUSTOM',
      customer_file_source: 'USER_PROVIDED_ONLY',
      access_token: this.config.accessToken,
    };

    try {
      const response = await axios.post(`${this.baseURL}/${actId}/customaudiences`, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      });

      return { audienceId: response.data.id };
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message;
      throw new Error(`Meta Custom Audience creation failed: ${msg}`);
    }
  }

  /**
   * Streams hashed users into a Meta Custom Audience in chunks of up to 10,000
   */
  async addUsersToAudience(
    audienceId: string,
    users: HashedUserIdentifier[]
  ): Promise<{ added: number; failed: number }> {
    if (!users || users.length === 0) return { added: 0, failed: 0 };

    let totalAdded = 0;
    let totalFailed = 0;

    // Chunk into BATCH_SIZE (10,000)
    for (let i = 0; i < users.length; i += MetaAudienceService.BATCH_SIZE) {
      const chunk = users.slice(i, i + MetaAudienceService.BATCH_SIZE);

      const dataRows = chunk
        .map((u) => {
          if (!u.emailHash && !u.phoneHash) return null;
          return [u.emailHash || '', u.phoneHash || ''];
        })
        .filter(Boolean);

      if (dataRows.length === 0) continue;

      const payload = {
        payload: {
          schema: ['EMAIL_SHA256', 'PHONE_SHA256'],
          data: dataRows,
        },
        access_token: this.config.accessToken,
      };

      try {
        const response = await axios.post(`${this.baseURL}/${audienceId}/users`, payload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 20000,
        });

        totalAdded += response.data?.num_received || dataRows.length;
      } catch (err: any) {
        console.warn(`[MetaAudienceService] Batch upload failed: ${err.message}`);
        totalFailed += dataRows.length;
      }
    }

    return { added: totalAdded, failed: totalFailed };
  }
}
