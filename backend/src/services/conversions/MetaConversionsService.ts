import axios from 'axios';
import { PIINormalizer } from '@/utils/piiNormalizer';
import { ServerConversionEvent } from '@/types/marketingProviders';

export interface MetaCAPIConfig {
  pixelId: string;
  accessToken: string;
  testEventCode?: string;
}

/**
 * MetaConversionsService
 *
 * Implements Meta Conversions API (CAPI) v21.0
 * Directly transmits web and offline events to Meta Graph API with automatic PII hashing and deduplication.
 */
export class MetaConversionsService {
  private baseURL = 'https://graph.facebook.com/v21.0';
  private config: MetaCAPIConfig;

  constructor(config: MetaCAPIConfig) {
    this.config = config;
  }

  /**
   * Dispatches a single server conversion event to Meta CAPI
   */
  async sendEvent(event: ServerConversionEvent): Promise<{ success: boolean; eventId: string; fbtraceId?: string }> {
    return this.sendEventsBatch([event]);
  }

  /**
   * Dispatches a batch of server conversion events to Meta CAPI
   */
  async sendEventsBatch(
    events: ServerConversionEvent[]
  ): Promise<{ success: boolean; eventId: string; fbtraceId?: string; eventsReceived?: number }> {
    if (!this.config.pixelId || !this.config.accessToken) {
      throw new Error('Meta CAPI requires pixelId and accessToken');
    }

    const formattedEvents = events.map((ev) => {
      const userData: Record<string, any> = {};

      if (ev.userData.emailHash) {
        userData.em = [ev.userData.emailHash];
      }
      if (ev.userData.phoneHash) {
        userData.ph = [ev.userData.phoneHash];
      }
      if (ev.userData.clientIp) {
        userData.client_ip_address = ev.userData.clientIp;
      }
      if (ev.userData.clientUserAgent) {
        userData.client_user_agent = ev.userData.clientUserAgent;
      }
      if (ev.userData.fbp) {
        userData.fbp = ev.userData.fbp;
      }
      if (ev.userData.fbc) {
        userData.fbc = ev.userData.fbc;
      }

      const item: Record<string, any> = {
        event_name: ev.eventName,
        event_time: ev.eventTime || Math.floor(Date.now() / 1000),
        event_id: ev.eventId,
        action_source: ev.actionSource || 'website',
        user_data: userData,
      };

      if (ev.eventSourceUrl) {
        item.event_source_url = ev.eventSourceUrl;
      }

      if (ev.customData) {
        item.custom_data = {
          currency: ev.customData.currency || 'USD',
          value: ev.customData.value,
          order_id: ev.customData.orderId,
          contents: ev.customData.contents,
        };
      }

      return item;
    });

    const payload: Record<string, any> = {
      data: formattedEvents,
      access_token: this.config.accessToken,
    };

    if (this.config.testEventCode) {
      payload.test_event_code = this.config.testEventCode;
    }

    try {
      const response = await axios.post(`${this.baseURL}/${this.config.pixelId}/events`, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });

      return {
        success: true,
        eventId: events[0]?.eventId,
        fbtraceId: response.data.fbtrace_id,
        eventsReceived: response.data.events_received,
      };
    } catch (err: any) {
      const detail = err.response?.data?.error?.message || err.message;
      throw new Error(`Meta CAPI upload error: ${detail}`);
    }
  }
}
