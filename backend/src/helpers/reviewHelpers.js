/**
 * Review Helper Functions
 * Common operations and formatting for reviews
 */

/**
 * Format review data for consistent API response
 * @param {Object} review - Raw review object
 * @returns {Object} Formatted review data
 */
const formatReview = (review) => {
  if (!review) return null;
  
  return {
    id: review._id || review.id,
    rating: review.rating,
    comment: review.comment || '',
    title: review.title || '',
    platform: review.platform,
    status: review.status,
    publishedAt: review.publishedAt,
    client: {
      name: review.client?.name || 'Anonymous',
      email: review.client?.email || null,
      avatarUrl: review.client?.avatarUrl || null
    },
    business: review.business,
    sentiment: review.sentiment || {
      score: 0,
      category: 'neutral'
    },
    hasResponse: !!review.response,
    response: review.response ? {
      text: review.response.responseText,
      sentAt: review.response.sentAt,
      automated: review.response.automated || false
    } : null
  };
};

/**
 * Calculate review statistics for a business
 * @param {Array} reviews - Array of review objects
 * @returns {Object} Review statistics
 */
const calculateReviewStats = (reviews) => {
  if (!reviews || !reviews.length) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      responseRate: 0,
      sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
      platforms: {}
    };
  }

  // Initialize counters
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  const platforms = {};
  let totalRating = 0;
  let responsedReviews = 0;

  // Process each review
  reviews.forEach(review => {
    // Count by rating
    const rating = review.rating;
    if (rating >= 1 && rating <= 5) {
      ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
      totalRating += rating;
    }

    // Count sentiment
    if (review.sentiment && review.sentiment.category) {
      sentimentCounts[review.sentiment.category] = 
        (sentimentCounts[review.sentiment.category] || 0) + 1;
    } else {
      sentimentCounts.neutral++;
    }

    // Count by platform
    if (review.platform) {
      platforms[review.platform] = (platforms[review.platform] || 0) + 1;
    }

    // Count responses
    if (review.hasResponse || review.response) {
      responsedReviews++;
    }
  });

  // Calculate statistics
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : 0;
  const responseRate = totalReviews > 0 ? (responsedReviews / totalReviews * 100).toFixed(1) : 0;

  // Calculate sentiment distribution
  const sentimentDistribution = {
    positive: totalReviews > 0 ? (sentimentCounts.positive / totalReviews * 100).toFixed(1) : 0,
    neutral: totalReviews > 0 ? (sentimentCounts.neutral / totalReviews * 100).toFixed(1) : 0,
    negative: totalReviews > 0 ? (sentimentCounts.negative / totalReviews * 100).toFixed(1) : 0
  };

  return {
    averageRating: parseFloat(averageRating),
    totalReviews,
    ratingCounts,
    responseRate: parseFloat(responseRate),
    sentimentDistribution,
    platforms
  };
};

/**
 * Filter reviews based on query parameters
 * @param {Array} reviews - Array of reviews
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered reviews
 */
const filterReviews = (reviews, filters) => {
  if (!reviews || !reviews.length) return [];
  if (!filters) return reviews;

  return reviews.filter(review => {
    // Filter by minimum rating
    if (filters.minRating && review.rating < filters.minRating) {
      return false;
    }

    // Filter by maximum rating
    if (filters.maxRating && review.rating > filters.maxRating) {
      return false;
    }

    // Filter by platform
    if (filters.platform && review.platform !== filters.platform) {
      return false;
    }

    // Filter by date range
    if (filters.startDate && new Date(review.publishedAt) < new Date(filters.startDate)) {
      return false;
    }

    if (filters.endDate && new Date(review.publishedAt) > new Date(filters.endDate)) {
      return false;
    }

    // Filter by sentiment
    if (filters.sentiment && review.sentiment?.category !== filters.sentiment) {
      return false;
    }

    // Filter by response status
    if (filters.hasResponse === true && !review.hasResponse) {
      return false;
    }

    if (filters.hasResponse === false && review.hasResponse) {
      return false;
    }

    // Filter by search term in comment or title
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const commentMatch = review.comment && review.comment.toLowerCase().includes(searchTerm);
      const titleMatch = review.title && review.title.toLowerCase().includes(searchTerm);
      const clientMatch = review.client?.name && review.client.name.toLowerCase().includes(searchTerm);
      
      if (!commentMatch && !titleMatch && !clientMatch) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Sort reviews based on criteria
 * @param {Array} reviews - Array of reviews
 * @param {String} sortBy - Sort field
 * @param {String} sortOrder - 'asc' or 'desc'
 * @returns {Array} Sorted reviews
 */
const sortReviews = (reviews, sortBy = 'publishedAt', sortOrder = 'desc') => {
  if (!reviews || !reviews.length) return [];

  const sortedReviews = [...reviews];

  sortedReviews.sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'rating':
        comparison = a.rating - b.rating;
        break;
      case 'sentiment':
        comparison = (a.sentiment?.score || 0) - (b.sentiment?.score || 0);
        break;
      case 'publishedAt':
      default:
        comparison = new Date(a.publishedAt) - new Date(b.publishedAt);
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sortedReviews;
};

/**
 * Detect spam or inappropriate content in reviews
 * @param {Object} review - Review object
 * @returns {Object} Validation result
 */
const validateReviewContent = (review) => {
  if (!review) return { isValid: false, issues: ['Review data is missing'] };
  
  const issues = [];
  
  // Check for empty review
  if (!review.comment && !review.rating) {
    issues.push('Review must include a rating or comment');
  }
  
  // Check for invalid rating
  if (review.rating && (review.rating < 1 || review.rating > 5)) {
    issues.push('Rating must be between 1 and 5');
  }
  
  // Check for excessive length (potential spam)
  if (review.comment && review.comment.length > 2000) {
    issues.push('Review comment is too long (maximum 2000 characters)');
  }
  
  // Check for suspicious content patterns
  const spamPatterns = [
    /\b(viagra|cialis|pharmacy|prescription|pill)\b/i,
    /\b(lottery|casino|gambling|bet)\b/i,
    /\b(http|www|\.com|\.net|\.org)\b/i
  ];
  
  if (review.comment) {
    for (const pattern of spamPatterns) {
      if (pattern.test(review.comment)) {
        issues.push('Review contains potentially inappropriate content');
        break;
      }
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

/**
 * Paginate a list of reviews
 * @param {Array} reviews - Array of reviews
 * @param {Number} page - Page number
 * @param {Number} limit - Items per page
 * @returns {Object} Paginated reviews with metadata
 */
const paginateReviews = (reviews, page = 1, limit = 20) => {
  if (!reviews) return { data: [], pagination: { page, limit, total: 0, pages: 0 } };
  
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = reviews.length;
  const pages = Math.ceil(total / limit);
  
  return {
    data: reviews.slice(startIndex, endIndex),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages
    }
  };
};

module.exports = {
  formatReview,
  calculateReviewStats,
  filterReviews,
  sortReviews,
  validateReviewContent,
  paginateReviews
};
