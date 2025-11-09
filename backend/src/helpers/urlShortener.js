const crypto = require('crypto');

class UrlShortener {
  constructor() {
    this.baseUrl = process.env.SHORT_URL_DOMAIN || 'http://localhost:8888/s';
    this.analytics = new Map(); // In production, use Redis or database
    this.urlMappings = new Map(); // In production, use database
  }

  /**
   * Shorten a URL and track analytics
   * @param {string} originalUrl - Original long URL
   * @param {string} ownerId - Owner ID for tracking
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Shortened URL data
   */
  async shortenUrl(originalUrl, ownerId, options = {}) {
    try {
      // Validate URL
      if (!this.isValidUrl(originalUrl)) {
        throw new Error('Invalid URL format');
      }

      // Check if URL already exists for this owner
      const existingShortCode = await this.findExistingShortCode(originalUrl, ownerId);
      if (existingShortCode) {
        return await this.getUrlData(existingShortCode);
      }

      // Generate short code
      const shortCode = this.generateShortCode(originalUrl, options.customCode);
      const shortUrl = `${this.baseUrl}/${shortCode}`;

      // Store URL mapping
      const urlData = {
        shortCode,
        shortUrl,
        originalUrl,
        ownerId,
        createdAt: new Date(),
        clicks: 0,
        isActive: true,
        expiresAt: options.expiresAt || null,
        description: options.description || null,
        tags: options.tags || [],
        campaign: options.campaign || null,
        utm: options.utm || {},
      };

      await this.storeUrlMapping(shortCode, urlData);
      await this.initializeAnalytics(shortCode);

      return urlData;
    } catch (error) {
      console.error('URL shortening error:', error);
      throw error;
    }
  }

  /**
   * Redirect to original URL and track click
   * @param {string} shortCode - Short URL code
   * @param {Object} requestInfo - Request information for analytics
   * @returns {Promise<string>} Original URL
   */
  async redirect(shortCode, requestInfo = {}) {
    try {
      const urlData = await this.getUrlData(shortCode);
      
      if (!urlData) {
        throw new Error('Short URL not found');
      }

      if (!urlData.isActive) {
        throw new Error('Short URL is disabled');
      }

      if (urlData.expiresAt && new Date() > new Date(urlData.expiresAt)) {
        throw new Error('Short URL has expired');
      }

      // Track click
      await this.trackClick(shortCode, requestInfo);

      return urlData.originalUrl;
    } catch (error) {
      console.error('URL redirect error:', error);
      throw error;
    }
  }

  /**
   * Get analytics for a short URL
   * @param {string} shortCode - Short URL code
   * @param {string} ownerId - Owner ID for permission check
   * @returns {Promise<Object>} Analytics data
   */
  async getAnalytics(shortCode, ownerId) {
    try {
      const urlData = await this.getUrlData(shortCode);
      
      if (!urlData || urlData.ownerId !== ownerId) {
        throw new Error('URL not found or access denied');
      }

      const analytics = this.analytics.get(shortCode) || {
        totalClicks: 0,
        uniqueClicks: 0,
        clicksByDate: {},
        clicksByCountry: {},
        clicksByDevice: {},
        clicksByReferrer: {},
        topReferrers: [],
      };

      return {
        url: urlData,
        analytics: analytics,
        performance: this.calculatePerformanceMetrics(analytics),
      };
    } catch (error) {
      console.error('Get analytics error:', error);
      throw error;
    }
  }

  /**
   * Get all URLs for an owner
   * @param {string} ownerId - Owner ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} List of URLs
   */
  async getUrlsByOwner(ownerId, filters = {}) {
    try {
      const allUrls = Array.from(this.urlMappings.values())
        .filter(url => url.ownerId === ownerId);

      let filteredUrls = allUrls;

      // Apply filters
      if (filters.campaign) {
        filteredUrls = filteredUrls.filter(url => url.campaign === filters.campaign);
      }

      if (filters.tag) {
        filteredUrls = filteredUrls.filter(url => url.tags.includes(filters.tag));
      }

      if (filters.dateFrom) {
        filteredUrls = filteredUrls.filter(url => 
          new Date(url.createdAt) >= new Date(filters.dateFrom)
        );
      }

      if (filters.dateTo) {
        filteredUrls = filteredUrls.filter(url => 
          new Date(url.createdAt) <= new Date(filters.dateTo)
        );
      }

      // Sort by creation date (newest first)
      filteredUrls.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return filteredUrls;
    } catch (error) {
      console.error('Get URLs by owner error:', error);
      throw error;
    }
  }

  /**
   * Update URL settings
   * @param {string} shortCode - Short URL code
   * @param {string} ownerId - Owner ID for permission check
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated URL data
   */
  async updateUrl(shortCode, ownerId, updates) {
    try {
      const urlData = await this.getUrlData(shortCode);
      
      if (!urlData || urlData.ownerId !== ownerId) {
        throw new Error('URL not found or access denied');
      }

      // Apply updates
      const updatedData = {
        ...urlData,
        ...updates,
        updatedAt: new Date(),
      };

      await this.storeUrlMapping(shortCode, updatedData);
      return updatedData;
    } catch (error) {
      console.error('Update URL error:', error);
      throw error;
    }
  }

  /**
   * Delete/deactivate a URL
   * @param {string} shortCode - Short URL code
   * @param {string} ownerId - Owner ID for permission check
   * @returns {Promise<boolean>} Success status
   */
  async deleteUrl(shortCode, ownerId) {
    try {
      const urlData = await this.getUrlData(shortCode);
      
      if (!urlData || urlData.ownerId !== ownerId) {
        throw new Error('URL not found or access denied');
      }

      // Soft delete - deactivate instead of removing
      await this.updateUrl(shortCode, ownerId, { 
        isActive: false, 
        deletedAt: new Date() 
      });

      return true;
    } catch (error) {
      console.error('Delete URL error:', error);
      return false;
    }
  }

  /**
   * Generate a short code for URL
   * @param {string} originalUrl - Original URL
   * @param {string} customCode - Custom short code (optional)
   * @returns {string} Short code
   */
  generateShortCode(originalUrl, customCode = null) {
    if (customCode) {
      // Validate custom code
      if (!/^[a-zA-Z0-9_-]+$/.test(customCode)) {
        throw new Error('Custom code can only contain letters, numbers, hyphens, and underscores');
      }
      
      if (this.urlMappings.has(customCode)) {
        throw new Error('Custom code already exists');
      }
      
      return customCode;
    }

    // Generate random short code
    let shortCode;
    do {
      shortCode = crypto.randomBytes(4).toString('base64url').substring(0, 6);
    } while (this.urlMappings.has(shortCode));

    return shortCode;
  }

  /**
   * Track a click on a short URL
   * @param {string} shortCode - Short URL code
   * @param {Object} requestInfo - Request information
   */
  async trackClick(shortCode, requestInfo) {
    try {
      // Update URL click count
      const urlData = this.urlMappings.get(shortCode);
      if (urlData) {
        urlData.clicks++;
        urlData.lastClickedAt = new Date();
        this.urlMappings.set(shortCode, urlData);
      }

      // Get or initialize analytics
      let analytics = this.analytics.get(shortCode) || {
        totalClicks: 0,
        uniqueClicks: 0,
        clicksByDate: {},
        clicksByCountry: {},
        clicksByDevice: {},
        clicksByReferrer: {},
        uniqueVisitors: new Set(),
      };

      // Track click
      analytics.totalClicks++;

      // Track unique visitors (simplified - in production use more sophisticated tracking)
      const visitorId = requestInfo.ip || 'anonymous';
      if (!analytics.uniqueVisitors.has(visitorId)) {
        analytics.uniqueVisitors.add(visitorId);
        analytics.uniqueClicks++;
      }

      // Track by date
      const today = new Date().toISOString().split('T')[0];
      analytics.clicksByDate[today] = (analytics.clicksByDate[today] || 0) + 1;

      // Track by country (simplified)
      const country = requestInfo.country || 'Unknown';
      analytics.clicksByCountry[country] = (analytics.clicksByCountry[country] || 0) + 1;

      // Track by device
      const device = this.detectDevice(requestInfo.userAgent || '');
      analytics.clicksByDevice[device] = (analytics.clicksByDevice[device] || 0) + 1;

      // Track by referrer
      const referrer = this.extractDomain(requestInfo.referrer || 'Direct');
      analytics.clicksByReferrer[referrer] = (analytics.clicksByReferrer[referrer] || 0) + 1;

      this.analytics.set(shortCode, analytics);
    } catch (error) {
      console.error('Track click error:', error);
    }
  }

  /**
   * Store URL mapping (in production, use database)
   * @param {string} shortCode - Short code
   * @param {Object} urlData - URL data
   */
  async storeUrlMapping(shortCode, urlData) {
    this.urlMappings.set(shortCode, urlData);
  }

  /**
   * Get URL data by short code
   * @param {string} shortCode - Short code
   * @returns {Object} URL data
   */
  async getUrlData(shortCode) {
    return this.urlMappings.get(shortCode) || null;
  }

  /**
   * Find existing short code for URL
   * @param {string} originalUrl - Original URL
   * @param {string} ownerId - Owner ID
   * @returns {string|null} Existing short code
   */
  async findExistingShortCode(originalUrl, ownerId) {
    for (const [shortCode, urlData] of this.urlMappings.entries()) {
      if (urlData.originalUrl === originalUrl && urlData.ownerId === ownerId && urlData.isActive) {
        return shortCode;
      }
    }
    return null;
  }

  /**
   * Initialize analytics for a new URL
   * @param {string} shortCode - Short code
   */
  async initializeAnalytics(shortCode) {
    this.analytics.set(shortCode, {
      totalClicks: 0,
      uniqueClicks: 0,
      clicksByDate: {},
      clicksByCountry: {},
      clicksByDevice: {},
      clicksByReferrer: {},
      uniqueVisitors: new Set(),
    });
  }

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} Is valid URL
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Detect device type from user agent
   * @param {string} userAgent - User agent string
   * @returns {string} Device type
   */
  detectDevice(userAgent) {
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  /**
   * Extract domain from URL
   * @param {string} url - URL or referrer
   * @returns {string} Domain name
   */
  extractDomain(url) {
    if (url === 'Direct' || !url) return 'Direct';
    
    try {
      return new URL(url).hostname;
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Calculate performance metrics
   * @param {Object} analytics - Analytics data
   * @returns {Object} Performance metrics
   */
  calculatePerformanceMetrics(analytics) {
    const totalClicks = analytics.totalClicks || 0;
    const uniqueClicks = analytics.uniqueClicks || 0;
    
    return {
      clickThroughRate: totalClicks > 0 ? (uniqueClicks / totalClicks * 100).toFixed(2) : 0,
      averageClicksPerDay: this.calculateAverageClicksPerDay(analytics.clicksByDate),
      topCountry: this.getTopEntry(analytics.clicksByCountry),
      topDevice: this.getTopEntry(analytics.clicksByDevice),
      topReferrer: this.getTopEntry(analytics.clicksByReferrer),
    };
  }

  /**
   * Calculate average clicks per day
   * @param {Object} clicksByDate - Clicks by date object
   * @returns {number} Average clicks per day
   */
  calculateAverageClicksPerDay(clicksByDate) {
    const dates = Object.keys(clicksByDate);
    if (dates.length === 0) return 0;
    
    const totalClicks = Object.values(clicksByDate).reduce((sum, clicks) => sum + clicks, 0);
    return (totalClicks / dates.length).toFixed(2);
  }

  /**
   * Get top entry from analytics object
   * @param {Object} analyticsObject - Analytics data object
   * @returns {string} Top entry key
   */
  getTopEntry(analyticsObject) {
    if (!analyticsObject || Object.keys(analyticsObject).length === 0) {
      return 'None';
    }
    
    return Object.entries(analyticsObject)
      .sort(([, a], [, b]) => b - a)[0][0];
  }
}

module.exports = new UrlShortener();
