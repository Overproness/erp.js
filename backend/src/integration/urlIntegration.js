const urlService = require('../services/urlService');
const urlHelpers = require('../helpers/urlHelpers');

class URLIntegration {
  constructor() {
    this.integrationConfig = {
      baseShortUrl: process.env.SHORT_URL_DOMAIN || 'http://localhost:8888/s',
      defaultExpiration: 90, // days
      defaultDomain: process.env.DEFAULT_DOMAIN || 'app.techrevisor.com'
    };
  }

  /**
   * Link URL to invoice
   * @param {string} invoiceId - Invoice ID
   * @param {string} originalUrl - Original URL to shorten
   * @param {object} options - Additional options
   * @returns {Promise<object>} URL data
   */
  async linkToInvoice(invoiceId, originalUrl, options = {}) {
    try {
      const urlData = {
        originalUrl,
        title: options.title || `Invoice ${invoiceId} Link`,
        description: options.description || `Shortened URL for invoice ${invoiceId}`,
        linkedModule: 'invoice',
        linkedEntityId: invoiceId,
        owner: options.userId,
        utmSource: 'invoice',
        utmMedium: 'email',
        utmCampaign: options.campaign || 'invoice_delivery',
        utmContent: `invoice_${invoiceId}`,
        expiresAt: options.expiresAt || this._getDefaultExpiration(),
        isPublic: options.isPublic !== false, // Default to public
        tags: ['invoice', 'payment', ...(options.tags || [])]
      };

      const url = await urlService.create(urlData);
      await this._logIntegrationEvent('invoice', invoiceId, url.shortCode, 'linked');
      
      return {
        shortUrl: `${this.integrationConfig.baseShortUrl}/${url.shortCode}`,
        shortCode: url.shortCode,
        urlId: url._id,
        trackingData: {
          utmParameters: this._buildUTMString(url),
          trackingUrl: this._buildTrackingUrl(url)
        }
      };
    } catch (error) {
      console.error('Error linking URL to invoice:', error);
      throw new Error(`Failed to create URL for invoice ${invoiceId}: ${error.message}`);
    }
  }

  /**
   * Link URL to quote
   * @param {string} quoteId - Quote ID
   * @param {string} originalUrl - Original URL to shorten
   * @param {object} options - Additional options
   * @returns {Promise<object>} URL data
   */
  async linkToQuote(quoteId, originalUrl, options = {}) {
    try {
      const urlData = {
        originalUrl,
        title: options.title || `Quote ${quoteId} Link`,
        description: options.description || `Shortened URL for quote ${quoteId}`,
        linkedModule: 'quote',
        linkedEntityId: quoteId,
        owner: options.userId,
        utmSource: 'quote',
        utmMedium: 'email',
        utmCampaign: options.campaign || 'quote_delivery',
        utmContent: `quote_${quoteId}`,
        expiresAt: options.expiresAt || this._getDefaultExpiration(),
        isPublic: options.isPublic !== false,
        tags: ['quote', 'proposal', ...(options.tags || [])]
      };

      const url = await urlService.create(urlData);
      await this._logIntegrationEvent('quote', quoteId, url.shortCode, 'linked');
      
      return {
        shortUrl: `${this.integrationConfig.baseShortUrl}/${url.shortCode}`,
        shortCode: url.shortCode,
        urlId: url._id,
        trackingData: {
          utmParameters: this._buildUTMString(url),
          trackingUrl: this._buildTrackingUrl(url)
        }
      };
    } catch (error) {
      console.error('Error linking URL to quote:', error);
      throw new Error(`Failed to create URL for quote ${quoteId}: ${error.message}`);
    }
  }

  /**
   * Link URL to customer
   * @param {string} customerId - Customer ID
   * @param {string} originalUrl - Original URL to shorten
   * @param {object} options - Additional options
   * @returns {Promise<object>} URL data
   */
  async linkToCustomer(customerId, originalUrl, options = {}) {
    try {
      const urlData = {
        originalUrl,
        title: options.title || `Customer Portal Link`,
        description: options.description || `Shortened URL for customer ${customerId}`,
        linkedModule: 'customer',
        linkedEntityId: customerId,
        owner: options.userId,
        utmSource: 'customer_portal',
        utmMedium: options.medium || 'email',
        utmCampaign: options.campaign || 'customer_engagement',
        utmContent: `customer_${customerId}`,
        expiresAt: options.expiresAt || this._getDefaultExpiration(),
        requiresAuth: options.requiresAuth || false,
        allowedUsers: options.allowedUsers || [],
        isPublic: options.isPublic !== false,
        tags: ['customer', 'portal', ...(options.tags || [])]
      };

      const url = await urlService.create(urlData);
      await this._logIntegrationEvent('customer', customerId, url.shortCode, 'linked');
      
      return {
        shortUrl: `${this.integrationConfig.baseShortUrl}/${url.shortCode}`,
        shortCode: url.shortCode,
        urlId: url._id,
        trackingData: {
          utmParameters: this._buildUTMString(url),
          trackingUrl: this._buildTrackingUrl(url)
        }
      };
    } catch (error) {
      console.error('Error linking URL to customer:', error);
      throw new Error(`Failed to create URL for customer ${customerId}: ${error.message}`);
    }
  }

  /**
   * Link URL to document
   * @param {string} documentId - Document ID
   * @param {string} originalUrl - Original URL to shorten
   * @param {object} options - Additional options
   * @returns {Promise<object>} URL data
   */
  async linkToDocument(documentId, originalUrl, options = {}) {
    try {
      const urlData = {
        originalUrl,
        title: options.title || `Document ${documentId} Link`,
        description: options.description || `Shortened URL for document ${documentId}`,
        linkedModule: 'document',
        linkedEntityId: documentId,
        owner: options.userId,
        utmSource: 'document',
        utmMedium: options.medium || 'share',
        utmCampaign: options.campaign || 'document_sharing',
        utmContent: `document_${documentId}`,
        expiresAt: options.expiresAt || this._getDefaultExpiration(),
        requiresAuth: options.requiresAuth || true, // Documents usually require auth
        allowedUsers: options.allowedUsers || [],
        passwordProtected: options.passwordProtected || false,
        maxClicks: options.maxClicks || null,
        isPublic: options.isPublic || false, // Documents default to private
        tags: ['document', 'sharing', ...(options.tags || [])]
      };

      const url = await urlService.create(urlData);
      await this._logIntegrationEvent('document', documentId, url.shortCode, 'linked');
      
      return {
        shortUrl: `${this.integrationConfig.baseShortUrl}/${url.shortCode}`,
        shortCode: url.shortCode,
        urlId: url._id,
        trackingData: {
          utmParameters: this._buildUTMString(url),
          trackingUrl: this._buildTrackingUrl(url)
        }
      };
    } catch (error) {
      console.error('Error linking URL to document:', error);
      throw new Error(`Failed to create URL for document ${documentId}: ${error.message}`);
    }
  }

  /**
   * Link URL to email campaign
   * @param {string} campaignId - Campaign ID
   * @param {string} originalUrl - Original URL to shorten
   * @param {object} options - Additional options
   * @returns {Promise<object>} URL data
   */
  async linkToCampaign(campaignId, originalUrl, options = {}) {
    try {
      const urlData = {
        originalUrl,
        title: options.title || `Campaign ${campaignId} Link`,
        description: options.description || `Shortened URL for campaign ${campaignId}`,
        linkedModule: 'campaign',
        linkedEntityId: campaignId,
        owner: options.userId,
        utmSource: options.utmSource || 'email_campaign',
        utmMedium: 'email',
        utmCampaign: campaignId,
        utmContent: options.utmContent || `campaign_${campaignId}`,
        utmTerm: options.utmTerm || null,
        expiresAt: options.expiresAt || this._getDefaultExpiration(),
        isPublic: true,
        trackOpens: true,
        trackClicks: true,
        tags: ['campaign', 'email', 'marketing', ...(options.tags || [])]
      };

      const url = await urlService.create(urlData);
      await this._logIntegrationEvent('campaign', campaignId, url.shortCode, 'linked');
      
      return {
        shortUrl: `${this.integrationConfig.baseShortUrl}/${url.shortCode}`,
        shortCode: url.shortCode,
        urlId: url._id,
        trackingData: {
          utmParameters: this._buildUTMString(url),
          trackingUrl: this._buildTrackingUrl(url)
        }
      };
    } catch (error) {
      console.error('Error linking URL to campaign:', error);
      throw new Error(`Failed to create URL for campaign ${campaignId}: ${error.message}`);
    }
  }

  /**
   * Auto-generate URLs for entities
   * @param {string} module - Module name
   * @param {string} entityId - Entity ID
   * @param {array} urlTypes - Types of URLs to generate
   * @param {object} options - Additional options
   * @returns {Promise<object>} Generated URLs
   */
  async generateModuleUrls(module, entityId, urlTypes = [], options = {}) {
    try {
      const generatedUrls = {};
      const baseUrl = options.baseUrl || `${this.integrationConfig.defaultDomain}/${module}/${entityId}`;

      for (const urlType of urlTypes) {
        let originalUrl = baseUrl;
        let urlOptions = { ...options };

        switch (urlType) {
          case 'view':
            originalUrl = `${baseUrl}/view`;
            urlOptions.title = `View ${module} ${entityId}`;
            urlOptions.utmContent = `${module}_view`;
            break;

          case 'edit':
            originalUrl = `${baseUrl}/edit`;
            urlOptions.title = `Edit ${module} ${entityId}`;
            urlOptions.utmContent = `${module}_edit`;
            urlOptions.requiresAuth = true;
            break;

          case 'share':
            originalUrl = `${baseUrl}/share`;
            urlOptions.title = `Share ${module} ${entityId}`;
            urlOptions.utmContent = `${module}_share`;
            break;

          case 'download':
            originalUrl = `${baseUrl}/download`;
            urlOptions.title = `Download ${module} ${entityId}`;
            urlOptions.utmContent = `${module}_download`;
            urlOptions.trackDownloads = true;
            break;

          case 'api':
            originalUrl = `${baseUrl}/api`;
            urlOptions.title = `API Access ${module} ${entityId}`;
            urlOptions.utmContent = `${module}_api`;
            urlOptions.requiresAuth = true;
            urlOptions.isPublic = false;
            break;

          default:
            originalUrl = baseUrl;
            urlOptions.title = `${module} ${entityId}`;
        }

        // Generate URL using appropriate method
        const methodName = `linkTo${module.charAt(0).toUpperCase() + module.slice(1)}`;
        if (typeof this[methodName] === 'function') {
          generatedUrls[urlType] = await this[methodName](entityId, originalUrl, urlOptions);
        } else {
          // Generic URL generation
          generatedUrls[urlType] = await this._generateGenericUrl(module, entityId, originalUrl, urlOptions);
        }
      }

      await this._logIntegrationEvent(module, entityId, 'multiple', 'bulk_generated', {
        urlTypes,
        count: urlTypes.length
      });

      return generatedUrls;
    } catch (error) {
      console.error('Error generating module URLs:', error);
      throw new Error(`Failed to generate URLs for ${module} ${entityId}: ${error.message}`);
    }
  }

  /**
   * Get URLs linked to an entity
   * @param {string} module - Module name
   * @param {string} entityId - Entity ID
   * @returns {Promise<array>} Linked URLs
   */
  async getLinkedUrls(module, entityId) {
    try {
      return await urlService.findByLinkedEntity(module, entityId);
    } catch (error) {
      console.error('Error getting linked URLs:', error);
      throw new Error(`Failed to get URLs for ${module} ${entityId}: ${error.message}`);
    }
  }

  /**
   * Update linked URLs when entity changes
   * @param {string} module - Module name
   * @param {string} entityId - Entity ID
   * @param {object} changes - Changes to apply
   * @returns {Promise<object>} Update result
   */
  async updateLinkedUrls(module, entityId, changes) {
    try {
      const urls = await this.getLinkedUrls(module, entityId);
      const updatePromises = urls.map(url => 
        urlService.update(url._id, {
          ...changes,
          updatedAt: new Date()
        })
      );

      const results = await Promise.all(updatePromises);
      
      await this._logIntegrationEvent(module, entityId, 'multiple', 'bulk_updated', {
        urlCount: urls.length,
        changes: Object.keys(changes)
      });

      return {
        success: true,
        updatedCount: results.length,
        urls: results
      };
    } catch (error) {
      console.error('Error updating linked URLs:', error);
      throw new Error(`Failed to update URLs for ${module} ${entityId}: ${error.message}`);
    }
  }

  /**
   * Delete linked URLs when entity is deleted
   * @param {string} module - Module name
   * @param {string} entityId - Entity ID
   * @param {boolean} softDelete - Whether to soft delete or hard delete
   * @returns {Promise<object>} Delete result
   */
  async deleteLinkedUrls(module, entityId, softDelete = true) {
    try {
      const urls = await this.getLinkedUrls(module, entityId);
      const deletePromises = urls.map(url => 
        softDelete 
          ? urlService.update(url._id, { isActive: false, deletedAt: new Date() })
          : urlService.delete(url._id)
      );

      const results = await Promise.all(deletePromises);
      
      await this._logIntegrationEvent(module, entityId, 'multiple', 'bulk_deleted', {
        urlCount: urls.length,
        softDelete
      });

      return {
        success: true,
        deletedCount: results.length,
        softDelete
      };
    } catch (error) {
      console.error('Error deleting linked URLs:', error);
      throw new Error(`Failed to delete URLs for ${module} ${entityId}: ${error.message}`);
    }
  }

  /**
   * Generate social media sharing URLs
   * @param {string} module - Module name
   * @param {string} entityId - Entity ID
   * @param {object} options - Sharing options
   * @returns {Promise<object>} Social sharing URLs
   */
  async generateSocialSharingUrls(module, entityId, options = {}) {
    try {
      const baseUrl = options.baseUrl || `${this.integrationConfig.defaultDomain}/${module}/${entityId}`;
      const socialUrls = {};

      const platforms = options.platforms || ['facebook', 'twitter', 'linkedin', 'email'];

      for (const platform of platforms) {
        const urlOptions = {
          ...options,
          title: `Share ${module} on ${platform}`,
          utmSource: platform,
          utmMedium: 'social',
          utmCampaign: options.campaign || `${module}_social_sharing`,
          utmContent: `${platform}_${module}_${entityId}`,
          tags: ['social', platform, module, ...(options.tags || [])]
        };

        socialUrls[platform] = await this._generateGenericUrl(module, entityId, baseUrl, urlOptions);
      }

      return socialUrls;
    } catch (error) {
      console.error('Error generating social sharing URLs:', error);
      throw new Error(`Failed to generate social URLs for ${module} ${entityId}: ${error.message}`);
    }
  }

  // Private helper methods

  /**
   * Generate generic URL for any module
   * @param {string} module - Module name
   * @param {string} entityId - Entity ID
   * @param {string} originalUrl - Original URL
   * @param {object} options - URL options
   * @returns {Promise<object>} URL data
   */
  async _generateGenericUrl(module, entityId, originalUrl, options = {}) {
    const urlData = {
      originalUrl,
      title: options.title || `${module} ${entityId} Link`,
      description: options.description || `Shortened URL for ${module} ${entityId}`,
      linkedModule: module,
      linkedEntityId: entityId,
      owner: options.userId,
      utmSource: options.utmSource || module,
      utmMedium: options.utmMedium || 'link',
      utmCampaign: options.utmCampaign || `${module}_sharing`,
      utmContent: options.utmContent || `${module}_${entityId}`,
      expiresAt: options.expiresAt || this._getDefaultExpiration(),
      isPublic: options.isPublic !== false,
      requiresAuth: options.requiresAuth || false,
      tags: [module, ...(options.tags || [])]
    };

    const url = await urlService.create(urlData);
    
    return {
      shortUrl: `${this.integrationConfig.baseShortUrl}/${url.shortCode}`,
      shortCode: url.shortCode,
      urlId: url._id,
      trackingData: {
        utmParameters: this._buildUTMString(url),
        trackingUrl: this._buildTrackingUrl(url)
      }
    };
  }

  /**
   * Get default expiration date
   * @returns {Date} Default expiration date
   */
  _getDefaultExpiration() {
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + this.integrationConfig.defaultExpiration);
    return expiration;
  }

  /**
   * Build UTM parameter string
   * @param {object} url - URL object
   * @returns {string} UTM parameter string
   */
  _buildUTMString(url) {
    const params = [];
    if (url.utmSource) params.push(`utm_source=${encodeURIComponent(url.utmSource)}`);
    if (url.utmMedium) params.push(`utm_medium=${encodeURIComponent(url.utmMedium)}`);
    if (url.utmCampaign) params.push(`utm_campaign=${encodeURIComponent(url.utmCampaign)}`);
    if (url.utmContent) params.push(`utm_content=${encodeURIComponent(url.utmContent)}`);
    if (url.utmTerm) params.push(`utm_term=${encodeURIComponent(url.utmTerm)}`);
    return params.join('&');
  }

  /**
   * Build tracking URL with UTM parameters
   * @param {object} url - URL object
   * @returns {string} Tracking URL
   */
  _buildTrackingUrl(url) {
    const utmString = this._buildUTMString(url);
    const separator = url.originalUrl.includes('?') ? '&' : '?';
    return utmString ? `${url.originalUrl}${separator}${utmString}` : url.originalUrl;
  }

  /**
   * Log integration events
   * @param {string} module - Module name
   * @param {string} entityId - Entity ID
   * @param {string} shortCode - Short code
   * @param {string} action - Action performed
   * @param {object} metadata - Additional metadata
   */
  async _logIntegrationEvent(module, entityId, shortCode, action, metadata = {}) {
    try {
      const logData = {
        timestamp: new Date(),
        module,
        entityId,
        shortCode,
        action,
        metadata
      };

      // In production, save to audit log or analytics database
      console.log('URL Integration Event:', logData);
    } catch (error) {
      console.error('Error logging integration event:', error);
    }
  }
}

module.exports = new URLIntegration();
