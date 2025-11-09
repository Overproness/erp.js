/**
 * Analytics utility functions
 * Sentiment calculation, trend analysis, and reporting helpers
 */

/**
 * Extract top keywords from reviews
 * @param {Array} reviews - Array of review objects
 * @param {Number} count - Number of top keywords to return
 * @returns {Array} Array of top keywords and their frequencies
 */
const extractTopKeywords = (reviews, count = 10) => {
  if (!reviews || !reviews.length) return [];
  
  // Common words to exclude
  const stopWords = [
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be',
    'have', 'has', 'had', 'do', 'does', 'did', 'to', 'at', 'in', 'on', 'for',
    'with', 'by', 'about', 'from', 'as', 'of', 'that', 'this', 'these', 'those',
    'it', 'its', 'they', 'them', 'their', 'we', 'our', 'my', 'your', 'his', 'her'
  ];
  
  // Extract all words from reviews
  const allWords = reviews
    .map(review => review.comment || '')
    .join(' ')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')  // Remove punctuation
    .split(/\s+/)              // Split into words
    .filter(word => word.length > 2 && !stopWords.includes(word)); // Filter out short words and stop words
  
  // Count word frequencies
  const wordFrequency = {};
  
  allWords.forEach(word => {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  });
  
  // Sort by frequency and return top words
  return Object.keys(wordFrequency)
    .map(word => ({ keyword: word, count: wordFrequency[word] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, count);
};

/**
 * Calculate response rate metrics
 * @param {Array} reviews - Array of review objects
 * @returns {Object} Response rate metrics
 */
const calculateResponseMetrics = (reviews) => {
  if (!reviews || reviews.length === 0) {
    return {
      responseRate: 0,
      averageResponseTime: 0,
      reviewsWithResponses: 0,
      totalReviews: 0
    };
  }
  
  // Count reviews with responses
  let reviewsWithResponses = 0;
  let totalResponseTimeMs = 0;
  
  reviews.forEach(review => {
    if (review.response) {
      reviewsWithResponses++;
      
      // Calculate response time if we have both dates
      if (review.publishedAt && review.response.sentAt) {
        const reviewDate = new Date(review.publishedAt);
        const responseDate = new Date(review.response.sentAt);
        const responseTimeMs = responseDate - reviewDate;
        totalResponseTimeMs += responseTimeMs;
      }
    }
  });
  
  // Calculate metrics
  const responseRate = parseFloat(((reviewsWithResponses / reviews.length) * 100).toFixed(1));
  
  // Average response time in hours
  const averageResponseTime = reviewsWithResponses > 0
    ? parseFloat(((totalResponseTimeMs / reviewsWithResponses) / (1000 * 60 * 60)).toFixed(1))
    : 0;
  
  return {
    responseRate,
    averageResponseTime,
    reviewsWithResponses,
    totalReviews: reviews.length
  };
};

/**
 * Generate review performance score
 * @param {Object} metrics - Review metrics
 * @returns {Number} Performance score (0-100)
 */
const calculatePerformanceScore = (metrics) => {
  // Weighted score based on multiple factors
  const weights = {
    averageRating: 0.4,
    responseRate: 0.3,
    reviewVolume: 0.2,
    recency: 0.1
  };
  
  // Calculate individual component scores
  const ratingScore = metrics.averageRating ? (metrics.averageRating / 5) * 100 : 0;
  const responseScore = metrics.responseRate || 0;
  
  // Volume score based on review count (logarithmic scale to prevent domination by volume)
  const volumeScore = metrics.totalReviews > 0
    ? Math.min(100, 20 * Math.log10(metrics.totalReviews + 1))
    : 0;
  
  // Recency score based on reviews in last 30 days
  const recencyScore = metrics.recentReviews > 0
    ? Math.min(100, metrics.recentReviews * 10)
    : 0;
  
  // Calculate weighted score
  const score = (
    (ratingScore * weights.averageRating) +
    (responseScore * weights.responseRate) +
    (volumeScore * weights.reviewVolume) +
    (recencyScore * weights.recency)
  );
  
  return Math.round(score);
};

/**
 * Analyze rating trends over time
 * @param {Array} reviews - Array of review objects
 * @param {Number} periods - Number of time periods to divide into
 * @returns {Array} Rating trend data
 */
const analyzeRatingTrends = (reviews, periods = 6) => {
  if (!reviews || !reviews.length) return [];
  
  // Sort reviews by date
  const sortedReviews = [...reviews].sort(
    (a, b) => new Date(a.publishedAt) - new Date(b.publishedAt)
  );
  
  // Find date range
  const firstDate = new Date(sortedReviews[0].publishedAt);
  const lastDate = new Date(sortedReviews[sortedReviews.length - 1].publishedAt);
  
  // Calculate period length in milliseconds
  const totalTimespan = lastDate - firstDate;
  const periodLength = totalTimespan / periods;
  
  // Initialize periods
  const trends = Array(periods).fill().map((_, index) => {
    const periodStart = new Date(firstDate.getTime() + (index * periodLength));
    const periodEnd = new Date(firstDate.getTime() + ((index + 1) * periodLength));
    
    return {
      periodStart,
      periodEnd,
      averageRating: 0,
      reviewCount: 0,
      sentimentScore: 0
    };
  });
  
  // Assign reviews to periods
  sortedReviews.forEach(review => {
    const reviewDate = new Date(review.publishedAt);
    
    // Find which period this review belongs to
    for (let i = 0; i < periods; i++) {
      if (reviewDate >= trends[i].periodStart && 
          (i === periods - 1 || reviewDate < trends[i + 1].periodStart)) {
        
        // Update period stats
        trends[i].reviewCount++;
        trends[i].averageRating += review.rating || 0;
        trends[i].sentimentScore += review.sentiment?.score || 0;
        break;
      }
    }
  });
  
  // Calculate averages for each period
  return trends.map(period => ({
    ...period,
    averageRating: period.reviewCount > 0
      ? parseFloat((period.averageRating / period.reviewCount).toFixed(1))
      : 0,
    sentimentScore: period.reviewCount > 0
      ? parseFloat((period.sentimentScore / period.reviewCount).toFixed(2))
      : 0
  }));
};

/**
 * Compare review performance against competitors
 * @param {Object} businessMetrics - Current business metrics
 * @param {Array} competitors - Competitor metrics
 * @returns {Object} Comparative analysis
 */
const compareWithCompetitors = (businessMetrics, competitors) => {
  if (!businessMetrics || !competitors || !competitors.length) {
    return {
      ratingDifference: 0,
      volumeDifference: 0,
      responseDifference: 0,
      rank: 1,
      totalCompetitors: 1
    };
  }
  
  // Calculate average metrics for competitors
  const competitorStats = competitors.reduce(
    (stats, competitor) => {
      stats.totalRating += competitor.averageRating || 0;
      stats.totalVolume += competitor.totalReviews || 0;
      stats.totalResponseRate += competitor.responseRate || 0;
      return stats;
    },
    { totalRating: 0, totalVolume: 0, totalResponseRate: 0 }
  );
  
  const avgRating = competitorStats.totalRating / competitors.length;
  const avgVolume = competitorStats.totalVolume / competitors.length;
  const avgResponseRate = competitorStats.totalResponseRate / competitors.length;
  
  // Calculate differences (positive numbers mean business is performing better)
  const ratingDifference = parseFloat((businessMetrics.averageRating - avgRating).toFixed(1));
  const volumeDifference = businessMetrics.totalReviews - avgVolume;
  const responseDifference = parseFloat((businessMetrics.responseRate - avgResponseRate).toFixed(1));
  
  // Determine rank by average rating
  const allBusinesses = [
    { id: 'current', rating: businessMetrics.averageRating },
    ...competitors.map(c => ({ id: c.id, rating: c.averageRating }))
  ];
  
  // Sort by rating (highest first)
  allBusinesses.sort((a, b) => b.rating - a.rating);
  
  // Find rank of current business
  const rank = allBusinesses.findIndex(b => b.id === 'current') + 1;
  
  return {
    ratingDifference,
    volumeDifference,
    responseDifference,
    avgCompetitorRating: parseFloat(avgRating.toFixed(1)),
    avgCompetitorVolume: Math.round(avgVolume),
    avgCompetitorResponseRate: parseFloat(avgResponseRate.toFixed(1)),
    rank,
    totalCompetitors: competitors.length + 1
  };
};

module.exports = {
  extractTopKeywords,
  calculateResponseMetrics,
  calculatePerformanceScore,
  analyzeRatingTrends,
  compareWithCompetitors
};
  const wordFrequency = {};
  words.forEach(word => {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  });
  
  // Sort by frequency and return top words
  return Object.keys(wordFrequency)
    .map(word => ({ keyword: word, count: wordFrequency[word] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, count);
};

/**
 * Calculate response rate metrics
 * @param {Array} reviews - Array of review objects
 * @returns {Object} Response rate metrics
 */
const calculateResponseMetrics = (reviews) => {
  if (!reviews || reviews.length === 0) {
    return {
      responseRate: 0,
      averageResponseTime: 0,
      reviewsWithResponses: 0,
      totalReviews: 0
    };
  }
  
  // Count reviews with responses
  let reviewsWithResponses = 0;
  let totalResponseTimeMs = 0;
  
  reviews.forEach(review => {
    if (review.response) {
      reviewsWithResponses++;
      
      // Calculate response time if we have both dates
      if (review.publishedAt && review.response.sentAt) {
        const reviewDate = new Date(review.publishedAt);
        const responseDate = new Date(review.response.sentAt);
        const responseTimeMs = responseDate - reviewDate;
        totalResponseTimeMs += responseTimeMs;
      }
    }
  });
  
  // Calculate metrics
  const responseRate = parseFloat(((reviewsWithResponses / reviews.length) * 100).toFixed(1));
  
  // Average response time in hours
  const averageResponseTime = reviewsWithResponses > 0
    ? parseFloat(((totalResponseTimeMs / reviewsWithResponses) / (1000 * 60 * 60)).toFixed(1))
    : 0;
  
  return {
    responseRate,
    averageResponseTime,
    reviewsWithResponses,
    totalReviews: reviews.length
  };
};

/**
 * Generate review performance score
 * @param {Object} metrics - Review metrics
 * @returns {Number} Performance score (0-100)
 */
const calculatePerformanceScore = (metrics) => {
  // Weighted score based on multiple factors
  const weights = {
    averageRating: 0.4,    // 40% weight for average rating
    responseRate: 0.3,     // 30% weight for response rate
    reviewVolume: 0.2,     // 20% weight for review volume
    recency: 0.1           // 10% weight for recency
  };
  
  // Rating score (0-100)
  const ratingScore = ((metrics.averageRating - 1) / 4) * 100;
  
  // Response rate score (0-100)
  const responseScore = metrics.responseRate;
  
  // Volume score (logarithmic scale, caps at 100 reviews)
  const volumeScore = Math.min(Math.log10(metrics.totalReviews + 1) * 50, 100);
  
  // Recency score (0-100)
  const recentReviewsPercentage = metrics.recentReviews > 0
    ? (metrics.recentReviews / metrics.totalReviews) * 100
    : 0;
  const recencyScore = Math.min(recentReviewsPercentage * 2, 100);
  
  // Calculate weighted score
  const weightedScore = 
    weights.averageRating * ratingScore +
    weights.responseRate * responseScore +
    weights.reviewVolume * volumeScore +
    weights.recency * recencyScore;
  
  return Math.round(weightedScore);
};

/**
 * Generate review summary metrics
 * @param {Array} reviews - Array of review objects
 * @returns {Object} Comprehensive review metrics
 */
const generateReviewSummary = (reviews) => {
  if (!reviews || reviews.length === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      responseRate: 0,
      averageResponseTime: 0,
      sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
      performanceScore: 0,
      recentReviews: 0
    };
  }
  
  // Get recent reviews (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentReviews = reviews.filter(review => {
    const reviewDate = new Date(review.publishedAt || review.createdAt);
    return reviewDate >= thirtyDaysAgo;
  });
  
  // Calculate basic metrics
  const averageRating = calculateAverageRating(reviews);
  const ratingDistribution = calculateRatingDistribution(reviews);
  const responseMetrics = calculateResponseMetrics(reviews);
  const sentimentDistribution = calculateSentimentDistribution(reviews);
  
  // Calculate performance score
  const performanceMetrics = {
    averageRating,
    responseRate: responseMetrics.responseRate,
    totalReviews: reviews.length,
    recentReviews: recentReviews.length
  };
  
  const performanceScore = calculatePerformanceScore(performanceMetrics);
  
  // Return comprehensive summary
  return {
    totalReviews: reviews.length,
    averageRating,
    ratingDistribution,
    responseRate: responseMetrics.responseRate,
    averageResponseTime: responseMetrics.averageResponseTime,
    sentimentDistribution,
    performanceScore,
    recentReviews: recentReviews.length,
    recentAverageRating: calculateAverageRating(recentReviews)
  };
};

module.exports = {
  calculateAverageRating,
  calculateRatingDistribution,
  calculateSentimentDistribution,
  calculateReviewTrends,
  calculateRatingTrends,
  extractTopKeywords,
  calculateResponseMetrics,
  calculatePerformanceScore,
  generateReviewSummary
};
