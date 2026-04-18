// @ts-nocheck
/**
 * Feature Map — single source of truth for tier-based access control.
 * The frontend mirrors these constants exactly.
 */

export const TIER_ORDER: Record<string, number> = {
  starter: 1,
  professional: 2,
  enterprise: 3,
};

export const FEATURE_REQUIREMENTS: Record<string, string> = {
  // ── CRM & Sales ──────────────────────────────────────────────
  LEAD_SCORING: 'professional',
  CUSTOMER_SEGMENTATION: 'professional',
  CUSTOMER_JOURNEY_TRACKING: 'professional',
  FOLLOW_UP_AUTOMATION: 'professional',

  // ── Finance ──────────────────────────────────────────────────
  BULK_EMAIL_QUOTES: 'professional',
  RECURRING_BILLING: 'professional',

  // ── Operations ───────────────────────────────────────────────
  E_SIGNATURES: 'professional',
  AI_TASK_PRIORITIZATION: 'professional',
  DOCUMENT_COMPLIANCE_AUDIT: 'enterprise',

  // ── Workflow Automation ───────────────────────────────────────
  TRIGGER_RULES: 'professional',
  BUSINESS_PROCESS_ENGINE: 'professional',
  N8N_WORKFLOWS: 'enterprise',
  AUTOMATION_SUGGESTIONS: 'enterprise',

  // ── AI Suite ─────────────────────────────────────────────────
  AI_SUITE: 'professional',
  AI_KNOWLEDGE_BASE: 'enterprise',
  AI_ANOMALY_DETECTION: 'enterprise',
  AI_MULTI_PROVIDER: 'enterprise',
  AI_SELF_LEARNING: 'enterprise',

  // ── Marketing & Campaigns ─────────────────────────────────────
  CAMPAIGN_MANAGEMENT: 'professional',
  AB_TESTING: 'professional',
  RETARGETING_ENGINE: 'professional',
  EMAIL_CAMPAIGNS: 'professional',
  ADVANCED_BEHAVIOR_TRACKING: 'professional',
  CUSTOMER_BEHAVIOR_ANALYTICS: 'professional',

  // ── Social Media ──────────────────────────────────────────────
  SOCIAL_MANAGEMENT: 'professional',
  SOCIAL_MENTION_MONITORING: 'enterprise',

  // ── Reputation ────────────────────────────────────────────────
  REVIEW_AGGREGATION: 'enterprise',
  REVIEW_RESPONSE_AUTOMATION: 'enterprise',
  REVIEW_ANALYTICS_SENTIMENT: 'enterprise',
  REVIEW_REQUEST_AUTOMATION: 'enterprise',
  REPUTATION_PORTAL: 'enterprise',

  // ── Analytics ─────────────────────────────────────────────────
  GLOBAL_KPI_DASHBOARD: 'professional',
  REALTIME_ANALYTICS: 'professional',
  ANALYTICS_DATA_EXPORT: 'enterprise',
  CROSS_MODULE_COMPARISON: 'enterprise',

  // ── Communication ─────────────────────────────────────────────
  CUSTOMER_LIVE_CHAT: 'professional',
  SMS_NOTIFICATIONS: 'professional',
  PUSH_NOTIFICATIONS: 'professional',

  // ── URLs & Links ──────────────────────────────────────────────
  UNLIMITED_URL_SHORTENING: 'professional',
  PASSWORD_PROTECTED_URLS: 'professional',
  CRM_LINKED_URLS: 'professional',

  // ── Surveys ───────────────────────────────────────────────────
  UNLIMITED_SURVEYS: 'professional',
  ADVANCED_SURVEY_ANALYTICS: 'professional',

  // ── Compliance & Security ─────────────────────────────────────
  ADVANCED_AUDIT: 'professional',
  GDPR_CONSENT: 'enterprise',
  DATA_RETENTION: 'enterprise',
  GDPR_EXPORT_DELETION: 'enterprise',
  COMPLIANCE_REPORTING: 'enterprise',
  SSO_SAML: 'enterprise',
  CUSTOM_BRANDING: 'enterprise',

  // ── Support & API ─────────────────────────────────────────────
  ONBOARDING_ASSISTANCE: 'professional',
  PERSONAL_ACCOUNT_MANAGER: 'enterprise',
  CUSTOM_TRAINING: 'enterprise',
  FULL_API_ACCESS: 'professional',
  WEBHOOK_API_ACCESS: 'enterprise',
};

export const PLAN_LIMITS: Record<string, Record<string, number>> = {
  users: { starter: 10, professional: 50, enterprise: Infinity },
  workflowRules: { starter: 10, professional: Infinity, enterprise: Infinity },
  activeSurveys: { starter: 3, professional: Infinity, enterprise: Infinity },
  socialAccounts: { starter: 0, professional: 5, enterprise: Infinity },
  monthlyUrlCreates: { starter: 50, professional: Infinity, enterprise: Infinity },
};

/** Returns true if plan can access the given feature key */
export function hasFeatureAccess(plan: string, featureKey: string): boolean {
  const required = FEATURE_REQUIREMENTS[featureKey];
  if (!required) return true;
  return (TIER_ORDER[plan] ?? 0) >= (TIER_ORDER[required] ?? 99);
}

/** Returns the usage cap for a given plan and limit key */
export function getPlanLimit(plan: string, limitKey: string): number {
  return PLAN_LIMITS[limitKey]?.[plan] ?? Infinity;
}

/** Returns the minimum plan required for a feature */
export function getMinimumPlan(featureKey: string): string {
  return FEATURE_REQUIREMENTS[featureKey] ?? 'starter';
}
