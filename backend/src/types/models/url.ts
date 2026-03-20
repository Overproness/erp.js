// URL model type definitions

export interface IURL {
  _id: string;
  originalUrl: string;
  shortCode: string;
  title: string;
  description: string;
  tags: string[];
  customDomain: string;
  isActive: boolean;
  isPublic: boolean;
  isFeatured: boolean;
  requiresAuth: boolean;
  allowedUsers: string[];
  allowedRoles: ('admin' | 'user' | 'manager' | 'viewer')[];
  passwordProtected: boolean;
  password?: string;
  expiresAt: Date;
  maxClicks: number;
  clickLimit: number;
  totalClicks: number;
  uniqueClicks: number;
  lastClickedAt: Date;
  firstClickedAt: Date;
  abTestGroup: 'control' | 'variant_a' | 'variant_b' | 'variant_c';
  abTestName: string;
  abTestId: string;
  linkedModule: 'invoice' | 'quote' | 'customer' | 'document' | 'campaign' | 'product' | 'payment' | 'social_media';
  linkedEntityId: string;
  linkedEntityType: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  ipRestrictions: { ip: string; type: string }[];
  countryRestrictions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IURLClickDevice {
  type: string;
  name: string;
  brand: string;
  model: string;
}

export interface IURLClick {
  _id: string;
  url: string | IURL;
  shortCode: string;
  clickedAt: Date;
  responseTime: number;
  user: string;
  isAuthenticated: boolean;
  userId: string;
  sessionId: string;
  isUniqueClick: boolean;
  userAgent: string;
  device: IURLClickDevice;
  browser: { name: string; version: string; major: string };
  os: { name: string; version: string };
  screenResolution: { width: number; height: number };
  ipAddress: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
  referrer: string;
  referrerDomain: string;
  referrerType: 'direct' | 'search' | 'social' | 'email' | 'paid' | 'other';
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  abTestGroup: string;
  abTestId: string;
  timeOnSite: number;
  pageViews: number;
  isBot: boolean;
  botType: string;
  isConversion: boolean;
}

export interface IABTestVariant {
  name: string;
  url: string;
  trafficAllocation: number;
  description: string;
}

export interface IABTestResults {
  control: {
    clicks: number;
    conversions: number;
    conversionRate: number;
    averageTimeOnSite: number;
    bounceRate: number;
  };
  variants: any[];
}

export interface IABTest {
  _id: string;
  testName: string;
  description: string;
  hypothesis: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  controlUrl: string | IURL;
  variants: IABTestVariant[];
  controlTrafficAllocation: number;
  testType: 'split_url' | 'redirect_test' | 'content_test';
  startDate: Date;
  endDate: Date;
  duration: number;
  primaryMetric: 'click_rate' | 'conversion_rate' | 'time_on_site' | 'bounce_rate' | 'custom';
  secondaryMetrics: string[];
  conversionGoal: string;
  minimumSampleSize: number;
  confidenceLevel: number;
  minimumDetectableEffect: number;
  totalParticipants: number;
  controlParticipants: number;
  variantParticipants: { variantName: string; participants: number }[];
  results: IABTestResults;
  statisticalSignificance: number;
  pValue: number;
  winner: 'control' | 'variant_a' | 'variant_b' | 'variant_c' | 'inconclusive';
  winnerDeclaredAt: Date;
  targetAudience: { countries: string[]; devices: string[]; userTypes: string[]; trafficSources: string[] };
  createdAt: Date;
  updatedAt: Date;
}
