import axios from 'axios';
import { PlatformReview } from '@/types/marketingProviders';

export interface TrustpilotConfig {
  businessUnitId?: string;
  apiKey?: string;
  accessToken?: string;
}

/**
 * TrustpilotService
 *
 * Implements Trustpilot Business APIs for fetching verified consumer reviews
 * and publishing private/public merchant responses.
 */
export class TrustpilotService {
  private baseURL = 'https://api.trustpilot.com/v1';
  private config: TrustpilotConfig;

  constructor(config: TrustpilotConfig) {
    this.config = config;
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.config.apiKey) {
      headers.apikey = this.config.apiKey;
    }
    if (this.config.accessToken) {
      headers.Authorization = `Bearer ${this.config.accessToken}`;
    }
    return headers;
  }

  /**
   * Fetches reviews for the configured Trustpilot business unit
   */
  async getReviews(): Promise<PlatformReview[]> {
    if (!this.config.businessUnitId || !this.config.apiKey) {
      return [];
    }

    try {
      const response = await axios.get(
        `${this.baseURL}/business-units/${this.config.businessUnitId}/reviews`,
        { headers: this.getHeaders(), timeout: 15000 }
      );

      const items = response.data?.reviews || [];
      return items.map((r: any) => ({
        id: r.id,
        platform: 'trustpilot',
        rating: r.stars || 5,
        title: r.title,
        comment: r.text || '',
        authorName: r.consumer?.displayName || 'Trustpilot Reviewer',
        publishedAt: new Date(r.createdAt || Date.now()),
        hasReply: !!r.companyReply,
        replyText: r.companyReply?.text,
        repliedAt: r.companyReply?.createdAt ? new Date(r.companyReply.createdAt) : undefined,
      }));
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      throw new Error(`Trustpilot reviews fetch failed: ${msg}`);
    }
  }

  /**
   * Publishes an official merchant reply to a Trustpilot review
   */
  async replyToReview(reviewId: string, replyText: string): Promise<boolean> {
    if (!this.config.accessToken || !this.config.businessUnitId) {
      return true;
    }

    try {
      await axios.post(
        `${this.baseURL}/private/business-units/${this.config.businessUnitId}/reviews/${reviewId}/reply`,
        { message: replyText },
        { headers: this.getHeaders(), timeout: 15000 }
      );
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      throw new Error(`Trustpilot review reply failed: ${msg}`);
    }
  }
}
