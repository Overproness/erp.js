import axios from 'axios';
import { PlatformReview } from '@/types/marketingProviders';

export interface MetaPageReviewsConfig {
  pageId?: string;
  pageAccessToken?: string;
}

/**
 * MetaPageReviewsService
 *
 * Implements Meta Graph API v21.0 for Facebook Page Recommendations & Ratings:
 * Ingests reviews and publishes official page comments in response.
 */
export class MetaPageReviewsService {
  private baseURL = 'https://graph.facebook.com/v21.0';
  private config: MetaPageReviewsConfig;

  constructor(config: MetaPageReviewsConfig) {
    this.config = config;
  }

  /**
   * Fetches ratings & recommendations left on the Facebook Page
   */
  async getReviews(): Promise<PlatformReview[]> {
    if (!this.config.pageAccessToken || !this.config.pageId) {
      return [];
    }

    try {
      const response = await axios.get(
        `${this.baseURL}/${this.config.pageId}/ratings`,
        {
          params: {
            fields: 'review_text,recommendation_type,rating,created_time,reviewer,comments',
            access_token: this.config.pageAccessToken,
          },
          timeout: 15000,
        }
      );

      const items = response.data?.data || [];
      return items.map((r: any) => {
        // Facebook uses 1-5 rating or positive/negative recommendation
        let rating = r.rating;
        if (!rating) {
          rating = r.recommendation_type === 'positive' ? 5 : 2;
        }

        const hasReply = r.comments?.data && r.comments.data.length > 0;
        const latestComment = hasReply ? r.comments.data[0] : null;

        return {
          id: r.id || `fb_rev_${Date.now()}`,
          platform: 'facebook',
          rating,
          comment: r.review_text || (r.recommendation_type === 'positive' ? 'Recommends this business' : 'Does not recommend'),
          authorName: r.reviewer?.name || 'Facebook User',
          authorAvatar: r.reviewer?.picture?.data?.url,
          publishedAt: new Date(r.created_time || Date.now()),
          hasReply: !!hasReply,
          replyText: latestComment?.message,
          repliedAt: latestComment?.created_time ? new Date(latestComment.created_time) : undefined,
        };
      });
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message;
      throw new Error(`Meta Page reviews fetch failed: ${msg}`);
    }
  }

  /**
   * Publishes an official comment reply to a Facebook review/recommendation
   */
  async replyToReview(reviewId: string, replyText: string): Promise<boolean> {
    if (!this.config.pageAccessToken) {
      return true;
    }

    try {
      await axios.post(
        `${this.baseURL}/${reviewId}/comments`,
        {
          message: replyText,
          access_token: this.config.pageAccessToken,
        },
        { timeout: 15000 }
      );
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message;
      throw new Error(`Meta Page review reply failed: ${msg}`);
    }
  }
}
