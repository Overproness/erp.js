// @ts-nocheck

import AiAnalytics from '@/models/appModels/AiAnalytics';
import aiAnalyticsHelper from '@/helpers/aiAnalyticsHelper';
const summary = async (req, res) => {
  try {
    // Resolve owner context - try different possible owner fields
    let ownerId;
    if (req.admin && req.admin._id) {
      ownerId = req.admin._id;
    } else if (req.companyOwner && req.companyOwner._id) {
      ownerId = req.companyOwner._id;
    } else if (req.user && req.user._id) {
      ownerId = req.user._id;
    } else {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Unauthorized: No valid owner context found',
      });
    }

    // Get query parameters
    const { timeframe = '30_days' } = req.query;

    // Get usage metrics
    const usageMetrics = await aiAnalyticsHelper.getUsageMetrics(ownerId, timeframe);

    // Get performance metrics
    const performanceMetrics = await aiAnalyticsHelper.getPerformanceMetrics(ownerId);

    // Get cost analysis
    const costAnalysis = await aiAnalyticsHelper.getCostAnalysis(ownerId, timeframe);

    // Get insights
    const insights = await aiAnalyticsHelper.getInsights(ownerId);

    // Get total analytics count
    const totalAnalytics = await AiAnalytics.countDocuments({
      owner: ownerId,
      removed: false,
    });

    // Get analytics by type breakdown
    const typeBreakdown = await AiAnalytics.aggregate([
      {
        $match: {
          owner: ownerId,
          removed: false,
        },
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get recent analytics (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentAnalytics = await AiAnalytics.countDocuments({
      owner: ownerId,
      removed: false,
      created: { $gte: sevenDaysAgo },
    });

    const summary = {
      totalAnalytics,
      recentAnalytics,
      typeBreakdown,
      usageMetrics: usageMetrics.summary,
      moduleBreakdown: usageMetrics.moduleBreakdown,
      performanceMetrics: performanceMetrics.slice(0, 7), // Last 7 days
      costAnalysis,
      insights: insights.slice(0, 5), // Top 5 insights
      timeframe,
    };

    return res.status(200).json({
      success: true,
      result: summary,
      message: 'AI Analytics summary retrieved successfully',
    });
  } catch (error) {
    console.error('AI Analytics Summary Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Server error while generating AI analytics summary',
      error: error.message,
    });
  }
};

export = summary;
