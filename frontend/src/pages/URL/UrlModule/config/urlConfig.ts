// URL Module Configuration

export default {
  // URL Settings
  url: {
    maxLength: 2048,
    shortCodeLength: 8,
    customShortCodeMaxLength: 50,
    defaultDomain: 'short.ly',
    allowCustomDomains: true,
    preserveOriginalUrl: true
  },

  // Analytics Settings
  analytics: {
    realTimeInterval: 30000, // 30 seconds
    defaultDateRange: 30, // days
    maxExportRecords: 10000,
    aggregationLevels: ['hour', 'day', 'week', 'month'],
    retentionPeriod: 365, // days
    enableRealTime: true
  },

  // Security Settings
  security: {
    passwordMinLength: 6,
    maxClickLimit: 1000000,
    allowPasswordProtection: true,
    allowClickLimits: true,
    enableAccessControl: true,
    malwareProtection: true
  },

  // A/B Testing
  abTesting: {
    maxVariants: 10,
    minSampleSize: 100,
    confidenceLevel: 0.95,
    maxTestDuration: 90, // days
    minTestDuration: 1, // days
    enableAutoWinner: true
  },

  // Export Formats
  export: {
    formats: ['csv', 'xlsx', 'json', 'pdf'],
    maxRecords: 50000,
    compressionEnabled: true
  },

  // Chart Configurations
  charts: {
    colors: {
      primary: '#8b5cf6',
      secondary: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#3b82f6'
    },
    animations: {
      enabled: true,
      duration: 300
    }
  },

  // Table Configuration
  table: {
    defaultPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
    showSizeChanger: true,
    showQuickJumper: true
  },

  // QR Code Settings
  qrCode: {
    defaultSize: 200,
    sizes: [100, 150, 200, 300, 400],
    errorCorrectionLevel: 'M',
    margin: 4,
    formats: ['PNG', 'JPG', 'SVG']
  },

  // UTM Parameters
  utm: {
    sources: ['google', 'facebook', 'twitter', 'linkedin', 'email', 'direct'],
    mediums: ['cpc', 'email', 'social', 'referral', 'organic', 'direct'],
    defaultCampaign: 'marketing'
  },

  // Categories
  categories: [
    { value: 'marketing', label: 'Marketing', color: '#8b5cf6' },
    { value: 'social', label: 'Social Media', color: '#ef4444' },
    { value: 'email', label: 'Email Campaigns', color: '#10b981' },
    { value: 'internal', label: 'Internal', color: '#6b7280' },
    { value: 'affiliate', label: 'Affiliate', color: '#f59e0b' },
    { value: 'other', label: 'Other', color: '#3b82f6' }
  ],

  // Status Options
  statuses: [
    { value: 'active', label: 'Active', color: 'success' },
    { value: 'inactive', label: 'Inactive', color: 'default' },
    { value: 'expired', label: 'Expired', color: 'error' },
    { value: 'scheduled', label: 'Scheduled', color: 'processing' }
  ]
};
