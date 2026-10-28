import axios from 'axios';
import { HashedUserIdentifier } from '@/types/marketingProviders';

export interface LinkedInAudienceConfig {
  sponsoredAccountId: string;
  accessToken: string;
}

/**
 * LinkedInAudienceService
 *
 * Implements LinkedIn Matched Audiences API (DMP Segments).
 * Handles DMP segment lifecycle and batch chunking (up to 5,000 users per chunk).
 */
export class LinkedInAudienceService {
  private baseURL = 'https://api.linkedin.com/rest';
  private config: LinkedInAudienceConfig;
  public static readonly BATCH_SIZE = 5000;
  public static readonly MINIMUM_DELIVERY_SIZE = 300;

  constructor(config: LinkedInAudienceConfig) {
    this.config = config;
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.config.accessToken}`,
      'LinkedIn-Version': '202401',
      'X-Restli-Protocol-Version': '2.0.0',
      'Content-Type': 'application/json',
    };
  }

  async createAudience(name: string, description?: string): Promise<{ audienceId: string }> {
    const accUrn = this.config.sponsoredAccountId.startsWith('urn:li:sponsoredAccount:')
      ? this.config.sponsoredAccountId
      : `urn:li:sponsoredAccount:${this.config.sponsoredAccountId}`;

    const payload = {
      name,
      description: description || `ERP.js Matched Audience - ${name}`,
      account: accUrn,
      type: 'USER',
      source: 'FIRST_PARTY',
    };

    try {
      const response = await axios.post(`${this.baseURL}/dmpSegments`, payload, {
        headers: this.getHeaders(),
        timeout: 15000,
      });

      const segmentId = response.headers['x-restli-id'] || response.data?.id || `li_seg_${Date.now()}`;
      return { audienceId: segmentId };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      throw new Error(`LinkedIn DMP Segment creation failed: ${msg}`);
    }
  }

  async addUsersToAudience(
    audienceId: string,
    users: HashedUserIdentifier[]
  ): Promise<{ added: number; failed: number }> {
    if (!users || users.length === 0) return { added: 0, failed: 0 };

    let totalAdded = 0;
    let totalFailed = 0;

    for (let i = 0; i < users.length; i += LinkedInAudienceService.BATCH_SIZE) {
      const chunk = users.slice(i, i + LinkedInAudienceService.BATCH_SIZE);

      const elements = chunk
        .map((u) => {
          if (!u.emailHash && !u.phoneHash) return null;
          return {
            action: 'ADD',
            user: {
              sha256Email: u.emailHash,
              sha256Phone: u.phoneHash,
            },
          };
        })
        .filter(Boolean);

      if (elements.length === 0) continue;

      const payload = {
        elements,
        patch: {
          $set: {},
        },
      };

      try {
        await axios.post(`${this.baseURL}/dmpSegments/${encodeURIComponent(audienceId)}/users`, payload, {
          headers: this.getHeaders(),
          timeout: 20000,
        });

        totalAdded += elements.length;
      } catch (err: any) {
        console.warn(`[LinkedInAudienceService] Chunk upload failed: ${err.message}`);
        totalFailed += elements.length;
      }
    }

    return { added: totalAdded, failed: totalFailed };
  }
}
