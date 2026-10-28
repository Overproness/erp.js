import axios from 'axios';
import { PlatformReview } from '@/types/marketingProviders';

export interface YelpConfig {
  businessId?: string;
  apiKey?: string;
}

/**
 * YelpFusionService
 *
 * Implements Yelp Fusion API (v3) for monitoring consumer reviews and ratings
 * with proper platform attribution.
 */
export class YelpFusionService {
  private baseURL = 'https://api.yelp.com/v3';
  private config: YelpConfig;

  constructor(config: YelpConfig) {
    this.config = config;
  }

  /**
   * Fetches latest review excerpts from Yelp Fusion API
   */
  async getReviews(): Promise<PlatformReview[]> {
    if (!this.config.apiKey || !this.config.businessId) {
      return [];
    }

    try {
      const response = await axios.get(
        `${this.baseURL}/businesses/${this.config.businessId}/reviews`,
        {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          timeout: 15000,
        }
      );

      const items = response.data?.reviews || [];
      return items.map((r: any) => ({
        id: r.id,
        platform: 'yelp',
        rating: r.rating || 5,
        comment: r.text || '',
        authorName: r.user?.name || 'Yelp Reviewer',
        authorAvatar: r.user?.image_url,
        publishedAt: new Date(r.time_created || Date.now()),
        hasReply: false,
      }));
    } catch (err: any) {
      const msg = err.response?.data?.error?.description || err.message;
      throw new Error(`Yelp reviews fetch failed: ${msg}`);
    }
  }
}
