const crypto = require('crypto');
const URL = require('@/models/appModels/URL');
const URLClick = require('@/models/appModels/URLClick');
const { customAlphabet } = require('nanoid');

// Custom alphabet for short codes (excluding confusing characters)
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const nanoid = customAlphabet(alphabet, 7);

class URLService {
  /**
   * Generate unique short code
   * @param {number} length - Length of short code
   * @param {string} customCode - Custom short code if provided
   * @returns {Promise<string>} Unique short code
   */
  async generateShortCode(length = 7, customCode = null) {
    if (customCode) {
      // Validate custom code
      if (!this.validateShortCodeFormat(customCode)) {
        throw new Error('Invalid custom short code format');
      }
      
      // Check if custom code already exists
      const existing = await URL.findOne({ shortCode: customCode });
      if (existing) {
        throw new Error('Custom short code already exists');
      }
      
      return customCode;
    }

    // Generate random short code
    let shortCode;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      shortCode = nanoid(length);
      attempts++;
      
      if (attempts > maxAttempts) {
        // Increase length if too many collisions
        length++;
        attempts = 0;
      }
      
      const existing = await URL.findOne({ shortCode });
      if (!existing) {
        return shortCode;
      }
    } while (attempts <= maxAttempts);

    throw new Error('Unable to generate unique short code');
  }

  /**
   * Validate short code format
   * @param {string} shortCode - Short code to validate
   * @returns {boolean} Is valid
   */
  validateShortCodeFormat(shortCode) {
    if (!shortCode || typeof shortCode !== 'string') {
      return false;
    }

    // Check length (3-50 characters)
    if (shortCode.length < 3 || shortCode.length > 50) {
      return false;
    }

    // Check characters (alphanumeric, dash, underscore)
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    return validPattern.test(shortCode);
  }

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {object} Validation result
   */
  validateUrl(url) {
    try {
      const urlObj = new globalThis.URL(url);
      
      // Check protocol
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return {
          isValid: false,
          error: 'URL must use HTTP or HTTPS protocol'
        };
      }

      // Check for basic security issues
      const securityCheck = this.checkUrlSafety(url);
      if (!securityCheck.isSafe) {
        return {
          isValid: false,
          error: securityCheck.reason
        };
      }

      return {
        isValid: true,
        domain: urlObj.hostname,
        protocol: urlObj.protocol,
        sanitizedUrl: this.sanitizeUrl(url)
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid URL format'
      };
    }
  }

  /**
   * Sanitize URL
   * @param {string} url - URL to sanitize
   * @returns {string} Sanitized URL
   */
  sanitizeUrl(url) {
    try {
      const urlObj = new globalThis.URL(url);
      
      // Remove common tracking parameters
      const trackingParams = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'fbclid', 'gclid', 'msclkid', '_ga', '_gl'
      ];
      
      trackingParams.forEach(param => {
        urlObj.searchParams.delete(param);
      });

      return urlObj.toString();
    } catch (error) {
      return url;
    }
  }

  /**
   * Check URL safety
   * @param {string} url - URL to check
   * @returns {object} Safety check result
   */
  checkUrlSafety(url) {
    // Basic malicious URL patterns
    const maliciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i,
      /\.exe$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.scr$/i
    ];

    for (const pattern of maliciousPatterns) {
      if (pattern.test(url)) {
        return {
          isSafe: false,
          reason: 'URL contains potentially malicious content'
        };
      }
    }

    // Check for suspicious domains
    const suspiciousDomains = [
      'bit.ly',
      'tinyurl.com',
      't.co'
    ];

    try {
      const urlObj = new globalThis.URL(url);
      if (suspiciousDomains.includes(urlObj.hostname.toLowerCase())) {
        return {
          isSafe: false,
          reason: 'URL redirects through suspicious domain'
        };
      }
    } catch (error) {
      return {
        isSafe: false,
        reason: 'Invalid URL format'
      };
    }

    return { isSafe: true };
  }

  /**
   * Check for duplicate URLs
   * @param {string} originalUrl - Original URL to check
   * @param {string} ownerId - Owner ID
   * @param {string} excludeId - URL ID to exclude from check
   * @returns {Promise<object>} Duplicate check result
   */
  async checkDuplicates(originalUrl, ownerId, excludeId = null) {
    const filter = {
      originalUrl,
      owner: ownerId,
      isActive: true
    };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    const existing = await URL.findOne(filter);
    
    return {
      isDuplicate: !!existing,
      existingUrl: existing
    };
  }

  /**
   * Check for duplicate URLs (controller expects this signature)
   * @param {string} originalUrl - Original URL to check
   * @param {string} ownerId - Owner ID
   * @param {string} excludeId - (optional) Exclude this URL ID from check
   * @returns {Promise<object|null>} Returns the existing URL document or null
   */
  async checkDuplicateUrl(originalUrl, ownerId, excludeId = null) {
    const filter = {
      originalUrl,
      owner: ownerId
    };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    const existing = await URL.findOne(filter);
    return existing;
  }

  /**
   * Process UTM parameters
   * @param {object} utmParams - UTM parameters
   * @returns {object} Processed UTM parameters
   */
  processUtmParameters(utmParams) {
    const processed = {};
    
    const utmFields = [
      'utmSource', 'utmMedium', 'utmCampaign', 
      'utmTerm', 'utmContent'
    ];

    utmFields.forEach(field => {
      if (utmParams[field]) {
        // Sanitize and validate UTM parameter
        processed[field] = utmParams[field]
          .toString()
          .trim()
          .substring(0, 255); // Limit length
      }
    });

    return processed;
  }

  /**
   * Generate QR code for URL
   * @param {string} url - URL to generate QR code for
   * @param {object} options - QR code options
   * @returns {Promise<string>} Base64 encoded QR code
   */
  async generateQRCode(url, options = {}) {
    try {
      const QRCode = require('qrcode');
      
      const qrOptions = {
        width: options.width || 300,
        height: options.height || 300,
        margin: options.margin || 2,
        color: {
          dark: options.darkColor || '#000000',
          light: options.lightColor || '#FFFFFF'
        },
        errorCorrectionLevel: options.errorLevel || 'M'
      };

      const qrCodeDataUrl = await QRCode.toDataURL(url, qrOptions);
      return qrCodeDataUrl;
    } catch (error) {
      throw new Error('Failed to generate QR code: ' + error.message);
    }
  }

  /**
   * Schedule URL expiration
   * @param {string} urlId - URL ID
   * @param {Date} expirationDate - Expiration date
   * @returns {Promise<void>}
   */
  async scheduleExpiration(urlId, expirationDate) {
    if (!expirationDate || expirationDate <= new Date()) {
      return;
    }

    // In production, use a job queue like Bull or Agenda
    const timeUntilExpiration = expirationDate.getTime() - Date.now();
    
    if (timeUntilExpiration > 0 && timeUntilExpiration < 2147483647) { // Max setTimeout value
      setTimeout(async () => {
        try {
          await URL.findByIdAndUpdate(urlId, {
            isActive: false,
            expiredAt: new Date()
          });
        } catch (error) {
          console.error('Error expiring URL:', error);
        }
      }, timeUntilExpiration);
    }
  }

  /**
   * Build tracking URL with UTM parameters
   * @param {string} baseUrl - Base URL
   * @param {object} utmParams - UTM parameters
   * @returns {string} URL with UTM parameters
   */
  buildTrackingUrl(baseUrl, utmParams) {
    try {
      const urlObj = new globalThis.URL(baseUrl);
      
      const utmMapping = {
        utmSource: 'utm_source',
        utmMedium: 'utm_medium',
        utmCampaign: 'utm_campaign',
        utmTerm: 'utm_term',
        utmContent: 'utm_content'
      };

      Object.entries(utmMapping).forEach(([key, param]) => {
        if (utmParams[key]) {
          urlObj.searchParams.set(param, utmParams[key]);
        }
      });

      return urlObj.toString();
    } catch (error) {
      return baseUrl;
    }
  }

  /**
   * Extract domain from URL
   * @param {string} url - URL to extract domain from
   * @returns {string} Domain
   */
  extractDomain(url) {
    try {
      const urlObj = new globalThis.URL(url);
      return urlObj.hostname;
    } catch (error) {
      return '';
    }
  }

  /**
   * Generate URL by short code
   * @param {string} shortCode - Short code
   * @param {object} options - Options
   * @returns {Promise<object>} URL data
   */
  async findByShortCode(shortCode, options = {}) {
    const query = URL.findOne({ shortCode, isActive: true });

    if (options.populate) {
      query.populate(options.populate);
    }

    const url = await query.lean();
    
    if (!url) {
      return null;
    }

    // Check expiration
    if (url.expiresAt && url.expiresAt <= new Date()) {
      await URL.findByIdAndUpdate(url._id, {
        isActive: false,
        expiredAt: new Date()
      });
      return null;
    }

    // Check click limit
    if (url.maxClicks && url.totalClicks >= url.maxClicks) {
      await URL.findByIdAndUpdate(url._id, {
        isActive: false,
        clickLimitReached: true
      });
      return null;
    }

    return url;
  }

  /**
   * Increment click count
   * @param {string} urlId - URL ID
   * @returns {Promise<void>}
   */
  async incrementClickCount(urlId) {
    await URL.findByIdAndUpdate(urlId, {
      $inc: { totalClicks: 1 },
      lastClickedAt: new Date()
    });
  }

  /**
   * Batch delete URLs
   * @param {Array} urlIds - Array of URL IDs
   * @param {string} ownerId - Owner ID
   * @returns {Promise<object>} Delete result
   */
  async batchDelete(urlIds, ownerId) {
    const result = await URL.updateMany(
      {
        _id: { $in: urlIds },
        owner: ownerId
      },
      {
        isActive: false,
        deletedAt: new Date()
      }
    );

    return {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    };
  }

  /**
   * Get URL statistics
   * @param {string} ownerId - Owner ID
   * @returns {Promise<object>} URL statistics
   */
  async getUrlStatistics(ownerId) {
    const [totalUrls, activeUrls, totalClicks, topUrls] = await Promise.all([
      URL.countDocuments({ owner: ownerId }),
      URL.countDocuments({ owner: ownerId, isActive: true }),
      URL.aggregate([
        { $match: { owner: ownerId } },
        { $group: { _id: null, total: { $sum: '$totalClicks' } } }
      ]),
      URL.find({ owner: ownerId, isActive: true })
        .sort({ totalClicks: -1 })
        .limit(5)
        .select('shortCode title totalClicks originalUrl')
    ]);

    return {
      totalUrls,
      activeUrls,
      totalClicks: totalClicks[0]?.total || 0,
      topUrls
    };
  }

  /**
   * Validate and sanitize URL (for controller usage)
   * @param {string} url - URL to validate and sanitize
   * @returns {string|null} Sanitized URL if valid, otherwise null
   */
  async validateAndSanitizeUrl(url) {
    const validation = this.validateUrl(url);
    if (validation.isValid && validation.sanitizedUrl) {
      return validation.sanitizedUrl;
    }
    return null;
  }

  /**
   * Validate short code (controller expects this signature)
   * @param {string} shortCode
   * @returns {Promise<boolean>} True if valid and not in use, false otherwise
   */
  async validateShortCode(shortCode) {
    // Format check
    if (!this.validateShortCodeFormat(shortCode)) return false;
    // Reserved codes (add your reserved list here if needed)
    const reserved = [
      'api', 'admin', 'www', 'app', 'mail', 'ftp', 'blog', 'help',
      'support', 'contact', 'about', 'privacy', 'terms', 'login',
      'signup', 'dashboard', 'settings', 'profile', 'account', 'docs',
      'status', 'health', 'metrics', 'analytics', 'reports', 'assets'
    ];
    if (reserved.includes(shortCode.toLowerCase())) return false;
    // Uniqueness check
    const existing = await URL.findOne({ shortCode });
    return !existing;
  }

  /**
   * Hash password for password-protected URLs
   * @param {string} password
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password) {
    const bcrypt = require('bcryptjs');
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password for password-protected URLs
   * @param {string} plainPassword
   * @param {string} hashedPassword
   * @returns {Promise<boolean>}
   */
  async verifyPassword(plainPassword, hashedPassword) {
    const bcrypt = require('bcryptjs');
    if (!plainPassword || !hashedPassword) return false;
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Extract page title from a URL (stub for now)
   * @param {string} url
   * @returns {Promise<string>} Title or empty string
   */
  async extractPageTitle(url) {
    // For now, just return empty string or implement real logic if needed
    return '';
  }
}

module.exports = new URLService();
