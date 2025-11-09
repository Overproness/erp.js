const { BadWords } = require('bad-words');
const filter = new BadWords({ placeHolder: '*' });

/**
 * Review validation utility
 * Handles content validation, spam detection, and structure validation
 */

/**
 * Validate review content structure
 * @param {Object} review - Review object
 * @returns {Object} Validation result with status and messages
 */
const validateReviewStructure = (review) => {
  const errors = [];
  
  // Check for required fields
  if (!review.rating) errors.push('Rating is required');
  if (review.rating < 1 || review.rating > 5) errors.push('Rating must be between 1 and 5');
  
  // Validate client information
  if (!review.client || !review.client.name) {
    errors.push('Reviewer name is required');
  }
  
  // Validate business information
  if (!review.business) errors.push('Business ID is required');
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Check if review content contains profanity
 * @param {String} content - Review comment
 * @returns {Boolean} True if profanity detected
 */
const containsProfanity = (content) => {
  if (!content) return false;
  return filter.isProfane(content);
};

/**
 * Clean review content by filtering profanity
 * @param {String} content - Review comment
 * @returns {String} Cleaned review content
 */
const cleanReviewContent = (content) => {
  if (!content) return '';
  return filter.clean(content);
};

/**
 * Detect review spam based on patterns
 * @param {Object} review - Review object
 * @returns {Object} Spam detection result
 */
const detectSpam = (review) => {
  if (!review || !review.comment) return { isSpam: false, reasons: [] };
  
  const reasons = [];
  const { comment, client } = review;
  
  // Check for URL patterns
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  if (urlPattern.test(comment)) {
    reasons.push('Review contains URLs');
  }
  
  // Check for email patterns
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  if (emailPattern.test(comment)) {
    reasons.push('Review contains email addresses');
  }
  
  // Check for phone number patterns
  const phonePattern = /(\+\d{1,3}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}/g;
  if (phonePattern.test(comment)) {
    reasons.push('Review contains phone numbers');
  }
  
  // Check for excessive capitalization
  const words = comment.split(' ');
  const capsWords = words.filter(word => word.length > 2 && word === word.toUpperCase());
  if (capsWords.length > words.length * 0.3) {
    reasons.push('Review contains excessive capitalization');
  }
  
  // Check for repetitive characters
  const repetitivePattern = /(.)\1{4,}/;
  if (repetitivePattern.test(comment)) {
    reasons.push('Review contains repetitive characters');
  }
  
  // Check for keyword stuffing
  const keywordStuffingPattern = /(buy|sell|discount|offer|cheap|free|guarantee|money).{0,15}\1.{0,15}\1/i;
  if (keywordStuffingPattern.test(comment)) {
    reasons.push('Review contains keyword stuffing');
  }
  
  return {
    isSpam: reasons.length > 0,
    reasons
  };
};

/**
 * Validate review submission
 * @param {Object} review - Review object
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
const validateReviewSubmission = (review, options = {}) => {
  const {
    allowProfanity = false,
    spamCheck = true,
    contentLengthLimit = 2000,
    autoClean = false
  } = options;
  
  // Create a copy that we might modify
  let validatedReview = { ...review };
  const issues = [];
  
  // Check structure
  const structureValidation = validateReviewStructure(validatedReview);
  if (!structureValidation.isValid) {
    issues.push(...structureValidation.errors);
  }
  
  // Content length check
  if (validatedReview.comment && validatedReview.comment.length > contentLengthLimit) {
    issues.push(`Review comment exceeds maximum length of ${contentLengthLimit} characters`);
  }
  
  // Profanity check
  if (!allowProfanity && validatedReview.comment && containsProfanity(validatedReview.comment)) {
    issues.push('Review contains inappropriate language');
    
    // Auto-clean if enabled
    if (autoClean) {
      validatedReview.comment = cleanReviewContent(validatedReview.comment);
    }
  }
  
  // Spam detection
  if (spamCheck && validatedReview.comment) {
    const spamResult = detectSpam(validatedReview);
    if (spamResult.isSpam) {
      issues.push(`Potential spam detected: ${spamResult.reasons.join(', ')}`);
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    review: validatedReview
  };
};

module.exports = {
  validateReviewStructure,
  containsProfanity,
  cleanReviewContent,
  detectSpam,
  validateReviewSubmission
};
  // Suspicious submission check
  const isSuspicious = await isSuspiciousSubmission(review, ipAddress);
  if (isSuspicious) {
    return {
      isValid: false,
      errors: ['Suspicious submission pattern detected'],
      validationType: 'suspicious'
    };
  }
  
  return { isValid: true };
};

module.exports = {
  validateReview,
  validateReviewStructure,
  hasProfanity,
  cleanProfanity,
  detectSpam,
  isSuspiciousSubmission
};
