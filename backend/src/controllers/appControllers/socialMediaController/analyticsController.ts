// @ts-nocheck
const SocialAnalytics = require('@/models/appModels/SocialAnalytics');
const SocialAccount = require('@/models/appModels/SocialAccount');
const SocialPost = require('@/models/appModels/SocialPost');
const { facebookService } = require('@/services/facebookService');
const { instagramService } = require('@/services/instagramService');
const { twitterService } = require('@/services/twitterService');

// Get analytics for specific account
const getAccountAnalytics = async (req, res) => {
  try {
    const { accountId } = req.params;
    const ownerId = req.admin._id;
    const { 
      startDate, 
      endDate, 
      period = 'daily',
      metrics 
    } = req.query;

    // Verify account ownership
    const account = await SocialAccount.findOne({
      _id: accountId,
      owner: ownerId,
      removed: false,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Social account not found',
      });
    }

    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const filter = {
      accountId,
      owner: ownerId,
      removed: false,
    };

    if (Object.keys(dateFilter).length > 0) {
      filter.date = dateFilter;
    }

    if (period) filter.period = period;

    // Get analytics data
    const analytics = await SocialAnalytics.find(filter)
      .sort({ date: -1 })
      .limit(100);

    // Calculate aggregated metrics
    const aggregated = analytics.length > 0 ? {
      totalImpressions: analytics.reduce((sum, a) => sum + a.metrics.impressions, 0),
      totalReach: analytics.reduce((sum, a) => sum + a.metrics.reach, 0),
      totalEngagement: analytics.reduce((sum, a) => sum + (
        a.metrics.likes + a.metrics.comments + a.metrics.shares + a.metrics.saves
      ), 0),
      totalClicks: analytics.reduce((sum, a) => sum + a.metrics.clicks, 0),
      avgEngagementRate: analytics.reduce((sum, a) => sum + a.engagementRate, 0) / analytics.length,
      followerGrowth: analytics.length > 1 ? 
        analytics[0].metrics.followers - analytics[analytics.length - 1].metrics.followers : 0,
    } : {};

    return res.status(200).json({
      success: true,
      result: {
        account,
        analytics,
        aggregated,
        period,
        dateRange: { startDate, endDate },
      },
      message: 'Account analytics retrieved successfully',
    });

  } catch (error) {
    console.error('Get Account Analytics Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve account analytics',
      error: error.message,
    });
  }
};

// Get analytics dashboard data
const getAnalyticsDashboard = async (req, res) => {
  try {
    const ownerId = req.admin._id;
    const { days = 30 } = req.query;

    const startDate = new Date(Date.now() - (parseInt(days) * 24 * 60 * 60 * 1000));

    // Get all user's accounts
    const accounts = await SocialAccount.findByOwner(ownerId);

    // Get recent analytics for all accounts
    const analyticsPromises = accounts.map(account => 
      SocialAnalytics.findByDateRange(ownerId, startDate, new Date(), account.platform)
    );

    const allAnalytics = await Promise.all(analyticsPromises);
    const flatAnalytics = allAnalytics.flat();

    // Get recent posts performance
    const recentPosts = await SocialPost.find({
      owner: ownerId,
      status: 'published',
      removed: false,
    })
    .sort({ created: -1 })
    .limit(10)
    .populate('platforms.accountId campaign');

    // Calculate dashboard metrics
    const dashboard = {
      overview: {
        totalAccounts: accounts.length,
        activeAccounts: accounts.filter(a => a.isActive).length,
        totalFollowers: accounts.reduce((sum, a) => sum + (a.followerCount || 0), 0),
        totalPosts: recentPosts.length,
      },
      
      engagement: {
        totalImpressions: flatAnalytics.reduce((sum, a) => sum + a.metrics.impressions, 0),
        totalReach: flatAnalytics.reduce((sum, a) => sum + a.metrics.reach, 0),
        totalLikes: flatAnalytics.reduce((sum, a) => sum + a.metrics.likes, 0),
        totalComments: flatAnalytics.reduce((sum, a) => sum + a.metrics.comments, 0),
        totalShares: flatAnalytics.reduce((sum, a) => sum + a.metrics.shares, 0),
        avgEngagementRate: flatAnalytics.length > 0 
          ? flatAnalytics.reduce((sum, a) => sum + a.engagementRate, 0) / flatAnalytics.length 
          : 0,
      },

      platformBreakdown: accounts.reduce((acc, account) => {
        if (!acc[account.platform]) {
          acc[account.platform] = {
            accounts: 0,
            followers: 0,
            posts: 0,
          };
        }
        acc[account.platform].accounts += 1;
        acc[account.platform].followers += account.followerCount || 0;
        acc[account.platform].posts += recentPosts.filter(p => 
          p.platforms.some(pl => pl.platform === account.platform)
        ).length;
        return acc;
      }, {}),

      topPosts: recentPosts
        .sort((a, b) => b.totalEngagement - a.totalEngagement)
        .slice(0, 5)
        .map(post => ({
          id: post._id,
          title: post.title,
          content: post.content.substring(0, 100),
          engagement: post.totalEngagement,
          platforms: post.platforms.map(p => p.platform),
          createdAt: post.created,
        })),

      trends: calculateTrends(flatAnalytics, days),
    };

    return res.status(200).json({
      success: true,
      result: dashboard,
      message: 'Analytics dashboard retrieved successfully',
    });

  } catch (error) {
    console.error('Get Analytics Dashboard Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve analytics dashboard',
      error: error.message,
    });
  }
};

// Sync analytics from platforms
const syncAnalytics = async (req, res) => {
  try {
    const { accountId } = req.params;
    const ownerId = req.admin._id;

    const account = await SocialAccount.findOne({
      _id: accountId,
      owner: ownerId,
      removed: false,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Social account not found',
      });
    }

    let analyticsData;

    try {
      // Fetch analytics from platform
      switch (account.platform) {
        case 'facebook':
          analyticsData = await facebookService.getAnalytics(
            account.accessToken,
            account.platformAccountId
          );
          break;

        case 'instagram':
          analyticsData = await instagramService.getAnalytics(
            account.accessToken,
            account.platformAccountId
          );
          break;

        case 'twitter':
          analyticsData = await twitterService.getAnalytics(
            account.accessToken,
            account.platformAccountId
          );
          break;

        default:
          return res.status(400).json({
            success: false,
            result: null,
            message: 'Unsupported platform for analytics sync',
          });
      }

      // Save analytics data
      const analytics = new SocialAnalytics({
        accountId: account._id,
        platform: account.platform,
        date: new Date(),
        period: 'daily',
        metrics: analyticsData.metrics,
        demographics: analyticsData.demographics,
        topPosts: analyticsData.topPosts,
        owner: ownerId,
      });

      await analytics.save();

      return res.status(200).json({
        success: true,
        result: analytics,
        message: 'Analytics synced successfully',
      });

    } catch (syncError) {
      console.error('Analytics sync error:', syncError);
      return res.status(500).json({
        success: false,
        result: null,
        message: 'Failed to sync analytics from platform',
        error: syncError.message,
      });
    }

  } catch (error) {
    console.error('Sync Analytics Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to sync analytics',
      error: error.message,
    });
  }
};

// Get comparative analytics
const getComparativeAnalytics = async (req, res) => {
  try {
    const ownerId = req.admin._id;
    const { platforms, days = 30 } = req.query;

    const startDate = new Date(Date.now() - (parseInt(days) * 24 * 60 * 60 * 1000));
    const platformArray = platforms ? platforms.split(',') : ['facebook', 'instagram', 'twitter'];

    const comparativeData = {};

    for (const platform of platformArray) {
      const analytics = await SocialAnalytics.getAggregatedMetrics(ownerId, platform, 'daily');
      comparativeData[platform] = analytics[0] || {
        totalImpressions: 0,
        totalReach: 0,
        totalEngagement: 0,
        avgEngagementRate: 0,
        totalFollowers: 0,
      };
    }

    // Calculate trends for each platform
    const trends = {};
    for (const platform of platformArray) {
      const trendData = await SocialAnalytics.getPerformanceTrends(ownerId, platform, days);
      trends[platform] = trendData;
    }

    return res.status(200).json({
      success: true,
      result: {
        comparative: comparativeData,
        trends,
        period: `${days} days`,
      },
      message: 'Comparative analytics retrieved successfully',
    });

  } catch (error) {
    console.error('Get Comparative Analytics Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve comparative analytics',
      error: error.message,
    });
  }
};

// Helper function to calculate trends
function calculateTrends(analytics, days) {
  if (analytics.length < 2) return {};

  const midPoint = Math.floor(analytics.length / 2);
  const firstHalf = analytics.slice(midPoint);
  const secondHalf = analytics.slice(0, midPoint);

  const avgFirst = (metric) => 
    firstHalf.reduce((sum, a) => sum + a.metrics[metric], 0) / firstHalf.length;
  
  const avgSecond = (metric) => 
    secondHalf.reduce((sum, a) => sum + a.metrics[metric], 0) / secondHalf.length;

  const calculateChange = (metric) => {
    const first = avgFirst(metric);
    const second = avgSecond(metric);
    return first > 0 ? ((second - first) / first) * 100 : 0;
  };

  return {
    impressions: calculateChange('impressions'),
    reach: calculateChange('reach'),
    likes: calculateChange('likes'),
    comments: calculateChange('comments'),
    shares: calculateChange('shares'),
    followers: calculateChange('followers'),
  };
}

module.exports = {
  getAccountAnalytics,
  getAnalyticsDashboard,
  syncAnalytics,
  getComparativeAnalytics,
};
