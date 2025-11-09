const { Campaign, CustomerSegment } = require('../../../models');
const campaignExecutorService = require('../../../services/campaignExecutorService');
const campaignScheduler = require('../../../utils/campaignScheduler');
const marketingURLHelper = require('../../../utils/marketingURLHelper');
const analyticsService = require('../../../services/analyticsService');
const aiOptimizer = require('../../../services/AIOptimizer');
const channels = require('../../../config/channels');
const { getCurrentUserId } = require('../../../utils/authUtils');

/**
 * Campaign Controller
 * Orchestrates multi-channel campaign execution and optimization
 */
class CampaignController {
  /**
   * Create a new marketing campaign
   */
  async create(req, res) {
    try {
      const ownerId = getCurrentUserId(req);
      const campaignData = req.body;

      // Validate required fields
      if (!campaignData.name || !campaignData.type) {
        return res.status(400).json({
          success: false,
          message: 'Campaign name and type are required',
        });
      }

      // Validate campaign type
      const validTypes = ['email', 'sms', 'push', 'social', 'retargeting', 'multi_channel'];
      if (!validTypes.includes(campaignData.type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid campaign type. Must be one of: ${validTypes.join(', ')}`,
        });
      }

      // Create campaign
      const campaign = new Campaign({
        ...campaignData,
        owner: ownerId,
        status: 'draft',
        created: new Date(),
      });

      // Generate tracking URLs if applicable
      if (campaignData.trackingUrl) {
        campaign.tracking = {
          ...campaign.tracking,
          ...(await marketingURLHelper.generateCampaignTracking(campaign)),
        };
      }

      await campaign.save();

      return res.status(201).json({
        success: true,
        message: 'Campaign created successfully',
        data: campaign,
      });
    } catch (error) {
      console.error('Campaign creation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create campaign',
        error: error.message,
      });
    }
  }

  /**
   * Get all campaigns for current user
   */
  async getAll(req, res) {
    try {
      const ownerId = getCurrentUserId(req);
      const {
        page = 1,
        limit = 20,
        status,
        type,
        search,
        sortBy = 'created',
        sortOrder = -1,
      } = req.query;

      // Build query
      const query = { owner: ownerId, removed: false };

      if (status) query.status = status;
      if (type) query.type = type;

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Execute query
      const campaigns = await Campaign.find(query)
        .sort({ [sortBy]: parseInt(sortOrder) })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Get total count for pagination
      const total = await Campaign.countDocuments(query);

      // Disable caching to prevent 304 responses
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      return res.status(200).json({
        success: true,
        data: {
          campaigns,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch campaigns',
        error: error.message,
      });
    }
  }

  /**
   * Get a single campaign by ID
   */
  async getOne(req, res) {
    try {
      const { id } = req.params;
      const ownerId = req.admin._id;

      const campaign = await Campaign.findOne({
        _id: id,
        owner: ownerId,
        removed: false,
      })
        .populate('targetSegments')
        .lean();

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found',
        });
      }

      // Get campaign performance metrics
      const metrics = await analyticsService.getCampaignAnalytics(id);

      return res.status(200).json({
        success: true,
        data: {
          ...campaign,
          metrics,
        },
      });
    } catch (error) {
      console.error(`Error fetching campaign ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch campaign',
        error: error.message,
      });
    }
  }

  /**
   * Update an existing campaign
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const ownerId = req.admin._id;
      const updates = req.body;

      // Find campaign
      const campaign = await Campaign.findOne({
        _id: id,
        owner: ownerId,
        removed: false,
      });

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found',
        });
      }

      // Restrict updates based on campaign status
      if (campaign.status === 'active' || campaign.status === 'completed') {
        const allowedUpdates = ['status', 'description', 'endDate'];

        // Filter out disallowed fields
        Object.keys(updates).forEach((key) => {
          if (!allowedUpdates.includes(key)) {
            delete updates[key];
          }
        });
      }

      // Apply updates
      Object.assign(campaign, updates);
      campaign.updated = new Date();

      // If changing status to active, ensure required fields
      if (updates.status === 'active' && campaign.status === 'active') {
        if (!campaign.startDate) {
          return res.status(400).json({
            success: false,
            message: 'Start date is required to activate campaign',
          });
        }

        // Update tracking information if needed
        if (campaign.tracking && campaign.tracking.utmCampaign) {
          await marketingURLHelper.updateCampaignTracking(campaign);
        }
      }

      await campaign.save();

      return res.status(200).json({
        success: true,
        message: 'Campaign updated successfully',
        data: campaign,
      });
    } catch (error) {
      console.error(`Error updating campaign ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update campaign',
        error: error.message,
      });
    }
  }

  /**
   * Delete a campaign
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const ownerId = req.admin._id;

      // Find campaign
      const campaign = await Campaign.findOne({
        _id: id,
        owner: ownerId,
        removed: false,
      });

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found',
        });
      }

      // Don't allow deleting active campaigns
      if (campaign.status === 'active') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete an active campaign. Please pause it first.',
        });
      }

      // Soft delete
      campaign.removed = true;
      campaign.updated = new Date();
      await campaign.save();

      return res.status(200).json({
        success: true,
        message: 'Campaign deleted successfully',
      });
    } catch (error) {
      console.error(`Error deleting campaign ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete campaign',
        error: error.message,
      });
    }
  }

  /**
   * Start a campaign
   */
  async start(req, res) {
    try {
      const { id } = req.params;
      const ownerId = req.admin._id;

      // Find campaign
      const campaign = await Campaign.findOne({
        _id: id,
        owner: ownerId,
        removed: false,
      });

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found',
        });
      }

      // Validate campaign can be started
      if (campaign.status === 'active') {
        return res.status(400).json({
          success: false,
          message: 'Campaign is already active',
        });
      }

      if (campaign.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Completed campaigns cannot be restarted',
        });
      }

      // Set campaign as active
      campaign.status = 'active';
      campaign.startDate = campaign.startDate || new Date();
      campaign.updated = new Date();

      // Generate tracking URLs if not already done
      if (campaign.trackingUrl && (!campaign.tracking || !campaign.tracking.utmCampaign)) {
        campaign.tracking = {
          ...campaign.tracking,
          ...(await marketingURLHelper.generateCampaignTracking(campaign)),
        };
      }

      await campaign.save();

      // Begin execution if immediate or scheduled for today
      const shouldExecuteNow =
        !campaign.scheduledStartTime || new Date(campaign.scheduledStartTime) <= new Date();

      if (shouldExecuteNow) {
        // Queue the campaign for execution
        campaignExecutorService
          .executeCampaign(campaign._id)
          .catch((error) => console.error(`Error executing campaign ${campaign._id}:`, error));
      }

      return res.status(200).json({
        success: true,
        message: 'Campaign started successfully',
        data: campaign,
      });
    } catch (error) {
      console.error(`Error starting campaign ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to start campaign',
        error: error.message,
      });
    }
  }

  /**
   * Pause a campaign
   */
  async pause(req, res) {
    try {
      const { id } = req.params;
      const ownerId = req.admin._id;

      // Find campaign
      const campaign = await Campaign.findOne({
        _id: id,
        owner: ownerId,
        removed: false,
        status: 'active',
      });

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Active campaign not found',
        });
      }

      // Update status
      campaign.status = 'paused';
      campaign.updated = new Date();
      campaign.pausedAt = new Date();
      await campaign.save();

      return res.status(200).json({
        success: true,
        message: 'Campaign paused successfully',
        data: campaign,
      });
    } catch (error) {
      console.error(`Error pausing campaign ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to pause campaign',
        error: error.message,
      });
    }
  }

  /**
   * Schedule a campaign for future execution
   */
  async schedule(req, res) {
    try {
      const { id } = req.params;
      const { scheduledStartTime, scheduledEndTime } = req.body;
      const ownerId = req.admin._id;

      if (!scheduledStartTime) {
        return res.status(400).json({
          success: false,
          message: 'Scheduled start time is required',
        });
      }

      // Find campaign
      const campaign = await Campaign.findOne({
        _id: id,
        owner: ownerId,
        removed: false,
      });

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found',
        });
      }

      if (campaign.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Completed campaigns cannot be rescheduled',
        });
      }

      // Update scheduling
      campaign.scheduledStartTime = new Date(scheduledStartTime);
      if (scheduledEndTime) {
        campaign.scheduledEndTime = new Date(scheduledEndTime);
      }
      campaign.status = 'scheduled';
      campaign.updated = new Date();
      await campaign.save();

      return res.status(200).json({
        success: true,
        message: 'Campaign scheduled successfully',
        data: campaign,
      });
    } catch (error) {
      console.error(`Error scheduling campaign ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to schedule campaign',
        error: error.message,
      });
    }
  }

  /**
   * Optimize campaign performance using AI
   */
  async optimize(req, res) {
    try {
      const { id } = req.params;
      const { optimizationTarget, testPercentage } = req.body;
      const ownerId = req.admin._id;

      // Find campaign
      const campaign = await Campaign.findOne({
        _id: id,
        owner: ownerId,
        removed: false,
        status: 'active',
      });

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Active campaign not found',
        });
      }

      // Enable AI optimization
      campaign.aiOptimization = {
        enabled: true,
        optimizeFor: optimizationTarget || 'clicks',
        testingPercent: testPercentage || 10,
        lastUpdated: new Date(),
      };

      await campaign.save();

      // Request AI optimization service to optimize the campaign
      aiOptimizer
        .optimizeCampaign(campaign._id)
        .catch((error) =>
          console.error(`Error in AI optimization for campaign ${campaign._id}:`, error)
        );

      return res.status(200).json({
        success: true,
        message: 'Campaign optimization enabled successfully',
        data: {
          aiOptimization: campaign.aiOptimization,
        },
      });
    } catch (error) {
      console.error(`Error optimizing campaign ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to optimize campaign',
        error: error.message,
      });
    }
  }

  /**
   * Duplicate an existing campaign
   */
  async duplicate(req, res) {
    try {
      const { id } = req.params;
      const ownerId = req.admin._id;

      // Find original campaign
      const originalCampaign = await Campaign.findOne({
        _id: id,
        owner: ownerId,
        removed: false,
      });

      if (!originalCampaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found',
        });
      }

      // Create duplicate campaign
      const duplicateCampaign = new Campaign({
        name: `Copy of ${originalCampaign.name}`,
        description: originalCampaign.description,
        type: originalCampaign.type,
        content: originalCampaign.content,
        targetSegments: originalCampaign.targetSegments,
        excludeSegments: originalCampaign.excludeSegments,
        channels: originalCampaign.channels,
        tracking: {
          ...originalCampaign.tracking,
          utmCampaign: undefined, // Will be regenerated
        },
        owner: ownerId,
        status: 'draft',
        created: new Date(),
        updated: new Date(),
      });

      await duplicateCampaign.save();

      return res.status(200).json({
        success: true,
        message: 'Campaign duplicated successfully',
        data: duplicateCampaign,
      });
    } catch (error) {
      console.error(`Error duplicating campaign ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to duplicate campaign',
        error: error.message,
      });
    }
  }

  /**
   * Get comprehensive campaign analytics
   */
  async getAnalytics(req, res) {
    try {
      const { id } = req.params;
      const { dateRange = 'all', metrics = 'all', granularity = 'daily' } = req.query;
      const ownerId = req.admin._id;

      // Find campaign
      const campaign = await Campaign.findOne({
        _id: id,
        owner: ownerId,
        removed: false,
      }).populate('targetSegments');

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found',
        });
      }

      // Calculate analytics
      const analytics = {
        overview: {
          campaignId: campaign._id,
          campaignName: campaign.name,
          campaignType: campaign.type,
          status: campaign.status,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          duration: campaign.endDate
            ? Math.ceil(
                (new Date(campaign.endDate) - new Date(campaign.startDate)) / (1000 * 60 * 60 * 24)
              )
            : null,
        },
        metrics: {
          totalSent: campaign.metrics.sent || 0,
          totalDelivered: campaign.metrics.delivered || 0,
          totalOpened: campaign.metrics.opened || 0,
          totalClicked: campaign.metrics.clicked || 0,
          totalConverted: campaign.metrics.converted || 0,
          totalBounced: campaign.metrics.bounced || 0,
          totalUnsubscribed: campaign.metrics.unsubscribed || 0,
          totalRevenue: campaign.metrics.revenue || 0,
        },
        rates: {
          deliveryRate:
            campaign.metrics.sent > 0
              ? (((campaign.metrics.delivered || 0) / campaign.metrics.sent) * 100).toFixed(2)
              : 0,
          openRate:
            campaign.metrics.sent > 0
              ? (((campaign.metrics.opened || 0) / campaign.metrics.sent) * 100).toFixed(2)
              : 0,
          clickRate:
            campaign.metrics.sent > 0
              ? (((campaign.metrics.clicked || 0) / campaign.metrics.sent) * 100).toFixed(2)
              : 0,
          conversionRate:
            campaign.metrics.sent > 0
              ? (((campaign.metrics.converted || 0) / campaign.metrics.sent) * 100).toFixed(2)
              : 0,
          bounceRate:
            campaign.metrics.sent > 0
              ? (((campaign.metrics.bounced || 0) / campaign.metrics.sent) * 100).toFixed(2)
              : 0,
          unsubscribeRate:
            campaign.metrics.sent > 0
              ? (((campaign.metrics.unsubscribed || 0) / campaign.metrics.sent) * 100).toFixed(2)
              : 0,
        },
        performance: {
          effectiveness: campaign.effectiveness || 0,
          roi:
            campaign.metrics.revenue && campaign.budget
              ? (((campaign.metrics.revenue - campaign.budget) / campaign.budget) * 100).toFixed(2)
              : 0,
          costPerConversion:
            campaign.metrics.converted > 0 && campaign.budget
              ? (campaign.budget / campaign.metrics.converted).toFixed(2)
              : 0,
          averageOrderValue:
            campaign.metrics.converted > 0
              ? ((campaign.metrics.revenue || 0) / campaign.metrics.converted).toFixed(2)
              : 0,
        },
        channelBreakdown: campaign.channels.map((channel) => ({
          type: channel.type,
          enabled: channel.enabled,
          deliveryOrder: channel.deliveryOrder,
          // Channel-specific metrics would be calculated here
          sent: Math.floor((campaign.metrics.sent || 0) / campaign.channels.length),
          opened: Math.floor((campaign.metrics.opened || 0) / campaign.channels.length),
          clicked: Math.floor((campaign.metrics.clicked || 0) / campaign.channels.length),
        })),
        segmentPerformance: campaign.targetSegments.map((segment) => ({
          segmentId: segment._id,
          segmentName: segment.name,
          // Segment-specific metrics would be calculated here
          sent: Math.floor((campaign.metrics.sent || 0) / campaign.targetSegments.length),
          opened: Math.floor((campaign.metrics.opened || 0) / campaign.targetSegments.length),
          clicked: Math.floor((campaign.metrics.clicked || 0) / campaign.targetSegments.length),
        })),
        abTesting: campaign.aiOptimization?.enabled
          ? {
              enabled: true,
              optimizeFor: campaign.aiOptimization.optimizeFor,
              variants: campaign.aiOptimization.variants || [],
              winningVariant: campaign.aiOptimization.winningVariant,
            }
          : { enabled: false },
        lastUpdated: campaign.metrics.lastUpdated || campaign.updated,
      };

      return res.status(200).json({
        success: true,
        message: 'Campaign analytics retrieved successfully',
        data: analytics,
      });
    } catch (error) {
      console.error(`Error getting analytics for campaign ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get campaign analytics',
        error: error.message,
      });
    }
  }

  /**
   * Generate campaign report
   */
  async generateReport(req, res) {
    try {
      const { id } = req.params;
      const {
        format = 'json',
        includeCharts = false,
        sections = 'all',
        dateRange = 'all',
      } = req.body;
      const ownerId = req.admin._id;

      // Find campaign
      const campaign = await Campaign.findOne({
        _id: id,
        owner: ownerId,
        removed: false,
      }).populate('targetSegments');

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found',
        });
      }

      // Generate comprehensive report
      const report = {
        reportMetadata: {
          campaignId: campaign._id,
          campaignName: campaign.name,
          generatedAt: new Date(),
          generatedBy: ownerId,
          format,
          dateRange,
        },
        executiveSummary: {
          campaignOverview: {
            name: campaign.name,
            type: campaign.type,
            status: campaign.status,
            duration: campaign.endDate
              ? Math.ceil(
                  (new Date(campaign.endDate) - new Date(campaign.startDate)) /
                    (1000 * 60 * 60 * 24)
                )
              : 'Ongoing',
            budget: campaign.budget || 'Not specified',
          },
          keyMetrics: {
            totalReach: campaign.metrics.sent || 0,
            engagementRate:
              campaign.metrics.sent > 0
                ? (
                    (((campaign.metrics.opened || 0) + (campaign.metrics.clicked || 0)) /
                      campaign.metrics.sent) *
                    100
                  ).toFixed(2)
                : 0,
            conversionRate:
              campaign.metrics.sent > 0
                ? (((campaign.metrics.converted || 0) / campaign.metrics.sent) * 100).toFixed(2)
                : 0,
            roi:
              campaign.metrics.revenue && campaign.budget
                ? (((campaign.metrics.revenue - campaign.budget) / campaign.budget) * 100).toFixed(
                    2
                  )
                : 'N/A',
          },
          recommendations: [
            // AI-powered recommendations would be generated here
            'Continue with current strategy - showing positive results',
            'Consider A/B testing subject lines for improved open rates',
            'Optimize send times based on audience behavior patterns',
          ],
        },
        detailedAnalytics: {
          performanceMetrics: {
            sent: campaign.metrics.sent || 0,
            delivered: campaign.metrics.delivered || 0,
            opened: campaign.metrics.opened || 0,
            clicked: campaign.metrics.clicked || 0,
            converted: campaign.metrics.converted || 0,
            bounced: campaign.metrics.bounced || 0,
            unsubscribed: campaign.metrics.unsubscribed || 0,
            revenue: campaign.metrics.revenue || 0,
          },
          channelAnalysis: campaign.channels.map((channel) => ({
            channel: channel.type,
            configuration: channel.configuration,
            performance: {
              // Channel-specific performance metrics
              effectiveness: 'High', // Would be calculated
              recommendedOptimizations: [],
            },
          })),
          audienceInsights: {
            totalTargeted: campaign.targetSegments.length,
            segmentPerformance: campaign.targetSegments.map((segment) => ({
              segmentName: segment.name,
              segmentSize: segment.customerCount || 0,
              engagementLevel: 'Medium', // Would be calculated
            })),
          },
          timeAnalysis: {
            bestPerformingDays: ['Tuesday', 'Thursday'], // Would be calculated from data
            bestPerformingTimes: ['10:00 AM', '2:00 PM'], // Would be calculated from data
            performanceTrends: 'Improving', // Would be calculated
          },
        },
        recommendations: {
          immediate: [
            'Optimize subject lines for better open rates',
            'Test different send times for improved engagement',
          ],
          longTerm: [
            'Implement behavioral segmentation',
            'Consider multi-channel campaign approach',
            'Set up automated follow-up sequences',
          ],
        },
        appendix: {
          methodology:
            'Analytics calculated based on campaign performance data and industry benchmarks',
          dataQuality: 'High - Real-time data from multiple touchpoints',
          limitations: 'Some metrics may have up to 24-hour delay for processing',
        },
      };

      return res.status(200).json({
        success: true,
        message: 'Campaign report generated successfully',
        data: report,
      });
    } catch (error) {
      console.error(`Error generating report for campaign ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate campaign report',
        error: error.message,
      });
    }
  }

  /**
   * Bulk operations on campaigns
   */
  async bulkOperations(req, res) {
    try {
      const { operation, campaignIds, data } = req.body;
      const ownerId = req.admin._id;

      if (!operation || !campaignIds || !Array.isArray(campaignIds)) {
        return res.status(400).json({
          success: false,
          message: 'Operation type and campaign IDs array are required',
        });
      }

      const validOperations = [
        'start',
        'pause',
        'archive',
        'delete',
        'update_status',
        'update_tags',
      ];
      if (!validOperations.includes(operation)) {
        return res.status(400).json({
          success: false,
          message: `Invalid operation. Must be one of: ${validOperations.join(', ')}`,
        });
      }

      // Find campaigns
      const campaigns = await Campaign.find({
        _id: { $in: campaignIds },
        owner: ownerId,
        removed: false,
      });

      if (campaigns.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No campaigns found',
        });
      }

      const results = {
        successful: [],
        failed: [],
        total: campaignIds.length,
      };

      // Process each campaign
      for (const campaign of campaigns) {
        try {
          switch (operation) {
            case 'start':
              if (campaign.status === 'draft' || campaign.status === 'paused') {
                campaign.status = 'active';
                campaign.startDate = campaign.startDate || new Date();
                await campaign.save();
                results.successful.push({
                  id: campaign._id,
                  name: campaign.name,
                  action: 'Started',
                });
              } else {
                results.failed.push({
                  id: campaign._id,
                  name: campaign.name,
                  error: 'Campaign cannot be started from current status',
                });
              }
              break;

            case 'pause':
              if (campaign.status === 'active') {
                campaign.status = 'paused';
                await campaign.save();
                results.successful.push({
                  id: campaign._id,
                  name: campaign.name,
                  action: 'Paused',
                });
              } else {
                results.failed.push({
                  id: campaign._id,
                  name: campaign.name,
                  error: 'Only active campaigns can be paused',
                });
              }
              break;

            case 'archive':
              campaign.status = 'archived';
              await campaign.save();
              results.successful.push({
                id: campaign._id,
                name: campaign.name,
                action: 'Archived',
              });
              break;

            case 'delete':
              campaign.removed = true;
              await campaign.save();
              results.successful.push({
                id: campaign._id,
                name: campaign.name,
                action: 'Deleted',
              });
              break;

            case 'update_status':
              if (data && data.status) {
                const validStatuses = [
                  'draft',
                  'active',
                  'paused',
                  'completed',
                  'failed',
                  'archived',
                ];
                if (validStatuses.includes(data.status)) {
                  campaign.status = data.status;
                  await campaign.save();
                  results.successful.push({
                    id: campaign._id,
                    name: campaign.name,
                    action: `Status updated to ${data.status}`,
                  });
                } else {
                  results.failed.push({
                    id: campaign._id,
                    name: campaign.name,
                    error: 'Invalid status provided',
                  });
                }
              } else {
                results.failed.push({
                  id: campaign._id,
                  name: campaign.name,
                  error: 'Status data required for update_status operation',
                });
              }
              break;

            case 'update_tags':
              if (data && data.tags) {
                campaign.tags = data.tags;
                await campaign.save();
                results.successful.push({
                  id: campaign._id,
                  name: campaign.name,
                  action: 'Tags updated',
                });
              } else {
                results.failed.push({
                  id: campaign._id,
                  name: campaign.name,
                  error: 'Tags data required for update_tags operation',
                });
              }
              break;

            default:
              results.failed.push({
                id: campaign._id,
                name: campaign.name,
                error: 'Unknown operation',
              });
          }
        } catch (error) {
          results.failed.push({
            id: campaign._id,
            name: campaign.name,
            error: error.message,
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: `Bulk operation ${operation} completed`,
        data: results,
      });
    } catch (error) {
      console.error('Error in bulk campaign operations:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to perform bulk operations',
        error: error.message,
      });
    }
  }

  /**
   * Create A/B test for campaign
   */
  async createABTest(req, res) {
    try {
      const { id } = req.params;
      const ownerId = getCurrentUserId(req);
      const {
        testType = 'subject', // subject, content, time, channel
        variations = [],
        trafficSplit = 50, // Percentage for each variation
        testDuration = 24, // Hours
        autoSelectWinner = false,
        successMetric = 'open_rate', // open_rate, click_rate, conversion_rate
      } = req.body;

      // Find campaign
      const campaign = await Campaign.findOne({
        _id: id,
        owner: ownerId,
        removed: false,
      });

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found',
        });
      }

      // Validate campaign can have A/B test
      if (campaign.status !== 'draft') {
        return res.status(400).json({
          success: false,
          message: 'A/B test can only be created for draft campaigns',
        });
      }

      // Validate variations
      if (!Array.isArray(variations) || variations.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'At least 2 variations are required for A/B testing',
        });
      }

      // Create A/B test configuration
      const abTestConfig = {
        isEnabled: true,
        testType,
        successMetric,
        testDuration,
        autoSelectWinner,
        startDate: new Date(),
        endDate: new Date(Date.now() + testDuration * 60 * 60 * 1000),
        variations: variations.map((variation, index) => ({
          id: `variation_${index + 1}`,
          name: variation.name || `Variation ${index + 1}`,
          percentage: index === 0 ? trafficSplit : 100 - trafficSplit,
          content: variation.content || {},
          metrics: {
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            converted: 0,
            openRate: 0,
            clickRate: 0,
            conversionRate: 0,
          },
          isControl: index === 0,
          isWinner: false,
        })),
        results: {
          isComplete: false,
          hasSignificantResult: false,
          confidenceLevel: 0,
          winnerVariation: null,
          significanceThreshold: 0.95,
        },
      };

      // Update campaign with A/B test
      campaign.abTesting = abTestConfig;
      await campaign.save();

      return res.status(200).json({
        success: true,
        message: 'A/B test created successfully',
        data: {
          campaignId: campaign._id,
          abTest: abTestConfig,
        },
      });
    } catch (error) {
      console.error('Error creating A/B test:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create A/B test',
        error: error.message,
      });
    }
  }

  /**
   * Get A/B test results
   */
  async getABTestResults(req, res) {
    try {
      const { id } = req.params;
      const ownerId = getCurrentUserId(req);

      // Find campaign
      const campaign = await Campaign.findOne({
        _id: id,
        owner: ownerId,
        removed: false,
      });

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found',
        });
      }

      if (!campaign.abTesting?.isEnabled) {
        return res.status(400).json({
          success: false,
          message: 'No A/B test found for this campaign',
        });
      }

      const abTest = campaign.abTesting;

      // Calculate statistical significance if test is running
      if (abTest.startDate && !abTest.results.isComplete) {
        const variations = abTest.variations;

        // Basic statistical significance calculation
        if (variations.length >= 2) {
          const control = variations.find((v) => v.isControl);
          const variant = variations.find((v) => !v.isControl);

          if (control && variant && control.metrics.sent > 100 && variant.metrics.sent > 100) {
            // Simple Z-test for proportions
            const p1 =
              control.metrics[abTest.successMetric.replace('_rate', '')] / control.metrics.sent;
            const p2 =
              variant.metrics[abTest.successMetric.replace('_rate', '')] / variant.metrics.sent;

            const pooledP =
              (control.metrics[abTest.successMetric.replace('_rate', '')] +
                variant.metrics[abTest.successMetric.replace('_rate', '')]) /
              (control.metrics.sent + variant.metrics.sent);

            const se = Math.sqrt(
              pooledP * (1 - pooledP) * (1 / control.metrics.sent + 1 / variant.metrics.sent)
            );
            const zScore = Math.abs(p1 - p2) / se;
            const confidenceLevel = this.getConfidenceLevel(zScore);

            // Update results
            abTest.results.confidenceLevel = confidenceLevel;
            abTest.results.hasSignificantResult =
              confidenceLevel >= abTest.results.significanceThreshold;

            if (abTest.results.hasSignificantResult) {
              const winnerRate = Math.max(p1, p2);
              abTest.results.winnerVariation = winnerRate === p1 ? control.id : variant.id;

              // Mark winner
              variations.forEach((v) => {
                v.isWinner = v.id === abTest.results.winnerVariation;
              });
            }
          }
        }

        // Check if test duration is complete
        const isTimeComplete = new Date() >= new Date(abTest.endDate);
        if (isTimeComplete || (abTest.autoSelectWinner && abTest.results.hasSignificantResult)) {
          abTest.results.isComplete = true;
        }

        await campaign.save();
      }

      // Calculate improvement percentages
      const resultsWithImprovement = abTest.variations.map((variation) => {
        const control = abTest.variations.find((v) => v.isControl);
        let improvement = 0;

        if (control && variation.id !== control.id) {
          const controlRate = control.metrics[abTest.successMetric] || 0;
          const variantRate = variation.metrics[abTest.successMetric] || 0;

          if (controlRate > 0) {
            improvement = ((variantRate - controlRate) / controlRate) * 100;
          }
        }

        return {
          ...variation,
          improvement: Math.round(improvement * 100) / 100,
        };
      });

      return res.status(200).json({
        success: true,
        data: {
          campaignId: campaign._id,
          abTest: {
            ...abTest,
            variations: resultsWithImprovement,
          },
          summary: {
            testType: abTest.testType,
            successMetric: abTest.successMetric,
            isComplete: abTest.results.isComplete,
            hasWinner: !!abTest.results.winnerVariation,
            confidenceLevel: Math.round(abTest.results.confidenceLevel * 10000) / 100,
            daysSinceStart: Math.floor(
              (new Date() - new Date(abTest.startDate)) / (1000 * 60 * 60 * 24)
            ),
          },
        },
      });
    } catch (error) {
      console.error('Error getting A/B test results:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get A/B test results',
        error: error.message,
      });
    }
  }

  /**
   * Update A/B test metrics (typically called by campaign execution service)
   */
  async updateABTestMetrics(req, res) {
    try {
      const { id } = req.params;
      const {
        variationId,
        metrics,
        action, // 'sent', 'delivered', 'opened', 'clicked', 'converted'
      } = req.body;

      const campaign = await Campaign.findById(id);
      if (!campaign || !campaign.abTesting?.isEnabled) {
        return res.status(404).json({
          success: false,
          message: 'Campaign or A/B test not found',
        });
      }

      // Find the variation to update
      const variation = campaign.abTesting.variations.find((v) => v.id === variationId);
      if (!variation) {
        return res.status(404).json({
          success: false,
          message: 'Variation not found',
        });
      }

      // Update metrics
      if (metrics) {
        Object.keys(metrics).forEach((key) => {
          if (variation.metrics.hasOwnProperty(key)) {
            variation.metrics[key] += metrics[key] || 0;
          }
        });
      }

      // Calculate rates
      if (variation.metrics.sent > 0) {
        variation.metrics.deliveryRate =
          (variation.metrics.delivered / variation.metrics.sent) * 100;
        variation.metrics.openRate = (variation.metrics.opened / variation.metrics.delivered) * 100;
        variation.metrics.clickRate = (variation.metrics.clicked / variation.metrics.opened) * 100;
        variation.metrics.conversionRate =
          (variation.metrics.converted / variation.metrics.sent) * 100;
      }

      await campaign.save();

      return res.status(200).json({
        success: true,
        message: 'A/B test metrics updated successfully',
        data: {
          variationId,
          updatedMetrics: variation.metrics,
        },
      });
    } catch (error) {
      console.error('Error updating A/B test metrics:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update A/B test metrics',
        error: error.message,
      });
    }
  }

  /**
   * Helper method to calculate confidence level from Z-score
   */
  getConfidenceLevel(zScore) {
    // Simplified confidence level calculation
    // In a real implementation, you'd use a proper statistical library
    if (zScore >= 2.576) return 0.99; // 99% confidence
    if (zScore >= 1.96) return 0.95; // 95% confidence
    if (zScore >= 1.645) return 0.9; // 90% confidence
    if (zScore >= 1.282) return 0.8; // 80% confidence
    return zScore / 2.576; // Approximate for lower values
  }

  /**
   * Email Template Management Methods
   */

  /**
   * Get all email templates
   */
  async getEmailTemplates(req, res) {
    try {
      const ownerId = getCurrentUserId(req);
      const {
        page = 1,
        limit = 20,
        category,
        industry,
        search,
        sortBy = 'updated',
        sortOrder = -1,
      } = req.query;

      // For now, return mock data since EmailTemplate model doesn't exist yet
      // TODO: Implement proper EmailTemplate model and database queries

      const mockTemplates = [
        {
          _id: 'template_1',
          name: 'Welcome Email',
          subject: 'Welcome to {{company_name}}!',
          category: 'welcome',
          industry: 'general',
          htmlContent: '<h1>Welcome {{customer_name}}!</h1><p>Thank you for joining us.</p>',
          textContent: 'Welcome {{customer_name}}! Thank you for joining us.',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          variables: ['company_name', 'customer_name'],
          metrics: {
            timesUsed: 145,
            avgOpenRate: 24.5,
            avgClickRate: 3.2,
          },
        },
        {
          _id: 'template_2',
          name: 'Product Launch',
          subject: 'Introducing {{product_name}} - Limited Time Offer!',
          category: 'product',
          industry: 'ecommerce',
          htmlContent: '<h1>New Product: {{product_name}}</h1><p>{{product_description}}</p>',
          textContent: 'New Product: {{product_name}}. {{product_description}}',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          variables: ['product_name', 'product_description'],
          metrics: {
            timesUsed: 67,
            avgOpenRate: 18.3,
            avgClickRate: 5.7,
          },
        },
      ];

      // Apply filtering
      let filteredTemplates = mockTemplates;

      if (category) {
        filteredTemplates = filteredTemplates.filter((t) => t.category === category);
      }

      if (industry) {
        filteredTemplates = filteredTemplates.filter((t) => t.industry === industry);
      }

      if (search) {
        const searchLower = search.toLowerCase();
        filteredTemplates = filteredTemplates.filter(
          (t) =>
            t.name.toLowerCase().includes(searchLower) ||
            t.subject.toLowerCase().includes(searchLower)
        );
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const paginatedTemplates = filteredTemplates.slice(startIndex, startIndex + parseInt(limit));

      return res.status(200).json({
        success: true,
        data: {
          templates: paginatedTemplates,
          pagination: {
            total: filteredTemplates.length,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(filteredTemplates.length / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      console.error('Error fetching email templates:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch email templates',
        error: error.message,
      });
    }
  }

  /**
   * Create new email template
   */
  async createEmailTemplate(req, res) {
    try {
      const ownerId = getCurrentUserId(req);
      const {
        name,
        subject,
        htmlContent,
        textContent,
        category = 'general',
        industry = 'general',
        variables = [],
        isActive = true,
      } = req.body;

      // Validate required fields
      if (!name || !subject || !htmlContent) {
        return res.status(400).json({
          success: false,
          message: 'Name, subject, and HTML content are required',
        });
      }

      // TODO: Create actual EmailTemplate model and save to database
      // For now, return mock response
      const newTemplate = {
        _id: `template_${Date.now()}`,
        name,
        subject,
        htmlContent,
        textContent: textContent || this.stripHtml(htmlContent),
        category,
        industry,
        variables,
        isActive,
        owner: ownerId,
        createdAt: new Date(),
        updatedAt: new Date(),
        metrics: {
          timesUsed: 0,
          avgOpenRate: 0,
          avgClickRate: 0,
        },
      };

      return res.status(201).json({
        success: true,
        message: 'Email template created successfully',
        data: newTemplate,
      });
    } catch (error) {
      console.error('Error creating email template:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create email template',
        error: error.message,
      });
    }
  }

  /**
   * Helper method to strip HTML tags
   */
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * Lead Scoring System Methods
   */

  /**
   * Calculate lead score for a customer
   */
  async calculateLeadScore(req, res) {
    try {
      const { customerId } = req.params;
      const ownerId = getCurrentUserId(req);

      // TODO: Implement proper Customer/Lead model queries
      // For now, return mock lead scoring data

      const mockCustomer = {
        _id: customerId,
        name: 'John Doe',
        email: 'john.doe@example.com',
        company: 'Example Corp',
        phone: '+1234567890',
        source: 'website',
        createdAt: new Date('2024-01-15'),
        lastActivity: new Date(),
      };

      // Mock behavioral data
      const behaviorData = {
        emailOpens: 15,
        emailClicks: 8,
        websiteVisits: 25,
        pagesViewed: 45,
        formsSubmitted: 3,
        documentsDownloaded: 2,
        webinarAttendance: 1,
        socialEngagement: 12,
        campaignResponses: 5,
      };

      // Mock demographic data
      const demographicData = {
        industryMatch: true,
        companySize: 'medium', // small, medium, large, enterprise
        jobTitle: 'Marketing Manager',
        seniorityLevel: 'manager', // individual, manager, director, executive
        geography: 'target', // target, secondary, other
        budget: 'qualified', // unknown, qualified, unqualified
      };

      // Lead scoring calculation
      const scoring = {
        behavioral: this.calculateBehavioralScore(behaviorData),
        demographic: this.calculateDemographicScore(demographicData),
        engagement: this.calculateEngagementScore(behaviorData),
        recency: this.calculateRecencyScore(mockCustomer.lastActivity),
      };

      const totalScore = Math.round(
        scoring.behavioral * 0.4 +
          scoring.demographic * 0.3 +
          scoring.engagement * 0.2 +
          scoring.recency * 0.1
      );

      // Determine lead grade
      const leadGrade = this.getLeadGrade(totalScore);
      const leadStatus = this.getLeadStatus(totalScore);

      const result = {
        customerId,
        customer: mockCustomer,
        scoring: {
          ...scoring,
          total: totalScore,
          grade: leadGrade,
          status: leadStatus,
          lastCalculated: new Date(),
        },
        recommendations: this.getLeadRecommendations(totalScore, scoring),
        historicalScores: [
          { date: new Date('2024-01-15'), score: 25 },
          { date: new Date('2024-02-01'), score: 45 },
          { date: new Date('2024-02-15'), score: 62 },
          { date: new Date(), score: totalScore },
        ],
      };

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error calculating lead score:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to calculate lead score',
        error: error.message,
      });
    }
  }

  /**
   * Get lead scoring rules
   */
  async getLeadScoringRules(req, res) {
    try {
      const ownerId = getCurrentUserId(req);

      // Mock lead scoring rules
      const scoringRules = {
        behavioral: {
          emailOpen: 2,
          emailClick: 5,
          websiteVisit: 3,
          pageView: 1,
          formSubmission: 15,
          documentDownload: 10,
          webinarAttendance: 20,
          socialEngagement: 2,
          campaignResponse: 8,
        },
        demographic: {
          industryMatch: 15,
          companySizes: {
            small: 5,
            medium: 10,
            large: 15,
            enterprise: 20,
          },
          jobTitles: {
            individual: 5,
            manager: 15,
            director: 20,
            executive: 25,
          },
          geography: {
            target: 10,
            secondary: 5,
            other: 0,
          },
          budget: {
            qualified: 20,
            unknown: 0,
            unqualified: -10,
          },
        },
        engagement: {
          highEngagement: 25, // 80%+ engagement rate
          mediumEngagement: 15, // 50-80% engagement rate
          lowEngagement: 5, // 20-50% engagement rate
          noEngagement: -5, // <20% engagement rate
        },
        recency: {
          today: 10,
          thisWeek: 8,
          thisMonth: 5,
          thisQuarter: 2,
          older: 0,
        },
      };

      return res.status(200).json({
        success: true,
        data: {
          rules: scoringRules,
          gradingScale: {
            A: { min: 80, max: 100, label: 'Hot Lead' },
            B: { min: 60, max: 79, label: 'Warm Lead' },
            C: { min: 40, max: 59, label: 'Cold Lead' },
            D: { min: 20, max: 39, label: 'Poor Lead' },
            F: { min: 0, max: 19, label: 'Not Qualified' },
          },
          statusMapping: {
            Hot: { min: 75, action: 'immediate_contact' },
            Warm: { min: 50, action: 'nurture_campaign' },
            Cold: { min: 25, action: 'educational_content' },
            Unqualified: { min: 0, action: 'no_action' },
          },
        },
      });
    } catch (error) {
      console.error('Error fetching lead scoring rules:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch lead scoring rules',
        error: error.message,
      });
    }
  }

  /**
   * Get lead leaderboard
   */
  async getLeadLeaderboard(req, res) {
    try {
      const ownerId = getCurrentUserId(req);
      const {
        limit = 50,
        timeRange = '30d', // 7d, 30d, 90d, 1y
        minScore = 0,
      } = req.query;

      // Mock lead leaderboard data
      const leaderboard = [
        {
          customerId: 'lead_1',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@techcorp.com',
          company: 'TechCorp Solutions',
          score: 92,
          grade: 'A',
          status: 'Hot',
          lastActivity: new Date(),
          scoreChange: +15,
          campaignsEngaged: 8,
        },
        {
          customerId: 'lead_2',
          name: 'Michael Chen',
          email: 'mchen@innovate.com',
          company: 'Innovate Inc',
          score: 87,
          grade: 'A',
          status: 'Hot',
          lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
          scoreChange: +8,
          campaignsEngaged: 6,
        },
        {
          customerId: 'lead_3',
          name: 'Emma Rodriguez',
          email: 'emma.r@growthco.com',
          company: 'GrowthCo',
          score: 78,
          grade: 'B',
          status: 'Warm',
          lastActivity: new Date(Date.now() - 6 * 60 * 60 * 1000),
          scoreChange: +3,
          campaignsEngaged: 4,
        },
        {
          customerId: 'lead_4',
          name: 'David Kumar',
          email: 'david.kumar@enterprise.com',
          company: 'Enterprise Systems',
          score: 71,
          grade: 'B',
          status: 'Warm',
          lastActivity: new Date(Date.now() - 12 * 60 * 60 * 1000),
          scoreChange: -2,
          campaignsEngaged: 5,
        },
        {
          customerId: 'lead_5',
          name: 'Lisa Zhang',
          email: 'lzhang@startup.io',
          company: 'Startup Ventures',
          score: 64,
          grade: 'B',
          status: 'Warm',
          lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000),
          scoreChange: +12,
          campaignsEngaged: 3,
        },
      ];

      // Filter by minimum score
      const filteredLeaderboard = leaderboard.filter((lead) => lead.score >= parseInt(minScore));

      // Apply limit
      const limitedLeaderboard = filteredLeaderboard.slice(0, parseInt(limit));

      // Calculate summary statistics
      const summary = {
        totalLeads: filteredLeaderboard.length,
        averageScore: Math.round(
          filteredLeaderboard.reduce((sum, lead) => sum + lead.score, 0) /
            filteredLeaderboard.length
        ),
        hotLeads: filteredLeaderboard.filter((lead) => lead.status === 'Hot').length,
        warmLeads: filteredLeaderboard.filter((lead) => lead.status === 'Warm').length,
        coldLeads: filteredLeaderboard.filter((lead) => lead.status === 'Cold').length,
        scoreIncrease: filteredLeaderboard.filter((lead) => lead.scoreChange > 0).length,
        scoreDecrease: filteredLeaderboard.filter((lead) => lead.scoreChange < 0).length,
      };

      return res.status(200).json({
        success: true,
        data: {
          leaderboard: limitedLeaderboard,
          summary,
          filters: {
            timeRange,
            minScore: parseInt(minScore),
            limit: parseInt(limit),
          },
        },
      });
    } catch (error) {
      console.error('Error fetching lead leaderboard:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch lead leaderboard',
        error: error.message,
      });
    }
  }

  /**
   * Helper methods for lead scoring calculations
   */
  calculateBehavioralScore(behaviorData) {
    const scores = {
      emailOpens: behaviorData.emailOpens * 2,
      emailClicks: behaviorData.emailClicks * 5,
      websiteVisits: behaviorData.websiteVisits * 3,
      pagesViewed: behaviorData.pagesViewed * 1,
      formsSubmitted: behaviorData.formsSubmitted * 15,
      documentsDownloaded: behaviorData.documentsDownloaded * 10,
      webinarAttendance: behaviorData.webinarAttendance * 20,
      socialEngagement: behaviorData.socialEngagement * 2,
      campaignResponses: behaviorData.campaignResponses * 8,
    };

    return Math.min(
      100,
      Object.values(scores).reduce((sum, score) => sum + score, 0)
    );
  }

  calculateDemographicScore(demographicData) {
    let score = 0;

    if (demographicData.industryMatch) score += 15;

    const companySizeScores = { small: 5, medium: 10, large: 15, enterprise: 20 };
    score += companySizeScores[demographicData.companySize] || 0;

    const seniorityScores = { individual: 5, manager: 15, director: 20, executive: 25 };
    score += seniorityScores[demographicData.seniorityLevel] || 0;

    const geographyScores = { target: 10, secondary: 5, other: 0 };
    score += geographyScores[demographicData.geography] || 0;

    const budgetScores = { qualified: 20, unknown: 0, unqualified: -10 };
    score += budgetScores[demographicData.budget] || 0;

    return Math.max(0, Math.min(100, score));
  }

  calculateEngagementScore(behaviorData) {
    const totalActivities =
      behaviorData.emailOpens +
      behaviorData.emailClicks +
      behaviorData.websiteVisits +
      behaviorData.formsSubmitted;

    if (totalActivities === 0) return 0;

    const engagementRate =
      (behaviorData.emailClicks + behaviorData.formsSubmitted) / totalActivities;

    if (engagementRate >= 0.8) return 25;
    if (engagementRate >= 0.5) return 15;
    if (engagementRate >= 0.2) return 5;
    return -5;
  }

  calculateRecencyScore(lastActivity) {
    const now = new Date();
    const daysSinceActivity = (now - new Date(lastActivity)) / (1000 * 60 * 60 * 24);

    if (daysSinceActivity <= 1) return 10;
    if (daysSinceActivity <= 7) return 8;
    if (daysSinceActivity <= 30) return 5;
    if (daysSinceActivity <= 90) return 2;
    return 0;
  }

  getLeadGrade(score) {
    if (score >= 80) return 'A';
    if (score >= 60) return 'B';
    if (score >= 40) return 'C';
    if (score >= 20) return 'D';
    return 'F';
  }

  getLeadStatus(score) {
    if (score >= 75) return 'Hot';
    if (score >= 50) return 'Warm';
    if (score >= 25) return 'Cold';
    return 'Unqualified';
  }

  getLeadRecommendations(totalScore, scoring) {
    const recommendations = [];

    if (totalScore >= 75) {
      recommendations.push({
        type: 'immediate_action',
        message: 'High-quality lead ready for immediate contact',
        priority: 'high',
        action: 'Schedule sales call within 24 hours',
      });
    } else if (totalScore >= 50) {
      recommendations.push({
        type: 'nurture_campaign',
        message: 'Warm lead suitable for nurturing campaign',
        priority: 'medium',
        action: 'Add to targeted email sequence',
      });
    } else if (totalScore >= 25) {
      recommendations.push({
        type: 'educational_content',
        message: 'Cold lead needs educational content',
        priority: 'low',
        action: 'Send industry insights and resources',
      });
    }

    if (scoring.behavioral < 20) {
      recommendations.push({
        type: 'engagement_boost',
        message: 'Low behavioral engagement detected',
        priority: 'medium',
        action: 'Create interactive content to boost engagement',
      });
    }

    if (scoring.recency < 5) {
      recommendations.push({
        type: 'reactivation',
        message: 'Lead has not been active recently',
        priority: 'medium',
        action: 'Launch re-engagement campaign',
      });
    }

    return recommendations;
  }

  /**
   * Behavior Tracking System Methods
   */

  /**
   * Track customer behavior event
   */
  async trackBehaviorEvent(req, res) {
    try {
      const {
        customerId,
        eventType, // 'email_open', 'email_click', 'website_visit', 'form_submit', 'download', etc.
        eventData = {},
        campaignId = null,
        timestamp = new Date(),
      } = req.body;

      // Validate required fields
      if (!customerId || !eventType) {
        return res.status(400).json({
          success: false,
          message: 'Customer ID and event type are required',
        });
      }

      // TODO: Save to actual BehaviorEvent model
      // For now, create mock behavior event
      const behaviorEvent = {
        _id: `event_${Date.now()}`,
        customerId,
        eventType,
        eventData,
        campaignId,
        timestamp: new Date(timestamp),
        source: req.headers['user-agent'] || 'unknown',
        ipAddress: req.ip || 'unknown',
        sessionId: req.sessionID || 'unknown',
        processed: false,
        triggeredWorkflows: [],
      };

      // Check for workflow triggers
      const triggeredWorkflows = await this.checkBehaviorTriggers(behaviorEvent);

      // Update lead score based on behavior
      await this.updateLeadScoreFromBehavior(customerId, eventType, eventData);

      return res.status(201).json({
        success: true,
        message: 'Behavior event tracked successfully',
        data: {
          event: behaviorEvent,
          triggeredWorkflows,
          leadScoreImpact: this.getLeadScoreImpact(eventType),
        },
      });
    } catch (error) {
      console.error('Error tracking behavior event:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to track behavior event',
        error: error.message,
      });
    }
  }

  /**
   * Get customer behavior analytics
   */
  async getBehaviorAnalytics(req, res) {
    try {
      const { customerId } = req.params;
      const {
        timeRange = '30d', // 7d, 30d, 90d, 1y
        eventTypes = [],
      } = req.query;

      // TODO: Query actual behavior events from database
      // For now, return mock analytics data

      const mockBehaviorData = {
        customerId,
        timeRange,
        summary: {
          totalEvents: 145,
          uniqueDays: 18,
          averageEventsPerDay: 8.1,
          mostActiveDay: 'Tuesday',
          lastActivity: new Date(),
        },
        eventBreakdown: {
          email_open: 45,
          email_click: 23,
          website_visit: 32,
          page_view: 67,
          form_submit: 8,
          document_download: 12,
          video_watch: 5,
          social_share: 3,
          webinar_join: 2,
          cart_add: 7,
          purchase: 1,
        },
        engagement_timeline: [
          { date: '2024-08-01', events: 12, score: 15 },
          { date: '2024-08-02', events: 8, score: 12 },
          { date: '2024-08-03', events: 15, score: 22 },
          { date: '2024-08-04', events: 6, score: 8 },
          { date: '2024-08-05', events: 18, score: 28 },
        ],
        channels: {
          email: 68,
          website: 52,
          social: 15,
          mobile_app: 8,
          webinar: 2,
        },
        conversion_funnel: {
          awareness: 89,
          interest: 67,
          consideration: 34,
          intent: 18,
          purchase: 1,
        },
        segments: ['high_engagement', 'email_responsive', 'content_consumer'],
      };

      return res.status(200).json({
        success: true,
        data: mockBehaviorData,
      });
    } catch (error) {
      console.error('Error getting behavior analytics:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get behavior analytics',
        error: error.message,
      });
    }
  }

  /**
   * Create behavior trigger
   */
  async createBehaviorTrigger(req, res) {
    try {
      const ownerId = getCurrentUserId(req);
      const {
        name,
        description = '',
        eventType, // 'email_open', 'website_visit', 'form_submit', etc.
        conditions = [], // Array of condition objects
        actions = [], // Array of action objects
        isActive = true,
        cooldownPeriod = 0, // Minutes before trigger can fire again for same customer
      } = req.body;

      // Validate required fields
      if (!name || !eventType || !actions.length) {
        return res.status(400).json({
          success: false,
          message: 'Name, event type, and at least one action are required',
        });
      }

      // TODO: Save to actual BehaviorTrigger model
      // For now, create mock behavior trigger
      const behaviorTrigger = {
        _id: `trigger_${Date.now()}`,
        name,
        description,
        eventType,
        conditions,
        actions,
        isActive,
        cooldownPeriod,
        owner: ownerId,
        createdAt: new Date(),
        updatedAt: new Date(),
        stats: {
          totalTriggers: 0,
          successfulActions: 0,
          failedActions: 0,
          lastTriggered: null,
        },
      };

      return res.status(201).json({
        success: true,
        message: 'Behavior trigger created successfully',
        data: behaviorTrigger,
      });
    } catch (error) {
      console.error('Error creating behavior trigger:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create behavior trigger',
        error: error.message,
      });
    }
  }

  /**
   * Get all behavior triggers
   */
  async getBehaviorTriggers(req, res) {
    try {
      const ownerId = getCurrentUserId(req);
      const { page = 1, limit = 20, isActive, eventType } = req.query;

      // TODO: Query actual behavior triggers from database
      // For now, return mock triggers

      const mockTriggers = [
        {
          _id: 'trigger_1',
          name: 'Welcome Email Trigger',
          description: 'Send welcome email when user signs up',
          eventType: 'form_submit',
          conditions: [{ field: 'form_name', operator: 'equals', value: 'newsletter_signup' }],
          actions: [{ type: 'send_email', templateId: 'welcome_template', delay: 0 }],
          isActive: true,
          cooldownPeriod: 1440, // 24 hours
          createdAt: new Date('2024-01-15'),
          stats: {
            totalTriggers: 234,
            successfulActions: 230,
            failedActions: 4,
            lastTriggered: new Date(),
          },
        },
        {
          _id: 'trigger_2',
          name: 'Cart Abandonment',
          description: 'Follow up when user abandons cart',
          eventType: 'cart_abandon',
          conditions: [{ field: 'cart_value', operator: 'greater_than', value: 50 }],
          actions: [
            { type: 'send_email', templateId: 'cart_reminder', delay: 60 },
            { type: 'update_lead_score', value: -5, delay: 0 },
          ],
          isActive: true,
          cooldownPeriod: 120, // 2 hours
          createdAt: new Date('2024-02-01'),
          stats: {
            totalTriggers: 89,
            successfulActions: 85,
            failedActions: 4,
            lastTriggered: new Date(Date.now() - 3 * 60 * 60 * 1000),
          },
        },
        {
          _id: 'trigger_3',
          name: 'High Engagement Scorer',
          description: 'Increase lead score for high engagement',
          eventType: 'email_click',
          conditions: [{ field: 'campaign_type', operator: 'equals', value: 'product_launch' }],
          actions: [
            { type: 'update_lead_score', value: 10, delay: 0 },
            { type: 'add_to_segment', segmentId: 'high_intent', delay: 0 },
          ],
          isActive: true,
          cooldownPeriod: 60, // 1 hour
          createdAt: new Date('2024-01-20'),
          stats: {
            totalTriggers: 156,
            successfulActions: 152,
            failedActions: 4,
            lastTriggered: new Date(Date.now() - 30 * 60 * 1000),
          },
        },
      ];

      // Apply filtering
      let filteredTriggers = mockTriggers;

      if (isActive !== undefined) {
        filteredTriggers = filteredTriggers.filter((t) => t.isActive === (isActive === 'true'));
      }

      if (eventType) {
        filteredTriggers = filteredTriggers.filter((t) => t.eventType === eventType);
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const paginatedTriggers = filteredTriggers.slice(startIndex, startIndex + parseInt(limit));

      return res.status(200).json({
        success: true,
        data: {
          triggers: paginatedTriggers,
          pagination: {
            total: filteredTriggers.length,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(filteredTriggers.length / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      console.error('Error fetching behavior triggers:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch behavior triggers',
        error: error.message,
      });
    }
  }

  /**
   * Helper methods for behavior tracking
   */
  async checkBehaviorTriggers(behaviorEvent) {
    // TODO: Implement actual trigger checking logic
    // For now, return mock triggered workflows

    const mockTriggeredWorkflows = [];

    if (behaviorEvent.eventType === 'email_click') {
      mockTriggeredWorkflows.push({
        triggerId: 'trigger_3',
        workflowId: 'workflow_lead_scoring',
        action: 'update_lead_score',
        status: 'scheduled',
      });
    }

    if (behaviorEvent.eventType === 'form_submit') {
      mockTriggeredWorkflows.push({
        triggerId: 'trigger_1',
        workflowId: 'workflow_welcome_sequence',
        action: 'send_welcome_email',
        status: 'scheduled',
      });
    }

    return mockTriggeredWorkflows;
  }

  async updateLeadScoreFromBehavior(customerId, eventType, eventData) {
    // TODO: Implement actual lead score update logic
    // For now, return mock score impact

    const scoreImpacts = {
      email_open: 2,
      email_click: 5,
      website_visit: 3,
      page_view: 1,
      form_submit: 15,
      document_download: 10,
      video_watch: 8,
      social_share: 5,
      webinar_join: 20,
      cart_add: 12,
      purchase: 50,
    };

    const impact = scoreImpacts[eventType] || 0;
    console.log(
      `Mock lead score update: Customer ${customerId} +${impact} points for ${eventType}`
    );

    return impact;
  }

  getLeadScoreImpact(eventType) {
    const scoreImpacts = {
      email_open: 2,
      email_click: 5,
      website_visit: 3,
      page_view: 1,
      form_submit: 15,
      document_download: 10,
      video_watch: 8,
      social_share: 5,
      webinar_join: 20,
      cart_add: 12,
      purchase: 50,
    };

    return scoreImpacts[eventType] || 0;
  }
}

module.exports = new CampaignController();
