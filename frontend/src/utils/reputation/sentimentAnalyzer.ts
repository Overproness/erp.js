import { SENTIMENT_CONFIG } from '../../config/reputationConfig';

/**
 * Client-side sentiment analysis utilities and scoring algorithms
 */

// List of positive sentiment keywords
const POSITIVE_KEYWORDS = [
  'amazing', 'awesome', 'excellent', 'fantastic', 'good', 'great', 'happy', 'love', 
  'outstanding', 'perfect', 'pleased', 'satisfied', 'terrific', 'thank', 'thanks', 
  'wonderful', 'best', 'brilliant', 'delighted', 'exceeded', 'exceptional', 'impressed', 
  'impressive', 'incredible', 'phenomenal', 'remarkable', 'superb', 'thrilled'
];

// List of negative sentiment keywords
const NEGATIVE_KEYWORDS = [
  'angry', 'awful', 'bad', 'disappointed', 'disappointing', 'disaster', 'fail', 
  'horrible', 'issue', 'mistake', 'poor', 'problem', 'refund', 'terrible', 'unhappy', 
  'unsatisfied', 'worst', 'complaint', 'frustrating', 'mediocre', 'not good', 'not happy', 
  'not satisfied', 'subpar', 'unacceptable', 'unfortunate', 'unprofessional', 'wrong'
];

// Negation words that can reverse sentiment
const NEGATION_WORDS = [
  'not', 'no', 'never', 'don\'t', 'doesn\'t', 'didn\'t', 'won\'t', 'wouldn\'t', 
  'couldn\'t', 'shouldn\'t', 'haven\'t', 'hasn\'t', 'hadn\'t', 'isn\'t', 'aren\'t', 
  'wasn\'t', 'weren\'t'
];

/**
 * Analyzes text content and returns sentiment analysis results
 * @param {string} text - The text to analyze
 * @returns {Object} Sentiment analysis result object
 */
export const analyzeSentiment = (text) => {
  // Default result
  const result = {
    sentiment: 'neutral',
    score: 0,
    confidence: 0.5,
    keywords: []
  };
  
  if (!text || typeof text !== 'string') {
    return result;
  }
  
  const normalizedText = text.toLowerCase();
  
  // Quick checks for empty content
  if (normalizedText.trim().length === 0) {
    return result;
  }
  
  // Choose analysis method based on config
  if (SENTIMENT_CONFIG.modelType === 'keyword') {
    return keywordBasedAnalysis(normalizedText);
  } else if (SENTIMENT_CONFIG.modelType === 'machine-learning') {
    return machineLearningAnalysis(normalizedText);
  } else {
    // Default to hybrid approach
    return hybridAnalysis(normalizedText);
  }
};

/**
 * Performs keyword-based sentiment analysis
 * @param {string} text - Normalized text to analyze
 * @returns {Object} Sentiment analysis result
 */
const keywordBasedAnalysis = (text) => {
  // Split text into words and sentences
  const words = text.match(/\b(\w+)\b/g) || [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  let positiveScore = 0;
  let negativeScore = 0;
  const foundKeywords = {
    positive: [],
    negative: []
  };
  
  // Process each sentence to properly handle negations
  sentences.forEach(sentence => {
    const sentenceWords = sentence.toLowerCase().match(/\b(\w+)\b/g) || [];
    let negationPresent = false;
    
    // Check for negation words
    sentenceWords.forEach((word, index) => {
      if (NEGATION_WORDS.includes(word)) {
        negationPresent = true;
      }
      
      // Check for positive keywords
      if (POSITIVE_KEYWORDS.includes(word)) {
        if (negationPresent) {
          negativeScore += 1;
          foundKeywords.negative.push(word);
        } else {
          positiveScore += 1;
          foundKeywords.positive.push(word);
        }
      }
      
      // Check for negative keywords
      else if (NEGATIVE_KEYWORDS.includes(word)) {
        if (negationPresent) {
          positiveScore += 1;
          foundKeywords.positive.push(word);
        } else {
          negativeScore += 1;
          foundKeywords.negative.push(word);
        }
      }
    });
  });
  
  // Calculate final sentiment score (-1 to 1 range)
  const totalKeywords = positiveScore + negativeScore;
  let score = 0;
  if (totalKeywords > 0) {
    score = (positiveScore - negativeScore) / totalKeywords;
  }
  
  // Apply thresholds from configuration
  let sentiment = 'neutral';
  if (score >= SENTIMENT_CONFIG.thresholds.positive) {
    sentiment = 'positive';
  } else if (score <= SENTIMENT_CONFIG.thresholds.negative) {
    sentiment = 'negative';
  }
  
  // Calculate confidence based on number of keywords found
  const confidence = Math.min(totalKeywords / 5, 1) * 0.7 + 0.3;
  
  return {
    sentiment,
    score,
    confidence,
    keywords: [...new Set([...foundKeywords.positive, ...foundKeywords.negative])]
  };
};

/**
 * Placeholder for machine learning based sentiment analysis
 * In a real implementation, this would call a trained model
 */
const machineLearningAnalysis = (text) => {
  // This would typically call an ML model API
  // For now, we'll use the keyword approach but with a note
  const result = keywordBasedAnalysis(text);
  result.method = 'ml-simulated';
  return result;
};

/**
 * Hybrid sentiment analysis combining keyword and ML approaches
 */
const hybridAnalysis = (text) => {
  // Currently just uses the keyword approach
  // In a real implementation, would combine multiple methods
  return keywordBasedAnalysis(text);
};

/**
 * Generates a sentiment report for a collection of reviews
 * @param {Array} reviews - Collection of review objects
 * @returns {Object} Sentiment report with statistics and insights
 */
export const generateSentimentReport = (reviews) => {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return {
      averageSentiment: 0,
      distribution: { positive: 0, neutral: 0, negative: 0 },
      commonKeywords: [],
      reviewCount: 0
    };
  }
  
  // Initialize variables
  const sentiments = { positive: 0, neutral: 0, negative: 0 };
  const allPositiveWords = {};
  const allNegativeWords = {};
  let totalScore = 0;
  
  // Process each review
  reviews.forEach(review => {
    // Analyze sentiment if not already present
    let sentiment = review.sentiment;
    let sentimentScore = review.sentimentScore;
    
    if (!sentiment && review.content) {
      const analysis = analyzeSentiment(review.content);
      sentiment = analysis.sentiment;
      sentimentScore = analysis.score;
    }
    
    // Update counters
    if (sentiment && sentiments.hasOwnProperty(sentiment)) {
      sentiments[sentiment]++;
      totalScore += sentimentScore || 0;
    }
    
    // Collect keywords from content
    if (review.content) {
      const analysis = analyzeSentiment(review.content);
      
      // Add keywords to collection
      if (analysis.keywords) {
        analysis.keywords.forEach(keyword => {
          if (POSITIVE_KEYWORDS.includes(keyword)) {
            allPositiveWords[keyword] = (allPositiveWords[keyword] || 0) + 1;
          } else if (NEGATIVE_KEYWORDS.includes(keyword)) {
            allNegativeWords[keyword] = (allNegativeWords[keyword] || 0) + 1;
          }
        });
      }
    }
  });
  
  // Calculate average sentiment score
  const averageSentiment = reviews.length > 0 ? totalScore / reviews.length : 0;
  
  // Get top keywords
  const topPositiveKeywords = Object.entries(allPositiveWords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));
  
  const topNegativeKeywords = Object.entries(allNegativeWords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));
  
  return {
    averageSentiment,
    distribution: sentiments,
    keywords: {
      positive: topPositiveKeywords,
      negative: topNegativeKeywords
    },
    positivePercentage: Math.round((sentiments.positive / reviews.length) * 100),
    neutralPercentage: Math.round((sentiments.neutral / reviews.length) * 100),
    negativePercentage: Math.round((sentiments.negative / reviews.length) * 100),
    reviewCount: reviews.length
  };
};

/**
 * Calculate sentiment trend over time
 * @param {Array} reviews - Array of review objects
 * @param {string} timeUnit - Time unit to group by ('day', 'week', 'month')
 * @returns {Array} - Sentiment trend data points
 */
export const calculateSentimentTrend = (reviews, timeUnit = 'month') => {
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
    return [];
  }
  
  // Sort reviews by date
  const sortedReviews = [...reviews].sort((a, b) => {
    return new Date(a.createdAt) - new Date(b.createdAt);
  });
  
  // Group reviews by time period
  const groupedReviews = {};
  
  sortedReviews.forEach(review => {
    const date = new Date(review.createdAt);
    let periodKey;
    
    switch (timeUnit) {
      case 'day':
        periodKey = date.toISOString().slice(0, 10); // YYYY-MM-DD
        break;
      case 'week':
        // Get the Monday of the current week
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date.setDate(diff));
        periodKey = monday.toISOString().slice(0, 10);
        break;
      case 'month':
      default:
        periodKey = date.toISOString().slice(0, 7); // YYYY-MM
        break;
    }
    
    if (!groupedReviews[periodKey]) {
      groupedReviews[periodKey] = [];
    }
    
    groupedReviews[periodKey].push(review);
  });
  
  // Calculate sentiment for each period
  const trendData = Object.entries(groupedReviews).map(([period, periodReviews]) => {
    const sentimentReport = generateSentimentReport(periodReviews);
    
    return {
      period,
      count: periodReviews.length,
      averageSentiment: sentimentReport.averageSentiment,
      distribution: sentimentReport.distribution,
      positivePercentage: sentimentReport.positivePercentage,
      neutralPercentage: sentimentReport.neutralPercentage,
      negativePercentage: sentimentReport.negativePercentage
    };
  });
  
  return trendData;
};

/**
 * Compare sentiments between two sets of reviews
 * @param {Array} reviewsA - First set of reviews
 * @param {Array} reviewsB - Second set of reviews
 * @returns {Object} - Comparison results
 */
export const compareSentiments = (reviewsA, reviewsB) => {
  const reportA = generateSentimentReport(reviewsA);
  const reportB = generateSentimentReport(reviewsB);
  
  const sentimentChange = reportB.averageSentiment - reportA.averageSentiment;
  const positiveChange = reportB.distribution.positive - reportA.distribution.positive;
  const negativeChange = reportB.distribution.negative - reportA.distribution.negative;
  
  return {
    sentimentChange,
    positiveChange,
    negativeChange,
    positivePercentageChange: reportB.positivePercentage - reportA.positivePercentage,
    negativePercentageChange: reportB.negativePercentage - reportA.negativePercentage,
    improvementScore: sentimentChange > 0 ? Math.abs(sentimentChange) * 100 : 0,
    deteriorationScore: sentimentChange < 0 ? Math.abs(sentimentChange) * 100 : 0
  };
};

export default {
  analyzeSentiment,
  generateSentimentReport,
  calculateSentimentTrend,
  compareSentiments
};

