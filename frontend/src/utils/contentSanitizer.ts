/**
 * Utility for sanitizing potentially inappropriate content
 */

// List of terms to replace with appropriate alternatives
const inappropriateTerms = [
  // Add terms that should be filtered
  // Using regex with word boundaries to catch only whole words
  { pattern: /\bn[i1]gg[e3]r/i, replacement: '[inappropriate term]' },
  { pattern: /\bf[u*]ck/i, replacement: '[inappropriate term]' },
  { pattern: /\bb[i1]tch/i, replacement: '[inappropriate term]' },
  // Add other patterns as needed
];

/**
 * Sanitizes a single string value
 * 
 * @param {string} text The text to sanitize
 * @returns {string} Sanitized text
 */
const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  let sanitized = text;
  inappropriateTerms.forEach(term => {
    sanitized = sanitized.replace(term.pattern, term.replacement);
  });
  
  return sanitized;
};

/**
 * Recursively sanitizes an object's string values
 * 
 * @param {Object|Array|string|number|boolean} data The data to sanitize
 * @returns {Object|Array|string|number|boolean} Sanitized data
 */
const sanitizeData = (data) => {
  if (data === null || data === undefined) return data;
  
  // Handle string values
  if (typeof data === 'string') {
    return sanitizeText(data);
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  
  // Handle objects
  if (typeof data === 'object') {
    const sanitized = {};
    Object.keys(data).forEach(key => {
      sanitized[key] = sanitizeData(data[key]);
    });
    return sanitized;
  }
  
  // Return other types unchanged
  return data;
};

export { sanitizeText, sanitizeData };
