// @ts-nocheck
import { CustomerBehavior } from '../models';
import { getClientIp } from 'request-ip';
import BehaviorProcessor from '../services/BehaviorProcessor';
import UAParser from 'ua-parser-js';
/**
 * Behavior Tracking Middleware
 *
 * Captures and logs customer behavior across all endpoints
 */

/**
 * Extract tracking parameters from URL
 * @param {string} url URL string
 * @returns {Object} Extracted UTM parameters
 */
const extractUtmParams = (url) => {
  try {
    if (!url) return {};

    const params = new URLSearchParams(url.split('?')[1]);
    return {
      source: params.get('utm_source') || null,
      medium: params.get('utm_medium') || null,
      campaign: params.get('utm_campaign') || null,
      term: params.get('utm_term') || null,
      content: params.get('utm_content') || null,
    };
  } catch (error) {
    console.error('Error extracting UTM params:', error);
    return {};
  }
};

/**
 * Parse user agent information
 * @param {string} userAgent User agent string
 * @returns {Object} Parsed device, browser, and OS information
 */
const parseUserAgent = (userAgent) => {
  try {
    if (!userAgent) return {};

    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    let deviceType = 'other';
    if (result.device.type === 'mobile') deviceType = 'mobile';
    else if (result.device.type === 'tablet') deviceType = 'tablet';
    else if (!result.device.type && result.os.name) deviceType = 'desktop';

    return {
      device: deviceType,
      browser: result.browser.name,
      os: result.os.name,
    };
  } catch (error) {
    console.error('Error parsing user agent:', error);
    return {};
  }
};

/**
 * Middleware to track page views
 */
const trackPageView = (req, res, next) => {
  // Skip for certain routes
  const skipPaths = ['/api/health', '/api/metrics', '/static', '/favicon.ico', '/api/'];
  if (skipPaths.some((path) => req.path.startsWith(path))) {
    return next();
  }

  // Execute after response is sent to client
  res.on('finish', async () => {
    try {
      // Skip non-successful responses
      if (res.statusCode >= 400) return;

      // Get customer ID either from authenticated user or anonymous ID in cookies
      const customerId = req.admin?._id || req.admin?.userId || null;
      const anonymousId = req.cookies?.anonymous_id || req.headers['x-anonymous-id'];

      // Skip if we can't identify the visitor
      if (!customerId && !anonymousId) return;

      // Extract relevant data
      const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const utmParams = extractUtmParams(req.originalUrl);
      const userAgentData = parseUserAgent(req.headers['user-agent']);

      // Get owner ID from admin
      const ownerId = req.admin?._id || req.admin?.id || req.companyOwner?._id;

      // Skip if no owner (required field)
      if (!ownerId) return;

      // Create behavior event
      const eventData = {
        customer: customerId, // Use 'customer' not 'customerId'
        anonymousId,
        eventType: 'page_view',
        eventName: 'Page View',
        url,
        urlPath: req.path,
        referrer: req.headers.referer || req.headers.referrer,
        source: utmParams.source,
        medium: utmParams.medium,
        campaign: utmParams.campaign ? mongoose.Types.ObjectId(utmParams.campaign) : null,
        sessionId: req.cookies?.session_id || req.headers['x-session-id'],
        context: {
          ip: getClientIp(req),
          userAgent: req.headers['user-agent'],
          ...userAgentData,
          language: req.headers['accept-language'],
        },
        properties: {
          method: req.method,
          statusCode: res.statusCode,
          ...utmParams,
        },
        owner: ownerId,
      };

      await BehaviorProcessor.trackEvent(eventData);
    } catch (error) {
      console.error('Error tracking page view:', error);
      // Non-blocking - don't affect user experience with tracking errors
    }
  });

  next();
};

/**
 * Middleware to track API interactions
 */
const trackApiInteraction = (req, res, next) => {
  // Skip for certain routes
  const skipPaths = ['/api/health', '/api/metrics', '/static'];
  if (
    skipPaths.some((path) => req.path.startsWith(path)) ||
    req.method === 'OPTIONS' ||
    req.method === 'HEAD'
  ) {
    return next();
  }

  // Execute after response is sent
  res.on('finish', async () => {
    try {
      // Skip for non-successful API calls
      if (res.statusCode >= 400) return;

      // Get customer ID either from authenticated user or anonymous ID
      const customerId = req.admin?._id || req.admin?.userId || null;
      const anonymousId = req.cookies?.anonymous_id || req.headers['x-anonymous-id'];

      // Skip if we can't identify the visitor
      if (!customerId && !anonymousId) return;

      // Determine API event type
      let eventType;
      if (req.method === 'GET') {
        eventType = 'api_get';
      } else if (req.method === 'POST') {
        eventType = 'api_create';
      } else if (req.method === 'PUT' || req.method === 'PATCH') {
        eventType = 'api_update';
      } else if (req.method === 'DELETE') {
        eventType = 'api_delete';
      } else {
        eventType = 'api_other';
      }

      // Get owner ID from admin
      const ownerId = req.admin?._id || req.admin?.id || req.companyOwner?._id;

      // Skip if no owner (required field)
      if (!ownerId) return;

      // Create behavior event
      const eventData = {
        customer: customerId, // Use 'customer' not 'customerId'
        anonymousId,
        eventType,
        eventName: `API ${req.method}`,
        url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
        urlPath: req.path,
        sessionId: req.cookies?.session_id || req.headers['x-session-id'],
        context: {
          ip: getClientIp(req),
          userAgent: req.headers['user-agent'],
          ...parseUserAgent(req.headers['user-agent']),
        },
        properties: {
          method: req.method,
          statusCode: res.statusCode,
          endpoint: req.path,
          responseTime: res.locals.responseTime || 0,
          contentType: req.headers['content-type'],
        },
        owner: ownerId,
      };

      await BehaviorProcessor.trackEvent(eventData);
    } catch (error) {
      console.error('Error tracking API interaction:', error);
      // Non-blocking - don't affect user experience with tracking errors
    }
  });

  // Measure response time
  const startTime = Date.now();
  res.on('finish', () => {
    res.locals.responseTime = Date.now() - startTime;
  });

  next();
};

/**
 * Middleware to track form submissions
 */
const trackFormSubmission = (req, res, next) => {
  // Only track POST requests with content type application/x-www-form-urlencoded or multipart/form-data
  if (
    req.method !== 'POST' ||
    (!req.is('application/x-www-form-urlencoded') && !req.is('multipart/form-data'))
  ) {
    return next();
  }

  // Execute after response
  res.on('finish', async () => {
    try {
      // Skip for non-successful submissions
      if (res.statusCode >= 400) return;

      // Get customer ID either from authenticated user or anonymous ID
      const customerId = req.admin?._id || null;
      const anonymousId = req.cookies?.anonymous_id || req.headers['x-anonymous-id'];

      // Skip if we can't identify the visitor
      if (!customerId && !anonymousId) return;

      // Create behavior event
      const eventData = {
        customerId,
        anonymousId,
        eventType: 'form_submit',
        eventName: 'Form Submission',
        url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
        urlPath: req.path,
        referrer: req.headers.referer || req.headers.referrer,
        sessionId: req.cookies?.session_id || req.headers['x-session-id'],
        context: {
          ip: getClientIp(req),
          userAgent: req.headers['user-agent'],
          ...parseUserAgent(req.headers['user-agent']),
        },
        properties: {
          formAction: req.path,
          formFields: Object.keys(req.body).filter(
            (key) => !['password', 'token', 'secret'].includes(key.toLowerCase())
          ),
          hasFileUpload: !!req.files,
        },
        owner: req.admin?._id || process.env.SYSTEM_OWNER_ID,
      };

      // Track event via behavior processor service
      await BehaviorProcessor.trackEvent(eventData);
    } catch (error) {
      console.error('Error tracking form submission:', error);
      // Non-blocking - don't affect user experience with tracking errors
    }
  });

  next();
};

/**
 * Middleware to track custom events from client
 */
const trackCustomEvent = (req, res) => {
  try {
    // Validate request
    if (!req.body.eventType) {
      return res.status(400).json({
        success: false,
        message: 'Event type is required',
      });
    }

    // Get customer ID either from authenticated user or anonymous ID
    const customerId = req.admin?._id || null;
    const anonymousId =
      req.body.anonymousId || req.cookies?.anonymous_id || req.headers['x-anonymous-id'];

    // Ensure we have some way to identify the user
    if (!customerId && !anonymousId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID or anonymous ID is required',
      });
    }

    // Create event data
    const eventData = {
      customerId,
      anonymousId,
      eventType: req.body.eventType,
      eventName: req.body.eventName || req.body.eventType,
      url: req.body.url,
      urlPath: req.body.urlPath,
      referrer: req.body.referrer,
      sessionId: req.body.sessionId || req.cookies?.session_id || req.headers['x-session-id'],
      source: req.body.source,
      medium: req.body.medium,
      campaign: req.body.campaignId,
      context: {
        ip: getClientIp(req),
        userAgent: req.headers['user-agent'],
        ...parseUserAgent(req.headers['user-agent']),
        ...req.body.context,
      },
      properties: req.body.properties || {},
      metadata: req.body.metadata || {},
      owner: req.admin?._id || process.env.SYSTEM_OWNER_ID,
    };

    // Track the event asynchronously
    BehaviorProcessor.trackEvent(eventData)
      .then(() => {
        console.log(`Tracked custom event: ${eventData.eventType}`);
      })
      .catch((error) => {
        console.error('Error tracking custom event:', error);
      });

    // Return immediate success to client
    return res.status(200).json({
      success: true,
      message: 'Event tracking initiated',
    });
  } catch (error) {
    console.error('Error in trackCustomEvent middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing event tracking',
    });
  }
};

// Export all middleware functions
export = {
  trackPageView,
  trackApiInteraction,
  trackFormSubmission,
  trackCustomEvent,
};
