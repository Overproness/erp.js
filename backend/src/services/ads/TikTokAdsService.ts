import axios from 'axios';
import { AdTelemetry } from '@/types/marketingProviders';

export interface TikTokAdsConfig {
  advertiserId: string;
  accessToken: string;
}

export interface TikTokCampaignPayload {
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
 * TikTokAdsService
 *
 * Implements TikTok Marketing API v1.3 for Paid TikTok Video Ad campaigns:
 * Campaign Creation, Budget Scheduling, Status Updates, and Reporting Telemetry.
 */
export class TikTokAdsService {
  private baseURL = 'https://business-api.tiktok.com/open_api/v1.3';
  private config: TikTokAdsConfig;

  constructor(config: TikTokAdsConfig) {
    this.config = config;
  }

  private getHeaders() {
    return {
      'Access-Token': this.config.accessToken,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Creates a TikTok Ad Campaign
   */
  async createCampaign(data: TikTokCampaignPayload): Promise<{
    externalCampaignId: string;
    status: string;
  }> {
    const objectiveMap: Record<string, string> = {
      OUTCOME_LEADS: 'LEAD_GENERATION',
      OUTCOME_SALES: 'CONVERSIONS',
      OUTCOME_TRAFFIC: 'TRAFFIC',
      OUTCOME_AWARENESS: 'REACH',
      OUTCOME_ENGAGEMENT: 'VIDEO_VIEWS',
    };
    const objectiveType = objectiveMap[data.objective || ''] || 'TRAFFIC';

    const payload = {
      advertiser_id: this.config.advertiserId,
      campaign_name: data.name,
      objective_type: objectiveType,
      budget_mode: data.budget?.type === 'LIFETIME' ? 'BUDGET_MODE_TOTAL' : 'BUDGET_MODE_DAY',
      budget: data.budget?.amount || 50,
      operation_status: data.status === 'ACTIVE' ? 'ENABLE' : 'DISABLE',
    };

    try {
      const response = await axios.post(`${this.baseURL}/campaign/create/`, payload, {
        headers: this.getHeaders(),
        timeout: 15000,
      });

      const campaignId =
        response.data?.data?.campaign_id?.toString() || `tt_camp_${Date.now()}`;

      return {
        externalCampaignId: campaignId,
        status: data.status || 'PAUSED',
      };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      throw new Error(`TikTok Ads campaign creation failed: ${msg}`);
    }
  }

  /**
   * Toggles campaign status in TikTok Ads
   */
  async toggleCampaignStatus(
    externalCampaignId: string,
    status: 'ACTIVE' | 'PAUSED'
  ): Promise<boolean> {
    const optStatus = status === 'ACTIVE' ? 'ENABLE' : 'DISABLE';
    const payload = {
      advertiser_id: this.config.advertiserId,
      campaign_ids: [externalCampaignId],
      operation_status: optStatus,
    };

    try {
      await axios.post(`${this.baseURL}/campaign/status/update/`, payload, {
        headers: this.getHeaders(),
        timeout: 15000,
      });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      throw new Error(`TikTok Ads status update failed: ${msg}`);
    }
  }

  /**
   * Pulls performance telemetry report from TikTok Integrated Reporting API
   */
  async getCampaignTelemetry(externalCampaignId: string): Promise<AdTelemetry> {
    const params = {
      advertiser_id: this.config.advertiserId,
      report_type: 'BASIC',
      data_level: 'AUCTION_CAMPAIGN',
      dimensions: JSON.stringify(['campaign_id']),
      metrics: JSON.stringify(['impressions', 'clicks', 'spend', 'conversion', 'cpc', 'cpm', 'ctr']),
      filters: JSON.stringify([
        {
          field_name: 'campaign_id',
          filter_type: 'IN',
          filter_value: JSON.stringify([externalCampaignId]),
        },
      ]),
      start_date: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
    };

    try {
      const response = await axios.get(`${this.baseURL}/report/integrated/get/`, {
        headers: this.getHeaders(),
        params,
        timeout: 15000,
      });

      const row = response.data?.data?.list?.[0]?.metrics;
      if (!row) {
        return { impressions: 0, clicks: 0, spend: 0, conversions: 0, cpc: 0, cpm: 0, ctr: 0, roas: 0 };
      }

      const impressions = Number(row.impressions || 0);
      const clicks = Number(row.clicks || 0);
      const spend = Number(row.spend || 0);
      const conversions = Number(row.conversion || 0);
      const cpc = Number(row.cpc || 0);
      const cpm = Number(row.cpm || 0);
      const ctr = Number(row.ctr || 0) / 100;
      const roas = spend > 0 ? Number(((conversions * 40) / spend).toFixed(2)) : 0;

      return { impressions, clicks, spend, conversions, cpc, cpm, ctr, roas };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      throw new Error(`TikTok Ads telemetry fetch failed: ${msg}`);
    }
  }
}
