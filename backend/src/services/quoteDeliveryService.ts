// @ts-nocheck
const emailService = require('./emailService');
const mongoose = require('mongoose');

const Quote = mongoose.model('Quote');
const CompanyOwner = mongoose.model('CompanyOwner');

const getSmsService = () => require('./smsService');

/**
 * Quote Delivery Service
 * Handles multi-channel quote delivery via email, SMS, and tracking
 */
class QuoteDeliveryService {
  constructor() {
    this.deliveryChannels = ['email', 'sms', 'both'];
  }

  /**
   * Get business information from company owner
   * @param {String} companyId - Company ID
   * @returns {Promise<Object>} Business information
   */
  async getBusinessInfo(companyId) {
    const company = await CompanyOwner.findById(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    return {
      name: company.name,
      email: company.email,
      phone: company.phone,
      address: company.address,
      branding: company.branding,
      contact: company.contact,
      socialLinks: company.socialLinks,
    };
  }

  /**
   * Send quote via email
   * @param {Object} quote - Quote document
   * @param {Object} customer - Customer information
   * @param {Object} business - Business information
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Delivery result
   */
  async sendViaEmail(quote, customer, business, options = {}) {
    try {
      const result = await emailService.sendQuote(customer, quote, business, options);

      return {
        channel: 'email',
        success: true,
        sentAt: new Date(),
        recipient: customer.email,
        messageId: result.messageId,
        details: result,
      };
    } catch (error) {
      console.error('Error sending quote via email:', error);
      return {
        channel: 'email',
        success: false,
        sentAt: new Date(),
        recipient: customer.email,
        error: error.message,
      };
    }
  }

  /**
   * Send quote via SMS
   * @param {Object} quote - Quote document
   * @param {Object} customer - Customer information
   * @param {Object} business - Business information
   * @param {String} quoteUrl - Optional quote URL
   * @returns {Promise<Object>} Delivery result
   */
  async sendViaSms(quote, customer, business, quoteUrl = null) {
    try {
      if (process.env.SMS_ENABLED !== 'true') {
        return {
          channel: 'sms',
          success: false,
          sentAt: new Date(),
          recipient: customer.phone,
          disabled: true,
          error: 'SMS service is disabled',
        };
      }

      if (!customer.phone) {
        throw new Error('Customer phone number not available');
      }

      const smsService = getSmsService();
      const result = await smsService.sendQuoteNotification(customer, quote, business, quoteUrl);

      return {
        channel: 'sms',
        success: true,
        sentAt: new Date(),
        recipient: customer.phone,
        messageId: result.messageId,
        simulated: result.simulated || false,
        details: result,
      };
    } catch (error) {
      console.error('Error sending quote via SMS:', error);
      return {
        channel: 'sms',
        success: false,
        sentAt: new Date(),
        recipient: customer.phone,
        error: error.message,
      };
    }
  }

  /**
   * Send quote via specified channels
   * @param {String} quoteId - Quote ID
   * @param {Object} options - Delivery options
   * @returns {Promise<Object>} Delivery results
   */
  async sendQuote(quoteId, options = {}) {
    const {
      channels = ['email'], // 'email', 'sms', or ['email', 'sms']
      attachPdf = true,
      customMessage = null,
      quoteUrl = null,
    } = options;

    // Normalize channels to array
    const channelArray = Array.isArray(channels) ? channels : [channels];

    // Fetch quote with populated client
    const quote = await Quote.findById(quoteId).populate('client');
    if (!quote) {
      throw new Error('Quote not found');
    }

    // Check if quote is in valid state to send
    if (quote.status === 'cancelled') {
      throw new Error('Cannot send cancelled quote');
    }

    const customer = quote.client;
    if (!customer) {
      throw new Error('Customer information not found');
    }

    // Get business information
    const business = await this.getBusinessInfo(quote.owner);

    // Prepare delivery results
    const deliveryResults = [];
    const emailOptions = {
      quoteUrl,
      customMessage,
    };

    // Add PDF attachment if requested
    if (attachPdf && quote.pdf) {
      emailOptions.attachments = [
        {
          filename: `Quote-${quote.year}-${quote.number}.pdf`,
          path: quote.pdf,
        },
      ];
    }

    // Send via requested channels
    if (channelArray.includes('email')) {
      const emailResult = await this.sendViaEmail(quote, customer, business, emailOptions);
      deliveryResults.push(emailResult);
    }

    if (channelArray.includes('sms')) {
      const smsResult = await this.sendViaSms(quote, customer, business, quoteUrl);
      deliveryResults.push(smsResult);
    }

    // Update quote delivery history
    const deliveryRecord = {
      sentAt: new Date(),
      channels: channelArray,
      results: deliveryResults,
      sentBy: options.sentBy || quote.owner,
    };

    await Quote.findByIdAndUpdate(quoteId, {
      $push: { deliveryHistory: deliveryRecord },
      $set: {
        status: quote.status === 'draft' ? 'sent' : quote.status,
        updated: new Date(),
      },
    });

    return {
      success: deliveryResults.some((r) => r.success),
      quote: {
        id: quote._id,
        number: `${quote.year}-${quote.number}`,
        customer: customer.name || customer.company,
      },
      deliveryResults,
      allChannelsSuccessful: deliveryResults.every((r) => r.success),
    };
  }

  /**
   * Resend quote
   * @param {String} quoteId - Quote ID
   * @param {Object} options - Delivery options
   * @returns {Promise<Object>} Delivery results
   */
  async resendQuote(quoteId, options = {}) {
    const quote = await Quote.findById(quoteId);
    if (!quote) {
      throw new Error('Quote not found');
    }

    if (quote.isExpired) {
      throw new Error(
        'Cannot resend expired quote. Please create a new quote or update the expiry date.'
      );
    }

    return this.sendQuote(quoteId, options);
  }

  /**
   * Send quote reminder
   * @param {String} quoteId - Quote ID
   * @param {Object} options - Delivery options
   * @returns {Promise<Object>} Delivery results
   */
  async sendReminder(quoteId, options = {}) {
    const { channels = ['email'], quoteUrl = null } = options;

    const channelArray = Array.isArray(channels) ? channels : [channels];

    const quote = await Quote.findById(quoteId).populate('client');
    if (!quote) {
      throw new Error('Quote not found');
    }

    if (quote.status === 'accepted') {
      throw new Error('Quote has already been accepted');
    }

    if (quote.status === 'cancelled') {
      throw new Error('Cannot send reminder for cancelled quote');
    }

    if (quote.isExpired) {
      throw new Error('Cannot send reminder for expired quote');
    }

    const customer = quote.client;
    const business = await this.getBusinessInfo(quote.owner);

    const deliveryResults = [];

    // Send email reminder
    if (channelArray.includes('email')) {
      try {
        const result = await emailService.sendQuoteReminder(customer, quote, business, {
          quoteUrl,
        });
        deliveryResults.push({
          channel: 'email',
          success: true,
          sentAt: new Date(),
          recipient: customer.email,
          messageId: result.messageId,
        });
      } catch (error) {
        deliveryResults.push({
          channel: 'email',
          success: false,
          sentAt: new Date(),
          recipient: customer.email,
          error: error.message,
        });
      }
    }

    // Send SMS reminder
    if (channelArray.includes('sms')) {
      if (process.env.SMS_ENABLED !== 'true') {
        deliveryResults.push({
          channel: 'sms',
          success: false,
          sentAt: new Date(),
          recipient: customer.phone,
          disabled: true,
          error: 'SMS service is disabled',
        });
      } else {
        try {
        const smsService = getSmsService();
        const result = await smsService.sendQuoteReminder(customer, quote, business, quoteUrl);
        deliveryResults.push({
          channel: 'sms',
          success: true,
          sentAt: new Date(),
          recipient: customer.phone,
          messageId: result.messageId,
          simulated: result.simulated || false,
        });
      } catch (error) {
        deliveryResults.push({
          channel: 'sms',
          success: false,
          sentAt: new Date(),
          recipient: customer.phone,
          error: error.message,
        });
      }
      }
    }

    // Update quote with reminder record
    await Quote.findByIdAndUpdate(quoteId, {
      $push: {
        deliveryHistory: {
          sentAt: new Date(),
          channels: channelArray,
          results: deliveryResults,
          type: 'reminder',
          sentBy: options.sentBy || quote.owner,
        },
      },
    });

    return {
      success: deliveryResults.some((r) => r.success),
      type: 'reminder',
      quote: {
        id: quote._id,
        number: `${quote.year}-${quote.number}`,
      },
      deliveryResults,
    };
  }

  /**
   * Get delivery history for a quote
   * @param {String} quoteId - Quote ID
   * @returns {Promise<Array>} Delivery history
   */
  async getDeliveryHistory(quoteId) {
    const quote = await Quote.findById(quoteId).select('deliveryHistory number year');
    if (!quote) {
      throw new Error('Quote not found');
    }

    return {
      quote: {
        id: quote._id,
        number: `${quote.year}-${quote.number}`,
      },
      deliveryHistory: quote.deliveryHistory || [],
    };
  }

  /**
   * Check delivery status
   * @param {String} quoteId - Quote ID
   * @returns {Promise<Object>} Delivery status
   */
  async checkDeliveryStatus(quoteId) {
    const quote = await Quote.findById(quoteId)
      .select('deliveryHistory status number year expiredDate')
      .populate('client', 'name company email phone');

    if (!quote) {
      throw new Error('Quote not found');
    }

    const history = quote.deliveryHistory || [];
    const lastDelivery = history.length > 0 ? history[history.length - 1] : null;

    return {
      quote: {
        id: quote._id,
        number: `${quote.year}-${quote.number}`,
        status: quote.status,
        isExpired: quote.isExpired,
        expiryDate: quote.expiredDate,
      },
      customer: {
        name: quote.client.name || quote.client.company,
        email: quote.client.email,
        phone: quote.client.phone,
      },
      totalDeliveries: history.length,
      lastDelivery: lastDelivery
        ? {
            sentAt: lastDelivery.sentAt,
            channels: lastDelivery.channels,
            success: lastDelivery.results.some((r) => r.success),
            type: lastDelivery.type || 'quote',
          }
        : null,
      deliveryHistory: history,
    };
  }

  /**
   * Send bulk quotes
   * @param {Array} quoteIds - Array of quote IDs
   * @param {Object} options - Delivery options
   * @returns {Promise<Object>} Bulk delivery results
   */
  async sendBulkQuotes(quoteIds, options = {}) {
    const results = [];
    const errors = [];

    for (const quoteId of quoteIds) {
      try {
        const result = await this.sendQuote(quoteId, options);
        results.push(result);
      } catch (error) {
        errors.push({
          quoteId,
          error: error.message,
        });
      }
    }

    return {
      success: results.length > 0,
      totalProcessed: quoteIds.length,
      successfulDeliveries: results.length,
      failedDeliveries: errors.length,
      results,
      errors,
    };
  }
}

module.exports = new QuoteDeliveryService();
