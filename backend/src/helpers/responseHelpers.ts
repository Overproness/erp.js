// @ts-nocheck
/**
 * Review Response Helper Functions
 * Template variable replacement and personalization utilities
 */

/**
 * Parse and replace template variables in response text
 * @param {String} template - Response template text with variables
 * @param {Object} data - Replacement data for variables
 * @returns {String} Processed response text
 */
const processTemplate = (template, data) => {
  if (!template) return '';
  
  let processed = template;
  
  // Replace {{variable}} patterns with actual values
  const variableRegex = /\{\{([^}]+)\}\}/g;
  processed = processed.replace(variableRegex, (match, variable) => {
    const trimmedVar = variable.trim();
    // Handle nested properties with dot notation (e.g. customer.name)
    if (trimmedVar.includes('.')) {
      const parts = trimmedVar.split('.');
      let value = data;
      for (const part of parts) {
        value = value?.[part];
        if (value === undefined) return match; // Return original if property doesn't exist
      }
      return value || '';
    }
    
    // Simple variable replacement
    return data[trimmedVar] !== undefined ? data[trimmedVar] : '';
  });
  
  return processed;
};

/**
 * Generate appropriate variable data for response templates
 * @param {Object} review - Review object
 * @param {Object} business - Business object
 * @param {Object} responder - User who's responding
 * @returns {Object} Variables for template processing
 */
const generateTemplateVariables = (review, business, responder) => {
  const now = new Date();
  
  return {
    customer: {
      name: review?.client?.name || 'Valued Customer',
      firstName: (review?.client?.name || '').split(' ')[0] || 'Valued Customer',
      email: review?.client?.email || ''
    },
    business: {
      name: business?.name || 'Our Business',
      address: business?.address || '',
      phone: business?.phone || '',
      website: business?.website || ''
    },
    review: {
      rating: review?.rating || 0,
      date: review?.publishedAt ? formatDate(review.publishedAt) : formatDate(now),
      platform: review?.platform || 'our platform',
      comment: review?.comment || ''
    },
    responder: {
      name: responder?.name || 'Management',
      title: responder?.title || 'Manager',
      signature: responder?.signature || 'The Management Team'
    },
    date: formatDate(now),
    currentYear: now.getFullYear()
  };
};

/**
 * Format date for templates
 * @param {Date} date - Date to format
 * @param {String} format - Format type
 * @returns {String} Formatted date string
 */
const formatDate = (date, format = 'medium') => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('en-US');
    case 'long':
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'medium':
    default:
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
  }
};

/**
 * Select the best template for a review based on sentiment and platform
 * @param {Array} templates - Available response templates
 * @param {Object} review - Review to respond to
 * @returns {Object} Best matching template
 */
const selectBestTemplate = (templates, review) => {
  if (!templates || !templates.length || !review) return null;
  
  // Extract relevant criteria for matching
  const sentiment = review.sentiment?.category || 'neutral';
  const rating = review.rating || 0;
  const platform = review.platform || 'general';
  
  // Score each template for suitability
  const scoredTemplates = templates.map(template => {
    let score = 0;
    
    // Sentiment match is most important
    if (template.sentimentType === sentiment) {
      score += 10;
    } else if (
      (template.sentimentType === 'positive' && rating >= 4) ||
      (template.sentimentType === 'negative' && rating <= 2) ||
      (template.sentimentType === 'neutral' && rating === 3)
    ) {
      score += 5;
    }
    
    // Platform match
    if (template.platform === platform) {
      score += 3;
    } else if (template.platform === 'all' || template.platform === 'general') {
      score += 1;
    }
    
    // Business match
    if (template.business && template.business.equals(review.business)) {
      score += 2;
    }
    
    return {
      template,
      score
    };
  });
  
  // Sort by score (highest first) and return best match
  scoredTemplates.sort((a, b) => b.score - a.score);
  return scoredTemplates[0]?.template || null;
};

/**
 * Personalize response based on review context
 * @param {String} responseText - Base response text
 * @param {Object} review - Review to respond to
 * @returns {String} Personalized response text
 */
const personalizeResponse = (responseText, review) => {
  if (!responseText || !review) return responseText || '';
  
  let personalized = responseText;
  
  // Add reviewer name acknowledgment if not present and we know their name
  if (
    review.client?.name &&
    !responseText.toLowerCase().includes(review.client.name.toLowerCase()) &&
    !responseText.toLowerCase().includes('dear customer')
  ) {
    const greeting = `Dear ${review.client.name},\n\n`;
    personalized = greeting + personalized;
  }
  
  // Add rating acknowledgment if not present
  if (
    review.rating &&
    !responseText.toLowerCase().includes('star') &&
    !responseText.toLowerCase().includes('rating')
  ) {
    const ratingText = review.rating >= 4
      ? `Thank you for your ${review.rating}-star rating! `
      : `We appreciate your feedback and ${review.rating}-star rating. `;
      
    // Add after first paragraph or at beginning
    const firstParagraphEnd = personalized.indexOf('\n\n');
    if (firstParagraphEnd > 0) {
      personalized = 
        personalized.substring(0, firstParagraphEnd) + 
        ' ' + ratingText + 
        personalized.substring(firstParagraphEnd);
    } else {
      personalized = ratingText + personalized;
    }
  }
  
  return personalized;
};

/**
 * Check if a response is appropriate for a given review
 * @param {String} responseText - Response to check
 * @param {Object} review - Associated review
 * @returns {Object} Validation result with issues if any
 */
const validateResponseAppropriateness = (responseText, review) => {
  if (!responseText) {
    return { isValid: false, issues: ['Response text is empty'] };
  }
  
  const issues = [];
  
  // Check for minimum length
  if (responseText.length < 20) {
    issues.push('Response is too short to be meaningful');
  }
  
  // Check for excessive length
  if (responseText.length > 1000) {
    issues.push('Response is too long (maximum 1000 characters)');
  }
  
  // Check tone appropriateness based on review sentiment
  if (review && review.sentiment) {
    const negativeWords = ['sorry', 'apologize', 'unfortunate', 'regret'];
    const positiveWords = ['thank', 'appreciate', 'happy', 'glad', 'delighted'];
    
    if (review.sentiment.category === 'negative' || review.rating <= 2) {
      // For negative reviews, check for acknowledgment words
      const hasAcknowledgment = negativeWords.some(word => 
        responseText.toLowerCase().includes(word)
      );
      
      if (!hasAcknowledgment) {
        issues.push('Response to negative review should include acknowledgment or apology');
      }
    }
    
    if (review.sentiment.category === 'positive' || review.rating >= 4) {
      // For positive reviews, check for gratitude words
      const hasGratitude = positiveWords.some(word => 
        responseText.toLowerCase().includes(word)
      );
      
      if (!hasGratitude) {
        issues.push('Response to positive review should include gratitude or appreciation');
      }
    }
  }
  
  // Check for templated-looking text without personalization
  const templatedPhrases = [
    '{{customer.name}}',
    '{{review.rating}}',
    '{{business.name}}',
    '[CUSTOMER_NAME]',
    '[RATING]'
  ];
  
  for (const phrase of templatedPhrases) {
    if (responseText.includes(phrase)) {
      issues.push('Response contains unparsed template variables');
      break;
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

module.exports = {
  processTemplate,
  generateTemplateVariables,
  formatDate,
  selectBestTemplate,
  personalizeResponse,
  validateResponseAppropriateness
};
