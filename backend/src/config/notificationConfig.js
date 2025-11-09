/**
 * Notification Configuration
 * Contains settings for various notification channels (email, SMS, push)
 */

// Load environment variables for defaults
const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_SECURE,
  EMAIL_USER,
  EMAIL_PASS,
  DEFAULT_SENDER,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  SMS_ENABLED,
} = process.env;

// Default configuration for notification services
const config = {
  // Email notification settings
  email: {
    enabled: true,
    host: EMAIL_HOST || 'smtp.gmail.com',
    port: EMAIL_PORT || 587,
    secure: EMAIL_SECURE === 'true',
    user: EMAIL_USER || '',
    pass: EMAIL_PASS || '',
    defaultSender: DEFAULT_SENDER || 'noreply@yourdomain.com',
    templates: {
      basePath: '../emailTemplates',
      defaultContext: {
        companyName: 'Tech Revisor',
        websiteUrl: 'https://www.techrevisor.com',
        supportEmail: 'support@techrevisor.com',
        year: new Date().getFullYear()
      }
    }
  },
  
  // SMS notification settings
  sms: {
    enabled: SMS_ENABLED === 'true',
    provider: 'twilio', // Currently only twilio is supported
    twilioAccountSid: TWILIO_ACCOUNT_SID || '',
    twilioAuthToken: TWILIO_AUTH_TOKEN || '',
    defaultSender: TWILIO_PHONE_NUMBER || '',
    retryAttempts: 2,
    retryDelay: 60000 // 1 minute
  },
  
  // Push notification settings
  push: {
    enabled: false,
    provider: 'firebase',
    firebaseCredentials: null,
    defaultTopic: 'general'
  }
};

module.exports = config;
