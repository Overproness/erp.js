// @ts-nocheck
const crypto = require('crypto');

/**
 * URL generation utility for review collection
 * Handles secure link generation with tracking
 */

/**
 * Generate a secure random string
 * @param {Number} length - Length of the random string
 * @returns {String} Random string
 */
const generateRandomString = (length = 6) => {
  const buffer = crypto.randomBytes(Math.ceil(length / 2));
  return buffer.toString('hex').slice(0, length);
};

/**
 * Generate a short ID for review links
 * @returns {String} Short unique ID
 */
const generateShortId = () => {
  // Generate a 8-character alphanumeric ID
  // This uses a more readable character set (avoids similar-looking characters)
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  let result = '';
  
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  
  return result;
};

/**
 * Generate a unique identifier with checksum
 * @param {String} businessId - Business ID
 * @returns {String} Unique ID with checksum
 */
const generateIdWithChecksum = (businessId) => {
  const timestamp = Date.now().toString().slice(-6);
  const randomPart = generateRandomString(4);
  const baseString = `${businessId.slice(0, 4)}${timestamp}${randomPart}`;
  
  // Calculate simple checksum
  let checksum = 0;
  for (let i = 0; i < baseString.length; i++) {
    checksum += baseString.charCodeAt(i);
  }
  
  checksum = checksum % 36;
  const checksumChar = checksum < 10 ? 
    checksum.toString() : 
    String.fromCharCode(checksum - 10 + 65);
  
  return `${baseString}${checksumChar}`;
};

/**
 * Validate a review link ID
 * @param {String} linkId - Review link ID to validate
 * @returns {Boolean} Whether ID is valid
 */
const validateLinkId = (linkId) => {
  // Check format
  if (!linkId || typeof linkId !== 'string' || linkId.length < 8) {
    return false;
  }
  
  // Basic validation only - more complex validation would check the checksum
  return /^[a-zA-Z0-9]{8,32}$/.test(linkId);
};

/**
 * Generate a secure review link
 * @param {Object} options - Link generation options
 * @param {String} options.businessId - Business ID
 * @param {String} options.customerId - Optional customer ID
 * @param {Date} options.expiryDate - Optional expiry date
 * @param {Boolean} options.isOneTime - Whether link is single-use
 * @param {Object} options.branding - Custom branding options
 * @returns {Object} Generated link object
 */
const generateReviewLink = (options) => {
  const {
    businessId,
    customerId = null,
    expiryDate = null,
    isOneTime = false,
    branding = null
  } = options;
  
  // Generate link ID
  const linkId = generateShortId();
  
  // Generate optional secure token if link is private
  const secureToken = isOneTime ? generateRandomString(16) : null;
  
  // Calculate expiry date if not provided
  const expiry = expiryDate || new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)); // 30 days default
  
  // Return link object
  return {
    linkId,
    businessId,
    customerId,
    secureToken,
    expiryDate: expiry,
    isOneTime,
    branding,
    createdAt: new Date(),
    usageCount: 0,
    isActive: true
  };
};

/**
 * Build full review link URL
 * @param {Object} link - Link object
 * @param {String} baseUrl - Base URL of the application
 * @returns {String} Full URL for review submission
 */
const buildReviewUrl = (link, baseUrl) => {
  if (!link || !link.linkId || !baseUrl) {
    throw new Error('Missing required parameters for URL generation');
  }
  
  let url = `${baseUrl}/review/${link.linkId}`;
  
  // Add secure token if provided
  if (link.secureToken) {
    url += `?token=${encodeURIComponent(link.secureToken)}`;
  }
  
  // Add customer ID if provided
  if (link.customerId) {
    const separator = url.includes('?') ? '&' : '?';
    url += `${separator}cid=${encodeURIComponent(link.customerId)}`;
  }
  
  return url;
};

/**
 * Generate tracking parameters for URL
 * @param {Object} options - Tracking options
 * @param {String} options.source - Traffic source
 * @param {String} options.medium - Traffic medium
 * @param {String} options.campaign - Campaign name
 * @returns {String} URL query parameters for tracking
 */
const generateTrackingParams = (options = {}) => {
  const {
    source = 'direct',
    medium = 'link',
    campaign = 'review_request',
    term = null,
    content = null
  } = options;
  
  let params = `utm_source=${encodeURIComponent(source)}&utm_medium=${encodeURIComponent(medium)}&utm_campaign=${encodeURIComponent(campaign)}`;
  
  if (term) {
    params += `&utm_term=${encodeURIComponent(term)}`;
  }
  
  if (content) {
    params += `&utm_content=${encodeURIComponent(content)}`;
  }
  
  return params;
};

/**
 * Add tracking to a review URL
 * @param {String} url - Base review URL
 * @param {Object} trackingOptions - Tracking parameters
 * @returns {String} URL with tracking parameters
 */
const addTrackingToUrl = (url, trackingOptions) => {
  if (!url) return '';
  
  const trackingParams = generateTrackingParams(trackingOptions);
  const separator = url.includes('?') ? '&' : '?';
  
  return `${url}${separator}${trackingParams}`;
};

/**
 * Generate a QR code URL for a review link
 * @param {String} reviewUrl - Review URL
 * @param {Object} options - QR code options
 * @returns {String} QR code image URL
 */
const generateQrCodeUrl = (reviewUrl, options = {}) => {
  const {
    size = 300,
    margin = 4,
    color = '000000',
    backgroundColor = 'FFFFFF',
    format = 'png'
  } = options;
  
  // Use Google Charts API for QR code generation
  // Note: For production, consider using a dedicated QR code library or service
  const encodedUrl = encodeURIComponent(reviewUrl);
  
  return `https://chart.googleapis.com/chart?cht=qr&chs=${size}x${size}&chl=${encodedUrl}&chld=H|${margin}&chco=${color}&chf=bg,s,${backgroundColor}`;
};

module.exports = {
  generateShortId,
  generateIdWithChecksum,
  validateLinkId,
  generateReviewLink,
  buildReviewUrl,
  generateTrackingParams,
  addTrackingToUrl,
  generateQrCodeUrl
};
