/**
 * Utility functions for review formatting, sentiment calculation, and data transformation
 */

// Detect spam content in reviews
export const detectSpam = (content) => {
  if (!content) return { isSpam: false, spamScore: 0 };
  
  const spamPatterns = [
    /buy now|cheap|discount|click here|subscribe|limited time/gi,
    /\b(viagra|cialis|casino|lottery|winner)\b/gi,
    /https?:\/\//gi,
    /\$[0-9,]+/g,
    /[A-Z]{5,}/g // SHOUTING IN ALL CAPS
  ];
  
  let spamScore = 0;
  const maxScore = spamPatterns.length;
  
  spamPatterns.forEach(pattern => {
    const matches = (content.match(pattern) || []).length;
    if (matches > 0) {
      spamScore += Math.min(1, matches / 3); // Cap the contribution of a single pattern
    }
  });
  
  // Calculate normalized score (0-100)
  const normalizedScore = (spamScore / maxScore) * 100;
  
  return {
    isSpam: normalizedScore > 30, // Threshold for spam classification
    spamScore: Math.round(normalizedScore),
    reasons: normalizedScore > 30 ? ['Suspicious content detected'] : []
  };
};

// Validate review data
export const validateReviewData = (reviewData) => {
  const errors = {};
  
  if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
    errors.rating = 'Rating must be between 1 and 5';
  }
  
  if (!reviewData.content || reviewData.content.trim().length < 10) {
    errors.content = 'Review content is too short (minimum 10 characters)';
  }
  
  if (reviewData.title && reviewData.title.length > 100) {
    errors.title = 'Title is too long (maximum 100 characters)';
  }
  
  if (reviewData.author && reviewData.author.length > 100) {
    errors.author = 'Author name is too long (maximum 100 characters)';
  }
  
  if (reviewData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reviewData.email)) {
    errors.email = 'Invalid email address';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Format review for display
export const formatReview = (review) => {
  if (!review) return null;
  
  return {
    ...review,
    formattedDate: formatDate(review.createdAt),
    excerpt: generateExcerpt(review.content, 150),
    sentiment: review.sentiment || determineSentiment(review.rating),
    platform: review.platform ? capitalizeFirstLetter(review.platform) : 'Unknown'
  };
};

// Generate review excerpt with ellipsis
export const generateExcerpt = (text, maxLength = 100) => {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength).trim() + '...';
};

// Format date for display
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)} weeks ago`;
  } else {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
};

// Determine sentiment based on rating
export const determineSentiment = (rating) => {
  if (!rating) return 'neutral';
  
  if (rating >= 4) return 'positive';
  if (rating <= 2) return 'negative';
  return 'neutral';
};

// Get sentiment color
export const getSentimentColor = (sentiment) => {
  switch (sentiment) {
    case 'positive': return '#4caf50'; // green
    case 'negative': return '#f44336'; // red
    case 'neutral': return '#ff9800'; // amber
    default: return '#9e9e9e'; // grey
  }
};

// Filter reviews based on filters
export const filterReviews = (reviews, filters) => {
  if (!reviews || !Array.isArray(reviews)) return [];
  if (!filters) return reviews;
  
  return reviews.filter(review => {
    // Platform filter
    if (filters.platform && filters.platform !== 'all' && review.platform !== filters.platform) {
      return false;
    }
    
    // Rating filter
    if (filters.rating && filters.rating !== 'all') {
      if (filters.rating.includes('-')) {
        // Range filter (e.g., '1-2')
        const [min, max] = filters.rating.split('-').map(Number);
        if (review.rating < min || review.rating > max) return false;
      } else {
        // Exact match
        if (review.rating !== Number(filters.rating)) return false;
      }
    }
    
    // Sentiment filter
    if (filters.sentiment && filters.sentiment !== 'all' && review.sentiment !== filters.sentiment) {
      return false;
    }
    
    // Date range filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const reviewDate = new Date(review.createdAt);
      const now = new Date();
      
      let cutoffDate;
      switch (filters.dateRange) {
        case '7d':
          cutoffDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case '30d':
          cutoffDate = new Date(now.setDate(now.getDate() - 30));
          break;
        case '90d':
          cutoffDate = new Date(now.setDate(now.getDate() - 90));
          break;
        case '1y':
          cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          cutoffDate = null;
      }
      
      if (cutoffDate && reviewDate < cutoffDate) return false;
    }
    
    // Search text filter
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      const content = review.content ? review.content.toLowerCase() : '';
      const title = review.title ? review.title.toLowerCase() : '';
      const author = review.author ? review.author.toLowerCase() : '';
      
      if (!content.includes(searchTerm) && 
          !title.includes(searchTerm) && 
          !author.includes(searchTerm)) {
        return false;
      }
    }
    
    // Response status filter
    if (filters.responded !== undefined) {
      if (filters.responded === true && !review.responded) return false;
      if (filters.responded === false && review.responded) return false;
    }
    
    return true;
  });
};

// Sort reviews based on field and direction
export const sortReviews = (reviews, field = 'date', order = 'desc') => {
  if (!reviews || !Array.isArray(reviews)) return [];
  
  const sortedReviews = [...reviews];
  
  sortedReviews.sort((a, b) => {
    let valueA, valueB;
    
    // Determine values to compare based on field
    switch (field) {
      case 'date':
      case 'createdAt':
        valueA = new Date(a.createdAt || a.date || 0);
        valueB = new Date(b.createdAt || b.date || 0);
        break;
      case 'rating':
        valueA = a.rating || 0;
        valueB = b.rating || 0;
        break;
      case 'sentiment':
        const sentimentMap = { positive: 3, neutral: 2, negative: 1, undefined: 0 };
        valueA = sentimentMap[a.sentiment] || 0;
        valueB = sentimentMap[b.sentiment] || 0;
        break;
      case 'author':
        valueA = a.author || '';
        valueB = b.author || '';
        break;
      default:
        valueA = a[field] || '';
        valueB = b[field] || '';
    }
    
    // Compare values based on order
    if (order === 'asc') {
      if (valueA < valueB) return -1;
      if (valueA > valueB) return 1;
      return 0;
    } else {
      if (valueA > valueB) return -1;
      if (valueA < valueB) return 1;
      return 0;
    }
  });
  
  return sortedReviews;
};

// Calculate average rating
export const calculateAverageRating = (reviews) => {
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) return 0;
  
  const sum = reviews.reduce((total, review) => {
    return total + (review.rating || 0);
  }, 0);
  
  return parseFloat((sum / reviews.length).toFixed(1));
};

// Group reviews by platform
export const groupReviewsByPlatform = (reviews) => {
  if (!reviews || !Array.isArray(reviews)) return {};
  
  return reviews.reduce((grouped, review) => {
    const platform = review.platform || 'unknown';
    grouped[platform] = grouped[platform] || [];
    grouped[platform].push(review);
    return grouped;
  }, {});
};

// Calculate sentiment distribution
export const calculateSentimentDistribution = (reviews) => {
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
    return { positive: 0, neutral: 0, negative: 0 };
  }
  
  const distribution = reviews.reduce((result, review) => {
    const sentiment = review.sentiment || determineSentiment(review.rating);
    result[sentiment] = (result[sentiment] || 0) + 1;
    return result;
  }, { positive: 0, neutral: 0, negative: 0 });
  
  // Calculate percentages
  const total = reviews.length;
  
  return {
    positive: distribution.positive,
    neutral: distribution.neutral,
    negative: distribution.negative,
    positivePercentage: Math.round((distribution.positive / total) * 100),
    neutralPercentage: Math.round((distribution.neutral / total) * 100),
    negativePercentage: Math.round((distribution.negative / total) * 100)
  };
};

// Calculate review trends over time
export const calculateReviewTrends = (reviews, period = 'month', maxPeriods = 12) => {
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) return [];
  
  // Sort reviews by date
  const sortedReviews = sortReviews(reviews, 'date', 'asc');
  
  // Determine period boundaries
  const periodMap = {
    'day': {
      format: (date) => date.toISOString().substring(0, 10), // YYYY-MM-DD
      increment: (date) => new Date(date.setDate(date.getDate() + 1)),
      label: (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    },
    'week': {
      format: (date) => {
        const firstDayOfWeek = new Date(date);
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        firstDayOfWeek.setDate(diff);
        return firstDayOfWeek.toISOString().substring(0, 10);
      },
      increment: (date) => new Date(date.setDate(date.getDate() + 7)),
      label: (date) => {
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 6);
        return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      }
    },
    'month': {
      format: (date) => date.toISOString().substring(0, 7), // YYYY-MM
      increment: (date) => new Date(date.setMonth(date.getMonth() + 1)),
      label: (date) => date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    }
  };
  
  const periodFuncs = periodMap[period] || periodMap['month'];
  
  // Group reviews by period
  const groupedReviews = {};
  
  sortedReviews.forEach(review => {
    const reviewDate = new Date(review.createdAt || review.date);
    const periodKey = periodFuncs.format(reviewDate);
    
    if (!groupedReviews[periodKey]) {
      groupedReviews[periodKey] = [];
    }
    
    groupedReviews[periodKey].push(review);
  });
  
  // Generate complete period list (including empty periods)
  const periods = [];
  const firstReview = sortedReviews[0];
  const lastReview = sortedReviews[sortedReviews.length - 1];
  
  if (!firstReview || !lastReview) return [];
  
  let currentDate = new Date(firstReview.createdAt || firstReview.date);
  const endDate = new Date(lastReview.createdAt || lastReview.date);
  
  // Limit the number of periods
  let periodCount = 0;
  
  while (currentDate <= endDate && periodCount < maxPeriods) {
    const periodKey = periodFuncs.format(currentDate);
    
    // Calculate metrics for this period
    const periodReviews = groupedReviews[periodKey] || [];
    const avgRating = calculateAverageRating(periodReviews);
    const sentimentDistribution = calculateSentimentDistribution(periodReviews);
    
    periods.push({
      period: periodKey,
      label: periodFuncs.label(currentDate),
      count: periodReviews.length,
      avgRating,
      sentimentDistribution
    });
    
    // Move to next period
    currentDate = periodFuncs.increment(currentDate);
    periodCount++;
  }
  
  return periods;
};

// Helper functions
export const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export default {
  detectSpam,
  validateReviewData,
  formatReview,
  generateExcerpt,
  formatDate,
  determineSentiment,
  getSentimentColor,
  filterReviews,
  sortReviews,
  calculateAverageRating,
  groupReviewsByPlatform,
  calculateSentimentDistribution,
  calculateReviewTrends,
  capitalizeFirstLetter
};
