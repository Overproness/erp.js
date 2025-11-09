const config = require('@/config/notificationConfig');

class SmsService {
  constructor() {
    this.defaultSender = config.sms?.defaultSender || process.env.TWILIO_PHONE_NUMBER || '+15555555555';
    this.enabled = (config.sms?.enabled || process.env.SMS_ENABLED === 'true') && false; // Force disable since Twilio is not available
    this.fallbackProviders = [];
    
    console.log('SMS Service initialized in simulation mode (Twilio not available)');
  }
  
  /**
   * Initialize fallback SMS providers
   * Can be extended to support multiple providers
   */
  initializeFallbackProviders() {
    // Example for future extension to other providers
    this.fallbackProviders = [];
    // Add more providers here if needed
  }
  
  /**
   * Send SMS message
   * @param {String} to - Recipient phone number
   * @param {String} message - SMS message content
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Send result
   */
  async sendSms(to, message, options = {}) {
    console.log('SMS sending in simulation mode:', { to, message });
    return { 
      success: true, 
      simulated: true, 
      to, 
      message,
      status: 'simulated',
      messageId: `sim_${Date.now()}`
    };
  }
  
  /**
   * Try sending SMS via fallback providers
   * @param {String} to - Recipient phone number
   * @param {String} message - SMS message content
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Send result
   */
  async tryFallbackProviders(to, message, options) {
    console.log('Fallback SMS providers not available');
    return { success: false };
  }
  
  /**
   * Format phone number to E.164 format
   * @param {String} phoneNumber - Input phone number
   * @returns {String} Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    // Strip non-digit characters
    let digits = phoneNumber.replace(/\D/g, '');
    
    // Ensure number starts with country code
    if (!digits.startsWith('1') && digits.length === 10) {
      digits = '1' + digits; // Add US country code
    }
    
    // Add + prefix for E.164 format
    if (!phoneNumber.startsWith('+')) {
      return '+' + digits;
    }
    
    return phoneNumber;
  }
  
  /**
   * Send review request SMS
   * @param {Object} customer - Customer information
   * @param {Object} business - Business information
   * @param {String} reviewLink - Review link URL
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Send result
   */
  async sendReviewRequest(customer, business, reviewLink, options = {}) {
    if (!customer.phone) {
      throw new Error('Customer phone number is required for SMS');
    }
    
    const message = `Hi ${customer.name}, ${business.name} values your feedback! Please take a moment to share your experience: ${reviewLink}`;
    
    return this.sendSms(customer.phone, message, options);
  }
  
  /**
   * Send new review alert SMS
   * @param {Object} review - Review information
   * @param {Object} business - Business information
   * @param {String} recipient - Recipient phone number
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Send result
   */
  async sendReviewAlert(review, business, recipient, options = {}) {
    // For negative reviews (3 stars or less), send urgent notification
    const isNegative = review.rating <= 3;
    
    const message = isNegative
      ? `URGENT: New ${review.rating}-star review received from ${review.client.name} on ${review.platform}. Immediate attention required.`
      : `New ${review.rating}-star review received from ${review.client.name} on ${review.platform}. Check your dashboard to respond.`;
    
    return this.sendSms(recipient.phone, message, options);
  }
  
  /**
   * Test SMS configuration
   * @returns {Promise<Object>} Test result
   */
  async testSmsConnection() {
    return { 
      success: false, 
      message: 'SMS is disabled - Twilio not available', 
      simulated: true 
    };
  }
}

module.exports = new SmsService();