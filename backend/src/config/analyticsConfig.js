const analyticsConfig = {
  // Data collection settings
  collection: {
    enableClickTracking: true,
    enableViewTracking: true,
    enableUserTracking: true,
    enableSessionTracking: true,
    enableGeolocationTracking: true,
    enableDeviceTracking: true,
    enableReferrerTracking: true,
    enableUTMTracking: true,
    enableCustomEventTracking: true,
    enableConversionTracking: true,
    enableABTestTracking: true,
    enablePerformanceTracking: true
  },

  // Data retention policies
  retention: {
    rawClickData: 90, // days
    aggregatedData: 365, // days
    userSessionData: 30, // days
    deviceFingerprints: 60, // days
    geoLocationData: 180, // days
    performanceMetrics: 30, // days
    auditLogs: 365, // days
    exportedReports: 90, // days
    temporaryData: 7, // days
    archivedData: 2555, // days (7 years)
    deletionGracePeriod: 30 // days before permanent deletion
  },

  // Data aggregation settings
  aggregation: {
    enableRealTimeAggregation: true,
    enableBatchAggregation: true,
    realTimeInterval: 60, // seconds
    batchInterval: 3600, // seconds (1 hour)
    aggregationLevels: ['hour', 'day', 'week', 'month', 'year'],
    metrics: [
      'total_clicks',
      'unique_clicks',
      'bounce_rate',
      'session_duration',
      'conversion_rate',
      'geographic_distribution',
      'device_distribution',
      'referrer_sources',
      'utm_performance',
      'time_series_data'
    ],
    enablePreAggregation: true,
    maxAggregationBatchSize: 10000
  },

  // Reporting configuration
  reporting: {
    enableScheduledReports: true,
    enableCustomReports: true,
    enableDashboards: true,
    defaultDateRange: 30, // days
    maxDateRange: 365, // days
    reportFormats: ['json', 'csv', 'xlsx', 'pdf'],
    defaultFormat: 'json',
    enableEmailReports: true,
    enableWebhookReports: true,
    reportSchedules: ['daily', 'weekly', 'monthly', 'quarterly'],
    maxReportSize: 50, // MB
    enableReportCaching: true,
    cacheTimeout: 3600 // seconds
  },

  // Performance settings
  performance: {
    enableQueryOptimization: true,
    enableIndexOptimization: true,
    enableDataPartitioning: true,
    partitionStrategy: 'date', // 'date', 'hash', 'range'
    enableComputedColumns: true,
    enableMaterializedViews: true,
    queryTimeout: 30000, // milliseconds
    maxConcurrentQueries: 10,
    enableQueryCaching: true,
    cacheSize: 100, // MB
    enableConnectionPooling: true,
    poolSize: 20
  },

  // Privacy and compliance
  privacy: {
    enableGDPRCompliance: true,
    enableCCPACompliance: true,
    respectDoNotTrack: true,
    enableConsentManagement: true,
    anonymizeIPs: true,
    ipAnonymizationMethod: 'hash', // 'hash', 'truncate', 'encrypt'
    enableDataMinimization: true,
    enableRightToErasure: true,
    enableDataPortability: true,
    enableConsentWithdrawal: true,
    dataSubjectRights: [
      'access',
      'rectification',
      'erasure',
      'portability',
      'restriction',
      'objection'
    ],
    consentCategories: [
      'necessary',
      'analytics',
      'marketing',
      'personalization'
    ]
  },

  // Data quality settings
  dataQuality: {
    enableValidation: true,
    enableCleaning: true,
    enableDeduplication: true,
    validationRules: {
      ipAddress: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/,
      userAgent: /^.{1,500}$/,
      url: /^https?:\/\/.+/,
      referrer: /^https?:\/\/.+/,
      sessionId: /^[a-zA-Z0-9]{8,64}$/
    },
    cleaningRules: {
      removeEmptyValues: true,
      trimWhitespace: true,
      normalizeUrls: true,
      standardizeCountryCodes: true,
      validateTimestamps: true
    },
    duplicationRules: {
      clickWindow: 5, // seconds
      sessionDuplication: 'session_id',
      userDuplication: 'user_id',
      deviceDuplication: 'device_fingerprint'
    }
  },

  // Real-time analytics
  realTime: {
    enableWebSockets: true,
    enableServerSentEvents: true,
    enablePolling: false,
    webSocketPort: process.env.WEBSOCKET_PORT || 3001,
    updateInterval: 1000, // milliseconds
    maxConnections: 100,
    enableAuthentication: true,
    enableRateLimiting: true,
    maxUpdatesPerSecond: 10,
    enableRoomBasedUpdates: true,
    rooms: ['global', 'user', 'url', 'campaign'],
    enableEventFiltering: true,
    eventTypes: [
      'click',
      'view',
      'conversion',
      'goal_completion',
      'session_start',
      'session_end'
    ]
  },

  // Machine learning and AI
  ml: {
    enablePredictiveAnalytics: false,
    enableAnomalyDetection: true,
    enableTrendAnalysis: true,
    enableSegmentation: true,
    enableRecommendations: false,
    models: {
      clickPrediction: {
        enabled: false,
        updateInterval: 86400, // seconds (daily)
        features: ['time', 'device', 'location', 'referrer', 'url']
      },
      anomalyDetection: {
        enabled: true,
        threshold: 2.5, // standard deviations
        updateInterval: 3600, // seconds (hourly)
        features: ['click_rate', 'unique_visitors', 'bounce_rate']
      },
      userSegmentation: {
        enabled: true,
        updateInterval: 604800, // seconds (weekly)
        features: ['behavior', 'geography', 'device', 'referrer']
      }
    }
  },

  // Export and integration
  export: {
    enableAPIExport: true,
    enableFileExport: true,
    enableStreamingExport: true,
    supportedFormats: ['json', 'csv', 'xlsx', 'parquet', 'avro'],
    maxExportSize: 1000000, // rows
    enableCompression: true,
    compressionFormat: 'gzip',
    enableEncryption: false,
    encryptionAlgorithm: 'AES-256-GCM',
    enableS3Export: false,
    s3Config: {
      bucket: '',
      region: '',
      accessKeyId: '',
      secretAccessKey: ''
    },
    enableWebhookExport: true,
    webhookTimeout: 30000, // milliseconds
    maxRetries: 3
  },

  // Alerting and monitoring
  alerting: {
    enableAlerts: true,
    enableEmailAlerts: true,
    enableSlackAlerts: false,
    enableWebhookAlerts: true,
    alertRules: [
      {
        name: 'high_error_rate',
        condition: 'error_rate > 5',
        severity: 'high',
        cooldown: 300 // seconds
      },
      {
        name: 'low_click_rate',
        condition: 'click_rate < 1',
        severity: 'medium',
        cooldown: 1800 // seconds
      },
      {
        name: 'unusual_traffic_spike',
        condition: 'traffic_increase > 300',
        severity: 'medium',
        cooldown: 600 // seconds
      },
      {
        name: 'data_quality_issue',
        condition: 'invalid_data_percentage > 10',
        severity: 'high',
        cooldown: 900 // seconds
      }
    ],
    escalation: {
      enabled: true,
      levels: ['info', 'warning', 'critical'],
      timeouts: [300, 900, 1800] // seconds
    }
  },

  // Storage optimization
  storage: {
    enablePartitioning: true,
    partitioningStrategy: 'time_based', // 'time_based', 'hash_based', 'range_based'
    partitionInterval: 'month', // 'day', 'week', 'month', 'year'
    enableCompression: true,
    compressionLevel: 6,
    enableArchiving: true,
    archiveAfterDays: 90,
    archiveStorage: 'cold', // 'cold', 's3_glacier', 'azure_archive'
    enableCleanup: true,
    cleanupInterval: 86400, // seconds (daily)
    enableOptimization: true,
    optimizationInterval: 604800 // seconds (weekly)
  },

  // Security settings
  security: {
    enableAuditLogging: true,
    enableAccessControl: true,
    enableFieldLevelSecurity: true,
    enableQueryFiltering: true,
    sensitiveFields: [
      'ip_address',
      'user_id',
      'session_id',
      'device_fingerprint'
    ],
    accessLevels: [
      'read_only',
      'analyst',
      'manager',
      'admin'
    ],
    enableQueryValidation: true,
    maxQueryComplexity: 1000,
    enableInjectionPrevention: true,
    enableRateLimiting: true,
    rateLimits: {
      queries_per_minute: 100,
      exports_per_hour: 10,
      reports_per_day: 50
    }
  },

  // Dashboard configuration
  dashboards: {
    enableCustomDashboards: true,
    enableSharedDashboards: true,
    maxDashboardsPerUser: 20,
    maxWidgetsPerDashboard: 15,
    enableRealTimeUpdates: true,
    updateInterval: 30000, // milliseconds
    enableDrillDown: true,
    enableFiltering: true,
    enableComparison: true,
    enableAnnotations: true,
    enableAlerts: true,
    widgetTypes: [
      'line_chart',
      'bar_chart',
      'pie_chart',
      'table',
      'metric',
      'map',
      'heatmap',
      'funnel'
    ],
    themes: ['light', 'dark', 'auto'],
    enableMobileOptimization: true
  },

  // Environment-specific overrides
  environments: {
    development: {
      retention: {
        rawClickData: 7,
        aggregatedData: 30
      },
      performance: {
        enableQueryOptimization: false,
        enableIndexOptimization: false
      },
      ml: {
        enablePredictiveAnalytics: false,
        enableAnomalyDetection: false
      },
      realTime: {
        maxConnections: 10
      }
    },
    staging: {
      retention: {
        rawClickData: 30,
        aggregatedData: 180
      },
      performance: {
        enableQueryOptimization: true,
        enableIndexOptimization: true
      },
      realTime: {
        maxConnections: 50
      }
    },
    production: {
      performance: {
        enableQueryOptimization: true,
        enableIndexOptimization: true,
        enableDataPartitioning: true,
        enableMaterializedViews: true
      },
      ml: {
        enableAnomalyDetection: true,
        enableTrendAnalysis: true
      },
      storage: {
        enablePartitioning: true,
        enableCompression: true,
        enableArchiving: true
      }
    }
  }
};

// Apply environment-specific overrides
const currentEnv = process.env.NODE_ENV || 'development';

if (analyticsConfig.environments[currentEnv]) {
  const envConfig = analyticsConfig.environments[currentEnv];
  
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
  
  deepMerge(analyticsConfig, envConfig);
}

module.exports = analyticsConfig;
