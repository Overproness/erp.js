# ERPjs — Tier-Based Access Control: Task List

Derived from `implementation_plan.md`. Tasks are grouped by phase and ordered by dependency. Work sequentially within each phase; phases can overlap after their foundation tasks are complete.

**Status legend:** `[ ]` = not started · `[~]` = in progress · `[x]` = done

---

## Phase 1 — Data Foundation

### P1-01 · Create Subscription Mongoose model

- **File:** `backend/src/models/appModels/Subscription.ts`
- Define schema: `companyOwner` (ObjectId, ref CompanyOwner, unique), `plan` (enum: starter/professional/enterprise), `status` (enum: trialing/active/past_due/canceled/paused), `billingCycle` (monthly/annual), `trialStart`, `trialEnd`, `currentPeriodStart`, `currentPeriodEnd`, `cancelAtPeriodEnd`, `stripeCustomerId`, `stripeSubscriptionId`, `stripePriceId`, `canceledAt`, `created`, `updated`.
- Add indexes: `{ companyOwner: 1 }`, `{ stripeCustomerId: 1 }`, `{ stripeSubscriptionId: 1 }`.
- Add `pre('save')` hook to auto-update `updated` field.
- Register as `mongoose.model('Subscription', subscriptionSchema)`.

```
[ ] Create file
[ ] Define schema fields
[ ] Add indexes
[ ] Add pre-save hook
[ ] Export model
```

---

### P1-02 · Register Subscription model in model loader

- **File:** Wherever app models are loaded/imported (check `backend/src/models/` index or `app.ts` auto-loader).
- Ensure `Subscription` is loaded before any route/middleware runs.

```
[ ] Find where appModels are auto-loaded
[ ] Confirm Subscription.ts is picked up (or manually import it)
```

---

### P1-03 · Extend TypeScript Request type with plan fields

- **File:** `backend/src/types/` — find the Express Request extension or create one.
- Add `plan: string`, `subscription: any | null` to the augmented `Request` interface.
- This eliminates TypeScript errors in subsequent phases.

```
[ ] Locate or create backend/src/types/express.d.ts
[ ] Add plan and subscription fields
```

---

### P1-04 · Extend GraphQLContext type with plan fields

- **File:** `backend/src/types/context.ts`
- Add `plan: string`, `subscription: any | null` to `GraphQLContext`.

```
[ ] Open context.ts
[ ] Add plan: string field
[ ] Add subscription: any | null field
```

---

### P1-05 · Auto-create trial Subscription on owner registration

- **File:** `backend/src/controllers/coreControllers/adminAuth.ts` — register handler.
- After `CompanyOwner.save()` succeeds, read `plan` from `req.body.plan`. Validate against `['starter','professional','enterprise']`; default to `'professional'` if missing.
- Create Subscription: `{ companyOwner: newOwner._id, plan, status: 'trialing', billingCycle: 'monthly', trialStart: now, trialEnd: now + 14 days }`.
- Do not block registration if Subscription creation fails (log error, continue).

```
[ ] Open adminAuth.ts register handler
[ ] Add plan validation from req.body
[ ] Create Subscription record after CompanyOwner save
[ ] Wrap in try/catch (non-blocking)
```

---

## Phase 2 — Backend Feature Map

### P2-01 · Create backend featureMap.ts constants

- **File:** `backend/src/config/featureMap.ts`
- Define and export: `TIER_ORDER`, `FEATURE_REQUIREMENTS` (all 50+ feature keys mapped to minimum plan), `PLAN_LIMITS` (users, workflowRules, activeSurveys, socialAccounts, monthlyUrlCreates).
- Define and export: `hasFeatureAccess(plan, featureKey): boolean`, `getPlanLimit(plan, limitKey): number`, `getMinimumPlan(featureKey): string`.

```
[ ] Create file
[ ] Define TIER_ORDER
[ ] Define FEATURE_REQUIREMENTS (all 50+ keys from implementation_plan.md Appendix)
[ ] Define PLAN_LIMITS (5 limit keys)
[ ] Implement hasFeatureAccess()
[ ] Implement getPlanLimit()
[ ] Implement getMinimumPlan()
[ ] Export all
```

---

## Phase 3 — Backend Enforcement

### P3-01 · Extend checkAuth middleware to load subscription

- **File:** `backend/src/middlewares/auth.ts`
- After successfully finding a `CompanyOwner`, query `Subscription.findOne({ companyOwner: companyOwner._id }).lean()` and attach to `req.subscription` and `req.plan`.
- If no subscription, set `req.plan = 'starter'` (backward-compat default).
- If `status === 'canceled'`, set `req.plan = 'starter'`.
- For the `isUser` branch: look up the owner via `CompanyOwner.findOne({ companyID: user.companyID })`, then load that owner's subscription.

```
[ ] Open auth.ts
[ ] Add Subscription import
[ ] Add subscription lookup after CompanyOwner lookup (owner branch)
[ ] Attach req.plan and req.subscription
[ ] Add plan/subscription lookup in isUser branch (lookup owner first)
[ ] Handle null subscription with starter default
[ ] Handle canceled status
```

---

### P3-02 · Extend isValidAuthToken middleware to load subscription

- **File:** `backend/src/controllers/middlewaresControllers/createAuthMiddleware/isValidAuthToken.ts`
- Same changes as P3-01 (this is the parallel REST auth middleware).

```
[ ] Open isValidAuthToken.ts
[ ] Replicate all subscription-loading logic from P3-01
[ ] Test that req.plan is set correctly for both owner and user tokens
```

---

### P3-03 · Create planMiddleware.ts (requireFeature, requireLimit)

- **File:** `backend/src/middlewares/planMiddleware.ts`
- Implement `requireFeature(featureKey: string)` — returns a middleware that returns 403 with `{ upgradeRequired: true, requiredPlan, currentPlan }` if access is denied.
- Implement `requireLimit(limitKey: string, getCountFn)` — async middleware factory, returns 403 with limit info if cap exceeded.

```
[ ] Create file
[ ] Import hasFeatureAccess and getPlanLimit from featureMap
[ ] Implement requireFeature factory
[ ] Implement requireLimit factory
[ ] Export both
```

---

### P3-04 · Add requireFeature guard to dataEntryRoutes.ts (OCR)

- **File:** `backend/src/routes/appRoutes/dataEntryRoutes.ts` (or `backend/src/routes/dataEntryRoutes.ts`)
- Add `requireFeature('AI_SUITE')` after the auth middleware on all OCR/data-entry upload endpoints.

```
[ ] Open dataEntryRoutes.ts
[ ] Import requireFeature
[ ] Add middleware to upload/extract/OCR routes
```

---

### P3-05 · Add requireFeature guard to customerChatRoutes.ts

- **File:** `backend/src/routes/appRoutes/customerChatRoutes.ts`
- Add `requireFeature('CUSTOMER_LIVE_CHAT')` to all authenticated customer chat endpoints (not public-facing customer endpoints).

```
[ ] Open customerChatRoutes.ts
[ ] Identify which routes are app-side (owner/user) vs public (customer)
[ ] Add requireFeature to owner-side routes only
```

---

### P3-06 · Extend GraphQL buildContext to load subscription

- **File:** `backend/src/graphql/index.ts`
- Inside `buildContext`, after the CompanyOwner is found, query subscription and attach to `context.plan` and `context.subscription`.

```
[ ] Open graphql/index.ts
[ ] Import Subscription model
[ ] Add subscription query after admin lookup
[ ] Set context.plan (handle null and canceled)
[ ] Set context.subscription
```

---

### P3-07 · Create GraphQL plan guard utility

- **File:** `backend/src/graphql/utils/requirePlanFeature.ts`
- Implement `requirePlanFeature(context, featureKey)` — throws `GraphQLError` with code `PLAN_UPGRADE_REQUIRED` if access is denied.
- Implement `requirePlanLimit(context, limitKey, currentCount)` — throws `GraphQLError` with code `PLAN_LIMIT_REACHED` if at cap.

```
[ ] Create directory backend/src/graphql/utils/ if needed
[ ] Create requirePlanFeature.ts
[ ] Implement requirePlanFeature function
[ ] Implement requirePlanLimit function
[ ] Export both
```

---

### P3-08 · Add plan guards to AI resolvers

- **Files:** All resolver files in `backend/src/graphql/resolvers/` that handle AI operations (any file with `ai`, `copilot`, `assistant`, `ocr` in the name).
- Add `requirePlanFeature(context, 'AI_SUITE')` as first line in every Query and Mutation.
- For knowledge base ops: use `'AI_KNOWLEDGE_BASE'`.
- For multi-provider / self-learning: use `'AI_MULTI_PROVIDER'` / `'AI_SELF_LEARNING'`.
- For anomaly detection: use `'AI_ANOMALY_DETECTION'`.

```
[ ] List all AI resolver files
[ ] Add AI_SUITE guard to all standard AI resolvers
[ ] Add AI_KNOWLEDGE_BASE guard to knowledge base resolvers
[ ] Add AI_MULTI_PROVIDER guard to provider-switching resolvers
[ ] Add AI_SELF_LEARNING guard to self-learning resolvers
[ ] Add AI_ANOMALY_DETECTION guard to anomaly detection resolvers
```

---

### P3-09 · Add plan guards to Campaign / Marketing resolvers

- **Files:** Resolver files for campaigns, A/B testing, retargeting, email campaigns, behavior tracking.
- Guards: `CAMPAIGN_MANAGEMENT`, `AB_TESTING`, `RETARGETING_ENGINE`, `EMAIL_CAMPAIGNS`, `ADVANCED_BEHAVIOR_TRACKING`, `CUSTOMER_BEHAVIOR_ANALYTICS`.

```
[ ] List all campaign/marketing resolver files
[ ] Add CAMPAIGN_MANAGEMENT guard to campaign CRUD resolvers
[ ] Add AB_TESTING guard to A/B test resolvers
[ ] Add RETARGETING_ENGINE guard to retargeting resolvers
[ ] Add EMAIL_CAMPAIGNS guard to email campaign resolvers
[ ] Add ADVANCED_BEHAVIOR_TRACKING guard to behavior tracking resolvers
[ ] Add CUSTOMER_BEHAVIOR_ANALYTICS guard to behavior analytics resolvers
```

---

### P3-10 · Add plan guards to Social Media resolvers

- **Files:** Resolver files for social accounts, social posts, social campaigns, social analytics.
- Guards: `SOCIAL_MANAGEMENT` (base), `SOCIAL_MENTION_MONITORING` (enterprise).

```
[ ] List all social media resolver files
[ ] Add SOCIAL_MANAGEMENT guard to account/post/campaign/analytics resolvers
[ ] Add SOCIAL_MENTION_MONITORING guard to mention resolvers
```

---

### P3-11 · Add plan guards to Reputation / Reviews resolvers

- **Files:** Resolver files for reviews, reputation portal, review responses, review analytics.
- Guards: `REVIEW_AGGREGATION`, `REVIEW_RESPONSE_AUTOMATION`, `REVIEW_ANALYTICS_SENTIMENT`, `REVIEW_REQUEST_AUTOMATION`, `REPUTATION_PORTAL`.

```
[ ] List all reputation/review resolver files
[ ] Add appropriate enterprise guard to each resolver group
```

---

### P3-12 · Add plan guards to Workflow resolvers

- **Files:** Resolver files for workflows, trigger rules, business processes, n8n, automation suggestions.
- Guards: `TRIGGER_RULES`, `BUSINESS_PROCESS_ENGINE`, `N8N_WORKFLOWS`, `AUTOMATION_SUGGESTIONS`.

```
[ ] List all workflow resolver files
[ ] Add TRIGGER_RULES guard to trigger rule resolvers
[ ] Add BUSINESS_PROCESS_ENGINE guard to business process resolvers
[ ] Add N8N_WORKFLOWS guard to n8n resolvers
[ ] Add AUTOMATION_SUGGESTIONS guard to suggestion resolvers
```

---

### P3-13 · Add plan guards to CRM extras resolvers

- **Files:** Resolvers for lead scoring, customer segmentation, customer journey, follow-ups.
- Guards: `LEAD_SCORING`, `CUSTOMER_SEGMENTATION`, `CUSTOMER_JOURNEY_TRACKING`, `FOLLOW_UP_AUTOMATION`.

```
[ ] Find lead scoring resolver(s)
[ ] Find segmentation resolver(s)
[ ] Find customer journey resolver(s)
[ ] Find follow-up resolver(s)
[ ] Add respective guards to each
```

---

### P3-14 · Add plan guards to Finance extras resolvers

- **Files:** Resolvers for recurring billing, bulk email quotes.
- Guards: `RECURRING_BILLING`, `BULK_EMAIL_QUOTES`.

```
[ ] Find recurring billing resolver(s)
[ ] Find bulk email quotes resolver(s)
[ ] Add respective guards
```

---

### P3-15 · Add plan guards to Operations extras resolvers

- **Files:** Resolvers for e-signatures, document compliance, AI task prioritization.
- Guards: `E_SIGNATURES`, `DOCUMENT_COMPLIANCE_AUDIT`, `AI_TASK_PRIORITIZATION`.

```
[ ] Find e-signature resolver(s)
[ ] Find document compliance resolver(s)
[ ] Find AI task prioritization resolver(s)
[ ] Add respective guards
```

---

### P3-16 · Add plan guards to Analytics extras resolvers

- **Files:** Resolvers for global KPI, real-time analytics, data export, cross-module comparison.
- Guards: `GLOBAL_KPI_DASHBOARD`, `REALTIME_ANALYTICS`, `ANALYTICS_DATA_EXPORT`, `CROSS_MODULE_COMPARISON`.

```
[ ] Find analytics resolver files
[ ] Add GLOBAL_KPI_DASHBOARD guard
[ ] Add REALTIME_ANALYTICS guard
[ ] Add ANALYTICS_DATA_EXPORT guard
[ ] Add CROSS_MODULE_COMPARISON guard
```

---

### P3-17 · Add plan guards to Communication extras resolvers

- **Files:** Resolvers for SMS, push notifications.
- Guards: `SMS_NOTIFICATIONS`, `PUSH_NOTIFICATIONS`.
- Note: `CUSTOMER_LIVE_CHAT` is already handled in P3-05 via REST; confirm if chat resolvers exist in GraphQL too.

```
[ ] Find SMS resolver(s)
[ ] Find push notification resolver(s)
[ ] Add respective guards
[ ] Check if customer live chat has GraphQL resolvers and guard those too
```

---

### P3-18 · Add plan guards to Compliance resolvers

- **Files:** Resolvers for audit (advanced), consent management, data retention, GDPR export/deletion, compliance reporting.
- Guards: `ADVANCED_AUDIT`, `GDPR_CONSENT`, `DATA_RETENTION`, `GDPR_EXPORT_DELETION`, `COMPLIANCE_REPORTING`.

```
[ ] Find audit resolver files (separate advanced vs basic)
[ ] Find consent management resolver(s)
[ ] Find data retention resolver(s)
[ ] Find GDPR export/deletion resolver(s)
[ ] Find compliance reporting resolver(s)
[ ] Add respective guards (advanced audit = professional, rest = enterprise)
```

---

### P3-19 · Add plan guards to URL extras resolvers

- **Files:** Resolvers for password-protected URLs, CRM-linked URLs, unlimited URL creation.
- Guards: `PASSWORD_PROTECTED_URLS`, `CRM_LINKED_URLS`, `UNLIMITED_URL_SHORTENING`.

```
[ ] Find URL resolver files
[ ] Add PASSWORD_PROTECTED_URLS guard to password URL ops
[ ] Add CRM_LINKED_URLS guard to CRM-linked URL ops
[ ] Add UNLIMITED_URL_SHORTENING guard to URL create (or use requireLimit)
```

---

### P3-20 · Add plan guards to Survey extras resolvers

- **Files:** Resolvers for survey creation, survey analytics.
- Guards: `UNLIMITED_SURVEYS` (or use requireLimit for starter cap), `ADVANCED_SURVEY_ANALYTICS`.

```
[ ] Find survey resolver files
[ ] Add UNLIMITED_SURVEYS / requirePlanLimit guard to survey creation
[ ] Add ADVANCED_SURVEY_ANALYTICS guard to analytics resolvers
```

---

### P3-21 · Implement usage limit enforcement — workflow rules

- **Resolver:** `createWorkflow` (or equivalent).
- Before creating: count `Workflow.countDocuments({ companyID, removed: false })`.
- Call `requirePlanLimit(context, 'workflowRules', count)`.

```
[ ] Open workflow creation resolver
[ ] Add count query before creation
[ ] Add requirePlanLimit call
```

---

### P3-22 · Implement usage limit enforcement — active surveys

- **Resolver:** `createSurvey` (or equivalent).
- Before creating: count published/active surveys.
- Call `requirePlanLimit(context, 'activeSurveys', count)`.

```
[ ] Open survey creation resolver
[ ] Add count query
[ ] Add requirePlanLimit call
```

---

### P3-23 · Implement usage limit enforcement — social accounts

- **Resolver:** `createSocialAccount` (or equivalent).
- Count existing social accounts for companyID.
- Call `requirePlanLimit(context, 'socialAccounts', count)`.

```
[ ] Open social account creation resolver
[ ] Add count query
[ ] Add requirePlanLimit call
```

---

### P3-24 · Implement usage limit enforcement — URL creation (monthly cap)

- **Resolver:** `createShortUrl` (or equivalent).
- Count URLs created this calendar month.
- Call `requirePlanLimit(context, 'monthlyUrlCreates', count)`.

```
[ ] Open URL creation resolver
[ ] Add monthly count query with { createdAt: { $gte: monthStart } }
[ ] Add requirePlanLimit call
```

---

### P3-25 · Implement usage limit enforcement — team member invites

- **Handler/Resolver:** Team invite endpoint (REST or GraphQL).
- Count active users for companyID.
- Compare to `PLAN_LIMITS.users[plan]`, block if at cap.

```
[ ] Find team invite handler (REST or GraphQL)
[ ] Add user count query
[ ] Add plan limit check (requireLimit or requirePlanLimit)
```

---

## Phase 4 — Subscription Lifecycle API

### P4-01 · Create Stripe service wrapper

- **File:** `backend/src/services/stripeService.ts`
- Install Stripe SDK: `npm install stripe` in backend.
- Implement: `createCustomer`, `createCheckoutSession`, `createPortalSession`, `constructWebhookEvent`, `retrieveSubscription`, `cancelSubscriptionAtPeriodEnd`, `reactivateSubscription`, `updateSubscriptionPrice`.
- Define `PRICE_IDS` lookup map (reads from env vars).

```
[ ] Install stripe package: npm install stripe @types/stripe in backend
[ ] Create services/ folder if needed
[ ] Create stripeService.ts
[ ] Implement all 8 methods
[ ] Define PRICE_IDS lookup map
[ ] Export stripeService object
```

---

### P4-02 · Create subscription controller

- **File:** `backend/src/controllers/appControllers/subscriptionController/index.ts`
- Implement: `getSubscription`, `createCheckoutSession`, `createPortalSession`, `cancelSubscription`, `reactivateSubscription`, `changePlan`.
- `getSubscription`: return sanitized subscription data (no Stripe secrets).
- `createCheckoutSession`: validate plan+billingCycle, call stripeService, create Stripe customer if none exists, return `{ url }`.
- `createPortalSession`: return `{ url }` for Stripe Billing Portal.

```
[ ] Create subscriptionController/ directory
[ ] Create index.ts
[ ] Implement getSubscription handler
[ ] Implement createCheckoutSession handler
[ ] Implement createPortalSession handler
[ ] Implement cancelSubscription handler
[ ] Implement reactivateSubscription handler
[ ] Implement changePlan handler
```

---

### P4-03 · Create subscription routes

- **File:** `backend/src/routes/appRoutes/subscriptionRoutes.ts`
- Mount `isValidAuthToken` + `isCompanyOwner` on all routes.
- Wire up all 6 controller handlers.

```
[ ] Create subscriptionRoutes.ts
[ ] Import auth + isCompanyOwner middlewares
[ ] Define GET /, POST /checkout, POST /portal, PUT /cancel, PUT /reactivate, PUT /plan
[ ] Export router
```

---

### P4-04 · Create Stripe webhook handler

- **File:** `backend/src/handlers/stripeWebhook.ts`
- Handle events: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.trial_will_end`.
- For each event: update the `Subscription` record in the database accordingly.
- Always verify `stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)` before processing.

```
[ ] Create stripeWebhook.ts
[ ] Add signature verification (constructEvent)
[ ] Handle checkout.session.completed → update/create Subscription
[ ] Handle invoice.payment_succeeded → set status active, update period dates
[ ] Handle invoice.payment_failed → set status past_due
[ ] Handle customer.subscription.updated → sync plan, billingCycle, cancelAtPeriodEnd
[ ] Handle customer.subscription.deleted → set status canceled, set canceledAt
[ ] Handle customer.subscription.trial_will_end → send in-app notification
[ ] Return 200 for all processed events, 400 for signature errors
```

---

### P4-05 · Mount subscription routes and webhook in app.ts

- **File:** `backend/src/app.ts`
- Add `express.raw({ type: 'application/json' })` for `/api/webhook/stripe` **before** `express.json()` global middleware.
- Mount subscription routes at `/api/subscription`.

```
[ ] Open app.ts
[ ] Add stripe webhook route BEFORE express.json() middleware
[ ] Import and mount subscriptionRoutes at /api/subscription
```

---

### P4-06 · Add Stripe and subscription env vars to .env

- Add all 10 new environment variables (see Section 13 of implementation_plan.md) to `backend/.env` (development keys).
- Document in `backend/Readme.md` or similar.

```
[ ] Add STRIPE_SECRET_KEY to .env
[ ] Add STRIPE_WEBHOOK_SECRET to .env
[ ] Add STRIPE_PUBLISHABLE_KEY to .env
[ ] Add all 6 STRIPE_PRICE_* variables (placeholders for now)
[ ] Add STRIPE_PORTAL_RETURN_URL, STRIPE_SUCCESS_URL, STRIPE_CANCEL_URL
```

---

## Phase 5 — Frontend Foundation

### P5-01 · Create frontend featureMap.ts constants

- **File:** `frontend/src/config/featureMap.ts`
- Exact mirror of the backend featureMap constants and helpers.
- No runtime imports from backend — this is a duplicate-by-design for client-side UX gating.

```
[ ] Create frontend/src/config/featureMap.ts
[ ] Copy TIER_ORDER, FEATURE_REQUIREMENTS, PLAN_LIMITS
[ ] Implement hasFeatureAccess, getPlanLimit, getMinimumPlan
[ ] Export all
```

---

### P5-02 · Create subscription Redux slice

- **File:** `frontend/src/redux/subscription/subscriptionSlice.ts`
- Define `SubscriptionState` interface.
- Define initial state.
- Implement `fetchSubscription` async thunk (calls `GET /api/subscription`).
- Implement `clearSubscription` action.
- Handle `fetchSubscription.pending/fulfilled/rejected` cases.

```
[ ] Create frontend/src/redux/subscription/ directory
[ ] Create subscriptionSlice.ts
[ ] Define SubscriptionState interface
[ ] Create fetchSubscription async thunk
[ ] Create clearSubscription action
[ ] Handle all 3 async lifecycle cases
[ ] Export reducer and actions
```

---

### P5-03 · Create subscription selectors

- **File:** `frontend/src/redux/subscription/subscriptionSelectors.ts`
- Export: `selectSubscription`, `selectPlan`, `selectSubscriptionStatus`, `selectTrialEnd`, `selectIsTrialing`, `selectIsActive`.

```
[ ] Create subscriptionSelectors.ts
[ ] Implement all 6 selectors
[ ] Export all
```

---

### P5-04 · Register subscription reducer in rootReducer

- **File:** `frontend/src/redux/rootReducer.ts`
- Import `subscriptionReducer` from the new slice.
- Add `subscription: subscriptionReducer` to `combineReducers`.

```
[ ] Open rootReducer.ts
[ ] Import subscriptionReducer
[ ] Add to combineReducers
[ ] Update RootState type if needed
```

---

### P5-05 · Create usePlan hook

- **File:** `frontend/src/hooks/usePlan.ts`
- Full implementation per implementation_plan.md Section 7.4.
- Returns: `plan`, `status`, `isTrialing`, `isActive`, `isPastDue`, `isCanceled`, `trialDaysLeft`, `canAccess(featureKey)`, `isAtLimit(limitKey, count)`, `getRequiredPlan(featureKey)`, `isStarter`, `isProfessional`, `isEnterprise`.

```
[ ] Create usePlan.ts
[ ] Import selectors and featureMap helpers
[ ] Implement all return values
[ ] Export usePlan
```

---

### P5-06 · Dispatch fetchSubscription on login

- **File:** `frontend/src/redux/auth/actions.ts`
- After `REQUEST_SUCCESS` dispatch in the login action, dispatch `fetchSubscription()`.
- On logout, dispatch `clearSubscription()`.

```
[ ] Open auth/actions.ts
[ ] Import fetchSubscription and clearSubscription
[ ] Add fetchSubscription() dispatch after successful login
[ ] Add clearSubscription() dispatch in logout action
```

---

### P5-07 · Fetch subscription on app boot (hard refresh)

- **File:** `frontend/src/RootApp.tsx` (or top-level component wrapping the router).
- In a `useEffect`, if `isLoggedIn && !subscription.data && !subscription.isLoading`, dispatch `fetchSubscription()`.

```
[ ] Open RootApp.tsx
[ ] Import usePlan or subscription selectors + dispatch
[ ] Add useEffect with subscription load-on-boot logic
```

---

## Phase 6 — Frontend UI Enforcement

### P6-01 · Create FeatureGate component

- **File:** `frontend/src/components/FeatureGate/index.tsx`
- Props: `feature: string`, `fallback?: ReactNode`, `silent?: boolean`, `children: ReactNode`.
- Logic: if `canAccess(feature)` → render children; if `silent` → render null; else → render fallback or `<DefaultUpgradePrompt>`.

```
[ ] Create FeatureGate/index.tsx
[ ] Implement component with all 3 render paths
[ ] Export FeatureGate
```

---

### P6-02 · Create UpgradePrompt component

- **File:** `frontend/src/components/UpgradePrompt/index.tsx`
- Variants: `inline` (card, default) and `modal`.
- Content: lock icon, feature name, required plan badge, "Upgrade Now" CTA → `/settings/billing`, "See all plans" → `/pricing`.
- Follow DESIGN.md: glassmorphic card, gradient CTA, `on_surface` + `on_surface_variant` colors.

```
[ ] Create UpgradePrompt/ directory
[ ] Create index.tsx with inline variant
[ ] Add modal variant (controlled via prop or context)
[ ] Style per DESIGN.md
[ ] Export UpgradePrompt
```

---

### P6-03 · Create TrialBanner component

- **File:** `frontend/src/components/TrialBanner/index.tsx`
- Only renders when `isTrialing === true`.
- Shows days remaining, changes style when ≤3 days (amber), 0 days (red).
- CTA: "Upgrade Now" → `/settings/billing`.
- Has a session-level dismiss button.

```
[ ] Create TrialBanner/ directory
[ ] Create index.tsx
[ ] Implement day-count logic using trialDaysLeft from usePlan
[ ] Implement 3 visual states (normal / warning / expired)
[ ] Implement session dismiss (sessionStorage key)
[ ] Export TrialBanner
```

---

### P6-04 · Add TrialBanner to app shell layout

- **File:** The main dashboard layout component in `frontend/src/layout/`.
- Import and render `<TrialBanner />` at the top of the authenticated layout, before the main content area.

```
[ ] Find main dashboard layout file
[ ] Import TrialBanner
[ ] Render at top of layout (authenticated area only, not on website pages)
```

---

### P6-05 · Add lock badges to sidebar navigation

- **Files:** Sidebar nav component(s) in `frontend/src/layout/`.
- For each gated nav item (AI, Campaigns, Social, Reputation, Compliance, n8n), add lock icon when `!canAccess(featureKey)`.
- On click of locked item: prevent navigation, show `<UpgradePrompt>` modal instead.

```
[ ] Find sidebar nav component
[ ] Import usePlan
[ ] Add lock condition to: AI Assistant, Campaigns, Social Media, Reputation/Reviews, Compliance, n8n Workflows
[ ] Add lock icon badge for locked items
[ ] Intercept click on locked items → show upgrade modal
```

---

### P6-06 · Wrap AI feature sections with FeatureGate

- **Files:** All pages/components in `frontend/src/` that render AI Assistant, AI Copilot, OCR/data-entry, AI analytics panels.
- Wrap entire section/tab/panel with `<FeatureGate feature="AI_SUITE">`.
- For enterprise-only AI features (knowledge base, anomaly detection, multi-provider), use their specific feature keys.

```
[ ] Search frontend for all AI-related components
[ ] Wrap each with FeatureGate using correct key
[ ] Confirm UpgradePrompt renders correctly in each location
```

---

### P6-07 · Wrap Campaign / Marketing sections with FeatureGate

- **Files:** Campaign list, campaign detail, A/B test, retargeting, behavior tracking pages.

```
[ ] Find all campaign/marketing page components
[ ] Wrap with FeatureGate using CAMPAIGN_MANAGEMENT, AB_TESTING, RETARGETING_ENGINE
[ ] Wrap behavior tracking with ADVANCED_BEHAVIOR_TRACKING
```

---

### P6-08 · Wrap Social Media sections with FeatureGate

- **Files:** Social account management, post scheduling, social analytics pages.

```
[ ] Find all social media page components
[ ] Wrap with FeatureGate using SOCIAL_MANAGEMENT
[ ] Wrap mention monitoring with SOCIAL_MENTION_MONITORING (enterprise gate)
```

---

### P6-09 · Wrap Reputation / Reviews sections with FeatureGate

- **Files:** Review aggregation, reputation portal, review response pages.

```
[ ] Find all reputation/review page components
[ ] Wrap with FeatureGate using REVIEW_AGGREGATION (enterprise)
[ ] Wrap reputation portal with REPUTATION_PORTAL
```

---

### P6-10 · Wrap Compliance sections with FeatureGate

- **Files:** GDPR consent, data retention, compliance reporting pages.

```
[ ] Find all compliance page components
[ ] Wrap advanced audit sections with ADVANCED_AUDIT (professional)
[ ] Wrap GDPR/consent/retention with GDPR_CONSENT (enterprise)
[ ] Wrap compliance reporting with COMPLIANCE_REPORTING
```

---

### P6-11 · Show usage limit UI feedback

- **Files:** Team invite UI, workflow creation form, survey creation form, social account add form, URL creation form.
- When at or near plan limit, show a limit indicator (e.g., "8/10 team members — upgrade for more").
- Disable create action when limit is reached and show inline upgrade prompt.

```
[ ] Find team invite / add member UI
[ ] Find workflow create UI
[ ] Find survey create UI
[ ] Find social account connect UI
[ ] Find URL shorten create UI
[ ] Add usage counter + limit indicator to each
[ ] Disable create button at limit, show upgrade nudge
```

---

## Phase 7 — Subscription Management UI

### P7-01 · Create BillingPage component

- **File:** `frontend/src/pages/Dashboard/SubscriptionPage.tsx`
- Route: `/settings/billing`
- Sections: Current Plan Card (plan, status, trial/billing date), Plan Cards (compact upgrade/downgrade), Billing Cycle Toggle, Manage Billing button, Cancel option.
- Only visible to CompanyOwner (check `isOwner` from `usePermissions`).

```
[ ] Create SubscriptionPage.tsx
[ ] Implement Current Plan Card section
[ ] Implement Plan Comparison Cards (compact variant from PricingPage design)
[ ] Implement Billing Cycle Toggle with save 20% annual badge
[ ] Add Manage Billing button (calls POST /api/subscription/portal and redirects)
[ ] Add Cancel Plan section with confirmation modal
[ ] Style per DESIGN.md
```

---

### P7-02 · Wire Stripe Checkout to upgrade buttons

- **File:** `frontend/src/pages/Dashboard/SubscriptionPage.tsx` (and any other "Upgrade" CTA).
- On "Upgrade Now" / "Start Plan" click: call `POST /api/subscription/checkout` with `{ plan, billingCycle }`, then `window.location.href = data.url` (Stripe hosted checkout).
- Handle `?upgraded=true` and `?canceled=true` query params on return to show success/cancel toast.

```
[ ] Implement checkout call in SubscriptionPage
[ ] Redirect to Stripe checkout URL on success
[ ] Handle return URL query params (show success toast on ?upgraded=true)
[ ] Handle cancel (show info message on ?canceled=true)
```

---

### P7-03 · Add Billing item to Settings navigation

- **File:** Settings sidebar or nav component in `frontend/src/layout/` or `frontend/src/pages/`.
- Add "Billing & Subscription" item linking to `/settings/billing`.
- Only show for `isOwner` users (not team members).

```
[ ] Find settings navigation component
[ ] Add Billing & Subscription nav item
[ ] Gate visibility with isOwner check
```

---

### P7-04 · Register /settings/billing route in router

- **File:** `frontend/src/router/AuthRouter.tsx` or the relevant router file.
- Add lazy import and route for `SubscriptionPage`.

```
[ ] Open AuthRouter.tsx or settings router
[ ] Add lazy import for SubscriptionPage
[ ] Add <Route path="/settings/billing" element={<SubscriptionPage />} />
[ ] Confirm route is NOT in publicPaths array
```

---

## Phase 8 — Auth Flow Updates

### P8-01 · Add subscription expiry gate to AuthRouter

- **File:** `frontend/src/router/AuthRouter.tsx`
- After the existing `isLoggedIn` check, add checks for `canceled` status and trial hard-expiry (3-day grace period).
- Redirect to `/settings/billing` for expired users on any non-public, non-billing route.

```
[ ] Open AuthRouter.tsx
[ ] Import subscription selectors and usePlan (or use raw selectors)
[ ] Add canceled status redirect gate
[ ] Add trial hard-expiry redirect gate (with 3-day grace period)
[ ] Ensure /settings/billing, /pricing, /logout are still accessible
```

---

## Phase 9 — Stripe Products Setup

### P9-01 · Create Stripe products and prices

- Action taken in the Stripe Dashboard (or Stripe CLI, not in code).
- Create 3 products: Starter, Professional, Enterprise.
- Create 2 prices per product: monthly and annual.
- Set metadata on each price: `plan`, `billingCycle`.
- Copy all 6 price IDs into `.env`.

```
[ ] Create Starter product in Stripe
[ ] Create Starter monthly price ($49)
[ ] Create Starter annual price ($468)
[ ] Create Professional product in Stripe
[ ] Create Professional monthly price ($149)
[ ] Create Professional annual price ($1,428)
[ ] Create Enterprise product in Stripe
[ ] Create Enterprise monthly price ($399)
[ ] Create Enterprise annual price ($3,828)
[ ] Copy all price IDs to .env
```

---

### P9-02 · Configure Stripe webhook endpoint

- Action taken in the Stripe Dashboard.
- Register `https://your-domain.com/api/webhook/stripe` as a webhook endpoint.
- Select events: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.trial_will_end`.
- Copy the signing secret to `.env` as `STRIPE_WEBHOOK_SECRET`.

```
[ ] Create webhook endpoint in Stripe Dashboard
[ ] Select all required events
[ ] Copy STRIPE_WEBHOOK_SECRET to .env
[ ] Test webhook delivery with Stripe CLI (stripe listen --forward-to localhost:8888/api/webhook/stripe)
```

---

## Phase 10 — Migration & Testing

### P10-01 · Write migration script for existing owners

- **File:** `backend/src/database/migrations/addSubscriptions.ts`
- Iterate all `CompanyOwner` documents without a linked `Subscription` and create one with `plan: 'starter', status: 'active'`.

```
[ ] Create addSubscriptions.ts migration
[ ] Implement owner iteration + Subscription existence check
[ ] Create Subscription with starter/active defaults
[ ] Add dry-run mode (--dry-run flag: logs without writing)
[ ] Test on local DB
```

---

### P10-02 · Create dev seed for multi-tier testing

- **File:** Add to existing seed script or create `backend/src/setup/seedSubscriptions.ts`
- Create 4 test CompanyOwners:
  - `tester-starter@erpjs.dev` → starter/active
  - `tester-pro@erpjs.dev` → professional/trialing (3 days left)
  - `tester-enterprise@erpjs.dev` → enterprise/active
  - `tester-expired@erpjs.dev` → starter/canceled

```
[ ] Create or extend seed file
[ ] Create 4 test owners with distinct subscription states
[ ] Confirm each state triggers the correct gating behavior in the UI
```

---

### P10-03 · End-to-end verification checklist

Run through each item manually (or automate) before shipping:

```
[ ] Starter owner: cannot access AI Assistant (403 from backend, FeatureGate on frontend)
[ ] Starter owner: cannot create more than 10 workflows (limit enforced)
[ ] Starter owner: cannot access social media management
[ ] Professional owner: can access AI Suite
[ ] Professional owner: cannot access n8n workflows or reputation management
[ ] Enterprise owner: has full access to all features
[ ] Trialing owner: TrialBanner shows correct days remaining
[ ] Canceled owner: redirected to /settings/billing on any app route
[ ] Trial expired owner (3+ days past): redirected to /settings/billing
[ ] Checkout flow: upgrade from starter to professional via Stripe test card
[ ] Webhook: verify Subscription record is updated after successful payment
[ ] Webhook: verify status changes to past_due on failed payment
[ ] Team member: cannot invite more users than plan allows
[ ] Locked nav items: show lock badge, open UpgradePrompt modal on click
[ ] FeatureGate inline: AI panel shows UpgradePrompt card for starter users
[ ] Billing page: shows current plan, correct dates, Manage Billing button works
```

---

## Summary

| Phase                    | Tasks            | Description                                                                     |
| ------------------------ | ---------------- | ------------------------------------------------------------------------------- |
| 1 — Data Foundation      | P1-01 to P1-05   | Subscription model, TS types, registration trial init                           |
| 2 — Backend Feature Map  | P2-01            | featureMap constants, helpers                                                   |
| 3 — Backend Enforcement  | P3-01 to P3-25   | Auth middleware extension, planMiddleware, all resolver guards, usage limits    |
| 4 — Subscription API     | P4-01 to P4-06   | Stripe service, subscription controller, routes, webhook, app.ts, env vars      |
| 5 — Frontend Foundation  | P5-01 to P5-07   | featureMap mirror, subscription slice, usePlan hook, login dispatch             |
| 6 — Frontend Enforcement | P6-01 to P6-11   | FeatureGate, UpgradePrompt, TrialBanner, nav gating, inline wrappers, limits UI |
| 7 — Subscription UI      | P7-01 to P7-04   | BillingPage, Stripe checkout wiring, settings nav, route registration           |
| 8 — Auth Flow            | P8-01            | AuthRouter expiry gates                                                         |
| 9 — Stripe Setup         | P9-01 to P9-02   | Products, prices, webhook endpoint (Stripe Dashboard ops)                       |
| 10 — Migration & QA      | P10-01 to P10-03 | Legacy migration, dev seed, end-to-end checklist                                |

**Total checklist items: ~150 discrete actions across 10 phases.**
