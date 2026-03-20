// @ts-nocheck
const axios = require('axios');

class URLWebhooks {
  constructor() {
    this.webhookConfig = {
      retryAttempts: 3,
      retryDelay: 1000, // ms
      timeout: 10000, // ms
      enabledEvents: process.env.URL_WEBHOOK_EVENTS?.split(',') || [
        'url.created',
        'url.clicked',
        'url.expired',
        'abtest.completed'
      ]
    };

    this.registeredWebhooks = new Map();
  }

  /**
   * Register a webhook endpoint
   * @param {string} event - Event name
   * @param {string} url - Webhook URL
   * @param {object} options - Webhook options
   */
  registerWebhook(event, url, options = {}) {
    if (!this.registeredWebhooks.has(event)) {
      this.registeredWebhooks.set(event, []);
    }

    const webhook = {
      url,
      secret: options.secret,
      headers: options.headers || {},
      enabled: options.enabled !== false,
      retryAttempts: options.retryAttempts || this.webhookConfig.retryAttempts,
      timeout: options.timeout || this.webhookConfig.timeout,
      filters: options.filters || {},
      id: this._generateWebhookId()
    };

    this.registeredWebhooks.get(event).push(webhook);
    console.log(`Registered webhook for ${event}:`, webhook.url);
  }

  /**
   * URL creation webhook
   * @param {object} urlData - URL data
   * @param {object} context - Creation context
   */
  async onUrlCreated(urlData, context = {}) {
    if (!this._isEventEnabled('url.created')) return;

    const payload = {
      event: 'url.created',
      timestamp: new Date().toISOString(),
      data: {
        url: {
          id: urlData._id,
          shortCode: urlData.shortCode,
          originalUrl: urlData.originalUrl,
          shortUrl: `${process.env.SHORT_URL_DOMAIN || 'http://localhost:8888/s'}/${urlData.shortCode}`,
          title: urlData.title,
          description: urlData.description,
          isPublic: urlData.isPublic,
          isActive: urlData.isActive,
          createdAt: urlData.createdAt,
          createdBy: urlData.createdBy,
          linkedModule: urlData.linkedModule,
          linkedEntityId: urlData.linkedEntityId,
          utmParameters: {
            source: urlData.utmSource,
            medium: urlData.utmMedium,
            campaign: urlData.utmCampaign,
            content: urlData.utmContent,
            term: urlData.utmTerm
          },
          expiresAt: urlData.expiresAt,
          tags: urlData.tags
        },
        context: {
          userAgent: context.userAgent,
          ipAddress: context.ipAddress,
          userId: context.userId,
          source: context.source || 'api'
        }
      }
    };

    await this._triggerWebhooks('url.created', payload);
  }

  /**
   * URL click webhook
   * @param {object} urlData - URL data
   * @param {object} clickData - Click data
   */
  async onUrlClicked(urlData, clickData) {
    if (!this._isEventEnabled('url.clicked')) return;

    const payload = {
      event: 'url.clicked',
      timestamp: new Date().toISOString(),
      data: {
        url: {
          id: urlData._id,
          shortCode: urlData.shortCode,
          originalUrl: urlData.originalUrl,
          shortUrl: `${process.env.SHORT_URL_DOMAIN || 'http://localhost:8888/s'}/${urlData.shortCode}`,
          title: urlData.title,
          linkedModule: urlData.linkedModule,
          linkedEntityId: urlData.linkedEntityId
        },
        click: {
          id: clickData._id,
          timestamp: clickData.clickedAt,
          ipAddress: this._hashIP(clickData.ipAddress),
          userAgent: clickData.userAgent,
          referrer: clickData.referrer,
          country: clickData.country,
          city: clickData.city,
          device: clickData.device,
          browser: clickData.browser,
          os: clickData.os,
          isUniqueClick: clickData.isUniqueClick,
          sessionId: clickData.sessionId,
          userId: clickData.userId,
          utmParameters: {
            source: clickData.utmSource,
            medium: clickData.utmMedium,
            campaign: clickData.utmCampaign,
            content: clickData.utmContent,
            term: clickData.utmTerm
          }
        },
        analytics: {
          totalClicks: urlData.totalClicks + 1,
          uniqueClicks: urlData.uniqueClicks + (clickData.isUniqueClick ? 1 : 0),
          clickRate: this._calculateClickRate(urlData.totalClicks + 1, urlData.views || 0)
        }
      }
    };

    await this._triggerWebhooks('url.clicked', payload);
  }

  /**
   * URL expiration webhook
   * @param {object} urlData - URL data
   * @param {string} reason - Expiration reason
   */
  async onUrlExpired(urlData, reason = 'time_expired') {
    if (!this._isEventEnabled('url.expired')) return;

    const payload = {
      event: 'url.expired',
      timestamp: new Date().toISOString(),
      data: {
        url: {
          id: urlData._id,
          shortCode: urlData.shortCode,
          originalUrl: urlData.originalUrl,
          shortUrl: `${process.env.SHORT_URL_DOMAIN || 'http://localhost:8888/s'}/${urlData.shortCode}`,
          title: urlData.title,
          linkedModule: urlData.linkedModule,
          linkedEntityId: urlData.linkedEntityId,
          createdAt: urlData.createdAt,
          expiresAt: urlData.expiresAt
        },
        expiration: {
          reason,
          finalStats: {
            totalClicks: urlData.totalClicks,
            uniqueClicks: urlData.uniqueClicks,
            lastClickedAt: urlData.lastClickedAt
          },
          lifetime: {
            days: this._calculateLifetimeDays(urlData.createdAt, new Date()),
            clicksPerDay: this._calculateClicksPerDay(urlData.totalClicks, urlData.createdAt)
          }
        }
      }
    };

    await this._triggerWebhooks('url.expired', payload);
  }

  /**
   * A/B test completion webhook
   * @param {object} testData - A/B test data
   * @param {object} results - Test results
   */
  async onAbTestComplete(testData, results) {
    if (!this._isEventEnabled('abtest.completed')) return;

    const payload = {
      event: 'abtest.completed',
      timestamp: new Date().toISOString(),
      data: {
        test: {
          id: testData._id,
          name: testData.testName,
          description: testData.description,
          status: testData.status,
          startedAt: testData.startedAt,
          completedAt: testData.completedAt,
          duration: this._calculateDuration(testData.startedAt, testData.completedAt),
          trafficDistribution: testData.trafficDistribution,
          linkedModule: testData.linkedModule,
          linkedEntityId: testData.linkedEntityId
        },
        results: {
          winner: results.winner,
          confidence: results.confidence,
          significance: results.significance,
          variants: results.variants.map(variant => ({
            name: variant.name,
            url: variant.url,
            clicks: variant.clicks,
            conversions: variant.conversions,
            conversionRate: variant.conversionRate,
            improvement: variant.improvement
          })),
          metrics: {
            totalClicks: results.totalClicks,
            totalConversions: results.totalConversions,
            overallConversionRate: results.overallConversionRate,
            statisticalSignificance: results.statisticalSignificance
          }
        },
        recommendations: results.recommendations || []
      }
    };

    await this._triggerWebhooks('abtest.completed', payload);
  }

  /**
   * Custom event webhook
   * @param {string} eventName - Custom event name
   * @param {object} data - Event data
   */
  async onCustomEvent(eventName, data) {
    if (!this._isEventEnabled(eventName)) return;

    const payload = {
      event: eventName,
      timestamp: new Date().toISOString(),
      data
    };

    await this._triggerWebhooks(eventName, payload);
  }

  /**
   * Bulk operations webhook
   * @param {string} operation - Operation type
   * @param {array} urls - Affected URLs
   * @param {object} context - Operation context
   */
  async onBulkOperation(operation, urls, context = {}) {
    if (!this._isEventEnabled('url.bulk_operation')) return;

    const payload = {
      event: 'url.bulk_operation',
      timestamp: new Date().toISOString(),
      data: {
        operation,
        count: urls.length,
        urls: urls.map(url => ({
          id: url._id,
          shortCode: url.shortCode,
          originalUrl: url.originalUrl,
          title: url.title,
          linkedModule: url.linkedModule,
          linkedEntityId: url.linkedEntityId
        })),
        context: {
          userId: context.userId,
          source: context.source || 'api',
          filters: context.filters || {},
          timestamp: context.timestamp || new Date()
        }
      }
    };

    await this._triggerWebhooks('url.bulk_operation', payload);
  }

  // Private helper methods

  /**
   * Trigger webhooks for an event
   * @param {string} event - Event name
   * @param {object} payload - Webhook payload
   */
  async _triggerWebhooks(event, payload) {
    const webhooks = this.registeredWebhooks.get(event) || [];
    const enabledWebhooks = webhooks.filter(webhook => webhook.enabled);

    if (enabledWebhooks.length === 0) return;

    const triggerPromises = enabledWebhooks.map(webhook => 
      this._callWebhook(webhook, payload)
    );

    try {
      await Promise.allSettled(triggerPromises);
    } catch (error) {
      console.error(`Error triggering webhooks for ${event}:`, error);
    }
  }

  /**
   * Call individual webhook
   * @param {object} webhook - Webhook configuration
   * @param {object} payload - Webhook payload
   */
  async _callWebhook(webhook, payload) {
    let attempt = 0;
    
    while (attempt < webhook.retryAttempts) {
      try {
        const headers = {
          'Content-Type': 'application/json',
          'User-Agent': 'URLManager-Webhook/1.0',
          'X-Webhook-Event': payload.event,
          'X-Webhook-Timestamp': payload.timestamp,
          'X-Webhook-ID': this._generateWebhookId(),
          ...webhook.headers
        };

        // Add signature if secret is provided
        if (webhook.secret) {
          const signature = this._generateSignature(JSON.stringify(payload), webhook.secret);
          headers['X-Webhook-Signature'] = signature;
        }

        const response = await axios.post(webhook.url, payload, {
          headers,
          timeout: webhook.timeout,
          validateStatus: (status) => status >= 200 && status < 300
        });

        console.log(`Webhook called successfully: ${webhook.url}`, {
          status: response.status,
          event: payload.event
        });

        return response;
      } catch (error) {
        attempt++;
        console.error(`Webhook call failed (attempt ${attempt}/${webhook.retryAttempts}):`, {
          url: webhook.url,
          event: payload.event,
          error: error.message
        });

        if (attempt < webhook.retryAttempts) {
          await this._delay(this.webhookConfig.retryDelay * attempt);
        } else {
          console.error(`Webhook failed after ${webhook.retryAttempts} attempts:`, webhook.url);
          // In production, might want to add to dead letter queue
        }
      }
    }
  }

  /**
   * Check if event is enabled
   * @param {string} event - Event name
   * @returns {boolean} Whether event is enabled
   */
  _isEventEnabled(event) {
    return this.webhookConfig.enabledEvents.includes(event) || 
           this.webhookConfig.enabledEvents.includes('*');
  }

  /**
   * Generate webhook signature
   * @param {string} payload - Payload string
   * @param {string} secret - Webhook secret
   * @returns {string} HMAC signature
   */
  _generateSignature(payload, secret) {
    const crypto = require('crypto');
    return 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Generate webhook ID
   * @returns {string} Unique webhook ID
   */
  _generateWebhookId() {
    const crypto = require('crypto');
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Hash IP address for privacy
   * @param {string} ipAddress - IP address
   * @returns {string} Hashed IP
   */
  _hashIP(ipAddress) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(ipAddress).digest('hex').substring(0, 8);
  }

  /**
   * Calculate click rate
   * @param {number} clicks - Number of clicks
   * @param {number} views - Number of views
   * @returns {number} Click rate
   */
  _calculateClickRate(clicks, views) {
    return views > 0 ? (clicks / views * 100) : 0;
  }

  /**
   * Calculate lifetime in days
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {number} Days
   */
  _calculateLifetimeDays(startDate, endDate) {
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate clicks per day
   * @param {number} totalClicks - Total clicks
   * @param {Date} createdAt - Creation date
   * @returns {number} Clicks per day
   */
  _calculateClicksPerDay(totalClicks, createdAt) {
    const days = this._calculateLifetimeDays(createdAt, new Date());
    return days > 0 ? (totalClicks / days) : 0;
  }

  /**
   * Calculate duration between dates
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {object} Duration object
   */
  _calculateDuration(startDate, endDate) {
    const diffTime = Math.abs(endDate - startDate);
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      total_milliseconds: diffTime,
      days,
      hours,
      minutes,
      human_readable: `${days}d ${hours}h ${minutes}m`
    };
  }

  /**
   * Delay execution
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Delay promise
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new URLWebhooks();
