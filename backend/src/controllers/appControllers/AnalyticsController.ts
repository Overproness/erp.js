// @ts-nocheck

import { Campaign, CustomerBehavior } from '../../models';
import analyticsService from '../../services/analyticsService';
/**
 * Analytics Controller
 * Generates campaign reports and real-time performance dashboards
 */
class AnalyticsController {
  /**
   * Get campaign analytics dashboard data
   */
  async getDashboard(req, res) {
    try {
      const ownerId = req.admin._id;
      const { startDate, endDate } = req.query;

      // Set date range
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const end = endDate ? new Date(endDate) : new Date();

      // Get all active campaigns in date range
      const campaigns = await Campaign.find({
        owner: ownerId,
        removed: false,
        startDate: { $lte: end },
        $or: [
          { endDate: { $gte: start } },
          { endDate: { $exists: false } }
        ]
      }).lean();

      // Get summary metrics
      const summary = await analyticsService.getSummaryMetrics(ownerId, start, end);

      // Get performance trends
      const trends = await analyticsService.getPerformanceTrends(ownerId, start, end);

      // Get channel performance
      const channelPerformance = await analyticsService.getChannelPerformance(ownerId, start, end);

      // Get top campaigns
      const topCampaigns = await analyticsService.getTopCampaigns(ownerId, start, end, 5);

      return res.status(200).json({
        success: true,
        data: {
          summary,
          trends,
          channelPerformance,
          topCampaigns,
          dateRange: { start, end },
          totalCampaigns: campaigns.length
        }
      });
    } catch (error) {
      console.error('Error fetching analytics dashboard:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics dashboard',
        error: error.message
      });
    }
  }

  /**
   * Get detailed campaign report
   */
  async getCampaignReport(req, res) {
    try {
      const { id } = req.params;
      const ownerId = req.admin._id;

      // Find campaign
      const campaign = await Campaign.findOne({
        _id: id,
        owner: ownerId,
        removed: false
      }).populate('targetSegments').lean();

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      // Get detailed analytics
      const metrics = await analyticsService.getCampaignDetailedReport(id);

      // Get channel breakdown
      const channelBreakdown = await analyticsService.getCampaignChannelBreakdown(id);

      // Get audience performance
      const audiencePerformance = await analyticsService.getCampaignAudiencePerformance(id);

      // Get time analysis
      const timeAnalysis = await analyticsService.getCampaignTimeAnalysis(id);

      // Get conversion path analysis
      const conversionPaths = await analyticsService.getCampaignConversionPaths(id);

      return res.status(200).json({
        success: true,
        data: {
          campaign,
          metrics,
          channelBreakdown,
          audiencePerformance,
          timeAnalysis,
          conversionPaths
        }
      });
    } catch (error) {
      console.error(`Error fetching campaign report for ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch campaign report',
        error: error.message
      });
    }
  }

  /**
   * Compare campaign performance
   */
  async compareCampaigns(req, res) {
    try {
      const { campaignIds } = req.body;
      const ownerId = req.admin._id;

      // Validate input
      if (!campaignIds || !Array.isArray(campaignIds) || campaignIds.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'At least two campaign IDs are required'
        });
      }

      // Check campaign ownership
      const campaigns = await Campaign.find({
        _id: { $in: campaignIds },
        owner: ownerId,
        removed: false
      }).lean();

      if (campaigns.length !== campaignIds.length) {
        return res.status(404).json({
          success: false,
          message: 'One or more campaigns not found'
        });
      }

      // Get comparison data
      const comparison = await analyticsService.compareCampaigns(campaignIds);

      return res.status(200).json({
        success: true,
        data: {
          campaigns: campaigns.map(c => ({ id: c._id, name: c.name, type: c.type })),
          comparison
        }
      });
    } catch (error) {
      console.error('Error comparing campaigns:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to compare campaigns',
        error: error.message
      });
    }
  }

  /**
   * Get customer journey analytics
   */
  async getCustomerJourney(req, res) {
    try {
      const { customerId } = req.params;
      const ownerId = req.admin._id;

      // Get customer's campaign interactions
      const journeyData = await analyticsService.getCustomerJourneyAnalytics(customerId, ownerId);

      if (!journeyData) {
        return res.status(404).json({
          success: false,
          message: 'Customer journey data not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: journeyData
      });
    } catch (error) {
      console.error(`Error fetching journey for customer ${req.params.customerId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch customer journey',
        error: error.message
      });
    }
  }

  /**
   * Export analytics data
   */
  async exportData(req, res) {
    try {
      const { 
        campaignId, 
        dataType, 
        format = 'csv',
        dateRange 
      } = req.body;
      const ownerId = req.admin._id;

      // Validate required fields
      if (!dataType) {
        return res.status(400).json({
          success: false,
          message: 'Data type is required'
        });
      }

      // Handle campaign-specific export
      if (campaignId) {
        const campaign = await Campaign.findOne({
          _id: campaignId,
          owner: ownerId,
          removed: false
        });

        if (!campaign) {
          return res.status(404).json({
            success: false,
            message: 'Campaign not found'
          });
        }
      }

      // Generate export
      const exportData = await analyticsService.exportAnalyticsData({
        campaignId,
        dataType,
        format,
        dateRange,
        ownerId
      });

      if (format === 'json') {
        return res.status(200).json({
          success: true,
          data: exportData
        });
      } else {
        // For CSV, set appropriate headers
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${dataType}_export_${new Date().toISOString().split('T')[0]}.csv`);
        return res.status(200).send(exportData);
      }
    } catch (error) {
      console.error('Error exporting analytics data:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to export analytics data',
        error: error.message
      });
    }
  }

  /**
   * Get campaign insights using AI
   */
  async getInsights(req, res) {
    try {
      const { campaignId } = req.params;
      const ownerId = req.admin._id;

      // Find campaign
      const campaign = await Campaign.findOne({
        _id: campaignId,
        owner: ownerId,
        removed: false
      });

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      // Get AI-generated insights
      const insights = await analyticsService.generateCampaignInsights(campaignId);

      return res.status(200).json({
        success: true,
        data: insights
      });
    } catch (error) {
      console.error(`Error generating insights for campaign ${req.params.campaignId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate campaign insights',
        error: error.message
      });
    }
  }

  /**
   * Get real-time campaign performance
   */
  async getRealTimePerformance(req, res) {
    try {
      const { campaignId } = req.params;
      const ownerId = req.admin._id;

      // Find campaign
      const campaign = await Campaign.findOne({
        _id: campaignId,
        owner: ownerId,
        removed: false
      });

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      // Get real-time performance data
      const realTimeData = await analyticsService.getRealTimePerformance(campaignId);

      return res.status(200).json({
        success: true,
        data: {
          campaign: {
            id: campaign._id,
            name: campaign.name,
            status: campaign.status
          },
          realTimeData,
          lastUpdated: new Date()
        }
      });
    } catch (error) {
      console.error(`Error getting real-time data for campaign ${req.params.campaignId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get real-time performance data',
        error: error.message
      });
    }
  }

  /**
   * Get UTM parameter performance
   */
  async getUtmPerformance(req, res) {
    try {
      const ownerId = req.admin._id;
      const { startDate, endDate, utmSource, utmMedium, utmCampaign } = req.query;

      // Set date range
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      // Build filter
      const filter = {
        owner: ownerId,
        timestamp: { $gte: start, $lte: end }
      };

      // Add UTM parameter filters if provided
      const utmFilters = {};
      if (utmSource) utmFilters['properties.utm_source'] = utmSource;
      if (utmMedium) utmFilters['properties.utm_medium'] = utmMedium;
      if (utmCampaign) utmFilters['properties.utm_campaign'] = utmCampaign;

      if (Object.keys(utmFilters).length > 0) {
        Object.assign(filter, utmFilters);
      }

      // Get UTM performance analytics
      const utmPerformance = await analyticsService.getUtmPerformance(filter);

      return res.status(200).json({
        success: true,
        data: {
          utmPerformance,
          dateRange: { start, end }
        }
      });
    } catch (error) {
      console.error('Error getting UTM performance:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get UTM performance data',
        error: error.message
      });
    }
  }
}

export = new AnalyticsController();
