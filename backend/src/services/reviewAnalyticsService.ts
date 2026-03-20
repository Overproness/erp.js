// @ts-nocheck
const mongoose = require('mongoose');
const Review = require('../models/appModels/Review');
const ReviewResponse = require('../models/appModels/ReviewResponse');
const ReviewLink = require('../models/appModels/ReviewLink');
const Business = require('../models/appModels/Business');

class ReviewAnalyticsService {
  async getDashboardAnalytics(businessId, period = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);
      
      // Get reviews in this period
      const [
        allReviews,
        recentReviews,
        reviewCountByPlatform,
        sentimentBreakdown,
        ratingDistribution,
        responseRate,
        reviewLinks,
        linkAnalytics
      ] = await Promise.all([
        // Total review count
        Review.countDocuments({ business: businessId, removed: false }),
        
        // Recent reviews in the period
        Review.find({ 
          business: businessId,
          removed: false,
          publishedAt: { $gte: startDate }
        }).sort({ publishedAt: -1 }),
        
        // Review count by platform
        Review.aggregate([
          { $match: { business: mongoose.Types.ObjectId(businessId), removed: false }},
          { $group: { _id: '$platform', count: { $sum: 1 } }},
          { $sort: { count: -1 }}
        ]),
        
        // Sentiment breakdown
        Review.aggregate([
          { $match: { 
            business: mongoose.Types.ObjectId(businessId), 
            removed: false,
            publishedAt: { $gte: startDate }
          }},
          { $group: { 
            _id: '$sentiment.category', 
            count: { $sum: 1 },
            avgRating: { $avg: '$rating' }
          }},
          { $sort: { count: -1 }}
        ]),
        
        // Rating distribution
        Review.aggregate([
          { $match: { business: mongoose.Types.ObjectId(businessId), removed: false }},
          { $group: { _id: '$rating', count: { $sum: 1 }}},
          { $sort: { _id: -1 }}
        ]),
        
        // Response rate
        ReviewResponse.getResponseRate(businessId),
        
        // Active review links
        ReviewLink.findActiveLinksByBusiness(businessId),
        
        // Review link analytics
        ReviewLink.getAnalytics(businessId, startDate)
      ]);
      
      // Calculate average rating
      const totalRating = recentReviews.reduce((sum, review) => sum + review.rating, 0);
      const avgRating = recentReviews.length > 0 ? totalRating / recentReviews.length : 0;
      
      // Calculate trend (comparison to previous period)
      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - period);
      
      const [previousReviews, previousAvgRating] = await Promise.all([
        Review.countDocuments({ 
          business: businessId, 
          removed: false,
          publishedAt: { $gte: previousStartDate, $lt: startDate }
        }),
        
        Review.aggregate([
          { $match: { 
            business: mongoose.Types.ObjectId(businessId), 
            removed: false,
            publishedAt: { $gte: previousStartDate, $lt: startDate }
          }},
          { $group: { _id: null, avgRating: { $avg: '$rating' }}}
        ])
      ]);
      
      // Calculate growth rates
      const reviewGrowth = previousReviews > 0 
        ? ((recentReviews.length - previousReviews) / previousReviews) * 100
        : 100;
      
      const ratingGrowth = previousAvgRating.length > 0 && previousAvgRating[0]
        ? ((avgRating - previousAvgRating[0].avgRating) / previousAvgRating[0].avgRating) * 100
        : 0;
      
      // Format platform breakdown
      const platforms = {};
      reviewCountByPlatform.forEach(p => {
        platforms[p._id] = p.count;
      });
      
      // Format sentiment breakdown
      const sentiment = {};
      sentimentBreakdown.forEach(s => {
        sentiment[s._id] = {
          count: s.count,
          avgRating: s.avgRating
        };
      });
      
      // Format rating distribution
      const ratingCounts = Array(5).fill(0);
      ratingDistribution.forEach(r => {
        ratingCounts[5 - r._id] = r.count;  // Convert to 0-indexed array
      });
      
      return {
        summary: {
          totalReviews: allReviews,
          recentReviews: recentReviews.length,
          averageRating: avgRating.toFixed(1),
          responseRate: responseRate.toFixed(1),
          reviewGrowth: reviewGrowth.toFixed(1),
          ratingGrowth: ratingGrowth.toFixed(1)
        },
        platforms,
        sentiment,
        ratingDistribution: ratingCounts,
        links: {
          active: reviewLinks.length,
          analytics: linkAnalytics[0] || {
            totalViews: 0,
            totalSubmissions: 0,
            avgConversionRate: 0,
            linkCount: 0
          }
        },
        recentActivity: recentReviews.slice(0, 5).map(review => ({
          id: review._id,
          rating: review.rating,
          client: review.client.name,
          platform: review.platform,
          date: review.publishedAt,
          hasResponse: review.hasResponse
        }))
      };
    } catch (error) {
      console.error('Error generating dashboard analytics:', error);
      throw error;
    }
  }

  async getReviewTrends(businessId, period = 90) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);
      
      // Aggregate reviews by day
      const dailyReviews = await Review.aggregate([
        { $match: { 
          business: mongoose.Types.ObjectId(businessId), 
          removed: false,
          publishedAt: { $gte: startDate }
        }},
        { $group: {
          _id: { 
            year: { $year: "$publishedAt" },
            month: { $month: "$publishedAt" },
            day: { $dayOfMonth: "$publishedAt" }
          },
          count: { $sum: 1 },
          avgRating: { $avg: "$rating" },
          positive: { $sum: { $cond: [{ $eq: ["$sentiment.category", "positive"] }, 1, 0] }},
          negative: { $sum: { $cond: [{ $eq: ["$sentiment.category", "negative"] }, 1, 0] }},
          neutral: { $sum: { $cond: [{ $eq: ["$sentiment.category", "neutral"] }, 1, 0] }}
        }},
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }}
      ]);
      
      // Convert to chart-friendly format
      const dates = [];
      const counts = [];
      const ratings = [];
      const positives = [];
      const negatives = [];
      const neutrals = [];
      
      // Fill in missing dates with zeros
      const dateMap = new Map();
      
      // Create a complete date range
      for (let i = 0; i < period; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const dateKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        dateMap.set(dateKey, {
          date: d.toISOString().split('T')[0],
          count: 0,
          avgRating: 0,
          positive: 0,
          negative: 0,
          neutral: 0
        });
      }
      
      // Fill in actual data
      dailyReviews.forEach(day => {
        const dateKey = `${day._id.year}-${day._id.month}-${day._id.day}`;
        const dateStr = new Date(day._id.year, day._id.month - 1, day._id.day)
          .toISOString().split('T')[0];
        
        dateMap.set(dateKey, {
          date: dateStr,
          count: day.count,
          avgRating: day.avgRating,
          positive: day.positive,
          negative: day.negative,
          neutral: day.neutral
        });
      });
      
      // Convert map to arrays for charting
      for (const [_, value] of dateMap) {
        dates.push(value.date);
        counts.push(value.count);
        ratings.push(value.avgRating);
        positives.push(value.positive);
        negatives.push(value.negative);
        neutrals.push(value.neutral);
      }
      
      return {
        dates,
        counts,
        ratings,
        sentiment: {
          positive: positives,
          negative: negatives,
          neutral: neutrals
        }
      };
    } catch (error) {
      console.error('Error generating review trends:', error);
      throw error;
    }
  }

  async getWordCloud(businessId, sentiment = null, limit = 100) {
    try {
      // Match criteria
      const match = { 
        business: mongoose.Types.ObjectId(businessId), 
        removed: false 
      };
      
      if (sentiment) {
        match['sentiment.category'] = sentiment;
      }
      
      // Aggregate keywords
      const keywords = await Review.aggregate([
        { $match: match },
        { $unwind: "$sentiment.keywords" },
        { $group: { 
          _id: "$sentiment.keywords", 
          count: { $sum: 1 } 
        }},
        { $sort: { count: -1 }},
        { $limit: limit }
      ]);
      
      return keywords.map(k => ({
        text: k._id,
        value: k.count
      }));
    } catch (error) {
      console.error('Error generating word cloud data:', error);
      throw error;
    }
  }

  async getPlatformComparison(businessId) {
    try {
      // Get reviews by platform with averages
      const platformData = await Review.aggregate([
        { $match: { 
          business: mongoose.Types.ObjectId(businessId), 
          removed: false 
        }},
        { $group: {
          _id: "$platform",
          count: { $sum: 1 },
          avgRating: { $avg: "$rating" },
          responseCount: { $sum: { $cond: ["$hasResponse", 1, 0] }},
        }},
        { $sort: { count: -1 }}
      ]);
      
      // Calculate response rates
      const platforms = platformData.map(p => ({
        platform: p._id,
        reviewCount: p.count,
        averageRating: p.avgRating.toFixed(1),
        responseRate: p.count > 0 ? ((p.responseCount / p.count) * 100).toFixed(1) : 0,
      }));
      
      return platforms;
    } catch (error) {
      console.error('Error generating platform comparison:', error);
      throw error;
    }
  }
}

const reviewAnalyticsService = new ReviewAnalyticsService();
module.exports = { reviewAnalyticsService };
