const urlIntegration = require('../integration/urlIntegration');
const Client = require('@/models/appModels/Client');
const crypto = require('crypto');

class CRMUrlService {
  constructor() {
    this.urlIntegration = urlIntegration;
    this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    this.apiUrl = process.env.BACKEND_URL || 'http://localhost:8888';
  }

  /**
   * Generate custom URL for customer portal access
   * @param {string} customerId - Customer/Client ID
   * @param {object} options - Additional options
   * @returns {Promise<object>} Generated URL data
   */
  async generateCustomerPortalUrl(customerId, options = {}) {
    try {
      // Verify customer exists
      const customer = await Client.findById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Generate secure token for portal access
      const accessToken = this._generateSecureToken(customerId);
      
      // Create portal URL
      const portalUrl = `${this.baseUrl}/customer-portal/${customerId}?token=${accessToken}`;
      
      const urlData = await this.urlIntegration.linkToCustomer(customerId, portalUrl, {
        title: options.title || `Portal Access - ${customer.name}`,
        description: options.description || `Secure customer portal access for ${customer.name}`,
        userId: options.userId,
        campaign: options.campaign || 'customer_portal',
        medium: options.medium || 'email',
        tags: ['portal', 'customer-access', ...(options.tags || [])],
        expiresAt: options.expiresAt,
        requiresAuth: options.requiresAuth !== false,
        isPublic: false
      });

      return {
        ...urlData,
        type: 'portal',
        accessToken,
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email
        },
        metadata: {
          purpose: 'customer_portal_access',
          createdAt: new Date(),
          validUntil: options.expiresAt
        }
      };
    } catch (error) {
      console.error('Error generating customer portal URL:', error);
      throw new Error(`Failed to generate portal URL: ${error.message}`);
    }
  }

  /**
   * Generate custom URL for payment request
   * @param {string} customerId - Customer/Client ID
   * @param {object} paymentData - Payment details
   * @param {object} options - Additional options
   * @returns {Promise<object>} Generated URL data
   */
  async generatePaymentRequestUrl(customerId, paymentData, options = {}) {
    try {
      const customer = await Client.findById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Generate secure payment token
      const paymentToken = this._generateSecureToken(`payment_${customerId}_${Date.now()}`);
      
      // Create payment URL with encoded data
      const paymentParams = new URLSearchParams({
        token: paymentToken,
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD',
        description: paymentData.description || 'Payment Request',
        invoiceId: paymentData.invoiceId || '',
        customerId: customerId
      });

      const paymentUrl = `${this.baseUrl}/payment/${customerId}?${paymentParams.toString()}`;
      
      const urlData = await this.urlIntegration.linkToCustomer(customerId, paymentUrl, {
        title: options.title || `Payment Request - ${customer.name}`,
        description: options.description || `Payment request for ${paymentData.amount} ${paymentData.currency || 'USD'}`,
        userId: options.userId,
        campaign: options.campaign || 'payment_request',
        medium: options.medium || 'email',
        tags: ['payment', 'invoice', ...(options.tags || [])],
        expiresAt: options.expiresAt,
        requiresAuth: false,
        isPublic: true
      });

      return {
        ...urlData,
        type: 'payment',
        paymentToken,
        paymentData: {
          amount: paymentData.amount,
          currency: paymentData.currency || 'USD',
          description: paymentData.description,
          invoiceId: paymentData.invoiceId
        },
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email
        }
      };
    } catch (error) {
      console.error('Error generating payment URL:', error);
      throw new Error(`Failed to generate payment URL: ${error.message}`);
    }
  }

  /**
   * Generate custom URL for document sharing
   * @param {string} customerId - Customer/Client ID
   * @param {string} documentId - Document ID
   * @param {object} options - Additional options
   * @returns {Promise<object>} Generated URL data
   */
  async generateDocumentShareUrl(customerId, documentId, options = {}) {
    try {
      const customer = await Client.findById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Generate secure document access token
      const docToken = this._generateSecureToken(`doc_${documentId}_${customerId}`);
      
      // Create document sharing URL
      const documentUrl = `${this.baseUrl}/shared-document/${documentId}?token=${docToken}&customer=${customerId}`;
      
      const urlData = await this.urlIntegration.linkToCustomer(customerId, documentUrl, {
        title: options.title || `Document Share - ${customer.name}`,
        description: options.description || `Shared document for ${customer.name}`,
        userId: options.userId,
        campaign: options.campaign || 'document_sharing',
        medium: options.medium || 'email',
        tags: ['document', 'sharing', ...(options.tags || [])],
        expiresAt: options.expiresAt,
        requiresAuth: options.requiresAuth !== false,
        isPublic: options.isPublic || false,
        passwordProtected: options.passwordProtected || false,
        maxClicks: options.maxClicks || null
      });

      return {
        ...urlData,
        type: 'document',
        documentId,
        docToken,
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email
        },
        accessControl: {
          requiresAuth: options.requiresAuth !== false,
          passwordProtected: options.passwordProtected || false,
          maxClicks: options.maxClicks
        }
      };
    } catch (error) {
      console.error('Error generating document share URL:', error);
      throw new Error(`Failed to generate document share URL: ${error.message}`);
    }
  }

  /**
   * Generate custom URL for appointment scheduling
   * @param {string} customerId - Customer/Client ID
   * @param {object} options - Additional options
   * @returns {Promise<object>} Generated URL data
   */
  async generateAppointmentSchedulingUrl(customerId, options = {}) {
    try {
      const customer = await Client.findById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Generate scheduling token
      const scheduleToken = this._generateSecureToken(`schedule_${customerId}`);
      
      // Create appointment scheduling URL
      const scheduleParams = new URLSearchParams({
        token: scheduleToken,
        customer: customerId,
        timezone: options.timezone || 'UTC',
        duration: options.duration || '30',
        type: options.appointmentType || 'general'
      });

      const scheduleUrl = `${this.baseUrl}/schedule-appointment?${scheduleParams.toString()}`;
      
      const urlData = await this.urlIntegration.linkToCustomer(customerId, scheduleUrl, {
        title: options.title || `Schedule Meeting - ${customer.name}`,
        description: options.description || `Appointment scheduling for ${customer.name}`,
        userId: options.userId,
        campaign: options.campaign || 'appointment_scheduling',
        medium: options.medium || 'email',
        tags: ['appointment', 'scheduling', ...(options.tags || [])],
        expiresAt: options.expiresAt,
        requiresAuth: false,
        isPublic: true
      });

      return {
        ...urlData,
        type: 'appointment',
        scheduleToken,
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email
        },
        appointmentSettings: {
          timezone: options.timezone || 'UTC',
          duration: options.duration || '30',
          type: options.appointmentType || 'general'
        }
      };
    } catch (error) {
      console.error('Error generating appointment URL:', error);
      throw new Error(`Failed to generate appointment URL: ${error.message}`);
    }
  }

  /**
   * Generate custom URL for survey/feedback collection
   * @param {string} customerId - Customer/Client ID
   * @param {string} surveyId - Survey ID
   * @param {object} options - Additional options
   * @returns {Promise<object>} Generated URL data
   */
  async generateSurveyUrl(customerId, surveyId, options = {}) {
    try {
      const customer = await Client.findById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Generate survey response token
      const surveyToken = this._generateSecureToken(`survey_${surveyId}_${customerId}`);
      
      // Create survey URL
      const surveyParams = new URLSearchParams({
        token: surveyToken,
        customer: customerId,
        survey: surveyId,
        source: options.source || 'email'
      });

      const surveyUrl = `${this.baseUrl}/survey/${surveyId}?${surveyParams.toString()}`;
      
      const urlData = await this.urlIntegration.linkToCustomer(customerId, surveyUrl, {
        title: options.title || `Feedback Survey - ${customer.name}`,
        description: options.description || `Customer feedback survey for ${customer.name}`,
        userId: options.userId,
        campaign: options.campaign || 'customer_feedback',
        medium: options.medium || 'email',
        tags: ['survey', 'feedback', ...(options.tags || [])],
        expiresAt: options.expiresAt,
        requiresAuth: false,
        isPublic: true,
        maxClicks: 1 // Typically one response per survey
      });

      return {
        ...urlData,
        type: 'survey',
        surveyId,
        surveyToken,
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email
        }
      };
    } catch (error) {
      console.error('Error generating survey URL:', error);
      throw new Error(`Failed to generate survey URL: ${error.message}`);
    }
  }

  /**
   * Generate custom URL for review/testimonial request
   * @param {string} customerId - Customer/Client ID
   * @param {object} options - Additional options
   * @returns {Promise<object>} Generated URL data
   */
  async generateReviewRequestUrl(customerId, options = {}) {
    try {
      const customer = await Client.findById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Generate review token
      const reviewToken = this._generateSecureToken(`review_${customerId}`);
      
      // Create review URL
      const reviewParams = new URLSearchParams({
        token: reviewToken,
        customer: customerId,
        platform: options.platform || 'internal',
        product: options.productId || ''
      });

      const reviewUrl = `${this.baseUrl}/review?${reviewParams.toString()}`;
      
      const urlData = await this.urlIntegration.linkToCustomer(customerId, reviewUrl, {
        title: options.title || `Review Request - ${customer.name}`,
        description: options.description || `Request for review from ${customer.name}`,
        userId: options.userId,
        campaign: options.campaign || 'review_request',
        medium: options.medium || 'email',
        tags: ['review', 'testimonial', ...(options.tags || [])],
        expiresAt: options.expiresAt,
        requiresAuth: false,
        isPublic: true,
        maxClicks: 5 // Allow multiple visits
      });

      return {
        ...urlData,
        type: 'review',
        reviewToken,
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email
        },
        reviewSettings: {
          platform: options.platform || 'internal',
          productId: options.productId
        }
      };
    } catch (error) {
      console.error('Error generating review URL:', error);
      throw new Error(`Failed to generate review URL: ${error.message}`);
    }
  }

  /**
   * Generate custom URL for quote acceptance
   * @param {string} customerId - Customer/Client ID
   * @param {string} quoteId - Quote ID
   * @param {object} options - Additional options
   * @returns {Promise<object>} Generated URL data
   */
  async generateQuoteAcceptanceUrl(customerId, quoteId, options = {}) {
    try {
      const customer = await Client.findById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Generate quote acceptance token
      const quoteToken = this._generateSecureToken(`quote_${quoteId}_${customerId}`);
      
      // Create quote acceptance URL
      const quoteParams = new URLSearchParams({
        token: quoteToken,
        customer: customerId,
        quote: quoteId,
        action: 'view'
      });

      const quoteUrl = `${this.baseUrl}/quote/${quoteId}?${quoteParams.toString()}`;
      
      const urlData = await this.urlIntegration.linkToQuote(quoteId, quoteUrl, {
        title: options.title || `Quote - ${customer.name}`,
        description: options.description || `Quote acceptance for ${customer.name}`,
        userId: options.userId,
        campaign: options.campaign || 'quote_delivery',
        medium: options.medium || 'email',
        tags: ['quote', 'acceptance', ...(options.tags || [])],
        expiresAt: options.expiresAt,
        requiresAuth: false,
        isPublic: true
      });

      return {
        ...urlData,
        type: 'quote',
        quoteId,
        quoteToken,
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email
        }
      };
    } catch (error) {
      console.error('Error generating quote URL:', error);
      throw new Error(`Failed to generate quote URL: ${error.message}`);
    }
  }

  /**
   * Generate custom URL for invoice payment
   * @param {string} customerId - Customer/Client ID
   * @param {string} invoiceId - Invoice ID
   * @param {object} options - Additional options
   * @returns {Promise<object>} Generated URL data
   */
  async generateInvoicePaymentUrl(customerId, invoiceId, options = {}) {
    try {
      const customer = await Client.findById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Generate invoice payment token
      const invoiceToken = this._generateSecureToken(`invoice_${invoiceId}_${customerId}`);
      
      // Create invoice payment URL
      const invoiceParams = new URLSearchParams({
        token: invoiceToken,
        customer: customerId,
        invoice: invoiceId,
        action: 'pay'
      });

      const invoiceUrl = `${this.baseUrl}/invoice/${invoiceId}?${invoiceParams.toString()}`;
      
      const urlData = await this.urlIntegration.linkToInvoice(invoiceId, invoiceUrl, {
        title: options.title || `Invoice Payment - ${customer.name}`,
        description: options.description || `Invoice payment for ${customer.name}`,
        userId: options.userId,
        campaign: options.campaign || 'invoice_payment',
        medium: options.medium || 'email',
        tags: ['invoice', 'payment', ...(options.tags || [])],
        expiresAt: options.expiresAt,
        requiresAuth: false,
        isPublic: true
      });

      return {
        ...urlData,
        type: 'invoice',
        invoiceId,
        invoiceToken,
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email
        }
      };
    } catch (error) {
      console.error('Error generating invoice URL:', error);
      throw new Error(`Failed to generate invoice URL: ${error.message}`);
    }
  }

  /**
   * Generate custom URL for event registration
   * @param {string} customerId - Customer/Client ID
   * @param {string} eventId - Event ID
   * @param {object} options - Additional options
   * @returns {Promise<object>} Generated URL data
   */
  async generateEventRegistrationUrl(customerId, eventId, options = {}) {
    try {
      const customer = await Client.findById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Generate event registration token
      const eventToken = this._generateSecureToken(`event_${eventId}_${customerId}`);
      
      // Create event registration URL
      const eventParams = new URLSearchParams({
        token: eventToken,
        customer: customerId,
        event: eventId
      });

      const eventUrl = `${this.baseUrl}/event/${eventId}/register?${eventParams.toString()}`;
      
      const urlData = await this.urlIntegration.linkToCustomer(customerId, eventUrl, {
        title: options.title || `Event Registration - ${customer.name}`,
        description: options.description || `Event registration for ${customer.name}`,
        userId: options.userId,
        campaign: options.campaign || 'event_registration',
        medium: options.medium || 'email',
        tags: ['event', 'registration', ...(options.tags || [])],
        expiresAt: options.expiresAt,
        requiresAuth: false,
        isPublic: true
      });

      return {
        ...urlData,
        type: 'event',
        eventId,
        eventToken,
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email
        }
      };
    } catch (error) {
      console.error('Error generating event URL:', error);
      throw new Error(`Failed to generate event URL: ${error.message}`);
    }
  }

  /**
   * Get all URLs for a customer
   * @param {string} customerId - Customer/Client ID
   * @param {object} filters - Filter options
   * @returns {Promise<Array>} List of URLs
   */
  async getCustomerUrls(customerId, filters = {}) {
    try {
      const URL = require('@/models/appModels/URL');
      
      const query = {
        linkedModule: 'customer',
        linkedEntityId: customerId
      };

      if (filters.type) {
        query.tags = { $in: [filters.type] };
      }

      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      const urls = await URL.find(query)
        .sort({ createdAt: -1 })
        .limit(filters.limit || 50)
        .lean();

      return urls.map(url => ({
        id: url._id,
        shortCode: url.shortCode,
        shortUrl: `${this.urlIntegration.integrationConfig.baseShortUrl}/${url.shortCode}`,
        originalUrl: url.originalUrl,
        title: url.title,
        description: url.description,
        type: this._extractUrlType(url.tags),
        analytics: {
          totalClicks: url.analytics?.totalClicks || 0,
          uniqueClicks: url.analytics?.uniqueClicks || 0,
          lastClicked: url.analytics?.lastClickedAt
        },
        isActive: url.isActive,
        expiresAt: url.expiresAt,
        createdAt: url.createdAt,
        tags: url.tags
      }));
    } catch (error) {
      console.error('Error getting customer URLs:', error);
      throw new Error(`Failed to get customer URLs: ${error.message}`);
    }
  }

  /**
   * Generate bulk URLs for multiple customers
   * @param {Array} customers - Array of customer IDs
   * @param {string} urlType - Type of URL to generate
   * @param {object} commonOptions - Common options for all URLs
   * @returns {Promise<Array>} Array of generated URLs
   */
  async generateBulkUrls(customers, urlType, commonOptions = {}) {
    try {
      const results = [];
      
      for (const customerId of customers) {
        try {
          let urlData;
          
          switch (urlType) {
            case 'portal':
              urlData = await this.generateCustomerPortalUrl(customerId, commonOptions);
              break;
            case 'survey':
              urlData = await this.generateSurveyUrl(customerId, commonOptions.surveyId, commonOptions);
              break;
            case 'review':
              urlData = await this.generateReviewRequestUrl(customerId, commonOptions);
              break;
            case 'appointment':
              urlData = await this.generateAppointmentSchedulingUrl(customerId, commonOptions);
              break;
            default:
              throw new Error(`Unsupported URL type: ${urlType}`);
          }
          
          results.push({
            success: true,
            customerId,
            urlData
          });
        } catch (error) {
          results.push({
            success: false,
            customerId,
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error generating bulk URLs:', error);
      throw new Error(`Failed to generate bulk URLs: ${error.message}`);
    }
  }

  /**
   * Generate secure token
   * @private
   * @param {string} data - Data to hash
   * @returns {string} Secure token
   */
  _generateSecureToken(data) {
    const secret = process.env.JWT_SECRET || 'default-secret-key';
    return crypto
      .createHmac('sha256', secret)
      .update(`${data}_${Date.now()}`)
      .digest('hex')
      .substring(0, 32);
  }

  /**
   * Extract URL type from tags
   * @private
   * @param {Array} tags - Tags array
   * @returns {string} URL type
   */
  _extractUrlType(tags = []) {
    const typeMap = {
      portal: 'portal',
      payment: 'payment',
      document: 'document',
      appointment: 'appointment',
      survey: 'survey',
      review: 'review',
      quote: 'quote',
      invoice: 'invoice',
      event: 'event'
    };

    for (const tag of tags) {
      if (typeMap[tag]) {
        return typeMap[tag];
      }
    }

    return 'general';
  }
}

module.exports = new CRMUrlService();
