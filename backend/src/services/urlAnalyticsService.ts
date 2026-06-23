// @ts-nocheck

import URLClick from '@/models/appModels/URLClick';
import URL from '@/models/appModels/URL';
import mongoose from 'mongoose';
import UAParser from 'ua-parser-js';
import geoip from 'geoip-lite';
import crypto from 'crypto';
class URLAnalyticsService {
  /**
   * Record a click event
   * @param {object} clickData - Click data
   * @returns {Promise<object>} Recorded click
   */
  async recordClick(clickData) {
    console.log('🔍 Recording click with data:', JSON.stringify(clickData, null, 2));
    
    const {
      urlId,
      shortCode,
      ipAddress,
      userAgent,
      referrer,
      userId,
      sessionId,
      utmParameters = {},
      responseTime = 0,
      abTestGroup,
      timeOnSite = 0,
      pageViews = 1
    } = clickData;

    console.log('📱 Parsing device information...');
    // Parse device information
    const deviceInfo = this.detectDevice(userAgent);
    console.log('Device Info:', JSON.stringify(deviceInfo, null, 2));
    
    console.log('🌍 Getting location data...');
    // Get location data
    const locationData = this.getLocationData(ipAddress);
    console.log('Location Data:', JSON.stringify(locationData, null, 2));
    
    console.log('🔗 Parsing referrer...');
    // Parse referrer
    const referrerInfo = this.parseReferrer(referrer);
    console.log('Referrer Info:', JSON.stringify(referrerInfo, null, 2));
    
    console.log('✅ Checking unique click...');
    // Check if this is a unique click
    const isUniqueClick = await this.checkUniqueClick(urlId, userId, sessionId, ipAddress);
    console.log('Is Unique Click:', isUniqueClick);
    
    console.log('🤖 Detecting bot...');
    // Detect if it's a bot
    const isBot = this.detectBot(userAgent, ipAddress);
    console.log('Is Bot:', isBot);

    // Generate anonymous user ID if not provided
    const anonymousUserId = userId || `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('User ID:', anonymousUserId);

    // Fix: Store the complete device information structure
    const clickRecordData = {
      url: urlId,
      shortCode: shortCode || null,
      clickedAt: new Date(),
      ipAddress: this.hashIP(ipAddress), // Store hashed IP for privacy
      userAgent,
      user: userId || null,
      userId: anonymousUserId, // Store anonymous user ID
      isAuthenticated: !!userId,
      // Store complete device info as nested object
      device: {
        type: deviceInfo.type || 'unknown',
        brand: deviceInfo.brand || null,
        model: deviceInfo.model || null
      },
      // Store browser info as nested object
      browser: {
        name: deviceInfo.browser?.name || 'unknown',
        version: deviceInfo.browser?.version || null,
        major: deviceInfo.browser?.major || null
      },
      // Store OS info as nested object
      os: {
        name: deviceInfo.os?.name || 'unknown',
        version: deviceInfo.os?.version || null
      },
      // Store engine info
      engine: {
        name: deviceInfo.engine?.name || 'unknown',
        version: deviceInfo.engine?.version || null
      },
      // Store CPU info
      cpu: {
        architecture: deviceInfo.cpu?.architecture || null
      },
      // Location data
      country: locationData.country,
      region: locationData.region,
      city: locationData.city,
      timezone: locationData.timezone,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      // Referrer data
      referrer: referrer || null,
      referrerDomain: referrerInfo.domain,
      referrerType: referrerInfo.type,
      // Session and tracking
      sessionId: sessionId || `session_${Date.now()}`,
      isUniqueClick,
      isBot,
      isValidClick: !isBot,
      isSuspicious: false, // Default value
      fraudScore: 0, // Default value
      doNotTrack: false, // Default value
      // UTM parameters
      utmSource: utmParameters.utm_source || null,
      utmMedium: utmParameters.utm_medium || null,
      utmCampaign: utmParameters.utm_campaign || null,
      utmTerm: utmParameters.utm_term || null,
      utmContent: utmParameters.utm_content || null,
      // Performance data
      responseTime: responseTime || 0,
      abTestGroup: abTestGroup || 'control',
      timeOnSite: timeOnSite || 0,
      pageViews: pageViews || 1,
      // Conversion data
      isConversion: false, // Default value
      conversionValue: 0, // Default value
      tags: [], // Default empty array
      createdAt: new Date()
    };

    console.log('💾 Click record data to be saved:', JSON.stringify(clickRecordData, null, 2));

    const clickRecord = new URLClick(clickRecordData);
    
    try {
      await clickRecord.save();
      console.log('✅ Click record saved successfully');
    } catch (error) {
      console.error('❌ Error saving click record:', error);
      throw error;
    }

    // Update URL click counts if it's a valid click
    if (!isBot) {
      console.log('📊 Updating URL click counts...');
      try {
        const updateResult = await URL.findByIdAndUpdate(urlId, {
          $inc: { 
            totalClicks: 1,
            ...(isUniqueClick && { uniqueClicks: 1 })
          },
          lastClickedAt: new Date(),
          ...(isUniqueClick && { firstClickedAt: new Date() }) // Set first click if unique
        });
        console.log('✅ URL click counts updated');
      } catch (error) {
        console.error('❌ Error updating URL click counts:', error);
      }
    }

    return clickRecord;
  }

  /**
   * Detect device information from user agent
   * @param {string} userAgent - User agent string
   * @returns {object} Device information
   */
  detectDevice(userAgent) {
    console.log('🔍 Detecting device from user agent:', userAgent);
    
    if (!userAgent) {
      console.log('⚠️ No user agent provided');
      return {
        type: 'unknown',
        brand: null,
        model: null,
        browser: { name: 'unknown', version: null, major: null },
        os: { name: 'unknown', version: null },
        engine: { name: 'unknown', version: null },
        cpu: { architecture: null }
      };
    }

    try {
      const parser = new UAParser(userAgent);
      const result = parser.getResult();
      
      console.log('🔧 UAParser result:', JSON.stringify(result, null, 2));

      const deviceInfo = {
        type: this.getDeviceType(result, userAgent),
        brand: result.device?.vendor || null,
        model: result.device?.model || null,
        browser: {
          name: result.browser?.name || 'unknown',
          version: result.browser?.version || null,
          major: result.browser?.major || null
        },
        os: {
          name: result.os?.name || 'unknown',
          version: result.os?.version || null
        },
        engine: {
          name: result.engine?.name || 'unknown',
          version: result.engine?.version || null
        },
        cpu: {
          architecture: result.cpu?.architecture || null
        }
      };

      console.log('✅ Final device info:', JSON.stringify(deviceInfo, null, 2));
      return deviceInfo;
    } catch (error) {
      console.error('❌ Error parsing user agent:', error);
      return {
        type: 'unknown',
        brand: null,
        model: null,
        browser: { name: 'unknown', version: null, major: null },
        os: { name: 'unknown', version: null },
        engine: { name: 'unknown', version: null },
        cpu: { architecture: null }
      };
    }
  }

  /**
   * Get device type from parsed result
   * @param {object} parsedUA - Parsed user agent
   * @param {string} originalUA - Original user agent string
   * @returns {string} Device type
   */
  getDeviceType(parsedUA, originalUA = '') {
    console.log('🔍 Determining device type from:', {
      deviceType: parsedUA.device?.type,
      userAgent: originalUA
    });

    // First check if UAParser already determined the type
    if (parsedUA.device && parsedUA.device.type) {
      console.log('✅ Device type from UAParser:', parsedUA.device.type);
      return parsedUA.device.type;
    }

    // Fallback to manual detection
    const userAgent = originalUA.toLowerCase();
    
    if (/mobile|android|iphone|ipod|blackberry|windows phone|webos/i.test(userAgent)) {
      console.log('📱 Detected as mobile device');
      return 'mobile';
    }
    
    if (/tablet|ipad/i.test(userAgent)) {
      console.log('📱 Detected as tablet device');
      return 'tablet';
    }
    
    if (/smart-tv|smarttv|tv|roku|apple tv|chromecast/i.test(userAgent)) {
      console.log('📺 Detected as smart TV');
      return 'smarttv';
    }
    
    // Check for desktop indicators
    if (/windows|mac|linux|x11/i.test(userAgent)) {
      console.log('🖥️ Detected as desktop');
      return 'desktop';
    }
    
    console.log('❓ Could not determine device type, defaulting to desktop');
    return 'desktop'; // Default to desktop instead of unknown
  }

  /**
   * Parse referrer information
   * @param {string} referrer - Referrer URL
   * @returns {object} Referrer information
   */
  parseReferrer(referrer) {
    console.log('🔗 Parsing referrer:', referrer);
    
    if (!referrer) {
      console.log('➡️ No referrer, marking as direct');
      return {
        domain: null,
        type: 'direct'
      };
    }

    try {
      // Simple domain extraction without using URL constructor to avoid mongoose conflicts
      let domain = null;
      let type = 'direct';
      
      // Basic URL parsing using string methods instead of URL constructor
      const urlString = referrer.toLowerCase();
      
      // Extract domain using regex
      const domainMatch = urlString.match(/^https?:\/\/([^\/]+)/);
      if (domainMatch) {
        domain = domainMatch[1];
      }
      
      // If no domain found or it's localhost, treat as direct
      if (!domain || domain.includes('localhost') || domain.includes('127.0.0.1')) {
        console.log('🏠 Local/no domain referrer, treating as direct');
        return {
          domain: null,
          type: 'direct'
        };
      }
      
      // Determine referrer type based on domain patterns
      // Social media platforms
      const socialPlatforms = [
        'facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com',
        'youtube.com', 'tiktok.com', 'snapchat.com', 'pinterest.com',
        'reddit.com', 'discord.com', 'whatsapp.com'
      ];
      
      // Search engines
      const searchEngines = [
        'google.', 'bing.com', 'yahoo.com', 'duckduckgo.com',
        'baidu.com', 'yandex.', 'ask.com', 'startpage.com'
      ];

      if (socialPlatforms.some(platform => domain.includes(platform))) {
        type = 'social';
        console.log('📱 Detected social media referrer');
      } else if (searchEngines.some(engine => domain.includes(engine))) {
        type = 'search';
        console.log('🔍 Detected search engine referrer');
      } else if (urlString.includes('utm_medium=email')) {
        type = 'email';
        console.log('📧 Detected email referrer');
      } else if (urlString.includes('utm_medium=cpc') || urlString.includes('gclid=')) {
        type = 'paid';
        console.log('💰 Detected paid referrer');
      } else {
        // For any other referrer, use 'referral'
        type = 'referral';
        console.log('🔗 Detected as general referral');
      }

      const referrerInfo = { domain, type };
      console.log('✅ Referrer info:', referrerInfo);
      return referrerInfo;
    } catch (error) {
      console.error('❌ Error parsing referrer:', error);
      // Return 'direct' for any parsing errors
      return {
        domain: null,
        type: 'direct'
      };
    }
  }

  /**
   * Check if this is a unique click
   * @param {string} urlId - URL ID
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   * @param {string} ipAddress - IP address
   * @returns {Promise<boolean>} Is unique click
   */
  async checkUniqueClick(urlId, userId, sessionId, ipAddress) {
    console.log('✅ Checking unique click for:', { urlId, userId, sessionId, ipAddress });
    
    const timeFrame = 24 * 60 * 60 * 1000; // 24 hours
    const since = new Date(Date.now() - timeFrame);

    const filter = {
      url: urlId,
      clickedAt: { $gte: since },
      isValidClick: true
    };

    // Check by user ID first (most reliable)
    if (userId) {
      filter.user = userId;
      console.log('🔍 Checking uniqueness by user ID');
    } else if (sessionId) {
      filter.sessionId = sessionId;
      console.log('🔍 Checking uniqueness by session ID');
    } else {
      filter.ipAddress = this.hashIP(ipAddress);
      console.log('🔍 Checking uniqueness by hashed IP');
    }

    console.log('🔍 Unique check filter:', filter);

    try {
      const existingClick = await URLClick.findOne(filter);
      const isUnique = !existingClick;
      console.log('✅ Is unique click:', isUnique);
      return isUnique;
    } catch (error) {
      console.error('❌ Error checking unique click:', error);
      return true; // Default to unique if check fails
    }
  }

  /**
   * Detect if request is from a bot
   * @param {string} userAgent - User agent string
   * @param {string} ipAddress - IP address
   * @returns {boolean} Is bot
   */
  detectBot(userAgent, ipAddress) {
    console.log('🤖 Detecting bot for UA:', userAgent);
    
    if (!userAgent) {
      console.log('❌ No user agent - likely bot');
      return true;
    }

    const userAgentLower = userAgent.toLowerCase();
    
    // Common bot patterns
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i,
      /whatsapp/i, /telegram/i, /slack/i, /discord/i,
      /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i,
      /baiduspider/i, /yandexbot/i, /sogou/i, /exabot/i,
      /curl/i, /wget/i, /python-requests/i, /java/i, /php/i,
      /postman/i, /insomnia/i, /httpie/i, /go-http-client/i
    ];

    const isBot = botPatterns.some(pattern => pattern.test(userAgentLower));
    console.log('🤖 Bot detection result:', isBot);
    
    return isBot;
  }

  /**
   * Hash IP address for privacy
   * @param {string} ipAddress - IP address
   * @returns {string} Hashed IP
   */
  hashIP(ipAddress) {
    if (!ipAddress) return 'no-ip';
    
    const salt = process.env.IP_HASH_SALT || 'default-salt';
    const hash = crypto
      .createHash('sha256')
      .update(ipAddress + salt)
      .digest('hex')
      .substring(0, 16);
    
    console.log('🔒 Hashed IP:', `${ipAddress} -> ${hash}`);
    return hash;
  }

  /**
   * Calculate performance metrics
   * @param {string} urlId - URL ID
   * @param {object} options - Calculation options
   * @returns {Promise<object>} Performance metrics
   */
  async calculateMetrics(urlId, options = {}) {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date()
    } = options;

    console.log('📊 Calculating metrics for URL:', urlId, 'from', startDate, 'to', endDate);

    const matchStage = {
      url: new mongoose.Types.ObjectId(urlId),
      clickedAt: { $gte: startDate, $lte: endDate },
      isValidClick: true
    };

    const [overview, timeSeriesData, topCountries, topReferrers, deviceStats] = await Promise.all([
      // Overview metrics
      URLClick.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalClicks: { $sum: 1 },
            uniqueClicks: { $sum: { $cond: ['$isUniqueClick', 1, 0] } },
            countries: { $addToSet: '$country' },
            avgResponseTime: { $avg: '$responseTime' }
          }
        }
      ]),

      // Time series data
      URLClick.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              year: { $year: '$clickedAt' },
              month: { $month: '$clickedAt' },
              day: { $dayOfMonth: '$clickedAt' }
            },
            clicks: { $sum: 1 },
            uniqueClicks: { $sum: { $cond: ['$isUniqueClick', 1, 0] } }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]),

      // Top countries
      URLClick.aggregate([
        { $match: { ...matchStage, country: { $ne: null } } },
        { $group: { _id: '$country', clicks: { $sum: 1 } } },
        { $sort: { clicks: -1 } },
        { $limit: 10 }
      ]),

      // Top referrers
      URLClick.aggregate([
        { $match: { ...matchStage, referrerDomain: { $ne: null } } },
        { $group: { _id: '$referrerDomain', clicks: { $sum: 1 } } },
        { $sort: { clicks: -1 } },
        { $limit: 10 }
      ]),

      // Device statistics
      URLClick.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$device.type',
            clicks: { $sum: 1 },
            uniqueClicks: { $sum: { $cond: ['$isUniqueClick', 1, 0] } }
          }
        },
        { $sort: { clicks: -1 } }
      ])
    ]);

    const metrics = {
      overview: overview[0] || { totalClicks: 0, uniqueClicks: 0, countries: [], avgResponseTime: 0 },
      timeSeries: timeSeriesData,
      topCountries,
      topReferrers,
      deviceStats
    };

    console.log('✅ Metrics calculated:', JSON.stringify(metrics, null, 2));
    return metrics;
  }

  /**
   * Generate analytics report
   * @param {string} urlId - URL ID
   * @param {object} options - Report options
   * @returns {Promise<object>} Analytics report
   */
  async generateReport(urlId, options = {}) {
    console.log('📈 Generating report for URL:', urlId);
    
    const metrics = await this.calculateMetrics(urlId, options);
    const url = await URL.findById(urlId).select('shortCode title originalUrl createdAt');

    const report = {
      url,
      generatedAt: new Date(),
      period: {
        startDate: options.startDate,
        endDate: options.endDate
      },
      metrics
    };

    console.log('✅ Report generated');
    return report;
  }

  /**
   * Extract client information from the request and record analytics
   * @param {object} req - Express request object
   * @param {string} urlId - URL ID for analytics
   * @param {string} shortCode - Short code for the URL
   * @returns {object} Complete client information with analytics
   */
  async extractClientInfo(req, urlId = null, shortCode = null) {
    console.log('🔍 Extracting comprehensive client info from request');
    
    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.headers.referer || req.headers.referrer || '';
    const ipAddress = this.getClientIP(req);
    const utmParameters = this.extractUTMParameters(req);
    
    console.log('📋 Raw client data:', {
      userAgent: userAgent.substring(0, 100) + '...',
      referrer,
      ipAddress,
      utmParameters
    });
    
    // Get comprehensive device info from user agent
    const deviceInfo = this.detectDevice(userAgent);
    console.log('📱 Complete device info:', deviceInfo);
    
    // Get location info from IP address
    const locationInfo = this.getLocationData(ipAddress);
    console.log('🌍 Location info:', locationInfo);
    
    // Parse referrer information
    const referrerInfo = this.parseReferrer(referrer);
    console.log('🔗 Referrer info:', referrerInfo);
    
    // Check if it's likely a bot
    const isBot = this.detectBot(userAgent, ipAddress);
    console.log('🤖 Bot detection:', isBot);

    // Generate session ID if not present
    const sessionId = req.cookies?.sessionId || req.query?.sid || req.headers['x-session-id'] || `session_${Date.now()}`;
    
    // Get user ID if authenticated
    const userId = req.user?.id || req.user?._id || null;
    
    const clientInfo = {
      // Basic request info
      userAgent,
      ipAddress,
      referrer,
      
      // Parsed device information (complete structure)
      device: {
        type: deviceInfo.type || 'unknown',
        brand: deviceInfo.brand || null,
        model: deviceInfo.model || null
      },
      
      // Browser information
      browser: {
        name: deviceInfo.browser?.name || 'unknown',
        version: deviceInfo.browser?.version || null,
        major: deviceInfo.browser?.major || null
      },
      
      // Operating system information
      os: {
        name: deviceInfo.os?.name || 'unknown',
        version: deviceInfo.os?.version || null
      },
      
      // Engine information
      engine: {
        name: deviceInfo.engine?.name || 'unknown',
        version: deviceInfo.engine?.version || null
      },
      
      // CPU information
      cpu: {
        architecture: deviceInfo.cpu?.architecture || null
      },
      
      // Location information
      country: locationInfo.country,
      region: locationInfo.region,
      city: locationInfo.city,
      timezone: locationInfo.timezone,
      latitude: locationInfo.latitude,
      longitude: locationInfo.longitude,
      
      // Referrer information
      referrerDomain: referrerInfo.domain,
      referrerType: referrerInfo.type,
      
      // UTM tracking parameters
      utmSource: utmParameters.utm_source || null,
      utmMedium: utmParameters.utm_medium || null,
      utmCampaign: utmParameters.utm_campaign || null,
      utmTerm: utmParameters.utm_term || null,
      utmContent: utmParameters.utm_content || null,
      
      // Session and user tracking
      sessionId,
      userId,
      isAuthenticated: !!userId,
      
      // Bot and fraud detection
      isBot,
      isValidClick: !isBot,
      isSuspicious: false, // Could be enhanced with fraud detection
      fraudScore: 0,
      
      // Privacy settings
      doNotTrack: req.headers['dnt'] === '1' || req.headers['do-not-track'] === '1',
      
      // Performance metrics
      responseTime: 0, // Will be calculated by the calling function
      
      // Tracking and analytics
      abTestGroup: req.query?.ab_test || req.headers['x-ab-test'] || 'control',
      timeOnSite: 0, // Will be calculated based on session activity
      pageViews: 1, // Default for new sessions
      
      // Conversion tracking
      isConversion: false, // Will be determined by business logic
      conversionValue: 0,
      
      // Additional metadata
      tags: [], // Can be used for custom categorization
      timestamp: new Date(),
      
      // Raw device info for debugging (can be removed in production)
      fullDeviceInfo: deviceInfo
    };

    console.log('✅ Complete client info extracted:', JSON.stringify(clientInfo, null, 2));
    
    // If urlId and shortCode are provided, record the click
    if (urlId && shortCode) {
      try {
        console.log('📊 Recording click analytics...');
        
        // Check if this is a unique click
        const isUniqueClick = await this.checkUniqueClick(urlId, userId, sessionId, ipAddress);
        
        const clickRecord = await this.recordClick({
          urlId,
          shortCode,
          ipAddress,
          userAgent,
          referrer,
          userId,
          sessionId,
          utmParameters,
          responseTime: clientInfo.responseTime,
          abTestGroup: clientInfo.abTestGroup,
          timeOnSite: clientInfo.timeOnSite,
          pageViews: clientInfo.pageViews
        });
        
        console.log('✅ Click recorded successfully');
        
        // Add the click record ID to client info
        clientInfo.clickRecordId = clickRecord._id;
        clientInfo.isUniqueClick = isUniqueClick;
        
      } catch (error) {
        console.error('❌ Error recording click:', error);
        // Don't fail the entire request if analytics recording fails
      }
    }
    
    return clientInfo;
  }

  /**
   * Get client IP address from request with public IP detection
   * @param {object} req - Express request object
   * @returns {string} IP address
   */
  getClientIP(req) {
    // Priority order for IP detection
    const headers = [
      'x-forwarded-for',
      'x-real-ip',
      'x-client-ip',
      'cf-connecting-ip', // Cloudflare
      'x-forwarded',
      'forwarded-for',
      'forwarded'
    ];

    // Check each header for a valid IP
    for (const header of headers) {
      const headerValue = req.headers[header];
      if (headerValue) {
        // Handle comma-separated IPs (x-forwarded-for can contain multiple IPs)
        const ips = headerValue.split(',').map(ip => ip.trim());
        
        // Find the first public IP
        for (const ip of ips) {
          if (this.isValidPublicIP(ip)) {
            console.log('🌐 Found public IP from header', header + ':', ip);
            return ip;
          }
        }
        
        // If no public IP found, use the first IP
        if (ips[0] && ips[0] !== 'unknown') {
          console.log('🌐 Using first IP from header', header + ':', ips[0]);
          return ips[0];
        }
      }
    }
    
    // Fall back to direct connection IP
    const directIP = req.connection?.remoteAddress ||
                     req.socket?.remoteAddress ||
                     req.connection?.socket?.remoteAddress ||
                     req.ip;
    
    if (directIP) {
      // Clean up IPv6 mapped IPv4 addresses
      const cleanIP = directIP.replace(/^::ffff:/, '');
      console.log('🌐 Using direct connection IP:', cleanIP);
      return cleanIP;
    }
    
    console.log('🌐 No IP found, defaulting to localhost');
    return '127.0.0.1';
  }

  /**
   * Check if an IP address is a valid public IP
   * @param {string} ip - IP address to check
   * @returns {boolean} True if valid public IP
   */
  isValidPublicIP(ip) {
    if (!ip || ip === 'unknown') return false;
    
    // Remove IPv6 prefix if present
    const cleanIP = ip.replace(/^::ffff:/, '');
    
    // IPv4 validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(cleanIP)) {
      const parts = cleanIP.split('.').map(Number);
      
      // Check if all parts are valid (0-255)
      if (parts.some(part => part < 0 || part > 255)) return false;
      
      // Check for private/local ranges
      const [a, b, c, d] = parts;
      
      // Private ranges
      if (a === 10) return false; // 10.0.0.0/8
      if (a === 172 && b >= 16 && b <= 31) return false; // 172.16.0.0/12
      if (a === 192 && b === 168) return false; // 192.168.0.0/16
      
      // Loopback
      if (a === 127) return false; // 127.0.0.0/8
      
      // Link-local
      if (a === 169 && b === 254) return false; // 169.254.0.0/16
      
      // Multicast and reserved
      if (a >= 224) return false;
      
      return true;
    }
    
    // IPv6 validation (basic)
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
    if (ipv6Regex.test(cleanIP)) {
      // Reject loopback and local addresses
      if (cleanIP === '::1' || cleanIP === '::') return false;
      if (cleanIP.startsWith('fe80:')) return false; // Link-local
      if (cleanIP.startsWith('fc00:') || cleanIP.startsWith('fd00:')) return false; // Unique local
      
      return true;
    }
    
    return false;
  }

  /**
   * Get location data from IP address with better handling
   * @param {string} ipAddress - IP address
   * @returns {object} Location data
   */
  getLocationData(ipAddress) {
    console.log('🌍 Getting location for IP:', ipAddress);
    
    // Handle localhost and local IPs
    if (!ipAddress || 
        ipAddress === '127.0.0.1' || 
        ipAddress === '::1' || 
        ipAddress.startsWith('192.168.') || 
        ipAddress.startsWith('10.') || 
        ipAddress.startsWith('172.') ||
        !this.isValidPublicIP(ipAddress)) {
      console.log('🏠 Local/Private IP detected, returning null location data');
      return {
        country: null,
        region: null,
        city: null,
        timezone: null,
        latitude: null,
        longitude: null
      };
    }

    try {
      const geo = geoip.lookup(ipAddress);
      console.log('🗺️ GeoIP lookup result:', geo);
      
      if (!geo) {
        console.log('❌ No geo data found for IP');
        return {
          country: null,
          region: null,
          city: null,
          timezone: null,
          latitude: null,
          longitude: null
        };
      }

      const locationData = {
        country: geo.country || null,
        region: geo.region || null,
        city: geo.city || null,
        timezone: geo.timezone || null,
        latitude: geo.ll && geo.ll[0] ? geo.ll[0] : null,
        longitude: geo.ll && geo.ll[1] ? geo.ll[1] : null
      };

      console.log('✅ Location data extracted:', locationData);
      return locationData;
    } catch (error) {
      console.error('❌ Error getting location data:', error);
      return {
        country: null,
        region: null,
        city: null,
        timezone: null,
        latitude: null,
        longitude: null
      };
    }
  }

  /**
   * Extract UTM parameters from request with better error handling
   * @param {object} req - Express request object
   * @returns {object} UTM parameters
   */
  extractUTMParameters(req) {
    const utmParams = {};
    const paramKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    
    console.log('🏷️ Extracting UTM parameters from query:', req.query);
    
    // Check in query parameters
    paramKeys.forEach(key => {
      if (req.query[key]) {
        utmParams[key] = req.query[key];
      }
    });
    
    // If there's a referer URL, also check there
    if (req.headers.referer) {
      try {
        const refererUrl = new URL(req.headers.referer);
        paramKeys.forEach(key => {
          if (!utmParams[key] && refererUrl.searchParams.has(key)) {
            utmParams[key] = refererUrl.searchParams.get(key);
          }
        });
      } catch (err) {
        console.log('❌ Error parsing referer URL for UTM params:', err.message);
      }
    }
    
    console.log('🏷️ Extracted UTM parameters:', utmParams);
    return utmParams;
  }

  // Helper methods for aggregation (keeping the original methods)
  getStartOfPeriod(date, interval) {
    const result = new Date(date);
    
    switch (interval) {
      case 'hourly':
        result.setMinutes(0, 0, 0);
        break;
      case 'daily':
        result.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        result.setDate(result.getDate() - result.getDay());
        result.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        result.setDate(1);
        result.setHours(0, 0, 0, 0);
        break;
    }
    
    return result;
  }

  getDateGroup(interval) {
    const base = {
      year: { $year: '$clickedAt' },
      month: { $month: '$clickedAt' }
    };

    switch (interval) {
      case 'hourly':
        return {
          ...base,
          day: { $dayOfMonth: '$clickedAt' },
          hour: { $hour: '$clickedAt' }
        };
      case 'daily':
        return {
          ...base,
          day: { $dayOfMonth: '$clickedAt' }
        };
      case 'weekly':
        return {
          ...base,
          week: { $week: '$clickedAt' }
        };
      case 'monthly':
        return base;
      default:
        return base;
    }
  }

  async aggregateData(urlId, interval = 'daily') {
    console.log('📊 Aggregating data for URL:', urlId, 'interval:', interval);
    
    const startOfPeriod = this.getStartOfPeriod(new Date(), interval);
    
    const aggregatedData = await URLClick.aggregate([
      {
        $match: {
          url: new mongoose.Types.ObjectId(urlId),
          clickedAt: { $gte: startOfPeriod },
          isValidClick: true
        }
      },
      {
        $group: {
          _id: {
            url: '$url',
            date: this.getDateGroup(interval),
            country: '$country',
            device: '$device.type'
          },
          clicks: { $sum: 1 },
          uniqueClicks: { $sum: { $cond: ['$isUniqueClick', 1, 0] } }
        }
      }
    ]);

    console.log('✅ Data aggregated:', aggregatedData.length, 'records');
    return aggregatedData;
  }
}

export = new URLAnalyticsService();
