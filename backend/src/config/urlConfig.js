const urlConfig = {
  // Short code generation settings
  shortCode: {
    defaultLength: 7,
    minLength: 3,
    maxLength: 50,
    alphabet: '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz',
    excludePatterns: ['admin', 'api', 'www', 'mail', 'ftp', 'test', 'dev'],
    collisionRetries: 5,
    customCodeAllowed: true,
    caseSensitive: false
  },

  // URL validation settings
  validation: {
    allowedProtocols: ['http', 'https'],
    maxUrlLength: 2048,
    allowPrivateIPs: false,
    allowedDomains: [], // Empty = allow all
    blockedDomains: [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      'example.com',
      'test.com'
    ],
    requireValidTLD: true,
    allowInternationalDomains: true
  },

  // Security settings
  security: {
    checkMaliciousUrls: true,
    enableRateLimiting: true,
    maxClicksPerIP: 100, // per hour
    maxCreationsPerUser: 50, // per hour
    enableIPWhitelist: false,
    ipWhitelist: [],
    enableCountryRestrictions: false,
    allowedCountries: [],
    blockedCountries: [],
    enablePasswordProtection: true,
    passwordMinLength: 8,
    enableClickLimits: true,
    defaultClickLimit: null, // null = unlimited
    enableExpiration: true,
    defaultExpirationDays: 90,
    maxExpirationDays: 365
  },

  // Analytics and tracking settings
  analytics: {
    enableTracking: true,
    trackClicks: true,
    trackViews: true,
    trackUniqueClicks: true,
    trackGeolocation: true,
    trackDeviceInfo: true,
    trackReferrers: true,
    trackUTMParameters: true,
    enableRealTimeTracking: true,
    anonymizeIPs: true,
    respectDoNotTrack: true,
    enableSessionTracking: true,
    sessionTimeout: 30, // minutes
    enableBotDetection: true,
    excludeBots: true,
    botUserAgents: [
      'googlebot',
      'bingbot',
      'slurp',
      'duckduckbot',
      'baiduspider',
      'yandexbot',
      'facebookexternalhit',
      'twitterbot',
      'linkedinbot'
    ]
  },

  // Performance settings
  performance: {
    enableCaching: true,
    cacheTimeout: 300, // seconds
    enableCompression: true,
    enableCDN: false,
    cdnUrl: '',
    enablePreloading: false,
    maxConcurrentRequests: 100,
    requestTimeout: 10000, // milliseconds
    enableConnectionPooling: true,
    poolMaxConnections: 10
  },

  // Feature flags
  features: {
    enableABTesting: true,
    enableQRCodes: true,
    enableBulkOperations: true,
    enableCustomDomains: false,
    enableAPIAccess: true,
    enableWebhooks: true,
    enableScheduling: true,
    enableCategories: true,
    enableTags: true,
    enableSocialSharing: true,
    enableExport: true,
    enableArchiving: true
  },

  // Default values
  defaults: {
    isPublic: true,
    isActive: true,
    requiresAuth: false,
    passwordProtected: false,
    trackClicks: true,
    enableAnalytics: true,
    expirationDays: 90,
    maxClicks: null,
    category: null,
    tags: [],
    description: '',
    title: '',
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    utmContent: '',
    utmTerm: ''
  },

  // Rate limiting configuration
  rateLimiting: {
    enabled: true,
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: {
      create: 50,
      read: 1000,
      update: 100,
      delete: 20,
      click: 1000,
      analytics: 200
    },
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: 'ip', // 'ip', 'user', 'session'
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false
  },

  // Database settings
  database: {
    collectionName: 'urls',
    clicksCollectionName: 'url_clicks',
    categoriesCollectionName: 'url_categories',
    abTestsCollectionName: 'ab_tests',
    enableIndexes: true,
    indexes: [
      { fields: { shortCode: 1 }, unique: true },
      { fields: { originalUrl: 1 } },
      { fields: { owner: 1 } },
      { fields: { createdAt: -1 } },
      { fields: { expiresAt: 1 } },
      { fields: { isActive: 1 } },
      { fields: { linkedModule: 1, linkedEntityId: 1 } },
      { fields: { tags: 1 } },
      { fields: { 'analytics.totalClicks': -1 } }
    ],
    enableSharding: false,
    shardKey: { _id: 'hashed' }
  },

  // API settings
  api: {
    version: 'v1',
    prefix: '/api/url',
    enableVersioning: true,
    enableSwagger: true,
    enableCORS: true,
    corsOrigins: ['*'],
    enableAuthentication: true,
    authRequired: ['create', 'update', 'delete', 'analytics'],
    publicEndpoints: ['redirect', 'preview'],
    enablePagination: true,
    defaultPageSize: 20,
    maxPageSize: 100,
    enableSorting: true,
    enableFiltering: true,
    enableSearch: true
  },

  // Notification settings
  notifications: {
    enableEmailNotifications: false,
    enableWebhookNotifications: true,
    enableSlackNotifications: false,
    events: {
      urlCreated: false,
      urlClicked: false,
      urlExpired: true,
      urlReachedLimit: true,
      abTestCompleted: true,
      securityAlert: true
    },
    emailTemplates: {
      urlExpired: 'url-expired',
      urlReachedLimit: 'url-reached-limit',
      abTestCompleted: 'abtest-completed'
    }
  },

  // Integration settings
  integrations: {
    enableModuleIntegration: true,
    supportedModules: [
      'invoice',
      'quote',
      'customer',
      'document',
      'campaign',
      'task',
      'project'
    ],
    autoGenerateUrls: true,
    autoUpdateLinkedUrls: true,
    autoDeleteLinkedUrls: false, // Use soft delete
    enableSocialSharing: true,
    socialPlatforms: [
      'facebook',
      'twitter',
      'linkedin',
      'email',
      'whatsapp',
      'telegram'
    ]
  },

  // Backup and maintenance settings
  maintenance: {
    enableAutoCleanup: true,
    cleanupInterval: 24, // hours
    deleteExpiredUrls: false, // Use soft delete
    archiveInactiveUrls: true,
    inactivityThreshold: 180, // days
    enableBackup: true,
    backupInterval: 168, // hours (weekly)
    backupRetention: 30, // days
    enableOptimization: true,
    optimizationInterval: 168 // hours
  },

  // Monitoring and logging
  monitoring: {
    enableMetrics: true,
    enableHealthCheck: true,
    enableProfiling: false,
    logLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    enableAuditLog: true,
    auditEvents: [
      'create',
      'update',
      'delete',
      'bulk_operation',
      'security_violation'
    ],
    enablePerformanceMonitoring: true,
    slowQueryThreshold: 1000, // milliseconds
    enableErrorTracking: true
  },

  // Environment-specific settings
  environments: {
    development: {
      shortCode: {
        defaultLength: 5
      },
      security: {
        checkMaliciousUrls: false,
        enableRateLimiting: false
      },
      analytics: {
        enableBotDetection: false
      }
    },
    staging: {
      shortCode: {
        defaultLength: 6
      },
      security: {
        maxClicksPerIP: 200
      }
    },
    production: {
      shortCode: {
        defaultLength: 7
      },
      security: {
        checkMaliciousUrls: true,
        enableRateLimiting: true
      },
      performance: {
        enableCaching: true,
        enableCDN: true
      }
    }
  }
};

// Apply environment-specific overrides
const currentEnv = process.env.NODE_ENV || 'development';
if (urlConfig.environments[currentEnv]) {
  const envConfig = urlConfig.environments[currentEnv];
  
  // Deep merge environment config
  function deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  
  deepMerge(urlConfig, envConfig);
}

module.exports = urlConfig;
