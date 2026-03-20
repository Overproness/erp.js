// @ts-nocheck
const UAParser = require('ua-parser-js');
const geoip = require('geoip-lite');
const { Parser } = require('json2csv');
const XLSX = require('xlsx');

class AnalyticsHelpers {
  /**
   * Parse user agent string to extract device information
   * @param {string} userAgent - User agent string
   * @returns {object} Parsed device information
   */
  parseUserAgent(userAgent) {
    if (!userAgent) {
      return this._getDefaultDeviceInfo();
    }

    try {
      const parser = new UAParser(userAgent);
      const result = parser.getResult();

      return {
        browser: {
          name: result.browser.name || 'Unknown',
          version: result.browser.version || null,
          major: result.browser.major || null,
          engine: result.engine.name || null
        },
        os: {
          name: result.os.name || 'Unknown',
          version: result.os.version || null
        },
        device: {
          type: this._getDeviceType(result),
          brand: result.device.vendor || null,
          model: result.device.model || null
        },
        cpu: {
          architecture: result.cpu.architecture || null
        },
        isBot: this._detectBot(userAgent),
        isMobile: this._isMobile(result),
        isTablet: this._isTablet(result),
        isDesktop: this._isDesktop(result)
      };
    } catch (error) {
      console.error('Error parsing user agent:', error);
      return this._getDefaultDeviceInfo();
    }
  }

  /**
   * Get default device info for unknown agents
   * @returns {object} Default device information
   */
  _getDefaultDeviceInfo() {
    return {
      browser: { name: 'Unknown', version: null, major: null, engine: null },
      os: { name: 'Unknown', version: null },
      device: { type: 'unknown', brand: null, model: null },
      cpu: { architecture: null },
      isBot: false,
      isMobile: false,
      isTablet: false,
      isDesktop: false
    };
  }

  /**
   * Determine device type from parsed UA
   * @param {object} parsedUA - Parsed user agent result
   * @returns {string} Device type
   */
  _getDeviceType(parsedUA) {
    if (parsedUA.device.type) {
      return parsedUA.device.type;
    }

    const userAgent = parsedUA.ua?.toLowerCase() || '';
    
    if (/mobile|android|iphone|ipod|phone|blackberry|mini|windows\sce|palm/i.test(userAgent)) {
      return 'mobile';
    }
    
    if (/tablet|ipad|playbook|silk|kindle/i.test(userAgent)) {
      return 'tablet';
    }
    
    if (/smart-?tv|tv|roku|apple\stv|boxee|googletv|hbbtv|pov_tv|netcast\.tv/i.test(userAgent)) {
      return 'smarttv';
    }
    
    if (/console|xbox|playstation|nintendo|wii/i.test(userAgent)) {
      return 'console';
    }
    
    return 'desktop';
  }

  /**
   * Detect if user agent is from a bot
   * @param {string} userAgent - User agent string
   * @returns {boolean} True if bot detected
   */
  _detectBot(userAgent) {
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i, /fetcher/i,
      /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i,
      /baiduspider/i, /yandexbot/i, /facebookexternalhit/i,
      /twitterbot/i, /linkedinbot/i, /whatsapp/i, /telegram/i,
      /curl/i, /wget/i, /python/i, /java/i, /php/i,
      /postman/i, /insomnia/i, /httpie/i, /node-fetch/i
    ];

    return botPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * Check if device is mobile
   * @param {object} parsedUA - Parsed user agent result
   * @returns {boolean} True if mobile
   */
  _isMobile(parsedUA) {
    return parsedUA.device.type === 'mobile' || 
           /mobile|android|iphone|ipod|phone|blackberry/i.test(parsedUA.ua);
  }

  /**
   * Check if device is tablet
   * @param {object} parsedUA - Parsed user agent result
   * @returns {boolean} True if tablet
   */
  _isTablet(parsedUA) {
    return parsedUA.device.type === 'tablet' || 
           /tablet|ipad|playbook|silk|kindle/i.test(parsedUA.ua);
  }

  /**
   * Check if device is desktop
   * @param {object} parsedUA - Parsed user agent result
   * @returns {boolean} True if desktop
   */
  _isDesktop(parsedUA) {
    return !this._isMobile(parsedUA) && !this._isTablet(parsedUA);
  }

  /**
   * Get country information from IP address
   * @param {string} ipAddress - IP address
   * @returns {object} Country information
   */
  getCountryFromIP(ipAddress) {
    if (!ipAddress || ipAddress === '127.0.0.1' || ipAddress === '::1') {
      return {
        country: null,
        countryCode: null,
        region: null,
        city: null,
        timezone: null,
        coordinates: null,
        accuracy: 'localhost'
      };
    }

    try {
      const geo = geoip.lookup(ipAddress);
      
      if (!geo) {
        return {
          country: null,
          countryCode: null,
          region: null,
          city: null,
          timezone: null,
          coordinates: null,
          accuracy: 'unknown'
        };
      }

      return {
        country: geo.country,
        countryCode: geo.country,
        region: geo.region,
        city: geo.city,
        timezone: geo.timezone,
        coordinates: geo.ll ? {
          latitude: geo.ll[0],
          longitude: geo.ll[1]
        } : null,
        accuracy: 'city',
        range: geo.range || null,
        metro: geo.metro || null
      };
    } catch (error) {
      console.error('Error getting country from IP:', error);
      return {
        country: null,
        countryCode: null,
        region: null,
        city: null,
        timezone: null,
        coordinates: null,
        accuracy: 'error'
      };
    }
  }

  /**
   * Calculate click-through rate
   * @param {number} clicks - Number of clicks
   * @param {number} views - Number of views/impressions
   * @returns {object} Click rate data
   */
  calculateClickRate(clicks, views) {
    if (!views || views === 0) {
      return {
        rate: 0,
        percentage: '0.00%',
        clicks,
        views: views || 0,
        ratio: '0:0'
      };
    }

    const rate = clicks / views;
    const percentage = (rate * 100).toFixed(2) + '%';
    const ratio = `${clicks}:${views}`;

    return {
      rate,
      percentage,
      clicks,
      views,
      ratio,
      quality: this._assessClickRateQuality(rate)
    };
  }

  /**
   * Assess click rate quality
   * @param {number} rate - Click rate (0-1)
   * @returns {string} Quality assessment
   */
  _assessClickRateQuality(rate) {
    if (rate >= 0.1) return 'excellent';
    if (rate >= 0.05) return 'good';
    if (rate >= 0.02) return 'average';
    if (rate >= 0.01) return 'below_average';
    return 'poor';
  }

  /**
   * Format analytics data for frontend consumption
   * @param {object} rawData - Raw analytics data
   * @param {string} format - Format type (summary, detailed, chart)
   * @returns {object} Formatted data
   */
  formatAnalyticsData(rawData, format = 'summary') {
    switch (format) {
      case 'summary':
        return this._formatSummaryData(rawData);
      case 'detailed':
        return this._formatDetailedData(rawData);
      case 'chart':
        return this._formatChartData(rawData);
      default:
        return rawData;
    }
  }

  /**
   * Format summary analytics data
   * @param {object} data - Raw analytics data
   * @returns {object} Summary data
   */
  _formatSummaryData(data) {
    return {
      totalClicks: data.totalClicks || 0,
      uniqueClicks: data.uniqueClicks || 0,
      clickRate: this.calculateClickRate(data.totalClicks, data.views),
      topCountries: (data.countries || []).slice(0, 5),
      topDevices: (data.devices || []).slice(0, 3),
      topBrowsers: (data.browsers || []).slice(0, 3),
      peakHour: data.peakHour || null,
      trend: data.trend || 'stable'
    };
  }

  /**
   * Format detailed analytics data
   * @param {object} data - Raw analytics data
   * @returns {object} Detailed data
   */
  _formatDetailedData(data) {
    return {
      ...this._formatSummaryData(data),
      hourlyDistribution: data.hourlyData || [],
      dailyDistribution: data.dailyData || [],
      weeklyDistribution: data.weeklyData || [],
      monthlyDistribution: data.monthlyData || [],
      referrerBreakdown: data.referrers || [],
      deviceBreakdown: data.devices || [],
      osBreakdown: data.operatingSystems || [],
      browserBreakdown: data.browsers || [],
      geographicBreakdown: data.geographic || []
    };
  }

  /**
   * Format data for chart visualization
   * @param {object} data - Raw analytics data
   * @returns {object} Chart-ready data
   */
  _formatChartData(data) {
    return {
      timeline: {
        labels: data.timeLabels || [],
        datasets: [{
          label: 'Clicks',
          data: data.clicksData || [],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)'
        }]
      },
      geographic: {
        type: 'choropleth',
        data: (data.countries || []).map(country => ({
          country: country.code,
          value: country.clicks
        }))
      },
      devices: {
        type: 'pie',
        labels: (data.devices || []).map(d => d.type),
        data: (data.devices || []).map(d => d.count)
      }
    };
  }

  /**
   * Generate chart data for various analytics views
   * @param {array} timeSeriesData - Time series data
   * @param {string} interval - Time interval (hour, day, week, month)
   * @returns {object} Chart data
   */
  generateChartData(timeSeriesData, interval = 'day') {
    const labels = [];
    const clicksData = [];
    const uniqueClicksData = [];

    timeSeriesData.forEach(point => {
      labels.push(this._formatTimeLabel(point.timestamp, interval));
      clicksData.push(point.clicks || 0);
      uniqueClicksData.push(point.uniqueClicks || 0);
    });

    return {
      labels,
      datasets: [
        {
          label: 'Total Clicks',
          data: clicksData,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.1
        },
        {
          label: 'Unique Clicks',
          data: uniqueClicksData,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1
        }
      ]
    };
  }

  /**
   * Format time label based on interval
   * @param {Date|string} timestamp - Timestamp
   * @param {string} interval - Time interval
   * @returns {string} Formatted label
   */
  _formatTimeLabel(timestamp, interval) {
    const date = new Date(timestamp);
    
    switch (interval) {
      case 'hour':
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      case 'day':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      case 'week':
        return `Week ${this._getWeekNumber(date)}`;
      case 'month':
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
      default:
        return date.toLocaleDateString();
    }
  }

  /**
   * Get week number for a date
   * @param {Date} date - Date object
   * @returns {number} Week number
   */
  _getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Calculate performance metrics
   * @param {object} currentData - Current period data
   * @param {object} previousData - Previous period data for comparison
   * @returns {object} Performance metrics
   */
  calculatePerformanceMetrics(currentData, previousData = null) {
    const metrics = {
      current: {
        clicks: currentData.clicks || 0,
        uniqueClicks: currentData.uniqueClicks || 0,
        bounceRate: currentData.bounceRate || 0,
        avgSessionDuration: currentData.avgSessionDuration || 0
      }
    };

    if (previousData) {
      metrics.comparison = {
        clicksChange: this._calculatePercentageChange(
          currentData.clicks, 
          previousData.clicks
        ),
        uniqueClicksChange: this._calculatePercentageChange(
          currentData.uniqueClicks, 
          previousData.uniqueClicks
        ),
        bounceRateChange: this._calculatePercentageChange(
          currentData.bounceRate, 
          previousData.bounceRate
        ),
        sessionDurationChange: this._calculatePercentageChange(
          currentData.avgSessionDuration, 
          previousData.avgSessionDuration
        )
      };
    }

    return metrics;
  }

  /**
   * Calculate percentage change between two values
   * @param {number} current - Current value
   * @param {number} previous - Previous value
   * @returns {object} Change data
   */
  _calculatePercentageChange(current, previous) {
    if (!previous || previous === 0) {
      return {
        value: current > 0 ? 100 : 0,
        direction: current > 0 ? 'up' : 'neutral',
        significant: current > 0
      };
    }

    const change = ((current - previous) / previous) * 100;
    
    return {
      value: Math.round(change * 100) / 100,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      significant: Math.abs(change) >= 5 // 5% threshold for significance
    };
  }

  /**
   * Aggregate click data by time interval
   * @param {array} clicks - Array of click records
   * @param {string} interval - Aggregation interval
   * @returns {array} Aggregated data
   */
  aggregateClicksByInterval(clicks, interval = 'day') {
    const aggregated = new Map();

    clicks.forEach(click => {
      const key = this._getIntervalKey(new Date(click.clickedAt), interval);
      
      if (!aggregated.has(key)) {
        aggregated.set(key, {
          timestamp: key,
          clicks: 0,
          uniqueClicks: 0,
          uniqueUsers: new Set()
        });
      }

      const data = aggregated.get(key);
      data.clicks++;
      
      if (click.userId) {
        data.uniqueUsers.add(click.userId);
      }
      
      if (click.isUniqueClick) {
        data.uniqueClicks++;
      }
    });

    // Convert to array and finalize unique counts
    return Array.from(aggregated.values()).map(item => ({
      timestamp: item.timestamp,
      clicks: item.clicks,
      uniqueClicks: item.uniqueClicks,
      uniqueUsers: item.uniqueUsers.size
    })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * Get interval key for aggregation
   * @param {Date} date - Date to get key for
   * @param {string} interval - Interval type
   * @returns {string} Interval key
   */
  _getIntervalKey(date, interval) {
    switch (interval) {
      case 'hour':
        return date.toISOString().substring(0, 13) + ':00:00.000Z';
      case 'day':
        return date.toISOString().substring(0, 10) + 'T00:00:00.000Z';
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().substring(0, 10) + 'T00:00:00.000Z';
      case 'month':
        return date.getFullYear() + '-' + 
               String(date.getMonth() + 1).padStart(2, '0') + 
               '-01T00:00:00.000Z';
      default:
        return date.toISOString().substring(0, 10) + 'T00:00:00.000Z';
    }
  }

  /**
   * Convert data to CSV string
   * @param {object|array} data - Data to convert
   * @returns {string} CSV string
   */
  convertToCSV(data) {
    try {
      // If data is an object with multiple arrays, flatten for CSV
      if (Array.isArray(data)) {
        if (data.length === 0) return '';
        const parser = new Parser();
        return parser.parse(data);
      } else if (typeof data === 'object' && data !== null) {
        // If object, flatten each array property as a separate CSV section
        let csv = '';
        for (const [key, value] of Object.entries(data)) {
          if (Array.isArray(value) && value.length > 0) {
            const parser = new Parser();
            csv += `\n\n# ${key}\n`;
            csv += parser.parse(value);
          } else if (typeof value === 'object' && value !== null) {
            csv += `\n\n# ${key}\n`;
            csv += Object.entries(value).map(([k, v]) => `${k},${v}`).join('\n');
          }
        }
        return csv.trim();
      }
      return '';
    } catch (err) {
      console.error('CSV conversion error:', err);
      return '';
    }
  }
}

module.exports = new AnalyticsHelpers();
