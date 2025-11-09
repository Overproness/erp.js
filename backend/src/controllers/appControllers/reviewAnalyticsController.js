const Review = require('../../models/appModels/Review');
const Business = require('../../models/appModels/Business');
const ReviewLink = require('../../models/appModels/ReviewLink');
const { reviewAnalyticsService } = require('../../services/reviewAnalyticsService');

/**
 * Get dashboard data
 */
const getDashboard = async (req, res) => {
  try {
    // Permission check for analytics
    if (req.user && !req.user.permissions?.canViewAnalytics) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to view analytics',
      });
    }

    // Get companyID for filtering
    const companyID = req.user?.companyID || req.companyOwner?.companyID;

    if (!companyID) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Company context not found - authentication required',
      });
    }

    const { businessId, period = '30' } = req.query;

    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build filter
    const filter = {
      companyID: companyID,
      removed: false,
      submittedAt: { $gte: startDate },
    };

    if (businessId) filter.business = businessId;

    // Get review statistics
    const reviewStats = await Review.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          positiveCount: {
            $sum: {
              $cond: [{ $gte: ['$rating', 4] }, 1, 0],
            },
          },
          neutralCount: {
            $sum: {
              $cond: [{ $eq: ['$rating', 3] }, 1, 0],
            },
          },
          negativeCount: {
            $sum: {
              $cond: [{ $lt: ['$rating', 3] }, 1, 0],
            },
          },
          responsedCount: {
            $sum: {
              $cond: [{ $ne: ['$response', null] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalReviews: 1,
          averageRating: { $round: ['$averageRating', 1] },
          positiveCount: 1,
          neutralCount: 1,
          negativeCount: 1,
          responsedCount: 1,
          responseRate: {
            $cond: [
              { $eq: ['$totalReviews', 0] },
              0,
              {
                $round: [
                  { $multiply: [{ $divide: ['$responsedCount', '$totalReviews'] }, 100] },
                  1,
                ],
              },
            ],
          },
        },
      },
    ]);

    // Get daily review counts
    const dailyReviews = await Review.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } },
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' },
        },
      },
      {
        $project: {
          date: '$_id',
          count: 1,
          averageRating: { $round: ['$averageRating', 1] },
          _id: 0,
        },
      },
      { $sort: { date: 1 } },
    ]);

    // Get platform distribution
    const platformDistribution = await Review.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$platform',
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' },
        },
      },
      {
        $project: {
          platform: '$_id',
          count: 1,
          averageRating: { $round: ['$averageRating', 1] },
          _id: 0,
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get sentiment distribution
    const sentimentDistribution = await Review.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$sentiment.label',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          sentiment: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Get recent reviews
    const recentReviews = await Review.find(filter)
      .populate('business')
      .sort({ submittedAt: -1 })
      .limit(5);

    // Get top performing businesses
    const topBusinesses = await Review.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$business',
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' },
        },
      },
      {
        $lookup: {
          from: 'businesses', // Make sure this matches your collection name
          localField: '_id',
          foreignField: '_id',
          as: 'businessInfo',
        },
      },
      { $unwind: '$businessInfo' },
      {
        $project: {
          business: {
            _id: '$_id',
            name: '$businessInfo.name',
            logo: '$businessInfo.logo',
          },
          count: 1,
          averageRating: { $round: ['$averageRating', 1] },
          _id: 0,
        },
      },
      { $sort: { averageRating: -1, count: -1 } },
      { $limit: 5 },
    ]);

    // Get review request performance
    const linkPerformance = await ReviewLink.aggregate([
      {
        $match: {
          companyID: companyID,
          removed: false,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalLinks: { $sum: 1 },
          totalVisits: { $sum: '$visitCount' },
          totalConversions: { $sum: '$conversionCount' },
        },
      },
      {
        $project: {
          _id: 0,
          totalLinks: 1,
          totalVisits: 1,
          totalConversions: 1,
          conversionRate: {
            $cond: [
              { $eq: ['$totalVisits', 0] },
              0,
              {
                $round: [
                  { $multiply: [{ $divide: ['$totalConversions', '$totalVisits'] }, 100] },
                  1,
                ],
              },
            ],
          },
        },
      },
    ]);

    // Format dashboard data
    const dashboard = {
      summary: reviewStats[0] || {
        totalReviews: 0,
        averageRating: 0,
        positiveCount: 0,
        neutralCount: 0,
        negativeCount: 0,
        responsedCount: 0,
        responseRate: 0,
      },
      dailyReviews,
      platformDistribution,
      sentimentDistribution,
      recentReviews,
      topBusinesses,
      linkPerformance: linkPerformance[0] || {
        totalLinks: 0,
        totalVisits: 0,
        totalConversions: 0,
        conversionRate: 0,
      },
      period: `${days} days`,
    };

    return res.status(200).json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      result: dashboard,
    });
  } catch (error) {
    console.error('Dashboard retrieval error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard data',
      error: error.message,
    });
  }
};

/**
 * Get sentiment trends
 */
const getSentimentTrends = async (req, res) => {
  try {
    // Permission check for analytics
    if (req.user && !req.user.permissions?.canViewAnalytics) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to view analytics',
      });
    }

    // Get companyID for filtering
    const companyID = req.user?.companyID || req.companyOwner?.companyID;

    if (!companyID) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Company context not found - authentication required',
      });
    }

    const { businessId, period = '90', interval = 'weekly' } = req.query;

    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build filter
    const filter = {
      companyID: companyID,
      removed: false,
      submittedAt: { $gte: startDate },
    };

    if (businessId) filter.business = businessId;

    let dateFormat = '%Y-%m-%d';
    if (interval === 'weekly') {
      dateFormat = '%Y-%U'; // Year and week number
    } else if (interval === 'monthly') {
      dateFormat = '%Y-%m'; // Year and month
    }

    // Get sentiment trends over time
    const sentimentTrends = await Review.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            period: { $dateToString: { format: dateFormat, date: '$submittedAt' } },
            sentiment: '$sentiment.label',
          },
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' },
        },
      },
      {
        $group: {
          _id: '$_id.period',
          sentiments: {
            $push: {
              sentiment: '$_id.sentiment',
              count: '$count',
              averageRating: { $round: ['$averageRating', 1] },
            },
          },
          totalCount: { $sum: '$count' },
        },
      },
      {
        $project: {
          period: '$_id',
          sentiments: 1,
          totalCount: 1,
          _id: 0,
        },
      },
      { $sort: { period: 1 } },
    ]);

    // Format data for easier frontend consumption
    const formattedTrends = sentimentTrends.map((entry) => {
      const result = {
        period: entry.period,
        totalCount: entry.totalCount,
        positive: 0,
        neutral: 0,
        negative: 0,
        positivePct: 0,
        neutralPct: 0,
        negativePct: 0,
      };

      entry.sentiments.forEach((s) => {
        if (s.sentiment) {
          result[s.sentiment] = s.count;
          result[`${s.sentiment}Pct`] = Math.round((s.count / entry.totalCount) * 100);
        }
      });

      return result;
    });

    // Get overall sentiment comparison
    const sentimentComparison = await Review.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$sentiment.label',
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' },
        },
      },
      {
        $project: {
          sentiment: '$_id',
          count: 1,
          averageRating: { $round: ['$averageRating', 1] },
          _id: 0,
        },
      },
    ]);

    const totalReviews = sentimentComparison.reduce((sum, item) => sum + item.count, 0);
    const sentimentSummary = sentimentComparison.map((item) => ({
      ...item,
      percentage: totalReviews > 0 ? Math.round((item.count / totalReviews) * 100) : 0,
    }));

    return res.status(200).json({
      success: true,
      message: 'Sentiment trends retrieved successfully',
      result: {
        trends: formattedTrends,
        summary: sentimentSummary,
        period: `${days} days`,
        interval,
      },
    });
  } catch (error) {
    console.error('Sentiment trends retrieval error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve sentiment trends',
      error: error.message,
    });
  }
};

/**
 * Get platform comparison
 */
const getPlatformComparison = async (req, res) => {
  try {
    // Permission check for analytics
    if (req.user && !req.user.permissions?.canViewAnalytics) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to view analytics',
      });
    }

    // Get companyID for filtering
    const companyID = req.user?.companyID || req.companyOwner?.companyID;

    if (!companyID) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Company context not found - authentication required',
      });
    }

    const { businessId, period = '90' } = req.query;

    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build filter
    const filter = {
      companyID: companyID,
      removed: false,
      submittedAt: { $gte: startDate },
    };

    if (businessId) filter.business = businessId;

    // Get platform comparison data
    const platformData = await Review.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$platform',
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratings: { $push: '$rating' },
          responseCount: {
            $sum: {
              $cond: [{ $ne: ['$response', null] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          platform: '$_id',
          count: 1,
          averageRating: { $round: ['$averageRating', 1] },
          responseRate: {
            $cond: [
              { $eq: ['$count', 0] },
              0,
              { $round: [{ $multiply: [{ $divide: ['$responseCount', '$count'] }, 100] }, 1] },
            ],
          },
          ratings: 1,
          _id: 0,
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Calculate rating distribution for each platform
    const formattedPlatformData = platformData.map((platform) => {
      const ratingDistribution = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };

      platform.ratings.forEach((rating) => {
        ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
      });

      return {
        platform: platform.platform,
        count: platform.count,
        averageRating: platform.averageRating,
        responseRate: platform.responseRate,
        ratingDistribution,
      };
    });

    // Get trends over time by platform
    const platformTrends = await Review.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            month: { $dateToString: { format: '%Y-%m', date: '$submittedAt' } },
            platform: '$platform',
          },
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' },
        },
      },
      {
        $project: {
          month: '$_id.month',
          platform: '$_id.platform',
          count: 1,
          averageRating: { $round: ['$averageRating', 1] },
          _id: 0,
        },
      },
      { $sort: { month: 1, platform: 1 } },
    ]);

    // Format trends data for easier consumption
    const months = [...new Set(platformTrends.map((item) => item.month))].sort();
    const platforms = [...new Set(platformTrends.map((item) => item.platform))];

    const trendsData = months.map((month) => {
      const monthData = { month };
      platforms.forEach((platform) => {
        const platformData = platformTrends.find(
          (item) => item.month === month && item.platform === platform
        );

        monthData[`${platform}_count`] = platformData ? platformData.count : 0;
        monthData[`${platform}_rating`] = platformData ? platformData.averageRating : 0;
      });
      return monthData;
    });

    return res.status(200).json({
      success: true,
      message: 'Platform comparison data retrieved successfully',
      result: {
        platforms: formattedPlatformData,
        trends: trendsData,
        period: `${days} days`,
      },
    });
  } catch (error) {
    console.error('Platform comparison retrieval error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve platform comparison data',
      error: error.message,
    });
  }
};

/**
 * Get business comparison
 */
const getBusinessComparison = async (req, res) => {
  try {
    // Permission check for analytics
    if (req.user && !req.user.permissions?.canViewAnalytics) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to view analytics',
      });
    }

    // Get companyID for filtering
    const companyID = req.user?.companyID || req.companyOwner?.companyID;

    if (!companyID) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Company context not found - authentication required',
      });
    }

    const { period = '90' } = req.query;

    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get list of businesses
    const businesses = await Business.find({
      companyID: companyID,
      removed: false,
    }).select('_id name logo');

    if (businesses.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No businesses found for comparison',
        result: {
          businesses: [],
          comparison: [],
          trends: [],
          period: `${days} days`,
        },
      });
    }

    const businessIds = businesses.map((b) => b._id);

    // Get comparison data
    const comparisonData = await Review.aggregate([
      {
        $match: {
          business: { $in: businessIds },
          companyID: companyID,
          removed: false,
          submittedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$business',
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          responseCount: {
            $sum: {
              $cond: [{ $ne: ['$response', null] }, 1, 0],
            },
          },
          sentimentCounts: {
            $push: {
              sentiment: '$sentiment.label',
            },
          },
        },
      },
      {
        $lookup: {
          from: 'businesses',
          localField: '_id',
          foreignField: '_id',
          as: 'businessInfo',
        },
      },
      { $unwind: '$businessInfo' },
      {
        $project: {
          business: {
            _id: '$_id',
            name: '$businessInfo.name',
            logo: '$businessInfo.logo',
          },
          count: 1,
          averageRating: { $round: ['$averageRating', 1] },
          responseRate: {
            $cond: [
              { $eq: ['$count', 0] },
              0,
              { $round: [{ $multiply: [{ $divide: ['$responseCount', '$count'] }, 100] }, 1] },
            ],
          },
          sentimentCounts: 1,
          _id: 0,
        },
      },
      { $sort: { averageRating: -1 } },
    ]);

    // Process sentiment counts
    const processedComparison = comparisonData.map((item) => {
      const sentimentCount = {
        positive: 0,
        neutral: 0,
        negative: 0,
      };

      item.sentimentCounts.forEach((entry) => {
        if (entry.sentiment && sentimentCount[entry.sentiment] !== undefined) {
          sentimentCount[entry.sentiment]++;
        }
      });

      return {
        ...item,
        sentimentCount,
        sentimentCounts: undefined, // Remove the raw data
      };
    });

    // Get trends over time
    const trendsData = await Review.aggregate([
      {
        $match: {
          business: { $in: businessIds },
          companyID: companyID,
          removed: false,
          submittedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            month: { $dateToString: { format: '%Y-%m', date: '$submittedAt' } },
            business: '$business',
          },
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' },
        },
      },
      {
        $lookup: {
          from: 'businesses',
          localField: '_id.business',
          foreignField: '_id',
          as: 'businessInfo',
        },
      },
      { $unwind: '$businessInfo' },
      {
        $project: {
          month: '$_id.month',
          business: {
            _id: '$_id.business',
            name: '$businessInfo.name',
          },
          count: 1,
          averageRating: { $round: ['$averageRating', 1] },
          _id: 0,
        },
      },
      { $sort: { month: 1 } },
    ]);

    // Format trends data for easier consumption
    const months = [...new Set(trendsData.map((item) => item.month))].sort();
    const businessNames = businesses.reduce((acc, business) => {
      acc[business._id.toString()] = business.name;
      return acc;
    }, {});

    const formattedTrends = months.map((month) => {
      const monthData = { month };

      businesses.forEach((business) => {
        const businessId = business._id.toString();
        const businessData = trendsData.find(
          (item) => item.month === month && item.business._id.toString() === businessId
        );

        monthData[`${businessNames[businessId]}_count`] = businessData ? businessData.count : 0;
        monthData[`${businessNames[businessId]}_rating`] = businessData
          ? businessData.averageRating
          : 0;
      });

      return monthData;
    });

    return res.status(200).json({
      success: true,
      message: 'Business comparison data retrieved successfully',
      result: {
        businesses,
        comparison: processedComparison,
        trends: formattedTrends,
        period: `${days} days`,
      },
    });
  } catch (error) {
    console.error('Business comparison retrieval error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve business comparison data',
      error: error.message,
    });
  }
};

/**
 * Get review performance metrics
 */
const getPerformanceMetrics = async (req, res) => {
  try {
    // Permission check for analytics access
    if (req.user && !req.user.permissions?.canViewAnalytics) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to view analytics',
      });
    }

    const companyID = req.user?.companyID || req.companyOwner?.companyID;
    const { businessId, period = '30' } = req.query;

    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);

    // Build filter for current period
    const currentFilter = {
      companyID: companyID,
      removed: false,
      submittedAt: { $gte: startDate },
    };

    // Build filter for previous period
    const previousFilter = {
      companyID: companyID,
      removed: false,
      submittedAt: { $gte: previousStartDate, $lt: startDate },
    };

    if (businessId) {
      currentFilter.business = businessId;
      previousFilter.business = businessId;
    }

    // Get metrics for current period
    const currentMetrics = await Review.aggregate([
      { $match: currentFilter },
      {
        $group: {
          _id: null,
          reviewCount: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          responseCount: {
            $sum: {
              $cond: [{ $ne: ['$response', null] }, 1, 0],
            },
          },
          positiveCount: {
            $sum: {
              $cond: [{ $eq: ['$sentiment.label', 'positive'] }, 1, 0],
            },
          },
          negativeCount: {
            $sum: {
              $cond: [{ $eq: ['$sentiment.label', 'negative'] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          reviewCount: 1,
          averageRating: { $round: ['$averageRating', 1] },
          responseRate: {
            $cond: [
              { $eq: ['$reviewCount', 0] },
              0,
              {
                $round: [{ $multiply: [{ $divide: ['$responseCount', '$reviewCount'] }, 100] }, 1],
              },
            ],
          },
          positiveRate: {
            $cond: [
              { $eq: ['$reviewCount', 0] },
              0,
              {
                $round: [{ $multiply: [{ $divide: ['$positiveCount', '$reviewCount'] }, 100] }, 1],
              },
            ],
          },
          negativeRate: {
            $cond: [
              { $eq: ['$reviewCount', 0] },
              0,
              {
                $round: [{ $multiply: [{ $divide: ['$negativeCount', '$reviewCount'] }, 100] }, 1],
              },
            ],
          },
        },
      },
    ]);

    // Get metrics for previous period
    const previousMetrics = await Review.aggregate([
      { $match: previousFilter },
      {
        $group: {
          _id: null,
          reviewCount: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          responseCount: {
            $sum: {
              $cond: [{ $ne: ['$response', null] }, 1, 0],
            },
          },
          positiveCount: {
            $sum: {
              $cond: [{ $eq: ['$sentiment.label', 'positive'] }, 1, 0],
            },
          },
          negativeCount: {
            $sum: {
              $cond: [{ $eq: ['$sentiment.label', 'negative'] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          reviewCount: 1,
          averageRating: { $round: ['$averageRating', 1] },
          responseRate: {
            $cond: [
              { $eq: ['$reviewCount', 0] },
              0,
              {
                $round: [{ $multiply: [{ $divide: ['$responseCount', '$reviewCount'] }, 100] }, 1],
              },
            ],
          },
          positiveRate: {
            $cond: [
              { $eq: ['$reviewCount', 0] },
              0,
              {
                $round: [{ $multiply: [{ $divide: ['$positiveCount', '$reviewCount'] }, 100] }, 1],
              },
            ],
          },
          negativeRate: {
            $cond: [
              { $eq: ['$reviewCount', 0] },
              0,
              {
                $round: [{ $multiply: [{ $divide: ['$negativeCount', '$reviewCount'] }, 100] }, 1],
              },
            ],
          },
        },
      },
    ]);

    // Calculate changes and trends
    const current = currentMetrics[0] || {
      reviewCount: 0,
      averageRating: 0,
      responseRate: 0,
      positiveRate: 0,
      negativeRate: 0,
    };

    const previous = previousMetrics[0] || {
      reviewCount: 0,
      averageRating: 0,
      responseRate: 0,
      positiveRate: 0,
      negativeRate: 0,
    };

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (previous === 0) {
        return current > 0 ? 100 : 0; // 100% increase if previous was zero
      }
      return Math.round(((current - previous) / previous) * 100);
    };

    const performance = {
      current,
      previous,
      changes: {
        reviewCount: calculateChange(current.reviewCount, previous.reviewCount),
        averageRating: calculateChange(current.averageRating, previous.averageRating),
        responseRate: calculateChange(current.responseRate, previous.responseRate),
        positiveRate: calculateChange(current.positiveRate, previous.positiveRate),
        negativeRate: calculateChange(current.negativeRate, previous.negativeRate),
      },
      period: `${days} days`,
    };

    return res.status(200).json({
      success: true,
      message: 'Performance metrics retrieved successfully',
      result: performance,
    });
  } catch (error) {
    console.error('Performance metrics retrieval error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve performance metrics',
      error: error.message,
    });
  }
};

/**
 * Export reviews data
 */
const exportReviews = async (req, res) => {
  try {
    // Permission check for analytics access
    if (req.user && !req.user.permissions?.canViewAnalytics) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to export analytics data',
      });
    }

    const companyID = req.user?.companyID || req.companyOwner?.companyID;
    const { businessId, format = 'csv', startDate, endDate } = req.body;

    // Build filter
    const filter = {
      companyID: companyID,
      removed: false,
    };

    if (businessId) filter.business = businessId;

    if (startDate || endDate) {
      filter.submittedAt = {};
      if (startDate) filter.submittedAt.$gte = new Date(startDate);
      if (endDate) filter.submittedAt.$lte = new Date(endDate);
    }

    // Get reviews
    const reviews = await Review.find(filter).populate('business').sort({ submittedAt: -1 });

    if (reviews.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No reviews found for export',
        result: null,
      });
    }

    // Use analytics service to format and export
    const exportData = await analyticsService.exportReviewData(reviews, format);

    return res.status(200).json({
      success: true,
      message: `Reviews exported successfully as ${format.toUpperCase()}`,
      result: exportData,
    });
  } catch (error) {
    console.error('Review export error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to export reviews',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboard,
  getSentimentTrends,
  getPlatformComparison,
  getBusinessComparison,
  getPerformanceMetrics,
  exportReviews,
};
