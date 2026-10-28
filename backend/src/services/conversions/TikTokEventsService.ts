import axios from 'axios';
import { ServerConversionEvent } from '@/types/marketingProviders';

export interface TikTokEventsConfig {
  pixelCode: string;
  accessToken: string;
  testEventCode?: string;
}

/**
 * TikTokEventsService
 *
 * Implements TikTok Events API v2 for server-to-server tracking.
 */
export class TikTokEventsService {
  private baseURL = 'https://open.tiktokapis.com/v2/event/track/';
  private config: TikTokEventsConfig;

  constructor(config: TikTokEventsConfig) {
    this.config = config;
  }

  /**
   * Maps general conversion event names to TikTok standardized event names
   */
  private mapEventName(name: string): string {
    const map: Record<string, string> = {
      Purchase: 'CompletePayment',
      Lead: 'SubmitForm',
      AddToCart: 'AddToCart',
      ViewContent: 'ViewContent',
      InitiateCheckout: 'InitiateCheckout',
      CompleteRegistration: 'CompleteRegistration',
    };
    return map[name] || name;
  }

  async sendEvent(event: ServerConversionEvent): Promise<{ success: boolean; eventId: string }> {
    if (!this.config.pixelCode || !this.config.accessToken) {
      throw new Error('TikTok Events API requires pixelCode and accessToken');
    }

    const payload = {
      event_source: 'web',
      event_source_id: this.config.pixelCode,
      test_event_code: this.config.testEventCode,
      data: [
        {
          event: this.mapEventName(event.eventName),
          event_time: event.eventTime || Math.floor(Date.now() / 1000),
          event_id: event.eventId,
          user: {
            email: event.userData.emailHash,
            phone_number: event.userData.phoneHash,
            ttclid: event.userData.ttclid,
            ip: event.userData.clientIp,
            user_agent: event.userData.clientUserAgent,
          },
          properties: event.customData
            ? {
                currency: event.customData.currency || 'USD',
                value: event.customData.value,
                order_id: event.customData.orderId,
              }
            : undefined,
        },
      ],
    };

    try {
      const response = await axios.post(this.baseURL, payload, {
        headers: {
          'Access-Token': this.config.accessToken,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      if (response.data?.code !== 0 && response.data?.code !== 200) {
        throw new Error(response.data?.message || 'TikTok API returned non-zero code');
      }

      return {
        success: true,
        eventId: event.eventId,
      };
    } catch (err: any) {
      const detail = err.response?.data?.message || err.message;
      throw new Error(`TikTok Events API upload error: ${detail}`);
    }
  }
}
