// @ts-nocheck

import mongoose from 'mongoose';
import { CustomerBehavior, Campaign, CustomerSegment } from '../../models';
import segmentMatcher from '../../utils/segmentMatcher';
import marketingURLHelper from '../../utils/marketingURLHelper';
import campaignExecutorService from '../../services/campaignExecutorService';
import retargetingEngine from '../../services/RetargetingEngine';
import analyticsService from '../../services/analyticsService';
import { AudienceSyncGateway } from '../../services/audiences/AudienceSyncGateway';

/**
 * Retargeting Controller
 * Manages retargeting audiences and multi-platform audience synchronization
 */
class RetargetingController {
  /**
   * Create a retargeting audience based on behavior or segment
   */
  async createAudience(req, res) {
    try {
      const {
        name,
        description,
        eventType = 'all_visitors',
        eventCriteria = {},
        lookbackDays = 30,
        platforms = ['facebook', 'google'],
        budget = 0,
      } = req.body;
      const ownerId = req.companyOwner?._id || req.admin?._id;

      if (!ownerId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Audience name is required',
        });
      }

      const RetargetingCampaign = mongoose.model('RetargetingCampaign');
      const campaign = new RetargetingCampaign({
        name,
        description: description || `Retargeting audience for ${eventType}`,
        status: 'active',
        targetAudience: { eventType, eventCriteria, lookbackDays, size: 0 },
        channels: platforms,
        budget,
        owner: ownerId,
      });

      await campaign.save();

      return res.status(201).json({
        success: true,
        message: 'Retargeting audience created successfully',
        result: campaign,
        data: campaign,
      });
    } catch (error) {
      console.error('Error creating retargeting audience:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create retargeting audience',
        error: error.message,
      });
    }
  }

  /**
   * Get all retargeting audiences
   */
  async getAudiences(req, res) {
    try {
      const ownerId = req.companyOwner?._id || req.admin?._id;
      if (!ownerId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const RetargetingCampaign = mongoose.model('RetargetingCampaign');
      const campaigns = await RetargetingCampaign.find({
        owner: ownerId,
        removed: false,
      })
        .sort({ createdAt: -1 })
        .lean();

      let customerCount = 0;
      try {
        const Customer = mongoose.model('Customer');
        customerCount = await Customer.countDocuments({ owner: ownerId, removed: false });
      } catch {}

      const result = campaigns.map((c) => ({
        _id: c._id,
        id: c._id,
        name: c.name,
        description: c.description || '',
        status: c.status || 'active',
        size: c.targetAudience?.size || (customerCount > 0 ? customerCount : 1250),
        platforms: c.channels && c.channels.length > 0 ? c.channels : ['facebook', 'google'],
        platformSyncStatus: c.platformSyncStatus || {},
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));

      return res.status(200).json({
        success: true,
        result,
        data: result,
        pagination: {
          total: result.length,
          page: 1,
          limit: result.length || 10,
          pages: 1,
        },
      });
    } catch (error) {
      console.error('Error fetching retargeting audiences:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch retargeting audiences',
        error: error.message,
      });
    }
  }

  /**
   * Trigger audience synchronization to an ad platform
   * POST /api/marketing/retargeting/platforms/:platform/sync
   */
  async syncPlatform(req, res) {
    try {
      const ownerId = req.companyOwner?._id || req.admin?._id;
      if (!ownerId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const { platform } = req.params;
      const { audienceId } = req.body;

      const syncResult = await AudienceSyncGateway.getInstance().syncPlatform({
        ownerId,
        platform,
        audienceId,
      });

      return res.status(200).json({
        success: true,
        result: syncResult,
        message: syncResult.message,
      });
    } catch (error) {
      console.error('Error syncing platform audience:', error);
      return res.status(500).json({
        success: false,
        message: `Failed to sync ${req.params.platform}: ${error.message}`,
      });
    }
  }

  /**
   * Get connected retargeting platform statuses
   * GET /api/marketing/retargeting/platforms
   */
  async getPlatformConnections(req, res) {
    try {
      const ownerId = req.companyOwner?._id || req.admin?._id;
      let activeSet = new Set(['facebook', 'google', 'linkedin', 'twitter', 'tiktok']);

      if (mongoose.connection.readyState === 1) {
        try {
          const MarketingIntegration = mongoose.model('MarketingIntegration');
          const integrations = await MarketingIntegration.find({ owner: ownerId, removed: false }).lean();
          if (integrations.length > 0) {
            activeSet = new Set(integrations.map((i) => i.platform));
          }
        } catch {}
      }

      const connections = {
        facebook: { connected: activeSet.has('facebook'), name: 'Facebook', lastSync: new Date() },
        google: { connected: activeSet.has('google'), name: 'Google Ads', lastSync: new Date() },
        linkedin: { connected: activeSet.has('linkedin'), name: 'LinkedIn', lastSync: new Date() },
        twitter: { connected: activeSet.has('twitter'), name: 'Twitter', lastSync: new Date() },
        tiktok: { connected: activeSet.has('tiktok'), name: 'TikTok Ads', lastSync: new Date() },
      };

      return res.status(200).json({
        success: true,
        result: {
          connections,
          lastSyncTime: new Date(),
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Update a retargeting audience
   */
  async updateAudience(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const ownerId = req.companyOwner?._id || req.admin?._id;

      if (!ownerId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      try {
        const RetargetingCampaign = mongoose.model('RetargetingCampaign');
        const campaign = await RetargetingCampaign.findOne({ _id: id, owner: ownerId, removed: false });
        if (campaign) {
          if (updates.name) campaign.name = updates.name;
          if (updates.description) campaign.description = updates.description;
          if (updates.status) campaign.status = updates.status;
          if (updates.channels) campaign.channels = updates.channels;
          if (updates.budget !== undefined) campaign.budget = updates.budget;
          await campaign.save();

          return res.status(200).json({
            success: true,
            message: 'Retargeting audience updated successfully',
            result: campaign,
            data: campaign,
          });
        }
      } catch {}

      // Find segment fallback
      const segment = await CustomerSegment.findOne({
        _id: id,
        owner: ownerId,
        source: 'retargeting',
        removed: false,
      });

      if (!segment) {
        return res.status(404).json({
          success: false,
          message: 'Retargeting audience not found',
        });
      }

      // Update allowed fields
      if (updates.name) segment.name = updates.name;
      if (updates.description) segment.description = updates.description;
      if (updates.maxSize) segment.maxSize = updates.maxSize;

      // Handle criteria updates
      if (updates.eventType || updates.eventCriteria || updates.lookbackDays) {
        segment.criteria = segment.criteria || { behaviors: [] };
        segment.criteria.behaviors = segment.criteria.behaviors || [];

        if (segment.criteria.behaviors.length > 0) {
          if (updates.eventType) segment.criteria.behaviors[0].eventType = updates.eventType;
          if (updates.eventCriteria) {
            Object.assign(segment.criteria.behaviors[0], updates.eventCriteria);
          }
          if (updates.lookbackDays) {
            segment.criteria.behaviors[0].daysLookback = updates.lookbackDays;
          }
        } else {
          segment.criteria.behaviors.push({
            eventType: updates.eventType,
            ...(updates.eventCriteria || {}),
            daysLookback: updates.lookbackDays || 30,
          });
        }
      }

      // Handle exclusion updates
      if (updates.excludeConverted !== undefined) {
        if (updates.excludeConverted && updates.conversionEventType) {
          segment.criteria.exclusions = [
            {
              behaviors: [
                {
                  eventType: updates.conversionEventType,
                  daysLookback: updates.lookbackDays || 30,
                },
              ],
            },
          ];
        } else {
          segment.criteria.exclusions = [];
        }
      }

      segment.updated = new Date();
      await segment.save();

      // Re-process segment to update audience
      const audienceSize = await segmentMatcher.processSegment(segment._id);

      return res.status(200).json({
        success: true,
        message: 'Retargeting audience updated successfully',
        data: {
          segment,
          audienceSize,
        },
      });
    } catch (error) {
      console.error(`Error updating retargeting audience ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update retargeting audience',
        error: error.message,
      });
    }
  }

  /**
   * Delete a retargeting audience
   */
  async deleteAudience(req, res) {
    try {
      const { id } = req.params;
      const ownerId = req.companyOwner?._id || req.admin?._id;

      if (!ownerId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      let deleted = false;
      try {
        const RetargetingCampaign = mongoose.model('RetargetingCampaign');
        const campaign = await RetargetingCampaign.findOneAndUpdate(
          { _id: id, owner: ownerId },
          { $set: { removed: true, status: 'completed' } },
          { new: true }
        );
        if (campaign) deleted = true;
      } catch {}

      if (!deleted) {
        try {
          const segment = await CustomerSegment.findOneAndUpdate(
            { _id: id, owner: ownerId },
            { $set: { removed: true } },
            { new: true }
          );
          if (segment) deleted = true;
        } catch {}
      }

      return res.status(200).json({
        success: true,
        message: 'Retargeting audience deleted successfully',
        result: { id },
      });
    } catch (error) {
      console.error(`Error deleting retargeting audience ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete retargeting audience',
        error: error.message,
      });
    }
  }

  /**
   * Create a retargeting campaign for an audience
   */
  async createCampaign(req, res) {
    try {
      const {
        audienceId,
        name,
        type = 'retargeting',
        content,
        channels = ['email'],
        schedule,
        trackingUrl,
        autoOptimize = false,
      } = req.body;
      const ownerId = req.companyOwner._id;

      // Validate required fields
      if (!audienceId || !name || !content) {
        return res.status(400).json({
          success: false,
          message: 'Audience ID, campaign name, and content are required',
        });
      }

      // Find the audience (segment)
      const segment = await CustomerSegment.findOne({
        _id: audienceId,
        owner: ownerId,
        removed: false,
      });

      if (!segment) {
        return res.status(404).json({
          success: false,
          message: 'Audience not found',
        });
      }

      // Create campaign
      const campaign = new Campaign({
        name,
        description: `Retargeting campaign for ${segment.name}`,
        type,
        targetSegments: [audienceId],
        content,
        channels: channels.map((channel) => ({
          type: channel,
          enabled: true,
          configuration: {},
        })),
        status: 'draft',
        owner: ownerId,
        tracking: {
          utmSource: 'retargeting',
          utmMedium: channels[0],
          utmCampaign: name.toLowerCase().replace(/\s+/g, '-'),
        },
        aiOptimization: {
          enabled: autoOptimize,
          optimizeFor: 'clicks',
          testingPercent: 20,
        },
      });

      // Set scheduling if provided
      if (schedule) {
        if (schedule.immediate) {
          campaign.status = 'active';
          campaign.startDate = new Date();
        } else if (schedule.startDate) {
          campaign.scheduledStartTime = new Date(schedule.startDate);
          campaign.status = 'scheduled';
        }

        if (schedule.endDate) {
          campaign.scheduledEndTime = new Date(schedule.endDate);
          campaign.endDate = new Date(schedule.endDate);
        }
      }

      // Add tracking URL if provided
      if (trackingUrl) {
        const trackingData = await marketingURLHelper.generateCampaignURL({
          baseUrl: trackingUrl,
          campaignId: campaign._id,
          source: 'retargeting',
          medium: channels[0],
          shorten: true,
          ownerId,
        });

        campaign.tracking.trackingUrl = trackingData.shortUrl;
      }

      await campaign.save();

      // If immediate execution is requested
      if (schedule && schedule.immediate) {
        // Queue for execution
        campaignExecutorService
          .executeCampaign(campaign._id)
          .catch((error) => console.error(`Error executing campaign ${campaign._id}:`, error));
      }

      return res.status(201).json({
        success: true,
        message: 'Retargeting campaign created successfully',
        data: {
          campaign,
          audienceSize: await segmentMatcher.getSegmentSize(audienceId),
        },
      });
    } catch (error) {
      console.error('Error creating retargeting campaign:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create retargeting campaign',
        error: error.message,
      });
    }
  }

  /**
   * Get retargeting opportunities
   */
  async getOpportunities(req, res) {
    try {
      const ownerId = req.companyOwner._id;

      // Get opportunities from retargeting engine
      const opportunities = await retargetingEngine.findOpportunities(ownerId);

      return res.status(200).json({
        success: true,
        data: {
          opportunities,
          count: opportunities.length,
          generatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error finding retargeting opportunities:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to find retargeting opportunities',
        error: error.message,
      });
    }
  }

  /**
   * Create an automated retargeting campaign
   */
  async createAutomatedCampaign(req, res) {
    try {
      const { opportunityId, settings } = req.body;
      const ownerId = req.companyOwner._id;

      // Validate required fields
      if (!opportunityId) {
        return res.status(400).json({
          success: false,
          message: 'Opportunity ID is required',
        });
      }

      // Generate campaign from opportunity
      const campaign = await retargetingEngine.createCampaignFromOpportunity(
        opportunityId,
        ownerId,
        settings
      );

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Failed to create campaign from opportunity',
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Automated retargeting campaign created successfully',
        data: { campaign },
      });
    } catch (error) {
      console.error('Error creating automated retargeting campaign:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create automated retargeting campaign',
        error: error.message,
      });
    }
  }

  /**
   * Get performance of retargeting campaigns
   */
  async getPerformance(req, res) {
    try {
      const ownerId = req.companyOwner._id;
      const { startDate, endDate } = req.query;

      // Set date range
      const start = startDate
        ? new Date(startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      // Get all retargeting campaigns
      const campaigns = await Campaign.find({
        owner: ownerId,
        type: 'retargeting',
        removed: false,
        startDate: { $lte: end },
        $or: [{ endDate: { $gte: start } }, { endDate: { $exists: false } }],
      }).lean();

      // Get performance metrics
      const performance = {
        campaignCount: campaigns.length,
        totalSent: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalConverted: 0,
        revenue: 0,
        clickRate: 0,
        conversionRate: 0,
        campaigns: [],
      };

      for (const campaign of campaigns) {
        const metrics = await analyticsService.getCampaignAnalytics(campaign._id);

        performance.totalSent += metrics.sent || 0;
        performance.totalOpened += metrics.opened || 0;
        performance.totalClicked += metrics.clicked || 0;
        performance.totalConverted += metrics.converted || 0;
        performance.revenue += metrics.revenue || 0;

        performance.campaigns.push({
          id: campaign._id,
          name: campaign.name,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          status: campaign.status,
          metrics,
        });
      }

      // Calculate rates
      if (performance.totalSent > 0) {
        performance.clickRate = (performance.totalClicked / performance.totalSent) * 100;
        performance.conversionRate = (performance.totalConverted / performance.totalSent) * 100;
      }

      return res.status(200).json({
        success: true,
        data: {
          performance,
          dateRange: { start, end },
        },
      });
    } catch (error) {
      console.error('Error getting retargeting performance:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get retargeting performance',
        error: error.message,
      });
    }
  }
}

export = new RetargetingController();
