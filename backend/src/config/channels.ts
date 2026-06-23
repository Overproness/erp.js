/**
 * Marketing Channel Configurations
 * 
 * Defines available marketing channels and their API integrations
 */

const channels = {
  // Email channel configuration
  email: {
    enabled: true,
    displayName: 'Email',
    description: 'Send personalized emails to your customers',
    icon: 'envelope',
    providers: {
      default: 'sendgrid',
      available: ['sendgrid', 'mailchimp', 'amazonses', 'custom'],
      
      // SendGrid configuration
      sendgrid: {
        apiKey: process.env.SENDGRID_API_KEY,
        from: process.env.SENDGRID_FROM_EMAIL || 'marketing@yourdomain.com',
        fromName: process.env.SENDGRID_FROM_NAME || 'Marketing Team',
        replyTo: process.env.SENDGRID_REPLY_TO || 'support@yourdomain.com',
        batchSize: 1000, // Maximum emails per batch
        rateLimitPerSecond: 100,
        templateIdPrefix: 'd-', // SendGrid dynamic template ID prefix
        webhookSecret: process.env.SENDGRID_WEBHOOK_SECRET,
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true },
          subscriptionTracking: { enable: true },
        }
      },
      
      // Mailchimp configuration
      mailchimp: {
        apiKey: process.env.MAILCHIMP_API_KEY,
        defaultListId: process.env.MAILCHIMP_LIST_ID,
        serverPrefix: process.env.MAILCHIMP_SERVER_PREFIX, // The 'us10' part in https://us10.api.mailchimp.com
        fromEmail: process.env.MAILCHIMP_FROM_EMAIL || 'marketing@yourdomain.com',
        fromName: process.env.MAILCHIMP_FROM_NAME || 'Marketing Team',
        webhookSecret: process.env.MAILCHIMP_WEBHOOK_SECRET,
      },
      
      // Amazon SES configuration
      amazonses: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_SES_REGION || 'us-east-1',
        fromEmail: process.env.AWS_SES_FROM_EMAIL || 'marketing@yourdomain.com',
        fromName: process.env.AWS_SES_FROM_NAME || 'Marketing Team',
        configSet: process.env.AWS_SES_CONFIG_SET,
      },
      
      // Custom SMTP provider
      custom: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
        fromEmail: process.env.SMTP_FROM_EMAIL || 'marketing@yourdomain.com',
        fromName: process.env.SMTP_FROM_NAME || 'Marketing Team',
      }
    },
    
    // Default sending settings
    settings: {
      trackOpens: true,
      trackClicks: true,
      unsubscribeLink: true,
      throttleRate: 10, // emails per second
      maxRetries: 3,
      retryDelay: 300, // seconds
    },
    
    // Deliverability settings
    deliverability: {
      validateMX: true,
      validateSyntax: true,
      excludeBounced: true,
      excludeComplained: true,
      excludeUnsubscribed: true,
      suppressionListEnabled: true,
    },
    
    // Email template settings
    templates: {
      basePath: '../emailTemplates',
      defaultTemplate: 'campaignBase.html',
      behaviorTriggerTemplate: 'behaviorTrigger.html',
      retargetingTemplate: 'retargeting.html',
    }
  },
  
  // SMS channel configuration
  sms: {
    enabled: process.env.SMS_ENABLED === 'true',
    displayName: 'SMS',
    description: 'Send text messages directly to customers\' phones',
    icon: 'comment-alt',
    providers: {
      default: 'twilio',
      available: ['twilio', 'nexmo', 'custom'],
      
      // Twilio configuration
      twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        fromNumber: process.env.TWILIO_FROM_NUMBER,
        messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
        statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL,
      },
      
      // Nexmo/Vonage configuration
      nexmo: {
        apiKey: process.env.NEXMO_API_KEY,
        apiSecret: process.env.NEXMO_API_SECRET,
        fromNumber: process.env.NEXMO_FROM_NUMBER,
        brand: process.env.NEXMO_BRAND || 'Your Brand',
      },
      
      // Custom SMS gateway
      custom: {
        apiUrl: process.env.SMS_API_URL,
        apiKey: process.env.SMS_API_KEY,
        fromNumber: process.env.SMS_FROM_NUMBER,
        requestFormat: process.env.SMS_REQUEST_FORMAT || 'json',
      }
    },
    
    // Default sending settings
    settings: {
      maxMessageLength: 160,
      splitLongMessages: true,
      throttleRate: 5, // messages per second
      maxRetries: 2,
      retryDelay: 60, // seconds
      deliveryReports: true,
    },
    
    // Compliance settings
    compliance: {
      includeOptOutInfo: true,
      optOutKeyword: 'STOP',
      optInRequired: true,
      respectQuietHours: true,
      quietHoursStart: 21, // 9 PM
      quietHoursEnd: 8, // 8 AM
      restrictedCountries: [] as string[], // Empty array means no restrictions
    }
  },
  
  // Social media channel configuration
  social: {
    enabled: process.env.SOCIAL_ENABLED === 'true',
    displayName: 'Social Media',
    description: 'Publish content across connected social platforms',
    icon: 'share-alt',
    platforms: {
      facebook: {
        enabled: true,
        displayName: 'Facebook',
        icon: 'facebook',
        apiVersion: 'v17.0',
        scopes: ['pages_manage_posts', 'pages_read_engagement'],
        contentTypes: ['text', 'image', 'video', 'link'],
      },
      instagram: {
        enabled: true,
        displayName: 'Instagram',
        icon: 'instagram',
        apiVersion: 'v17.0',
        scopes: ['instagram_basic', 'instagram_content_publish'],
        contentTypes: ['image', 'video', 'carousel'],
      },
      twitter: {
        enabled: true,
        displayName: 'Twitter',
        icon: 'twitter',
        apiVersion: '2',
        scopes: ['tweet.read', 'tweet.write', 'users.read'],
        contentTypes: ['text', 'image', 'video', 'link'],
      },
      linkedin: {
        enabled: true,
        displayName: 'LinkedIn',
        icon: 'linkedin',
        apiVersion: 'v2',
        scopes: ['r_liteprofile', 'w_member_social'],
        contentTypes: ['text', 'image', 'video', 'link', 'article'],
      }
    },
    
    // Default publishing settings
    settings: {
      postingFrequency: {
        facebook: 1, // posts per day
        instagram: 1, // posts per day
        twitter: 3, // posts per day
        linkedin: 1, // posts per day
      },
      postingTimeRanges: {
        facebook: { start: 9, end: 15 }, // 9 AM - 3 PM
        instagram: { start: 11, end: 20 }, // 11 AM - 8 PM
        twitter: { start: 8, end: 20 }, // 8 AM - 8 PM
        linkedin: { start: 10, end: 17 }, // 10 AM - 5 PM
      },
      mediaQuality: {
        imageCompression: 0.9, // 0-1, higher is better quality
        videoCompression: 'medium',
      },
      hashtagLimit: {
        facebook: 3,
        instagram: 30,
        twitter: 5,
        linkedin: 3,
      }
    }
  },
  
  // Web channel configuration (website personalization)
  web: {
    enabled: process.env.WEB_ENABLED === 'true',
    displayName: 'Website',
    description: 'Display personalized website content and popups',
    icon: 'globe',
    integrations: {
      // Website integration script
      script: {
        enabled: true,
        scriptUrl: process.env.WEB_SCRIPT_URL || '/js/web-personalization.js',
        autoInject: true,
        dataAttributes: ['data-campaign', 'data-segment', 'data-customer'],
      },
      
      // Content personalization
      personalization: {
        enabled: true,
        defaultCacheTTL: 3600, // seconds
        apiEndpoint: '/api/web-personalization',
        supportedElements: ['banner', 'popup', 'inline', 'recommendation'],
      },
      
      // Popup manager
      popups: {
        enabled: true,
        frequencyCapping: {
          global: 3, // popups per session
          perCampaign: 1, // views per campaign
          sessionTimeout: 30, // minutes
        },
        timing: {
          initialDelay: 5, // seconds
          minimumInterval: 60, // seconds between popups
        }
      }
    },
    
    // Analytics settings
    analytics: {
      trackPageviews: true,
      trackClicks: true,
      trackFormSubmissions: true,
      trackScrollDepth: true,
      trackTimeOnPage: true,
      anonymizeIP: true,
      respectDoNotTrack: true,
    }
  },
};

// Export configurations
(channels as any).default = channels;
export = channels;
