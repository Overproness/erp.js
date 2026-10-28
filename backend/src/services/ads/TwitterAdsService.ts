import axios from 'axios';
import { AdTelemetry } from '@/types/marketingProviders';

export interface TwitterAdsConfig {
  accountId: string;
  accessToken?: string;
}

export interface TwitterCampaignPayload {
  name: string;
  objective?: string;
  status?: 'ACTIVE' | 'PAUSED';
  budget?: {
    amount: number;
    type?: 'DAILY' | 'LIFETIME';
    currency?: string;
  };
}

/**
 * TwitterAdsService
 *
 * Implements X (Twitter) Ads API v11 for Promoted Post campaigns:
 * Campaign Management, Daily Budget Scheduling, Status Updates, and Analytics.
 */
export class TwitterAdsService {
  private baseURL = 'https://ads-api.twitter.com/11';
  private config: TwitterAdsConfig;

  constructor(config: TwitterAdsConfig) {
    this.config = config;
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.config.accessToken || ''}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Creates an X (Twitter) Ad Campaign
   */
  async createCampaign(data: TwitterCampaignPayload): Promise<{
    externalCampaignId: string;
    status: string;
  }> {
    if (this.config.accessToken) {
      const dailyBudgetMicro = Math.round((data.budget?.amount || 50) * 1_000_000);
      const payload = {
        name: data.name,
        entity_status: data.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED',
        daily_budget_amount_local_micro: dailyBudgetMicro,
      };

      try {
        const response = await axios.post(
          `${this.baseURL}/accounts/${this.config.accountId}/campaigns`,
          payload,
          { headers: this.getHeaders(), timeout: 15000 }
        );

        const campaignId = response.data?.data?.id || `tw_camp_${Date.now()}`;
        return {
          externalCampaignId: campaignId,
          status: data.status || 'PAUSED',
        };
      } catch (err: any) {
        const msg = err.response?.data?.errors?.[0]?.message || err.message;
        throw new Error(`X Ads campaign creation failed: ${msg}`);
      }
    }

    return {
      externalCampaignId: `tw_camp_${Date.now()}`,
      status: data.status || 'PAUSED',
    };
  }

  /**
   * Toggles campaign status in X Ads
   */
  async toggleCampaignStatus(
    externalCampaignId: string,
    status: 'ACTIVE' | 'PAUSED'
  ): Promise<boolean> {
    if (this.config.accessToken) {
      try {
        await axios.put(
          `${this.baseURL}/accounts/${this.config.accountId}/campaigns/${externalCampaignId}`,
          { entity_status: status },
          { headers: this.getHeaders(), timeout: 15000 }
        );
        return true;
      } catch (err: any) {
        const msg = err.response?.data?.errors?.[0]?.message || err.message;
        throw new Error(`X Ads status update failed: ${msg}`);
      }
    }
    return true;
  }

  /**
   * Pulls performance telemetry from X Ads Stats API
   */
  async getCampaignTelemetry(externalCampaignId: string): Promise<AdTelemetry> {
    if (this.config.accessToken) {
      try {
        const response = await axios.get(
          `${this.baseURL}/stats/accounts/${this.config.accountId}`,
          {
            headers: this.getHeaders(),
            params: {
              entity: 'CAMPAIGN',
              entity_ids: externalCampaignId,
              metric_groups: 'ENGAGEMENT,BILLING',
              granularity: 'TOTAL',
            },
            timeout: 15000,
          }
        );

        const metrics = response.data?.data?.[0]?.id_data?.[0]?.metrics;
        if (!metrics) {
          return { impressions: 0, clicks: 0, spend: 0, conversions: 0, cpc: 0, cpm: 0, ctr: 0, roas: 0 };
        }

        const impressions = Number(metrics.impressions?.[0] || 0);
        const clicks = Number(metrics.clicks?.[0] || 0);
        const billedChargeLocalMicro = Number(metrics.billed_charge_local_micro?.[0] || 0);
        const spend = billedChargeLocalMicro / 1_000_000;
        const conversions = Number(metrics.conversion_purchases?.[0] || 0);
        const cpc = clicks > 0 ? spend / clicks : 0;
        const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
        const ctr = impressions > 0 ? clicks / impressions : 0;
        const roas = spend > 0 ? Number(((conversions * 50) / spend).toFixed(2)) : 0;

        return { impressions, clicks, spend, conversions, cpc, cpm, ctr, roas };
      } catch (err: any) {
        const msg = err.response?.data?.errors?.[0]?.message || err.message;
        throw new Error(`X Ads telemetry fetch failed: ${msg}`);
      }
    }

    return {
      impressions: 0,
      clicks: 0,
      spend: 0,
      conversions: 0,
      cpc: 0,
      cpm: 0,
      ctr: 0,
      roas: 0,
    };
  }
}
