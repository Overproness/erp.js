// @ts-nocheck

import { createError } from '@/handlers/errorHandlers';
import analyticsHelpers from '../helpers/analyticsHelpers';
import ReviewLink from '@/models/appModels/ReviewLink';
import Review from '@/models/appModels/Review';
import crypto from 'crypto';
import { createRequire } from 'module';
const load = createRequire(__filename);
class AnalyticsMiddleware {
  /**
   * Track page views for URLs
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Next middleware function
   */
  trackPageView(req, res, next) {
    // Add page view tracking data to request
    req.pageView = {
      timestamp: new Date(),
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referer'),
      ipAddress: req.ip || req.connection.remoteAddress,
      sessionId: req.sessionID || this._generateSessionId(req)
    };

    // Process page view asynchronously
    setImmediate(() => {
      this._processPageView(req.pageView);
    });

    next();
  }

  /**
   * Capture detailed click metadata
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Next middleware function
   */
  captureClickData(req, res, next) {
    const startTime = Date.now();
    
    // Parse user agent
    const deviceInfo = analyticsHelpers.parseUserAgent(req.get('User-Agent'));
    
    // Get location data
    const locationData = analyticsHelpers.getCountryFromIP(
      req.ip || req.connection.remoteAddress
    );

    // Capture comprehensive click data
    req.clickData = {
      timestamp: new Date(),
      responseTime: 0, // Will be calculated later
      device: deviceInfo,
      location: locationData,
      network: {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        acceptLanguage: req.get('Accept-Language'),
        acceptEncoding: req.get('Accept-Encoding')
      },
      request: {
        method: req.method,
        url: req.originalUrl,
        queryParams: req.query,
        headers: this._sanitizeHeaders(req.headers)
      },
      session: {
        sessionId: req.sessionID || this._generateSessionId(req),
        isNewSession: this._isNewSession(req),
        userId: req.admin?.id || null,
        isAuthenticated: !!req.admin
      },
      referrer: this._parseReferrer(req.get('Referer')),
      utm: this._extractUTMParameters(req.query)
    };

    // Hook into response to capture response time
    const originalSend = res.send;
    res.send = function(data) {
      req.clickData.responseTime = Date.now() - startTime;
      req.clickData.response = {
        statusCode: res.statusCode,
        contentLength: data ? data.length : 0
      };
      
      return originalSend.call(this, data);
    };

    next();
  }

  /**
   * Detect and filter bot traffic
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Next middleware function
   */
  detectBot(req, res, next) {
    const userAgent = req.get('User-Agent') || '';
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    // Detect bots using analytics helpers
    const deviceInfo = analyticsHelpers.parseUserAgent(userAgent);
    const isBot = deviceInfo.isBot;
    
    // Additional bot detection patterns
    const additionalBotChecks = this._performAdditionalBotChecks(req);
    
    req.botDetection = {
      isBot: isBot || additionalBotChecks.isBot,
      confidence: additionalBotChecks.confidence,
      reasons: additionalBotChecks.reasons,
      userAgent,
      ipAddress
    };

    // If it's a bot and we want to block, return 403
    if (req.botDetection.isBot && req.query.blockBots === 'true') {
      return res.status(403).json({
        success: false,
        message: 'Bot traffic not allowed'
      });
    }

    next();
  }

  /**
   * Session-based tracking
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Next middleware function
   */
  sessionTracking(req, res, next) {
    const sessionId = req.sessionID || this._generateSessionId(req);
    const userId = req.admin?.id || null;
    
    req.sessionTracking = {
      sessionId,
      userId,
      isAuthenticated: !!userId,
      sessionStart: this._getSessionStartTime(sessionId),
      isNewSession: this._isNewSession(req),
      previousPage: req.get('Referer'),
      sessionData: this._getSessionData(sessionId)
    };

    // Update session data
    this._updateSessionData(req.sessionTracking);

    next();
  }

  /**
   * Geographic tracking middleware
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Next middleware function
   */
  geographicTracking(req, res, next) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const locationData = analyticsHelpers.getCountryFromIP(ipAddress);
    
    req.geographic = {
      ...locationData,
      ipAddress: this._hashIP(ipAddress), // Store hashed IP for privacy
      timezone: this._detectTimezone(req),
      language: this._detectLanguage(req)
    };

    next();
  }

  /**
   * Real-time analytics tracking
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Next middleware function
   */
  realTimeTracking(req, res, next) {
    const eventData = {
      type: 'page_view',
      timestamp: new Date(),
      sessionId: req.sessionID || this._generateSessionId(req),
      userId: req.admin?.id || null,
      url: req.originalUrl,
      referrer: req.get('Referer'),
      userAgent: req.get('User-Agent')
    };

    // Emit real-time event (if WebSocket is available)
    if (req.app.locals.io) {
      req.app.locals.io.emit('analytics:real-time', eventData);
    }

    req.realTimeEvent = eventData;
    next();
  }

  /**
   * Privacy-compliant tracking
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Next middleware function
   */
  privacyCompliantTracking(req, res, next) {
    // Check for Do Not Track header
    const doNotTrack = req.get('DNT') === '1' || req.get('Sec-GPC') === '1';
    
    // Check for consent cookies
    const hasConsent = this._checkTrackingConsent(req);
    
    req.privacy = {
      doNotTrack,
      hasConsent,
      shouldTrack: !doNotTrack && hasConsent,
      consentLevel: this._getConsentLevel(req),
      anonymize: doNotTrack || !hasConsent
    };

    // If user doesn't want tracking, skip analytics
    if (!req.privacy.shouldTrack) {
      req.skipAnalytics = true;
    }

    next();
  }

  /**
   * Performance monitoring middleware
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Next middleware function
   */
  performanceMonitoring(req, res, next) {
    const startTime = process.hrtime.bigint();
    
    req.performance = {
      startTime,
      requestSize: req.get('Content-Length') || 0,
      method: req.method,
      url: req.originalUrl
    };

    // Hook into response
    const originalSend = res.send;
    res.send = function(data) {
      const endTime = process.hrtime.bigint();
      const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      
      req.performance.endTime = endTime;
      req.performance.responseTime = responseTime;
      req.performance.responseSize = data ? data.length : 0;
      req.performance.statusCode = res.statusCode;

      // Log slow requests
      if (responseTime > 1000) { // Slower than 1 second
        console.warn('Slow request detected:', {
          url: req.originalUrl,
          method: req.method,
          responseTime: responseTime + 'ms',
          statusCode: res.statusCode
        });
      }

      return originalSend.call(this, data);
    };

    next();
  }

  /**
   * A/B testing middleware
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Next middleware function
   */
  abTestTracking(req, res, next) {
    const sessionId = req.sessionID || this._generateSessionId(req);
    
    req.abTest = {
      sessionId,
      userId: req.admin?.id || null,
      variant: this._determineABTestVariant(req),
      testName: req.query.abtest || null,
      conversionGoal: req.query.goal || null
    };

    // Store variant in session for consistency
    if (req.session && req.abTest.variant) {
      req.session.abTestVariant = req.abTest.variant;
    }

    next();
  }

  /**
   * Conversion tracking middleware
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Next middleware function
   */
  conversionTracking(req, res, next) {
    req.conversion = {
      timestamp: new Date(),
      sessionId: req.sessionID || this._generateSessionId(req),
      userId: req.admin?.id || null,
      conversionType: req.query.conversion || 'click',
      value: parseFloat(req.query.value) || 0,
      currency: req.query.currency || 'USD',
      referrer: req.get('Referer')
    };

    // Track conversion goal completion
    if (req.query.goal) {
      req.conversion.goalName = req.query.goal;
      req.conversion.goalCompleted = true;
    }

    next();
  }

  /**
   * Custom event tracking middleware
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Next middleware function
   */
  customEventTracking(req, res, next) {
    req.customEvent = {
      timestamp: new Date(),
      sessionId: req.sessionID || this._generateSessionId(req),
      userId: req.admin?.id || null,
      eventName: req.query.event || 'custom',
      eventCategory: req.query.category || 'interaction',
      eventLabel: req.query.label || null,
      eventValue: parseFloat(req.query.eventValue) || 0,
      customProperties: this._extractCustomProperties(req.query)
    };

    next();
  }

  /**
   * Capture analytics data from request
   * @returns {Object} Analytics data object
   */
  _captureAnalyticsData(req) {
    return {
      timestamp: new Date(),
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      referer: req.headers.referer || 'direct',
      path: req.originalUrl || req.url,
      queryParams: req.query,
      method: req.method,
      responseTime: req.responseTime,
      businessId: req.business ? req.business._id : undefined,
      linkId: req.reviewLink ? req.reviewLink._id : undefined,
      userId: req.admin ? req.admin._id : undefined
    };
  }

  /**
   * Track portal visit analytics
   */
  _trackPortalVisit(req, res, next) {
    try {
      // Skip tracking for non-GET requests
      if (req.method !== 'GET') {
        return next();
      }
      
      // Start timer for response time
      const startTime = Date.now();
      
      // Handle response finish event
      res.on('finish', async () => {
        try {
          // Calculate response time
          req.responseTime = Date.now() - startTime;
          
          // Capture analytics data
          const analyticsData = this._captureAnalyticsData(req);
          
          // Skip tracking for non-successful responses
          if (res.statusCode >= 400) {
            return;
          }
          
          // Track visit if there's a review link
          if (req.reviewLink && req.reviewLink._id) {
            // Don't await to avoid blocking
            ReviewLink.findByIdAndUpdate(
              req.reviewLink._id,
              { 
                $inc: { visitCount: 1 },
                $push: { 
                  visits: {
                    date: new Date(),
                    ipAddress: req.ip || 'unknown',
                    userAgent: req.headers['user-agent'] || 'unknown',
                    referer: req.headers.referer || 'direct',
                    path: req.originalUrl || req.url,
                    responseTime: req.responseTime,
                    successful: res.statusCode < 400
                  }
                }
              }
            ).catch(err => console.error('Error tracking link visit:', err));
          }
          
          // If you have a general analytics service, send data there
          if (req.app.locals.analyticsService) {
            req.app.locals.analyticsService.trackPageView(analyticsData)
              .catch(err => console.error('Analytics service error:', err));
          }
        } catch (error) {
          console.error('Error in trackPortalVisit:', error);
        }
      });
      
      next();
    } catch (error) {
      // Don't block the request if analytics fails
      console.error('Error setting up analytics tracking:', error);
      next();
    }
  }

  /**
   * Track review submission analytics
   */
  _trackSubmission(req, res, next) {
    try {
      // Only track for POST to review submission endpoints
      if (req.method !== 'POST') {
        return next();
      }
      
      // Store original json method
      const originalJson = res.json;
      
      // Override json method to capture response data
      res.json = function(body) {
        // Only track successful submissions
        if (body && body.success && body.result && body.result._id) {
          try {
            const reviewId = body.result._id;
            const linkId = req.reviewLink ? req.reviewLink._id : null;
            
            // Track submission analytics
            if (linkId) {
              // Don't await to avoid blocking
              ReviewLink.findByIdAndUpdate(
                linkId,
                { 
                  $inc: { conversionCount: 1 },
                  $push: { 
                    conversions: {
                      date: new Date(),
                      reviewId,
                      ipAddress: req.ip || 'unknown',
                      userAgent: req.headers['user-agent'] || 'unknown',
                      referer: req.headers.referer || 'direct'
                    }
                  }
                }
              ).catch(err => console.error('Error tracking link conversion:', err));
            }
            
            // Add submission analytics to review
            Review.findByIdAndUpdate(
              reviewId,
              {
                submissionData: {
                  ipAddress: req.ip || 'unknown',
                  userAgent: req.headers['user-agent'] || 'unknown',
                  referer: req.headers.referer || 'direct',
                  submittedAt: new Date()
                }
              }
            ).catch(err => console.error('Error updating review submission data:', err));
            
            // If you have a general analytics service
            if (req.app.locals.analyticsService) {
              req.app.locals.analyticsService.trackConversion({
                type: 'review_submission',
                reviewId,
                linkId,
                businessId: req.business ? req.business._id : undefined,
                timestamp: new Date(),
                rating: body.result.rating,
                source: req.headers.referer || 'direct'
              }).catch(err => console.error('Analytics service error:', err));
            }
          } catch (error) {
            console.error('Error tracking submission:', error);
          }
        }
        
        // Call the original json method
        return originalJson.call(this, body);
      };
      
      next();
    } catch (error) {
      // Don't block the request if analytics fails
      console.error('Error setting up submission tracking:', error);
      next();
    }
  }

  /**
   * Attach UTM parameters to review data
   */
  _trackUtmParameters(req, res, next) {
    try {
      // Extract UTM parameters from query string
      const utmParams = {};
      const utmFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
      
      utmFields.forEach(field => {
        if (req.query[field]) {
          utmParams[field] = req.query[field];
        }
      });
      
      // If there are UTM parameters, attach to request
      if (Object.keys(utmParams).length > 0) {
        req.utmParams = utmParams;
        
        // For POST requests, add to body for saving with the review
        if (req.method === 'POST' && req.body) {
          req.body.utmParams = utmParams;
        }
      }
      
      next();
    } catch (error) {
      // Don't block the request if UTM tracking fails
      console.error('Error tracking UTM parameters:', error);
      next();
    }
  }

  // Private helper methods

  /**
   * Process page view asynchronously
   * @param {object} pageViewData - Page view data
   */
  _processPageView(pageViewData) {
    // Store in database or analytics service
    console.log('Page view:', pageViewData);
  }

  /**
   * Generate session ID
   * @param {object} req - Express request object
   * @returns {string} Session ID
   */
  _generateSessionId(req) {
    const data = (req.ip || '') + (req.get('User-Agent') || '') + Date.now();
    return crypto.createHash('md5').update(data).digest('hex');
  }

  /**
   * Check if this is a new session
   * @param {object} req - Express request object
   * @returns {boolean} True if new session
   */
  _isNewSession(req) {
    // Check for session cookie or similar indicator
    return !req.cookies || !req.cookies.sessionId;
  }

  /**
   * Sanitize headers for logging
   * @param {object} headers - Request headers
   * @returns {object} Sanitized headers
   */
  _sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    
    // Remove sensitive headers
    delete sanitized.authorization;
    delete sanitized.cookie;
    delete sanitized['x-api-key'];
    
    return sanitized;
  }

  /**
   * Parse referrer information
   * @param {string} referrer - Referrer URL
   * @returns {object} Parsed referrer data
   */
  _parseReferrer(referrer) {
    if (!referrer) {
      return { type: 'direct', domain: null, url: null };
    }

    try {
      const url = new URL(referrer);
      const domain = url.hostname.toLowerCase();
      
      // Determine referrer type
      let type = 'referral';
      
      if (domain.includes('google.')) type = 'search';
      else if (domain.includes('bing.com')) type = 'search';
      else if (domain.includes('yahoo.com')) type = 'search';
      else if (domain.includes('facebook.com')) type = 'social';
      else if (domain.includes('twitter.com')) type = 'social';
      else if (domain.includes('linkedin.com')) type = 'social';
      
      return {
        type,
        domain,
        url: referrer,
        hostname: url.hostname,
        pathname: url.pathname
      };
    } catch (error) {
      return { type: 'unknown', domain: null, url: referrer };
    }
  }

  /**
   * Extract UTM parameters
   * @param {object} query - Query parameters
   * @returns {object} UTM parameters
   */
  _extractUTMParameters(query) {
    const utmParams = {};
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id'];
    
    utmKeys.forEach(key => {
      if (query[key]) {
        utmParams[key] = query[key];
      }
    });

    return Object.keys(utmParams).length > 0 ? utmParams : null;
  }

  /**
   * Perform additional bot detection checks
   * @param {object} req - Express request object
   * @returns {object} Bot detection result
   */
  _performAdditionalBotChecks(req) {
    const userAgent = req.get('User-Agent') || '';
    const ipAddress = req.ip || req.connection.remoteAddress;
    const reasons = [];
    let confidence = 0;

    // Check for missing or suspicious user agent
    if (!userAgent) {
      reasons.push('Missing User-Agent header');
      confidence += 50;
    }

    // Check for bot-like request patterns
    if (req.get('Accept') === '*/*') {
      reasons.push('Generic Accept header');
      confidence += 20;
    }

    // Check for automation tools
    const automationTools = ['curl', 'wget', 'python-requests', 'postman', 'insomnia'];
    if (automationTools.some(tool => userAgent.toLowerCase().includes(tool))) {
      reasons.push('Automation tool detected');
      confidence += 70;
    }

    // Check request frequency (simplified)
    const requestCount = this._getRequestCount(ipAddress);
    if (requestCount > 100) { // More than 100 requests per minute
      reasons.push('High request frequency');
      confidence += 30;
    }

    // Check for headless browser indicators
    if (userAgent.includes('HeadlessChrome') || userAgent.includes('PhantomJS')) {
      reasons.push('Headless browser detected');
      confidence += 60;
    }

    return {
      isBot: confidence >= 70,
      confidence,
      reasons
    };
  }

  /**
   * Get session start time
   * @param {string} sessionId - Session ID
   * @returns {Date} Session start time
   */
  _getSessionStartTime(sessionId) {
    // In production, store this in Redis or database
    return new Date();
  }

  /**
   * Get session data
   * @param {string} sessionId - Session ID
   * @returns {object} Session data
   */
  _getSessionData(sessionId) {
    // In production, retrieve from session store
    return {
      pageViews: 1,
      duration: 0,
      referrer: null
    };
  }

  /**
   * Update session data
   * @param {object} sessionData - Session tracking data
   */
  _updateSessionData(sessionData) {
    // In production, update session store
    console.log('Updating session data:', sessionData.sessionId);
  }

  /**
   * Hash IP address for privacy
   * @param {string} ipAddress - IP address
   * @returns {string} Hashed IP
   */
  _hashIP(ipAddress) {
    const crypto = load('crypto');
    return crypto.createHash('sha256').update(ipAddress).digest('hex').substring(0, 8);
  }

  /**
   * Detect timezone from request
   * @param {object} req - Express request object
   * @returns {string} Timezone
   */
  _detectTimezone(req) {
    return req.get('X-Timezone') || 'UTC';
  }

  /**
   * Detect language from request
   * @param {object} req - Express request object
   * @returns {string} Language code
   */
  _detectLanguage(req) {
    const acceptLanguage = req.get('Accept-Language');
    if (acceptLanguage) {
      return acceptLanguage.split(',')[0].split('-')[0];
    }
    return 'en';
  }

  /**
   * Check tracking consent
   * @param {object} req - Express request object
   * @returns {boolean} True if consent given
   */
  _checkTrackingConsent(req) {
    // Check for consent cookie
    return req.cookies && req.cookies.tracking_consent === 'true';
  }

  /**
   * Get consent level
   * @param {object} req - Express request object
   * @returns {string} Consent level
   */
  _getConsentLevel(req) {
    if (req.cookies && req.cookies.tracking_consent) {
      return req.cookies.tracking_level || 'basic';
    }
    return 'none';
  }

  /**
   * Determine A/B test variant
   * @param {object} req - Express request object
   * @returns {string} Test variant
   */
  _determineABTestVariant(req) {
    // Simple hash-based assignment
    if (req.query.abtest) {
      const sessionId = req.sessionID || this._generateSessionId(req);
      const hash = load('crypto').createHash('md5').update(sessionId + req.query.abtest).digest('hex');
      const hashValue = parseInt(hash.substring(0, 8), 16);
      return hashValue % 2 === 0 ? 'control' : 'variant';
    }
    return null;
  }

  /**
   * Extract custom properties from query
   * @param {object} query - Query parameters
   * @returns {object} Custom properties
   */
  _extractCustomProperties(query) {
    const customProps = {};
    
    // Extract properties starting with 'custom_'
    Object.keys(query).forEach(key => {
      if (key.startsWith('custom_')) {
        const propName = key.replace('custom_', '');
        customProps[propName] = query[key];
      }
    });

    return customProps;
  }

  /**
   * Get request count for IP (simplified rate limiting check)
   * @param {string} ipAddress - IP address
   * @returns {number} Request count
   */
  _getRequestCount(ipAddress) {
    // In production, use Redis or similar for tracking
    return 0;
  }

  /**
   * Track click with full analytics data
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Next middleware function
   */
  trackClick(req, res, next) {
    // Combine all tracking data
    const trackingData = {
      ...req.clickData,
      ...req.geographic,
      ...req.sessionTracking,
      ...req.abTest,
      ...req.conversion,
      bot: req.botDetection,
      privacy: req.privacy,
      performance: req.performance
    };

    // Skip tracking if user opted out
    if (req.skipAnalytics) {
      return next();
    }

    // Store tracking data
    req.analytics = trackingData;

    // Process analytics asynchronously
    setImmediate(async () => {
      try {
        await this._processAnalytics(trackingData);
      } catch (error) {
        console.error('Error processing analytics:', error);
      }
    });

    next();
  }

  /**
   * Process analytics data
   * @param {object} data - Analytics data
   */
  async _processAnalytics(data) {
    // In production, save to database and trigger real-time updates
    console.log('Processing analytics data:', {
      timestamp: data.timestamp,
      url: data.request?.url,
      device: data.device?.device?.type,
      location: data.location?.country,
      isBot: data.bot?.isBot
    });
  }
}

export = new AnalyticsMiddleware();
