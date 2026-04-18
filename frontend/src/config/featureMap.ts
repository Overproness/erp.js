/**
 * Frontend mirror of backend/src/config/featureMap.ts
 * Keeps feature keys, tier hierarchy, and plan metadata in sync.
 */

export type PlanTier = 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused';

export const TIER_ORDER: Record<PlanTier, number> = {
  starter: 1,
  professional: 2,
  enterprise: 3,
};

export const FEATURE_REQUIREMENTS: Record<string, PlanTier> = {
  // ─── Starter (included) ──────────────────────
  BASIC_CRM: 'starter',
  BASIC_INVOICING: 'starter',
  BASIC_QUOTES: 'starter',
  BASIC_PAYMENTS: 'starter',
  DOCUMENT_MANAGEMENT: 'starter',
  TEAM_CHAT: 'starter',
  BASIC_TASKS: 'starter',
  BASIC_SETTINGS: 'starter',
  BASIC_PROFILE: 'starter',
  BASIC_SEARCH: 'starter',
  TAX_MANAGEMENT: 'starter',

  // ─── Professional ────────────────────────────
  AI_SUITE: 'professional',
  AI_ASSISTANT: 'professional',
  AI_SELF_LEARNING: 'professional',
  AI_TASK_PRIORITIZATION: 'professional',
  AI_FRAUD_DETECTION: 'professional',
  AI_DATA_ENTRY: 'professional',
  CAMPAIGN_MANAGEMENT: 'professional',
  AB_TESTING: 'professional',
  SOCIAL_MANAGEMENT: 'professional',
  SOCIAL_AI_CONTENT: 'professional',
  SOCIAL_ANALYTICS: 'professional',
  URL_MANAGEMENT: 'professional',
  URL_ANALYTICS: 'professional',
  URL_AB_TESTING: 'professional',
  SURVEY_MANAGEMENT: 'professional',
  SURVEY_ANALYTICS: 'professional',
  SURVEY_ADVANCED: 'professional',
  REPUTATION_MANAGEMENT: 'professional',
  MARKETING_MODULE: 'professional',
  BEHAVIOR_TRIGGERS: 'professional',
  RETARGETING: 'professional',
  WORKFLOW_MANAGEMENT: 'professional',
  ADVANCED_ANALYTICS: 'professional',
  LEAD_SCORING: 'professional',
  RECURRING_BILLING: 'professional',
  CUSTOMER_LIVE_CHAT: 'professional',
  DOCUMENT_COMPLIANCE: 'professional',
  COPILOT: 'professional',

  // ─── Enterprise ──────────────────────────────
  N8N_WORKFLOWS: 'enterprise',
  CUSTOM_INTEGRATIONS: 'enterprise',
  GLOBAL_KPI_DASHBOARD: 'enterprise',
  REALTIME_ANALYTICS: 'enterprise',
  CUSTOMER_JOURNEY_TRACKING: 'enterprise',
  DOCUMENT_COMPLIANCE_AUDIT: 'enterprise',
  ADVANCED_PERMISSIONS: 'enterprise',
  WHITE_LABEL: 'enterprise',
  PRIORITY_SUPPORT: 'enterprise',
};

export const PLAN_LIMITS: Record<string, Record<PlanTier, number>> = {
  users: { starter: 10, professional: 50, enterprise: Infinity },
  workflowRules: { starter: 5, professional: 50, enterprise: Infinity },
  activeSurveys: { starter: 0, professional: 10, enterprise: Infinity },
  socialAccounts: { starter: 0, professional: 5, enterprise: Infinity },
  monthlyUrlCreates: { starter: 0, professional: 100, enterprise: Infinity },
};

export const PLAN_METADATA: Record<PlanTier, { name: string; price: number; priceAnnual: number; color: string }> = {
  starter: { name: 'Starter', price: 49, priceAnnual: 39, color: '#52c41a' },
  professional: { name: 'Professional', price: 149, priceAnnual: 119, color: '#1890ff' },
  enterprise: { name: 'Enterprise', price: 399, priceAnnual: 319, color: '#722ed1' },
};

export function hasFeatureAccess(currentPlan: PlanTier, featureKey: string): boolean {
  const requiredPlan = FEATURE_REQUIREMENTS[featureKey];
  if (!requiredPlan) return true; // unknown feature → allow
  return TIER_ORDER[currentPlan] >= TIER_ORDER[requiredPlan];
}

export function getPlanLimit(plan: PlanTier, limitKey: string): number {
  return PLAN_LIMITS[limitKey]?.[plan] ?? 0;
}

export function getMinimumPlan(featureKey: string): PlanTier | null {
  return FEATURE_REQUIREMENTS[featureKey] ?? null;
}
