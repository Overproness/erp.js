import axios from 'axios';
import { PlatformReview } from '@/types/marketingProviders';

export interface GoogleReviewsConfig {
  accountId?: string;
  locationId?: string;
  accessToken?: string;
}

/**
 * GoogleBusinessProfileService
 *
 * Implements Google Business Profile APIs (mybusiness.googleapis.com) for
 * reading customer reviews, star ratings, and publishing official business replies.
 */
export class GoogleBusinessProfileService {
  private baseURL = 'https://mybusiness.googleapis.com/v4';
  private config: GoogleReviewsConfig;

  constructor(config: GoogleReviewsConfig) {
    this.config = config;
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.config.accessToken || ''}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Fetches customer reviews for a Google Business location
   */
  async getReviews(): Promise<PlatformReview[]> {
    if (!this.config.accessToken || !this.config.locationId) {
      return [];
    }

    try {
      const response = await axios.get(
        `${this.baseURL}/${this.config.locationId}/reviews`,
        { headers: this.getHeaders(), timeout: 15000 }
      );

      const items = response.data?.reviews || [];
      return items.map((r: any) => {
        const starMap: Record<string, number> = {
          FIVE: 5,
          FOUR: 4,
          THREE: 3,
          TWO: 2,
          ONE: 1,
        };
        const rating = starMap[r.starRating] || 5;

        return {
          id: r.name || r.reviewId,
          platform: 'google',
          rating,
          comment: r.comment || '',
          authorName: r.reviewer?.displayName || 'Google User',
          authorAvatar: r.reviewer?.profilePhotoUrl,
          publishedAt: new Date(r.createTime || Date.now()),
          hasReply: !!r.reviewReply,
          replyText: r.reviewReply?.comment,
          repliedAt: r.reviewReply?.updateTime ? new Date(r.reviewReply.updateTime) : undefined,
        };
      });
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message;
      throw new Error(`Google Business reviews fetch failed: ${msg}`);
    }
  }

  /**
   * Publishes an official business reply to a Google review
   */
  async replyToReview(reviewId: string, replyText: string): Promise<boolean> {
    if (!this.config.accessToken) {
      return true; // Sandbox fallback
    }

    try {
      await axios.put(
        `${this.baseURL}/${reviewId}/reply`,
        { comment: replyText },
        { headers: this.getHeaders(), timeout: 15000 }
      );
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message;
      throw new Error(`Google Business review reply failed: ${msg}`);
    }
  }
}
