/**
 * Configuration for the Reputation Management module including 
 * API endpoints, platform settings, and default templates
 */

// API base endpoints
export const API_ENDPOINTS = {
  REVIEWS: '/api/reputation/reviews',
  REVIEW_LINKS: '/api/reputation/links',
  RESPONSES: '/api/reputation/responses',
  TEMPLATES: '/api/reputation/templates',
  ANALYTICS: '/api/reputation/analytics',
  PLATFORMS: '/api/reputation/platforms',
  WEBHOOKS: '/api/reputation/webhooks',
  AUTO_RESPONSE: '/api/reputation/auto-response',
  EXPORT: '/api/reputation/export',
  IMPORT: '/api/reputation/import'
};

// Platform configuration
export const PLATFORMS = {
  GOOGLE: {
    id: 'google',
    name: 'Google Business Profile',
    icon: '/assets/icons/google.png',
    color: '#4285F4',
    oauthEnabled: true,
    apiEnabled: true,
    webhookEnabled: false,
    responseEnabled: true,
    reviewSyncEnabled: true,
    maxResponseLength: 1000,
    apiDocs: 'https://developers.google.com/my-business/reference',
    supportedFeatures: [
      'reviews_sync', 
      'response_posting', 
      'business_info',
      'review_alerts',
      'analytics'
    ],
    description: 'Connect to your Google Business Profile to manage reviews and ratings.'
  },
  FACEBOOK: {
    id: 'facebook',
    name: 'Facebook',
    icon: '/assets/icons/facebook.png',
    color: '#1877F2',
    oauthEnabled: true,
    apiEnabled: true,
    webhookEnabled: true,
    responseEnabled: true,
    reviewSyncEnabled: true,
    maxResponseLength: 8000,
    apiDocs: 'https://developers.facebook.com/docs/graph-api/reference/page/ratings',
    supportedFeatures: [
      'reviews_sync', 
      'response_posting', 
      'page_info',
      'review_alerts',
      'analytics'
    ],
    description: 'Manage your Facebook page reviews and recommendations.'
  }
};

// Rating sentiment thresholds
export const RATING_SENTIMENT = {
  POSITIVE: 4, // 4-5 stars
  NEUTRAL: 3,  // 3 stars
  NEGATIVE: 2  // 1-2 stars
};

// Review response templates categories
export const TEMPLATE_CATEGORIES = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
  NEUTRAL: 'neutral',
  GENERAL: 'general'
};

// Default API pagination settings
export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20
};

// Analytics time periods
export const TIME_PERIODS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '6m', label: 'Last 6 months' },
  { value: '1y', label: 'Last year' },
  { value: 'all', label: 'All time' }
];

// Default response templates
export const DEFAULT_TEMPLATES = {
  POSITIVE: {
    id: 'default_positive',
    name: 'Positive Review Response',
    content: 'Thank you {{customerName}} for your wonderful feedback! We\'re thrilled that you enjoyed your experience with {{businessName}}. Your satisfaction is our top priority, and we appreciate you taking the time to share your thoughts. We look forward to serving you again soon!',
    sentiment: 'positive',
    ratingRange: '4-5',
    isActive: true,
    category: 'default'
  },
  NEUTRAL: {
    id: 'default_neutral',
    name: 'Neutral Review Response',
    content: 'Thank you {{customerName}} for your feedback. We appreciate you taking the time to share your experience with {{businessName}}. We\'re constantly working to improve our services, and your input helps us identify areas where we can do better. If you have any specific suggestions, please don\'t hesitate to contact us directly.',
    sentiment: 'neutral',
    ratingRange: '3-3',
    isActive: true,
    category: 'default'
  },
  NEGATIVE: {
    id: 'default_negative',
    name: 'Negative Review Response',
    content: 'Thank you {{customerName}} for bringing this to our attention. We apologize that your experience with {{businessName}} didn\'t meet your expectations. We take customer feedback seriously and would like the opportunity to address your concerns. Please contact our customer service team at support@{{businessName}}.com so we can work together toward a resolution.',
    sentiment: 'negative',
    ratingRange: '1-2',
    isActive: true,
    category: 'default'
  },
  GENERIC: {
    id: 'default_generic',
    name: 'Generic Response',
    content: 'Thank you {{customerName}} for sharing your feedback about {{businessName}}. We value all customer input and appreciate you taking the time to share your thoughts with us. Your feedback helps us continually improve our services.',
    sentiment: 'all',
    ratingRange: 'all',
    isActive: true,
    category: 'default'
  }
};

// Template variables
export const TEMPLATE_VARIABLES = {
  CUSTOMER: [
    { name: 'customerName', description: 'Customer name', fallback: 'Valued Customer' },
    { name: 'customerEmail', description: 'Customer email', fallback: '[email protected]', isSensitive: true }
  ],
  BUSINESS: [
    { name: 'businessName', description: 'Business name', fallback: 'Our Business' },
    { name: 'businessPhone', description: 'Business phone number', fallback: '[Business Phone]' },
    { name: 'businessEmail', description: 'Business email', fallback: '[Business Email]' }
  ],
  REVIEW: [
    { name: 'reviewRating', description: 'Review rating (1-5)', fallback: '[Rating]' },
    { name: 'reviewDate', description: 'Review submission date', fallback: '[Date]' },
    { name: 'platform', description: 'Review platform', fallback: '[Platform]' }
  ],
  MISC: [
    { name: 'currentDate', description: 'Current date', fallback: '[Current Date]' },
    { name: 'responseOwner', description: 'Response owner name', fallback: 'Management' }
  ]
};

// Auto-response rules configuration
export const AUTO_RESPONSE_CONFIG = {
  defaultSettings: {
    enabled: false,
    sentimentTriggers: ['negative'],
    ratingTriggers: [1, 2],
    delay: 24, // hours
    templates: {
      positive: 'default_positive',
      neutral: 'default_neutral',
      negative: 'default_negative'
    }
  },
  conditions: {
    fields: ['rating', 'sentiment', 'platform', 'keywords', 'length'],
    operators: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'not_contains']
  },
  actions: ['send_response', 'escalate', 'tag', 'assign', 'notify']
};

// Review link configuration
export const REVIEW_LINK_CONFIG = {
  defaultExpiry: 90, // days
  urlShorteningEnabled: true,
  trackingEnabled: true,
  qrCodeEnabled: true,
  maxActiveLinks: 50,
  availableBranding: {
    colors: {
      primary: ['#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6c757d', '#343a40'],
      secondary: ['#6c757d', '#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd']
    },
    fonts: ['Arial', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Source Sans Pro']
  }
};

// Analytics configuration
export const ANALYTICS_CONFIG = {
  defaultDateRange: '30d',
  availableDateRanges: ['7d', '30d', '90d', '1y', 'custom'],
  refreshInterval: 300000, // 5 minutes
  metricThresholds: {
    rating: {
      danger: 3.0,
      warning: 3.8,
      success: 4.5
    },
    responseRate: {
      danger: 50,
      warning: 80,
      success: 95
    },
    sentimentRatio: {
      danger: 0.6,
      warning: 0.8,
      success: 0.9
    }
  },
  chartColors: {
    positive: '#28a745',
    neutral: '#ffc107',
    negative: '#dc3545',
    rating: '#17a2b8',
    count: '#007bff'
  }
};

// Review portal configuration
export const PORTAL_CONFIG = {
  defaultLayout: 'standard',
  availableLayouts: ['standard', 'compact', 'full-width', 'card', 'minimal'],
  defaultBranding: {
    logo: null,
    colors: {
      primary: '#007bff',
      secondary: '#6c757d',
      background: '#ffffff',
      text: '#212529'
    },
    fonts: {
      heading: 'Roboto',
      body: 'Arial'
    }
  },
  defaultFields: [
    { id: 'name', label: 'Name', type: 'text', required: true, visible: true },
    { id: 'email', label: 'Email', type: 'email', required: true, visible: true },
    { id: 'rating', label: 'Rating', type: 'rating', required: true, visible: true },
    { id: 'title', label: 'Title', type: 'text', required: false, visible: true },
    { id: 'content', label: 'Review', type: 'textarea', required: true, visible: true },
    { id: 'image', label: 'Photo', type: 'image', required: false, visible: true },
    { id: 'consent', label: 'Consent', type: 'checkbox', required: true, visible: true }
  ]
};

// Platform sync configuration
export const SYNC_CONFIG = {
  defaultInterval: 43200000, // 12 hours
  errorRetryCount: 3,
  errorRetryDelay: 300000, // 5 minutes
  batchSize: 100,
  reviewsLookback: 90, // days
  webhookEnabled: true,
  syncHistory: {
    maxEntries: 100,
    retention: 30 // days
  }
};

// Validation rules
export const VALIDATION_RULES = {
  review: {
    rating: { required: true, min: 1, max: 5 },
    content: { required: true, minLength: 5, maxLength: 5000 },
    author: { required: false, maxLength: 100 },
    email: { required: false, format: 'email' },
    title: { required: false, maxLength: 200 }
  },
  reviewLink: {
    name: { required: true, maxLength: 100 },
    expiryDays: { required: false, min: 1, max: 365 },
    redirectUrl: { required: false, format: 'url' },
    platforms: { required: true, minItems: 1 }
  },
  response: {
    content: { required: true, minLength: 10, maxLength: 10000 },
    templateId: { required: false }
  },
  template: {
    name: { required: true, maxLength: 100 },
    content: { required: true, minLength: 10, maxLength: 10000 }
  },
  portal: {
    name: { required: true, maxLength: 100 },
    domain: { required: false, format: 'domain' }
  }
};

// Sentiment analysis configuration
export const SENTIMENT_CONFIG = {
  modelType: 'keyword', // 'keyword', 'machine-learning', or 'hybrid'
  thresholds: {
    positive: 0.2,
    negative: -0.2
  },
  includeNegation: true,
  cacheEnabled: true
};

// Module permissions
export const PERMISSIONS = {
  VIEW_REVIEWS: 'reputation.view_reviews',
  CREATE_REVIEWS: 'reputation.create_reviews',
  UPDATE_REVIEWS: 'reputation.update_reviews',
  DELETE_REVIEWS: 'reputation.delete_reviews',
  RESPOND_TO_REVIEWS: 'reputation.respond_to_reviews',
  CREATE_LINKS: 'reputation.create_links',
  VIEW_ANALYTICS: 'reputation.view_analytics',
  CREATE_ANALYTICS: 'reputation.create_analytics',
  UPDATE_ANALYTICS: 'reputation.update_analytics',
  DELETE_ANALYTICS: 'reputation.delete_analytics',
  EXPORT_DATA: 'reputation.export_data',
  MANAGE_PLATFORMS: 'reputation.manage_platforms',
  MANAGE_TEMPLATES: 'reputation.manage_templates',
  CONFIGURE_AUTO_RESPONSE: 'reputation.configure_auto_response',
  MANAGE_PORTAL: 'reputation.manage_portal',
  ADMIN_ACCESS: 'reputation.admin_access'
};

// Default system settings
export const DEFAULT_SETTINGS = {
  notificationsEnabled: true,
  reviewAlertsEnabled: true,
  autoResponseEnabled: false,
  syncEnabled: true,
  reviewsPerPage: 10,
  dashboardRefreshInterval: 300000, // 5 minutes
  defaultSortField: 'createdAt',
  defaultSortDirection: 'desc'
};

// Notification configuration
export const NOTIFICATION_CONFIG = {
  channels: ['email', 'app', 'sms'],
  types: {
    NEW_REVIEW: { 
      title: 'New Review Received',
      defaultEnabled: true,
      channels: ['email', 'app']
    },
    NEGATIVE_REVIEW: { 
      title: 'Negative Review Alert',
      defaultEnabled: true,
      channels: ['email', 'app', 'sms']
    },
    SYNC_FAILURE: { 
      title: 'Platform Sync Failure',
      defaultEnabled: true,
      channels: ['email', 'app']
    },
    REVIEW_THRESHOLD: { 
      title: 'Review Threshold Alert',
      defaultEnabled: true,
      channels: ['email', 'app']
    }
  }
};

export default {
  API_ENDPOINTS,
  PLATFORMS,
  DEFAULT_TEMPLATES,
  TEMPLATE_VARIABLES,
  AUTO_RESPONSE_CONFIG,
  REVIEW_LINK_CONFIG,
  ANALYTICS_CONFIG,
  PORTAL_CONFIG,
  SYNC_CONFIG,
  VALIDATION_RULES,
  SENTIMENT_CONFIG,
  PERMISSIONS,
  DEFAULT_SETTINGS,
  NOTIFICATION_CONFIG
};

