/**
 * Sentiment Analysis Helper Functions
 * Utilities for review sentiment processing
 */

/**
 * Map sentiment score to category
 * @param {Number} score - Sentiment score (typically -1 to 1)
 * @returns {String} Sentiment category (positive, neutral, negative)
 */
const getSentimentCategory = (score: number | null | undefined) => {
  if (!score && score !== 0) return 'neutral';
  
  // Convert different scoring systems to a standardized category
  if (typeof score === 'number') {
    if (score >= 0.2) return 'positive';
    if (score <= -0.2) return 'negative';
    return 'neutral';
  }
  
  return 'neutral';
};

/**
 * Normalize sentiment scores from different providers to a standard scale
 * @param {Number} score - Raw sentiment score
 * @param {String} provider - Provider of sentiment analysis
 * @returns {Number} Normalized score between -1 and 1
 */
const normalizeScore = (score: number | null | undefined, provider = 'default') => {
  if (score === undefined || score === null) return 0;
  
  // Different providers use different scales, normalize to -1 to 1
  switch (provider.toLowerCase()) {
    case 'google':
      // Google uses -1 to 1 already
      return Math.max(-1, Math.min(1, score));
    
    case 'azure':
      // Azure uses 0 to 1, where 0 is negative and 1 is positive
      return (score * 2) - 1;
      
    case 'aws':
      // AWS uses -5 to 5
      return score / 5;
      
    case 'custom':
      // Custom implementation uses 0-100 with 50 as neutral
      return (score - 50) / 50;
      
    default:
      // Ensure the score is between -1 and 1
      if (score >= -1 && score <= 1) return score;
      return Math.max(-1, Math.min(1, score / 10)); // Assume scale of -10 to 10
  }
};

/**
 * Calculate sentiment from rating
 * @param {Number} rating - Review rating (1-5)
 * @returns {Object} Sentiment object with score and category
 */
const getSentimentFromRating = (rating: number | null | undefined) => {
  if (!rating || typeof rating !== 'number') return { score: 0, category: 'neutral' };
  
  // Map 1-5 rating to -1 to 1 sentiment score
  let score;
  switch (rating) {
    case 1: score = -1.0; break;
    case 2: score = -0.5; break;
    case 3: score = 0; break;
    case 4: score = 0.5; break;
    case 5: score = 1.0; break;
    default: score = 0;
  }
  
  return {
    score,
    category: getSentimentCategory(score)
  };
};

/**
 * Extract key sentiment phrases from review text
 * @param {String} text - Review text content
 * @param {Number} maxPhrases - Maximum number of phrases to extract
 * @returns {Array} Key phrases that influenced sentiment
 */
const extractSentimentPhrases = (text: string, maxPhrases = 3) => {
  if (!text) return [];
  
  // Simple implementation - would be replaced with actual NLP in production
  const positivePatterns = [
    'great', 'excellent', 'amazing', 'love', 'best',
    'helpful', 'recommend', 'fantastic', 'awesome', 'perfect'
  ];
  
  const negativePatterns = [
    'bad', 'poor', 'terrible', 'worst', 'awful',
    'disappointed', 'waste', 'slow', 'rude', 'avoid'
  ];
  
  const phrases = [];
  const words = text.toLowerCase().split(/\W+/);
  const sentenceRegex = /[^.!?]+[.!?]+/g;
  const sentences = text.match(sentenceRegex) || [text];
  
  // Extract sentences containing sentiment-laden words
  for (const sentence of sentences) {
    const sentenceLower = sentence.toLowerCase();
    
    // Check for positive patterns
    for (const pattern of positivePatterns) {
      if (sentenceLower.includes(pattern) && phrases.length < maxPhrases) {
        phrases.push({
          text: sentence.trim(),
          sentiment: 'positive',
          keyword: pattern
        });
        break;
      }
    }
    
    // Check for negative patterns
    for (const pattern of negativePatterns) {
      if (sentenceLower.includes(pattern) && phrases.length < maxPhrases) {
        phrases.push({
          text: sentence.trim(),
          sentiment: 'negative',
          keyword: pattern
        });
        break;
      }
    }
    
    if (phrases.length >= maxPhrases) break;
  }
  
  return phrases;
};

/**
 * Calculate weighted sentiment combining text analysis and rating
 * @param {Object} textSentiment - Sentiment from text analysis
 * @param {Object} ratingSentiment - Sentiment from rating
 * @returns {Object} Combined sentiment score and category
 */
const combineTextAndRatingSentiment = (textSentiment: Record<string, any>, ratingSentiment: Record<string, any>) => {
  // Default values if parameters are missing
  const textScore = textSentiment?.score || 0;
  const ratingScore = ratingSentiment?.score || 0;
  
  // Weight rating more heavily than text (70% rating, 30% text)
  const combinedScore = (ratingScore * 0.7) + (textScore * 0.3);
  
  return {
    score: parseFloat(combinedScore.toFixed(2)),
    category: getSentimentCategory(combinedScore),
    components: {
      text: textScore,
      rating: ratingScore
    }
  };
};

/**
 * Detect sentiment inconsistency between rating and review text
 * @param {Object} review - Review with rating and comment
 * @returns {Boolean} True if sentiment is inconsistent
 */
const hasSentimentInconsistency = (review: Record<string, any>) => {
  if (!review || !review.rating || !review.comment) return false;
  
  const ratingSentiment = getSentimentFromRating(review.rating);
  const textSentiment = review.sentiment || { score: 0, category: 'neutral' };
  
  // Check for significant difference between rating sentiment and text sentiment
  const sentimentDifference = Math.abs(ratingSentiment.score - textSentiment.score);
  
  // If difference is greater than 0.5 (on a -1 to 1 scale), there's inconsistency
  return sentimentDifference > 0.5;
};

module.exports = {
  getSentimentCategory,
  normalizeScore,
  getSentimentFromRating,
  extractSentimentPhrases,
  combineTextAndRatingSentiment,
  hasSentimentInconsistency
};
