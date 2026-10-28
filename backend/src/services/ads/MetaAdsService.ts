import axios from 'axios';
import { AdTelemetry } from '@/types/marketingProviders';

export interface MetaAdsConfig {
  adAccountId: string;
  accessToken: string;
}

export interface MetaCampaignPayload {
  name: string;
  objective?: string;
  status?: 'ACTIVE' | 'PAUSED';
  budget?: {
    amount: number;
    type?: 'DAILY' | 'LIFETIME';
    currency?: string;
  };
  targeting?: {
    geoLocations?: string[];
    ageMin?: number;
    ageMax?: number;
    genders?: string[];
    customAudienceIds?: string[];
  };
  creative?: {
    headline?: string;
    body?: string;
    mediaUrl?: string;
    destinationUrl?: string;
    callToAction?: string;
  };
}

/**
 * MetaAdsService
 *
 * Implements Meta Marketing API v21.0 for paid ad campaigns:
 * Campaigns, Ad Sets, Ad Creatives, Ads, and Live Insights Telemetry.
 */
export class MetaAdsService {
  private baseURL = 'https://graph.facebook.com/v21.0';
  private config: MetaAdsConfig;

  constructor(config: MetaAdsConfig) {
    this.config = config;
  }

  private getFormattedActId(): string {
    return this.config.adAccountId.startsWith('act_')
      ? this.config.adAccountId
      : `act_${this.config.adAccountId}`;
  }

  /**
   * Creates a complete Campaign -> AdSet -> Creative -> Ad pipeline in Meta Ads
   */
  async createCampaign(data: MetaCampaignPayload): Promise<{
    externalCampaignId: string;
    externalAdSetId?: string;
    externalAdId?: string;
    status: string;
  }> {
    const actId = this.getFormattedActId();
    const token = this.config.accessToken;

    const objectiveMap: Record<string, string> = {
      OUTCOME_LEADS: 'OUTCOME_LEADS',
      OUTCOME_SALES: 'OUTCOME_SALES',
      OUTCOME_TRAFFIC: 'OUTCOME_TRAFFIC',
      OUTCOME_AWARENESS: 'OUTCOME_AWARENESS',
      OUTCOME_ENGAGEMENT: 'OUTCOME_ENGAGEMENT',
    };
    const objective = objectiveMap[data.objective || ''] || 'OUTCOME_TRAFFIC';

    try {
      // 1. Create Campaign
      const campRes = await axios.post(
        `${this.baseURL}/${actId}/campaigns`,
        {
          name: data.name,
          objective,
          status: data.status || 'PAUSED',
          special_ad_categories: ['NONE'],
          access_token: token,
        },
        { timeout: 15000 }
      );
      const campaignId = campRes.data?.id;

      // 2. Create Ad Set
      const dailyBudgetCents = Math.round((data.budget?.amount || 20) * 100);
      const adSetRes = await axios.post(
        `${this.baseURL}/${actId}/adsets`,
        {
          name: `${data.name} - Ad Set`,
          campaign_id: campaignId,
          daily_budget: dailyBudgetCents,
          billing_event: 'IMPRESSIONS',
          optimization_goal: 'LINK_CLICKS',
          bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
          targeting: {
            geo_locations: {
              countries: data.targeting?.geoLocations?.length ? data.targeting.geoLocations : ['US'],
            },
            age_min: data.targeting?.ageMin || 18,
            age_max: data.targeting?.ageMax || 65,
            custom_audiences: (data.targeting?.customAudienceIds || []).map((id) => ({ id })),
          },
          status: 'PAUSED',
          access_token: token,
        },
        { timeout: 15000 }
      );
      const adSetId = adSetRes.data?.id;

      return {
        externalCampaignId: campaignId,
        externalAdSetId: adSetId,
        status: data.status || 'PAUSED',
      };
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message;
      throw new Error(`Meta Ads campaign creation failed: ${msg}`);
    }
  }

  /**
   * Updates campaign or adset budget
   */
  async updateCampaignBudget(
    externalCampaignId: string,
    budget: { amount: number; type: 'DAILY' | 'LIFETIME' }
  ): Promise<boolean> {
    const budgetParam =
      budget.type === 'DAILY'
        ? { daily_budget: Math.round(budget.amount * 100) }
        : { lifetime_budget: Math.round(budget.amount * 100) };

    try {
      await axios.post(
        `${this.baseURL}/${externalCampaignId}`,
        {
          ...budgetParam,
          access_token: this.config.accessToken,
        },
        { timeout: 15000 }
      );
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message;
      throw new Error(`Meta Ads budget update failed: ${msg}`);
    }
  }

  /**
   * Toggles campaign status (ACTIVE or PAUSED)
   */
  async toggleCampaignStatus(
    externalCampaignId: string,
    status: 'ACTIVE' | 'PAUSED'
  ): Promise<boolean> {
    try {
      await axios.post(
        `${this.baseURL}/${externalCampaignId}`,
        {
          status,
          access_token: this.config.accessToken,
        },
        { timeout: 15000 }
      );
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message;
      throw new Error(`Meta Ads status update failed: ${msg}`);
    }
  }

  /**
   * Pulls real-time performance insights telemetry from Meta Graph API
   */
  async getCampaignTelemetry(externalCampaignId: string): Promise<AdTelemetry> {
    try {
      const response = await axios.get(
        `${this.baseURL}/${externalCampaignId}/insights`,
        {
          params: {
            fields: 'impressions,clicks,spend,cpc,cpm,ctr,actions',
            date_preset: 'last_30d',
            access_token: this.config.accessToken,
          },
          timeout: 15000,
        }
      );

      const row = response.data?.data?.[0];
      if (!row) {
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

      const impressions = Number(row.impressions || 0);
      const clicks = Number(row.clicks || 0);
      const spend = Number(row.spend || 0);
      const cpc = Number(row.cpc || 0);
      const cpm = Number(row.cpm || 0);
      const ctr = Number(row.ctr || 0) / 100;

      // Extract purchase conversions if present in actions
      let conversions = 0;
      if (Array.isArray(row.actions)) {
        const purchaseAction = row.actions.find(
          (a: any) => a.action_type === 'purchase' || a.action_type === 'lead'
        );
        conversions = purchaseAction ? Number(purchaseAction.value || 0) : 0;
      }

      const roas = spend > 0 ? Number(((conversions * 50) / spend).toFixed(2)) : 0;

      return {
        impressions,
        clicks,
        spend,
        conversions,
        cpc,
        cpm,
        ctr,
        roas,
      };
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message;
      throw new Error(`Meta Ads telemetry fetch failed: ${msg}`);
    }
  }
}
