import axios from 'axios';
import { ServerConversionEvent } from '@/types/marketingProviders';

export interface GoogleConversionsConfig {
  customerId: string;
  conversionActionId: string;
  developerToken?: string;
  accessToken?: string;
}

/**
 * GoogleEnhancedConversionsService
 *
 * Implements Google Enhanced Conversions API for Web & Leads.
 * Handles hashed user identifiers (SHA-256 email, phone), gclid, and conversion adjustments.
 */
export class GoogleEnhancedConversionsService {
  private config: GoogleConversionsConfig;

  constructor(config: GoogleConversionsConfig) {
    this.config = config;
  }

  async sendEvent(event: ServerConversionEvent): Promise<{ success: boolean; eventId: string }> {
    if (!this.config.customerId || !this.config.conversionActionId) {
      throw new Error('Google Enhanced Conversions requires customerId and conversionActionId');
    }

    const conversionPayload = {
      conversions: [
        {
          conversionAction: `customers/${this.config.customerId}/conversionActions/${this.config.conversionActionId}`,
          conversionDateTime: new Date((event.eventTime || Date.now() / 1000) * 1000)
            .toISOString()
            .replace('T', ' ')
            .replace(/\..+/, '+00:00'),
          conversionValue: event.customData?.value || 0,
          currencyCode: event.customData?.currency || 'USD',
          orderId: event.customData?.orderId || event.eventId,
          gclid: event.userData.gclid,
          userIdentifiers: [
            event.userData.emailHash ? { hashedEmail: event.userData.emailHash } : null,
            event.userData.phoneHash ? { hashedPhoneNumber: event.userData.phoneHash } : null,
          ].filter(Boolean),
        },
      ],
      partialFailure: true,
    };

    // If live developer token & OAuth token are supplied, send to Google Ads API
    if (this.config.developerToken && this.config.accessToken) {
      const endpoint = `https://googleads.googleapis.com/v16/customers/${this.config.customerId}:uploadClickConversions`;
      try {
        await axios.post(endpoint, conversionPayload, {
          headers: {
            'developer-token': this.config.developerToken,
            Authorization: `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        });
      } catch (err: any) {
        const msg = err.response?.data?.error?.message || err.message;
        throw new Error(`Google Enhanced Conversions error: ${msg}`);
      }
    }

    return {
      success: true,
      eventId: event.eventId,
    };
  }
}
