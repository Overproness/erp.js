// @ts-nocheck
const Review = require('@/models/appModels/Review');
const Business = require('@/models/appModels/Business');
const ReviewTemplate = require('@/models/appModels/ReviewTemplate');

class ReviewAggregationService {
  /**
   * Get aggregated review statistics for a business
   * @param {String} businessId - Business ID
   * @param {Object} filters - Optional filters (platform, dateRange, etc.)
   */
  async getAggregatedStats(businessId, filters = {}) {
    try {
      // Build filter query
      const query = { business: businessId, removed: false };
      
      if (filters.platform) {
        query.platform = filters.platform;
      }
      
      if (filters.dateFrom || filters.dateTo) {
        query.publishedAt = {};
        if (filters.dateFrom) query.publishedAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.publishedAt.$lte = new Date(filters.dateTo);
      }
      
      // Get all matching reviews
      const reviews = await Review.find(query);
      
      if (!reviews || reviews.length === 0) {
        return {
          businessId,
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
          platforms: {},
          sentimentDistribution: {positive: 0, neutral: 0, negative: 0},
          responsiveness: {
            responded: 0,
            responseRate: 0,
            averageResponseTime: 0
          }
        };
      }
      
      // Calculate aggregated statistics
      const stats = {
        businessId,
        totalReviews: reviews.length,
        ratingDistribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
        platforms: {},
        sentimentDistribution: {positive: 0, neutral: 0, negative: 0},
        responsiveness: {
          responded: 0,
          responseRate: 0,
          averageResponseTime: 0
        }
      };
      
      // Process each review for statistics
      let ratingSum = 0;
      let respondedCount = 0;
      let totalResponseTime = 0;
      
      reviews.forEach(review => {
        // Rating distribution
        ratingSum += review.rating;
        stats.ratingDistribution[review.rating] = (stats.ratingDistribution[review.rating] || 0) + 1;
        
        // Platform distribution
        if (!stats.platforms[review.platform]) {
          stats.platforms[review.platform] = {
            count: 0,
            ratingSum: 0,
            averageRating: 0
          };
        }
        stats.platforms[review.platform].count += 1;
        stats.platforms[review.platform].ratingSum += review.rating;
        
        // Sentiment distribution
        const sentiment = review.sentiment?.category || 'neutral';
        stats.sentimentDistribution[sentiment] = (stats.sentimentDistribution[sentiment] || 0) + 1;
        
        // Responsiveness
        if (review.hasResponse) {
          respondedCount += 1;
          
          // Calculate response time if we have both dates
          if (review.publishedAt && review.respondedAt) {
            const responseTime = review.respondedAt - review.publishedAt; // Time difference in ms
            totalResponseTime += responseTime;
          }
        }
      });
      
      // Calculate averages
      stats.averageRating = ratingSum / reviews.length;
      
      // Calculate platform averages
      Object.keys(stats.platforms).forEach(platform => {
        const platformData = stats.platforms[platform];
        platformData.averageRating = platformData.ratingSum / platformData.count;
      });
      
      // Calculate responsiveness metrics
      stats.responsiveness.responded = respondedCount;
      stats.responsiveness.responseRate = respondedCount / reviews.length;
      
      if (respondedCount > 0) {
        stats.responsiveness.averageResponseTime = totalResponseTime / respondedCount;
      }
      
      return stats;
    } catch (error) {
      console.error('Error aggregating review statistics:', error);
      throw error;
    }
  }
  
  /**
   * Get review trends over time
   * @param {String} businessId - Business ID
   * @param {String} timeframe - Time grouping (day, week, month, year)
   * @param {Number} limit - Number of periods to return
   * @param {Object} filters - Additional filters
   */
  async getReviewTrends(businessId, timeframe = 'month', limit = 12, filters = {}) {
    try {
      // Determine date grouping format based on timeframe
      let dateFormat;
      let dateField;
      const sortOrder = -1; // Default to newest first
      
      switch (timeframe) {
        case 'day':
          dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$publishedAt' } };
          dateField = 'day';
          limit = limit || 30; // Default 30 days
          break;
        case 'week':
          dateFormat = {
            $dateToString: { 
              format: '%Y-W%U', 
              date: '$publishedAt'
            }
          };
          dateField = 'week';
          limit = limit || 12; // Default 12 weeks
          break;
        case 'year':
          dateFormat = { $dateToString: { format: '%Y', date: '$publishedAt' } };
          dateField = 'year';
          limit = limit || 5; // Default 5 years
          break;
        case 'month':
        default:
          dateFormat = { $dateToString: { format: '%Y-%m', date: '$publishedAt' } };
          dateField = 'month';
          limit = limit || 12; // Default 12 months
          break;
      }
      
      // Build match query
      const matchQuery = { business: businessId, removed: false };
      
      if (filters.platform) {
        matchQuery.platform = filters.platform;
      }
      
      if (filters.dateFrom || filters.dateTo) {
        matchQuery.publishedAt = {};
        if (filters.dateFrom) matchQuery.publishedAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) matchQuery.publishedAt.$lte = new Date(filters.dateTo);
      }
      
      // Run aggregation pipeline
      const trendData = await Review.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: { timeperiod: dateFormat },
            count: { $sum: 1 },
            avgRating: { $avg: '$rating' },
            ratings: {
              $push: '$rating'
            },
            platforms: {
              $push: '$platform'
            },
            sentiments: {
              $push: '$sentiment.category'
            }
          }
        },
        { $sort: { '_id.timeperiod': sortOrder } },
        { $limit: limit }
      ]);
      
      // Format results
      const formattedTrends = trendData.map(period => {
        // Count ratings by value
        const ratingCounts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
        period.ratings.forEach(rating => {
          ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
        });
        
        // Count platforms
        const platformCounts = {};
        period.platforms.forEach(platform => {
          platformCounts[platform] = (platformCounts[platform] || 0) + 1;
        });
        
        // Count sentiments
        const sentimentCounts = {positive: 0, neutral: 0, negative: 0};
        period.sentiments.forEach(sentiment => {
          if (sentiment) {
            sentimentCounts[sentiment] = (sentimentCounts[sentiment] || 0) + 1;
          } else {
            sentimentCounts.neutral += 1;
          }
        });
        
        return {
          period: period._id.timeperiod,
          count: period.count,
          avgRating: period.avgRating,
          ratingDistribution: ratingCounts,
          platformDistribution: platformCounts,
          sentimentDistribution: sentimentCounts
        };
      });
      
      return {
        businessId,
        timeframe,
        trends: formattedTrends
      };
    } catch (error) {
      console.error('Error getting review trends:', error);
      throw error;
    }
  }
  
  /**
   * Get word cloud data from review text
   * @param {String} businessId - Business ID
   * @param {Object} filters - Filters for reviews
   * @param {Number} limit - Max number of words to return
   */
  async getWordCloudData(businessId, filters = {}, limit = 100) {
    try {
      // Build filter query
      const query = { business: businessId, removed: false };
      
      if (filters.platform) {
        query.platform = filters.platform;
      }
      
      if (filters.sentiment) {
        query['sentiment.category'] = filters.sentiment;
      }
      
      if (filters.minRating) {
        query.rating = query.rating || {};
        query.rating.$gte = parseInt(filters.minRating);
      }
      
      if (filters.maxRating) {
        query.rating = query.rating || {};
        query.rating.$lte = parseInt(filters.maxRating);
      }
      
      if (filters.dateFrom || filters.dateTo) {
        query.publishedAt = {};
        if (filters.dateFrom) query.publishedAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.publishedAt.$lte = new Date(filters.dateTo);
      }
      
      // Get reviews with non-empty comments
      const reviews = await Review.find({
        ...query,
        comment: { $exists: true, $ne: "" }
      });
      
      if (!reviews || reviews.length === 0) {
        return {
          businessId,
          wordCount: 0,
          words: []
        };
      }
      
      // Combine all review text
      let allText = reviews.map(review => review.comment).join(' ');
      
      // Normalize and tokenize text
      allText = allText.toLowerCase();
      
      // Remove punctuation
      allText = allText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
      
      // Split into words
      const words = allText.split(/\s+/);
      
      // Count word frequency
      const wordCount = {};
      const stopWords = this.getStopWords();
      
      words.forEach(word => {
        if (word.length > 2 && !stopWords.includes(word)) {
          wordCount[word] = (wordCount[word] || 0) + 1;
        }
      });
      
      // Convert to array and sort by frequency
      const wordArray = Object.keys(wordCount).map(word => ({
        text: word,
        value: wordCount[word]
      }));
      
      wordArray.sort((a, b) => b.value - a.value);
      
      return {
        businessId,
        wordCount: words.length,
        words: wordArray.slice(0, limit)
      };
    } catch (error) {
      console.error('Error generating word cloud data:', error);
      throw error;
    }
  }
  
  /**
   * Get common English stop words to exclude from word clouds
   */
  getStopWords() {
    return [
      'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
      'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being',
      'below', 'between', 'both', 'but', 'by', 'can\'t', 'cannot', 'could', 'couldn\'t',
      'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
      'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t',
      'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here',
      'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i',
      'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it',
      'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my',
      'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
      'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t',
      'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some',
      'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves',
      'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re',
      'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
      'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were',
      'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which',
      'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would',
      'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours',
      'yourself', 'yourselves'
    ];
  }
  
  /**
   * Get competitive benchmarking data
   * @param {String} businessId - Business ID
   * @param {Array} competitorIds - Array of competitor business IDs
   * @param {Object} filters - Additional filters
   */
  async getCompetitiveBenchmark(businessId, competitorIds = [], filters = {}) {
    try {
      // Ensure we have at least one competitor
      if (!competitorIds || competitorIds.length === 0) {
        throw new Error('At least one competitor ID is required');
      }
      
      // Get aggregated stats for main business and competitors
      const mainBusinessStats = await this.getAggregatedStats(businessId, filters);
      
      const competitorStats = await Promise.all(
        competitorIds.map(id => this.getAggregatedStats(id, filters))
      );
      
      // Get business names
      const businesses = await Business.find({
        _id: { $in: [businessId, ...competitorIds] }
      }, 'name');
      
      const businessNames = businesses.reduce((acc, business) => {
        acc[business._id.toString()] = business.name;
        return acc;
      }, {});
      
      // Format results for comparison
      const benchmarkData = {
        mainBusiness: {
          id: businessId,
          name: businessNames[businessId] || 'Your Business',
          stats: mainBusinessStats
        },
        competitors: competitorStats.map(stats => ({
          id: stats.businessId,
          name: businessNames[stats.businessId] || 'Competitor',
          stats: stats
        })),
        comparison: {
          averageRating: {
            mainBusiness: mainBusinessStats.averageRating,
            industryAverage: this.calculateIndustryAverage(
              [mainBusinessStats, ...competitorStats], 
              'averageRating'
            ),
            competitors: competitorStats.map(stats => stats.averageRating)
          },
          responseRate: {
            mainBusiness: mainBusinessStats.responsiveness.responseRate,
            industryAverage: this.calculateIndustryAverage(
              [mainBusinessStats, ...competitorStats], 
              'responsiveness.responseRate'
            ),
            competitors: competitorStats.map(stats => stats.responsiveness.responseRate)
          },
          reviewVolume: {
            mainBusiness: mainBusinessStats.totalReviews,
            industryAverage: this.calculateIndustryAverage(
              [mainBusinessStats, ...competitorStats], 
              'totalReviews'
            ),
            competitors: competitorStats.map(stats => stats.totalReviews)
          },
          sentimentRatio: {
            mainBusiness: this.calculateSentimentRatio(mainBusinessStats),
            industryAverage: this.calculateIndustryAverage(
              [mainBusinessStats, ...competitorStats], 
              'sentimentRatio'
            ),
            competitors: competitorStats.map(stats => this.calculateSentimentRatio(stats))
          }
        }
      };
      
      return benchmarkData;
    } catch (error) {
      console.error('Error generating competitive benchmark:', error);
      throw error;
    }
  }
  
  /**
   * Calculate industry average for a specific metric
   * @param {Array} allStats - Array of business stats
   * @param {String} metricPath - Path to the metric (dot notation)
   */
  calculateIndustryAverage(allStats, metricPath) {
    try {
      // Extract metric values from all businesses
      const values = allStats.map(stats => {
        if (metricPath.includes('.')) {
          // Handle nested properties
          const parts = metricPath.split('.');
          let value = stats;
          for (const part of parts) {
            value = value[part];
          }
          return value;
        }
        
        return stats[metricPath];
      });
      
      // Calculate average
      const sum = values.reduce((acc, val) => acc + val, 0);
      return sum / values.length;
    } catch (error) {
      console.error('Error calculating industry average:', error);
      return 0;
    }
  }
  
  /**
   * Calculate sentiment ratio (positive to negative)
   * @param {Object} stats - Business stats object
   */
  calculateSentimentRatio(stats) {
    const positive = stats.sentimentDistribution?.positive || 0;
    const negative = stats.sentimentDistribution?.negative || 0;
    
    // Avoid division by zero
    if (negative === 0) {
      return positive > 0 ? positive : 0;
    }
    
    return positive / negative;
  }
}

module.exports = new ReviewAggregationService();
