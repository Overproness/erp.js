// @ts-nocheck

import { CustomerBehavior, Campaign, CustomerSegment } from '../../models';
import segmentMatcher from '../../utils/segmentMatcher';
import marketingURLHelper from '../../utils/marketingURLHelper';
import campaignExecutorService from '../../services/campaignExecutorService';
import retargetingEngine from '../../services/RetargetingEngine';
import analyticsService from '../../services/analyticsService';
/**
 * Retargeting Controller
 * Manages retargeting audiences and personalized message delivery
 */
class RetargetingController {
  /**
   * Create a retargeting audience based on behavior
   */
  async createAudience(req, res) {
    try {
      const {
        name,
        description,
        eventType,
        eventCriteria,
        lookbackDays = 30,
        excludeConverted = true,
        maxAudienceSize,
      } = req.body;
      const ownerId = req.companyOwner._id;

      // Validate required fields
      if (!name || !eventType) {
        return res.status(400).json({
          success: false,
          message: 'Audience name and event type are required',
        });
      }

      // Create a new segment for the retargeting audience
      const segment = new CustomerSegment({
        name,
        description: description || `Retargeting audience for ${eventType}`,
        type: 'behavioral',
        criteria: {
          behaviors: [
            {
              eventType,
              ...eventCriteria,
              daysLookback: lookbackDays,
            },
          ],
        },
        source: 'retargeting',
        isDynamic: true,
        maxSize: maxAudienceSize,
        owner: ownerId,
      });

      // If excluding converted users, add exclusion criteria
      if (excludeConverted && req.body.conversionEventType) {
        segment.criteria.exclusions = [
          {
            behaviors: [
              {
                eventType: req.body.conversionEventType,
                daysLookback: lookbackDays,
              },
            ],
          },
        ];
      }

      await segment.save();

      // Process segment immediately to populate it
      const audienceSize = await segmentMatcher.processSegment(segment._id);

      return res.status(201).json({
        success: true,
        message: 'Retargeting audience created successfully',
        data: {
          segment,
          audienceSize,
        },
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
      const { page = 1, limit = 20 } = req.query;
      const ownerId = req.companyOwner._id;

      // Find all retargeting segments
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const segments = await CustomerSegment.find({
        owner: ownerId,
        source: 'retargeting',
        removed: false,
      })
        .sort({ created: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Get total count
      const total = await CustomerSegment.countDocuments({
        owner: ownerId,
        source: 'retargeting',
        removed: false,
      });

      // Get audience sizes
      const audienceSizes = {};
      for (const segment of segments) {
        audienceSizes[segment._id] = await segmentMatcher.getSegmentSize(segment._id);
      }

      return res.status(200).json({
        success: true,
        result: segments.map((segment) => ({
          ...segment,
          audienceSize: audienceSizes[segment._id] || 0,
        })),
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
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
   * Update a retargeting audience
   */
  async updateAudience(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const ownerId = req.companyOwner._id;

      // Find segment
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
