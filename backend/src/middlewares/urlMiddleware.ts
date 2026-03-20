// @ts-nocheck
const rateLimit = require('express-rate-limit');
const urlHelpers = require('../helpers/urlHelpers');
const urlService = require('../services/urlService');
const urlAnalyticsService = require('../services/urlAnalyticsService');

class URLMiddleware {
  /**
   * Validate short code format
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Next middleware function
   */
  validateShortCode(req, res, next) {
    const { shortCode } = req.params;
    
    if (!shortCode) {
      return res.status(400).json({
        success: false,
        message: 'Short code is required'
      });
    }

    const validation = urlHelpers.validateShortCodeFormat(shortCode);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    // Add normalized code to request
    req.normalizedShortCode = validation.normalizedCode;
    next();
  }

  /**
   * Check URL access permissions
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Next middleware function
   */
  async checkUrlAccess(req, res, next) {
    try {
      const { shortCode } = req.params;
      const userId = req.admin?.id || null;
      const ipAddress = req.ip || req.connection.remoteAddress;

      // Find URL by short code
      const url = await urlService.findByShortCode(shortCode);
      
      if (!url) {
        return res.status(404).json({
          success: false,
          message: 'URL not found'
        });
      }

      // Check if URL is active
      if (!url.isActive) {
        return res.status(410).json({
          success: false,
          message: 'URL is no longer active'
        });
      }

      // Check expiration
      if (url.expiresAt && new Date(url.expiresAt) <= new Date()) {
        return res.status(410).json({
          success: false,
          message: 'URL has expired'
        });
      }

      // Check click limit
      if (url.maxClicks && url.totalClicks >= url.maxClicks) {
        return res.status(410).json({
          success: false,
          message: 'URL has reached its click limit'
        });
      }

      // Check authentication requirement
      if (url.requiresAuth && !userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to access this URL'
        });
      }

      // Check user access permissions
      if (url.allowedUsers && url.allowedUsers.length > 0) {
        if (!userId || !url.allowedUsers.includes(userId)) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to access this URL'
          });
        }
      }

      // Check IP restrictions
      if (url.ipRestrictions && url.ipRestrictions.length > 0) {
        const isAllowed = url.ipRestrictions.some(restriction => {
          if (restriction.includes('/')) {
            // CIDR notation
            return this._isIPInCIDR(ipAddress, restriction);
          } else {
            // Direct IP match
            return ipAddress === restriction;
          }
        });

        if (!isAllowed) {
          return res.status(403).json({
            success: false,
            message: 'Access denied from your IP address'
          });
        }
      }

      // Check country restrictions
      if (url.countryRestrictions && url.countryRestrictions.length > 0) {
        const location = await this._getLocationFromIP(ipAddress);
        
        if (location.country) {
          const isAllowed = url.countryRestrictions.includes(location.country);
          
          if (!isAllowed) {
            return res.status(403).json({
              success: false,
              message: 'Access denied from your location'
            });
          }
        }
      }

      // Store URL in request for later use
      req.urlData = url;
      next();
    } catch (error) {
      console.error('Error checking URL access:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking URL access'
      });
    }
  }

  /**
   * Rate limiting for URL clicks
   */
  rateLimitClicks() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: {
        success: false,
        message: 'Too many requests, please try again later'
      },
      standardHeaders: true,
      legacyHeaders: false,
      // Skip successful requests
      skipSuccessfulRequests: false,
      // Custom key generator based on IP and short code
      keyGenerator: (req) => {
        return `${req.ip}:${req.params.shortCode || 'unknown'}`;
      }
    });
  }

  /**
   * Rate limiting for URL creation
   */
  rateLimitCreation() {
    return rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 50, // Limit each user to 50 URL creations per hour
      message: {
        success: false,
        message: 'URL creation rate limit exceeded'
      },
      keyGenerator: (req) => {
        return req.admin?.id || req.ip;
      }
    });
  }

  /**
   * Log URL access attempts
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Next middleware function
   */
  async logUrlAccess(req, res, next) {
    try {
      const startTime = Date.now();
      const originalSend = res.send;

      // Override res.send to capture response
      res.send = function(data) {
        const responseTime = Date.now() - startTime;
        
        // Log access attempt
        setImmediate((async () => {
          try {
            await this._logAccess(req, res, responseTime);
          } catch (error) {
            console.error('Error logging URL access:', error);
          }
        }).bind(req.urlMiddleware));

        // Call original send
        return originalSend.call(this, data);
      };

      req.urlMiddleware = this;
      next();
    } catch (error) {
      console.error('Error setting up URL access logging:', error);
      next();
    }
  }

  /**
   * Handle password protection
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Next middleware function
   */
  async handlePasswordProtection(req, res, next) {
    try {
      const url = req.urlData;
      
      if (!url.passwordProtected) {
        return next();
      }

      const { password } = req.body;
      
      if (!password) {
        return res.status(401).json({
          success: false,
          message: 'Password required',
          requiresPassword: true
        });
      }

      // Verify password (assuming it's hashed)
      const bcrypt = require('bcrypt');
      const isValidPassword = await bcrypt.compare(password, url.password);
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password'
        });
      }

      next();
    } catch (error) {
      console.error('Error handling password protection:', error);
      res.status(500).json({
        success: false,
        message: 'Error verifying password'
      });
    }
  }

  /**
   * Track URL click analytics
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Next middleware function
   */
  async trackClick(req, res, next) {
    try {
      const url = req.urlData;
      const userId = req.admin?.id || null;
      const sessionId = req.sessionID || this._generateSessionId(req);
      
      // Extract click data
      const clickData = {
        urlId: url._id,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        referrer: req.get('Referer'),
        userId,
        sessionId,
        utmParameters: this._extractUTMParameters(req),
        responseTime: 0 // Will be set by response middleware
      };

      // Record click asynchronously
      setImmediate(async () => {
        try {
          await urlAnalyticsService.recordClick(clickData);
          await urlService.incrementClickCount(url._id);
        } catch (error) {
          console.error('Error recording click:', error);
        }
      });

      next();
    } catch (error) {
      console.error('Error tracking click:', error);
      next(); // Continue despite tracking error
    }
  }

  /**
   * Validate URL creation input
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Next middleware function
   */
  validateUrlCreation(req, res, next) {
    const { originalUrl, customShortCode, title } = req.body;

    // Validate original URL
    if (!originalUrl) {
      return res.status(400).json({
        success: false,
        message: 'Original URL is required'
      });
    }

    const urlValidation = urlHelpers.validateUrlFormat(originalUrl);
    if (!urlValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: urlValidation.error
      });
    }

    // Validate custom short code if provided
    if (customShortCode) {
      const codeValidation = urlHelpers.validateShortCodeFormat(customShortCode);
      if (!codeValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: `Custom short code: ${codeValidation.error}`
        });
      }
    }

    // Validate title if provided
    if (title && title.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Title must be less than 200 characters'
      });
    }

    // Check URL safety
    const safetyCheck = urlHelpers.checkUrlSafety(originalUrl);
    if (!safetyCheck.isSafe) {
      return res.status(400).json({
        success: false,
        message: `URL rejected: ${safetyCheck.reason}`
      });
    }

    next();
  }

  /**
   * Check if IP is in CIDR range
   * @param {string} ip - IP address to check
   * @param {string} cidr - CIDR notation
   * @returns {boolean} True if IP is in range
   */
  _isIPInCIDR(ip, cidr) {
    // Simple implementation - in production use a proper library
    const [network, prefixLength] = cidr.split('/');
    const prefixLen = parseInt(prefixLength);
    
    // Convert IPs to integers and compare
    // This is a simplified version - use ip-range-check library for production
    return false; // Placeholder
  }

  /**
   * Get location from IP address
   * @param {string} ipAddress - IP address
   * @returns {object} Location data
   */
  async _getLocationFromIP(ipAddress) {
    try {
      const geoip = require('geoip-lite');
      const geo = geoip.lookup(ipAddress);
      
      return {
        country: geo?.country || null,
        region: geo?.region || null,
        city: geo?.city || null
      };
    } catch (error) {
      console.error('Error getting location from IP:', error);
      return { country: null, region: null, city: null };
    }
  }

  /**
   * Log access attempt
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {number} responseTime - Response time in ms
   */
  async _logAccess(req, res, responseTime) {
    const logData = {
      shortCode: req.params.shortCode,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referer'),
      statusCode: res.statusCode,
      responseTime,
      timestamp: new Date(),
      userId: req.admin?.id || null
    };

    // Log to database or file
    console.log('URL Access:', JSON.stringify(logData));
  }

  /**
   * Generate session ID
   * @param {object} req - Express request object
   * @returns {string} Session ID
   */
  _generateSessionId(req) {
    const crypto = require('crypto');
    const data = req.ip + req.get('User-Agent') + Date.now();
    return crypto.createHash('md5').update(data).digest('hex');
  }

  /**
   * Extract UTM parameters from request
   * @param {object} req - Express request object
   * @returns {object} UTM parameters
   */
  _extractUTMParameters(req) {
    const utmParams = {};
    const queryParams = req.query;
    
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    
    utmKeys.forEach(key => {
      if (queryParams[key]) {
        utmParams[key] = queryParams[key];
      }
    });

    return utmParams;
  }
}

module.exports = new URLMiddleware();
