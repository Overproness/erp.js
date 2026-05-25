# ERPjs — Feature Mapping & Taxonomy

> **Stack:** Node.js · TypeScript · Express · GraphQL (Apollo) · MongoDB/Mongoose · React · Vite · Tailwind CSS · Socket.IO

---

## Table of Contents

1. [Core Infrastructure & Platform](#1-core-infrastructure--platform)
2. [CRM & Sales](#2-crm--sales)
3. [AI Suite](#3-ai-suite)
4. [Marketing & Campaigns](#4-marketing--campaigns)
5. [Workflow Automation Engine](#5-workflow-automation-engine)
6. [Social Media & Reputation Management](#6-social-media--reputation-management)
7. [Analytics & Business Intelligence](#7-analytics--business-intelligence)
8. [Communication & Engagement](#8-communication--engagement)
9. [Document Management & Compliance](#9-document-management--compliance)
10. [Admin, Billing & Access Control](#10-admin-billing--access-control)
11. [Feature Dependencies Map](#11-feature-dependencies-map)
12. [Tier Access Matrix](#12-tier-access-matrix)

---

## 1. Core Infrastructure & Platform

> Foundation services shared by every module.

| Feature                  | Description                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------- |
| **GraphQL API**          | Apollo Server 4 with Express middleware; primary data-fetching layer                   |
| **REST API**             | Selective REST routes for auth, file uploads, binary streams, webhooks, URL redirects  |
| **MongoDB / Mongoose**   | Document-oriented data layer; all domain models defined as Mongoose schemas            |
| **Real-time WebSockets** | Socket.IO for live chat and push notifications                                         |
| **Rate Limiting**        | Per-route rate limiter middleware to prevent abuse                                     |
| **JWT Authentication**   | Admin and user token-based auth via cookie + header                                    |
| **File Upload Handling** | `express-fileupload`; multipart form routes for documents and data imports             |
| **PDF Generation**       | Server-side PDF rendering from invoice / quote data                                    |
| **OCR Service**          | Tesseract.js for image/scanned-document text extraction; AI fallback via OpenAI Vision |
| **Spreadsheet Import**   | CSV (`csv-parser`) and XLSX (`xlsx`) parsing with row-level validation                 |
| **Email Transport**      | Pluggable providers: SendGrid, Mailchimp, Amazon SES, custom SMTP                      |
| **SMS Transport**        | SMS notifications via configurable SMS gateway                                         |
| **Push Notifications**   | Web push notification service                                                          |
| **Error Handling**       | Centralized error handler middleware with structured logging                           |
| **Compression & CORS**   | `compression` + `cors` with configurable origin allowlist                              |

**Key files:** `backend/src/app.ts`, `backend/src/server.ts`, `backend/src/graphql/`, `backend/src/middlewares/`

---

## 2. CRM & Sales

> Full customer lifecycle management from lead capture to revenue collection.

| Feature                          | Description                                                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Client / Customer Management** | Full CRUD; profile, contact info, tags, notes, lifecycle status                                                   |
| **Lead Scoring**                 | Weighted multi-factor scoring: demographic (20%), behavioral (25%), engagement (25%), value (20%), interest (10%) |
| **Customer Segmentation**        | Rule-based segment builder grouping customers by attributes and behavior                                          |
| **Customer Journey Tracking**    | Records and visualises touchpoints across the full customer lifecycle                                             |
| **Interaction Tracking**         | Logs every call, email, meeting, and note against a customer record                                               |
| **Follow-Up Automation**         | Scheduled follow-up tasks auto-generated from rules                                                               |
| **Appointment Scheduling**       | Create, update, and view appointments linked to customers                                                         |
| **Quote Management**             | Create, send, and track quotes; bulk email delivery via `quoteDeliveryService`                                    |
| **Invoice Management**           | Generate and track invoices with line items and tax                                                               |
| **Payment & Payment Modes**      | Record payments; support multiple payment modes                                                                   |
| **Recurring Billing**            | Subscription-style billing cycles with automated re-billing                                                       |
| **Tax Management**               | Tax configuration applied per invoice / quote line item                                                           |
| **Project Management**           | Projects linked to clients; task association                                                                      |
| **Team Management**              | Internal team records, public invite links, role assignment                                                       |
| **Task Management**              | Tasks with assignees, due dates, priorities, and AI prioritization                                                |

**Key files:** `backend/src/controllers/appControllers/clientController/`, `invoiceController/`, `quoteController/`, `taskController/`, `leadScoringService.ts`

---

## 3. AI Suite

> Multi-provider AI layer spanning assistant, analytics, automation, and self-improvement.

| Feature                          | Description                                                                                    |
| -------------------------------- | ---------------------------------------------------------------------------------------------- |
| **AI Assistant**                 | Conversational assistant per module; powered by configurable LLM provider                      |
| **Multi-Provider AI**            | Supports OpenAI (GPT-4 / GPT-3.5-Turbo), Google Vertex AI, Azure OpenAI, Hugging Face          |
| **AI Knowledge Base**            | Uploadable documents indexed for assistant context retrieval                                   |
| **AI Conversation History**      | Persistent conversation threads stored in `AiConversation` model                               |
| **NLP Service**                  | Named entity recognition, intent classification, entity extraction                             |
| **Pattern Recognition**          | Cross-conversation trend detection via `patternRecognitionService`                             |
| **Context-Aware Responses**      | Module-aware context builder enriches prompts with live CRM/operational data                   |
| **Sentiment Analysis**           | Classifies text sentiment (positive / neutral / negative)                                      |
| **Predictive Analytics**         | Forecasts churn risk, deal close probability, campaign performance                             |
| **AI Self-Learning**             | Tracks interactions and feedback; schedules cron-based model optimization via `AILearningData` |
| **AI Anomaly Detection**         | Flags statistical outliers in business metrics                                                 |
| **Automation Suggestion Engine** | Recommends new trigger rules based on observed patterns                                        |
| **AI Data Extraction Templates** | Structured extraction from unstructured text / OCR output                                      |
| **AI Processing Workflows**      | Chainable AI steps for multi-stage data processing                                             |
| **Fraud Detection**              | Flags suspicious transactions or interaction patterns                                          |
| **AI Task Prioritization**       | AI ranks open tasks by urgency and impact                                                      |
| **Copilot Module**               | In-app assistant shortcut accessible from any screen                                           |

**Key files:** `backend/src/services/aiService.ts`, `selfLearningService.ts`, `nlpService.ts`, `contextAwareService.ts`, `automationSuggestionEngine.ts`, `backend/src/config/aiSettings.ts`

---

## 4. Marketing & Campaigns

> End-to-end campaign execution across email, SMS, and push channels with behavioral targeting.

| Feature                         | Description                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| **Campaign Management**         | Create, schedule, and track multi-channel marketing campaigns                        |
| **Campaign Builder (UI)**       | Visual campaign builder at `frontend/src/pages/marketing/CampaignBuilder.tsx`        |
| **Email Campaigns**             | Templated HTML emails; provider routing via channels config                          |
| **SMS Campaigns**               | Bulk SMS delivery via `smsService`                                                   |
| **Push Notification Campaigns** | Web push blast via `pushNotificationService`                                         |
| **Customer Behavior Tracking**  | Middleware captures page views, product views, cart events, form interactions        |
| **Behavioral Trigger Rules**    | Event-driven rules: page view, product view, add-to-cart, cart abandonment, and more |
| **Retargeting Engine**          | Re-engages churned or inactive customers via `RetargetingEngine` service             |
| **A/B Testing**                 | Split URL and campaign variants; statistical winner detection                        |
| **Customer Segmentation**       | Audience builder for precise campaign targeting                                      |
| **Lead Scoring Integration**    | Segment audiences by computed lead score                                             |
| **Campaign Analytics**          | Open rates, click-throughs, conversions tracked per campaign                         |
| **AI-Optimized Campaigns**      | `AIOptimizer` tunes send times, subject lines, and content via ML                    |

**Key files:** `backend/src/controllers/appControllers/campaignController/`, `BehaviorController.ts`, `RetargetingController.ts`, `backend/src/services/CampaignExecutor.ts`, `backend/src/config/triggers.ts`, `backend/src/config/channels.ts`

---

## 5. Workflow Automation Engine

> Visual, event-driven automation with native node designer and enterprise n8n integration.

| Feature                          | Description                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Visual Workflow Designer**     | React-based drag-and-drop node canvas at `WorkflowDesigner.tsx`                                                                                                     |
| **Node Types**                   | Trigger, HTTP Request, Data Transform, Condition, Delay, Email, Webhook, Database, Custom Script, Notification, File Operation, Data Validation, Loop, Merge, Split |
| **Workflow Execution Tracking**  | `WorkflowExecution` model stores run history, status, and output per node                                                                                           |
| **Trigger Rule Engine**          | Configurable event rules fire workflows on behavioral or time conditions                                                                                            |
| **Business Process Engine**      | Multi-step process definitions with stage tracking                                                                                                                  |
| **Reminder Scheduler**           | `reminderScheduler` uses cron to dispatch automated reminders                                                                                                       |
| **Follow-Up Automation**         | Auto-creates follow-up tasks from trigger and journey events                                                                                                        |
| **Automation Suggestion Engine** | AI surfaces candidate rules based on pattern analysis                                                                                                               |
| **n8n Integration**              | Enterprise tier bridges to a self-hosted n8n instance for advanced pipelines                                                                                        |

**Key files:** `backend/src/models/appModels/EnhancedWorkflow.ts`, `WorkflowExecution.ts`, `backend/src/controllers/appControllers/workflowController/`, `businessProcessController.ts`, `triggerRuleController/`, `backend/src/services/reminderScheduler.ts`, `frontend/src/pages/WorkflowBuilder/`

---

## 6. Social Media & Reputation Management

> Unified social publishing, monitoring, and review/reputation control across platforms.

### 6a. Social Media

| Feature                          | Description                                                          |
| -------------------------------- | -------------------------------------------------------------------- |
| **Account Management**           | Connect and manage Facebook, Twitter/X, and Instagram accounts       |
| **Post Scheduling & Publishing** | Compose and schedule posts across platforms via `socialMediaService` |
| **Social Campaign Management**   | Multi-platform campaign coordination                                 |
| **Social Mention Monitoring**    | Tracks brand mentions across connected platforms                     |
| **Social Analytics**             | Engagement metrics, follower growth, post performance                |
| **AI Social Content Generation** | `socialAIService` drafts captions, hashtags, and replies             |
| **Public Social Routes**         | Webhook receivers for platform callbacks                             |

### 6b. Reputation Management

| Feature                          | Description                                                                        |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| **Review Aggregation**           | Pulls reviews from Google (`googleReviews.ts`) and Facebook (`facebookReviews.ts`) |
| **Review Monitoring**            | Continuous watch for new reviews via `reviewMonitoringService`                     |
| **Review Request Automation**    | Sends post-interaction review requests via `reviewRequestService`                  |
| **Review Response Automation**   | AI-generated draft responses via `autoResponseService`                             |
| **Review Analytics & Sentiment** | Rating distribution, platform breakdown, sentiment scoring                         |
| **Reputation Portal**            | Public-facing page aggregating all verified reviews                                |
| **Review Templates**             | Reusable response templates per review type and rating                             |

**Key files:** `backend/src/integration/googleReviews.ts`, `facebookReviews.ts`, `backend/src/services/reviewAggregationService.ts`, `reviewAnalyticsService.ts`, `socialMediaService.ts`, `socialAIService.ts`, `frontend/src/pages/SocialMedia/`, `frontend/src/pages/Reputation/`

---

## 7. Analytics & Business Intelligence

> Cross-module data aggregation, real-time KPIs, predictive modelling, and custom reporting.

| Feature                        | Description                                                                              |
| ------------------------------ | ---------------------------------------------------------------------------------------- |
| **Global KPI Dashboard**       | Single dashboard aggregating metrics from all modules                                    |
| **Real-Time Analytics**        | Live event stream displayed via WebSocket-backed widgets                                 |
| **Predictive Analytics**       | Forecast pages powered by `predictiveService` (churn, revenue, conversion)               |
| **URL Click Analytics**        | Geo-location (geoip-lite), device/browser (ua-parser-js), referrer, UTM params per click |
| **Survey Analytics**           | Response rates, completion funnels, answer distributions                                 |
| **Review Analytics**           | Rating trends, sentiment distribution, response rate KPIs                                |
| **Social Analytics**           | Post-level and account-level engagement data                                             |
| **A/B Test Analytics**         | Variant impressions, conversions, statistical significance                               |
| **Campaign Analytics**         | Delivery, open, click, and conversion metrics per campaign                               |
| **Custom Report Builder**      | User-defined report at `frontend/src/pages/Analytics/CustomReportBuilder.tsx`            |
| **Cross-Module Comparison**    | Side-by-side KPI comparison across any two modules                                       |
| **AI Suggestions (Analytics)** | AI surfaces actionable insights from data anomalies                                      |
| **Analytics Data Export**      | CSV/XLSX export of any analytics dataset                                                 |

**Key files:** `backend/src/controllers/appControllers/AnalyticsController.ts`, `globalAnalyticsController/`, `urlAnalyticsService.ts`, `reviewAnalyticsService.ts`, `statisticsController/`, `frontend/src/pages/Analytics/`

---

## 8. Communication & Engagement

> Customer-facing chat, URL management, surveys, and multi-channel notification delivery.

### 8a. Customer Live Chat

| Feature                    | Description                                                                  |
| -------------------------- | ---------------------------------------------------------------------------- |
| **Embeddable Chat Widget** | Customer-side chat interface (`CustomerChatInterface.tsx`, `chatUrlService`) |
| **Chat Queue Management**  | Inbound queue with agent assignment via `chatQueueService`                   |
| **Real-Time Messaging**    | Socket.IO chat socket (`chatSocket.ts`)                                      |
| **Chat History**           | `ChatMessage` and `ChatRoom` models persist full conversation history        |
| **Agent-Side Chat**        | Internal agent UI at `frontend/src/pages/Chat/`                              |

### 8b. URL Shortener & Tracker

| Feature                     | Description                                                       |
| --------------------------- | ----------------------------------------------------------------- |
| **URL Shortening**          | Generate short codes; `urlRedirectController` handles redirects   |
| **Password-Protected URLs** | Optional access password per short link                           |
| **CRM-Linked URLs**         | Associate links with customer records for attribution             |
| **URL A/B Testing**         | Split test two destination URLs; track winner                     |
| **Click Analytics**         | Per-click geo, device, referrer, UTM; unique vs. repeat detection |

### 8c. Surveys

| Feature                   | Description                                               |
| ------------------------- | --------------------------------------------------------- |
| **Survey Builder**        | Create multi-question surveys with various question types |
| **Public Survey Sharing** | `publicSurveyRoutes` serve unauthenticated survey pages   |
| **Survey Responses**      | `SurveyResponse` model; response collection and storage   |
| **Survey Analytics**      | Completion rates, per-question breakdown                  |

### 8d. Notifications

| Feature                  | Description                                                          |
| ------------------------ | -------------------------------------------------------------------- |
| **In-App Notifications** | `notificationSocket.ts` pushes real-time alerts to connected clients |
| **Email Notifications**  | Template-driven transactional emails (`emailService`)                |
| **SMS Notifications**    | Outbound SMS via `smsService`                                        |
| **Push Notifications**   | Web push via `pushNotificationService`                               |

**Key files:** `backend/src/sockets/chatSocket.ts`, `notificationSocket.ts`, `backend/src/services/chatQueueService.ts`, `urlAnalyticsService.ts`, `urlService.ts`, `backend/src/routes/publicSurveyRoutes.ts`, `frontend/src/pages/URL/`, `frontend/src/pages/Surveys/`

---

## 9. Document Management & Compliance

> Collaborative document lifecycle with version control, e-signatures, and regulatory compliance tracking.

| Feature                       | Description                                                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Document Management**       | Create, read, update, delete documents; rich text editor (`DocumentEditor.tsx`)                                      |
| **Public Document Share**     | Unauthenticated shareable document links (`documentPublicRoutes`)                                                    |
| **Document Version Control**  | `DocumentVersion` model; full revision history                                                                       |
| **Document Audit Trail**      | `DocumentAudit` model logs every view, edit, and access                                                              |
| **E-Signatures**              | Electronic signature capture and storage on documents                                                                |
| **Document Compliance**       | GDPR, HIPAA, and custom regulation checks per document; status: compliant / non-compliant / review required / exempt |
| **GDPR Consent Management**   | `consentRecordModel` stores opt-in/opt-out records                                                                   |
| **Data Retention Policies**   | `dataRetentionPolicyModel` enforces automated data lifecycle rules                                                   |
| **GDPR Export & Deletion**    | On-demand personal data export and right-to-erasure flows                                                            |
| **Audit Trail (System-Wide)** | `auditTrailModel` tracks administrative and sensitive actions across the platform                                    |
| **SSO / SAML**                | Enterprise single sign-on integration                                                                                |
| **Compliance Reporting**      | Summary reports of compliance status across all documents                                                            |

**Key files:** `backend/src/models/appModels/DocumentCompliance.ts`, `DocumentVersion.ts`, `DocumentAudit.ts`, `consentRecordModel.ts`, `dataRetentionPolicyModel.ts`, `auditTrailModel.ts`, `frontend/src/pages/Document/`, `frontend/src/components/DocumentCompliance/`

---

## 10. Admin, Billing & Access Control

> Multi-tier SaaS licensing, plan gating, onboarding, and platform administration.

| Feature                        | Description                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| **Admin Authentication**       | Separate admin login flow (`adminAuth`) with elevated privilege scope                  |
| **User Management**            | CRUD on user accounts; role and permission assignment                                  |
| **Settings Management**        | `settingController` manages global and per-user configuration                          |
| **Company / Business Profile** | `Business` model; company metadata, branding                                           |
| **Onboarding Flow**            | Guided initial company setup (`InitialCompanySetup.tsx`, `Onboarding/`)                |
| **Subscription Management**    | Starter / Professional / Enterprise tiers; `Subscription` model                        |
| **Plan-Based Feature Gating**  | `featureMap.ts` is single source of truth; `PlanGating` component enforces on frontend |
| **Plan Limits**                | Hard caps: users (10 / 50 / unlimited), workflow rules (10 / unlimited / unlimited)    |
| **Full API Access**            | REST + GraphQL API access unlocked at Professional tier                                |
| **Webhook API Access**         | Outbound webhook event delivery unlocked at Enterprise tier                            |
| **Custom Branding**            | White-label branding per business at Enterprise tier                                   |
| **Personal Account Manager**   | Dedicated support contact at Enterprise tier                                           |
| **SSO / SAML**                 | Enterprise single sign-on (also listed under Compliance)                               |

**Key files:** `backend/src/controllers/coreControllers/`, `backend/src/config/featureMap.ts`, `frontend/src/components/PlanGating/`, `frontend/src/pages/Subscription/`, `frontend/src/pages/Onboarding/`

---

## 11. Feature Dependencies Map

```
Core Infrastructure (Auth, DB, API, Sockets, Email/SMS/Push)
    │
    ├── CRM & Sales
    │       └──► AI Suite (lead scoring, task prioritization, predictions)
    │       └──► Analytics (interaction data, revenue KPIs)
    │       └──► Workflow Automation (follow-ups, reminders)
    │       └──► Communication (chat, notifications)
    │
    ├── AI Suite
    │       └──► All modules consume AI services (NLP, sentiment, predictions)
    │       └──► Self-Learning feeds back from ALL interactions
    │
    ├── Marketing & Campaigns
    │       └──► CRM (customer data, segmentation, lead scores)
    │       └──► AI Suite (campaign optimization, content generation)
    │       └──► Communication (email/SMS/push delivery channels)
    │       └──► Analytics (campaign performance metrics)
    │       └──► Workflow Automation (trigger rules fire campaigns)
    │
    ├── Workflow Automation
    │       └──► All modules (can read/write any entity as workflow action)
    │       └──► AI Suite (automation suggestions, AI action nodes)
    │       └──► n8n (enterprise external orchestration)
    │
    ├── Social Media & Reputation
    │       └──► AI Suite (social content generation, response drafting, sentiment)
    │       └──► Analytics (social KPIs, review analytics)
    │       └──► Communication (notification when new review/mention arrives)
    │
    ├── Analytics & BI
    │       └──► All modules (aggregates data from every domain)
    │       └──► AI Suite (anomaly detection, predictive models, AI insights)
    │
    ├── Communication & Engagement
    │       └──► CRM (linked to customer records)
    │       └──► URL Shortener → Analytics (click tracking)
    │       └──► Surveys → Analytics (response analytics)
    │
    ├── Document Management & Compliance
    │       └──► Admin (user/role access control)
    │       └──► AI Suite (OCR extraction, compliance checks)
    │       └──► Audit Trail (system-wide)
    │
    └── Admin, Billing & Access Control  ←── gates ALL premium features
```

---

## 12. Tier Access Matrix

| Feature Category           | Starter | Professional | Enterprise |
| -------------------------- | :-----: | :----------: | :--------: |
| Core CRM & Invoicing       |   ✅    |      ✅      |     ✅     |
| Lead Scoring               |    —    |      ✅      |     ✅     |
| Customer Journey Tracking  |    —    |      ✅      |     ✅     |
| Recurring Billing          |    —    |      ✅      |     ✅     |
| E-Signatures               |    —    |      ✅      |     ✅     |
| AI Suite (Base)            |    —    |      ✅      |     ✅     |
| AI Knowledge Base          |    —    |      —       |     ✅     |
| AI Anomaly Detection       |    —    |      —       |     ✅     |
| AI Self-Learning           |    —    |      —       |     ✅     |
| Campaign Management        |    —    |      ✅      |     ✅     |
| A/B Testing                |    —    |      ✅      |     ✅     |
| Retargeting Engine         |    —    |      ✅      |     ✅     |
| Social Media Management    |    —    |      ✅      |     ✅     |
| Social Mention Monitoring  |    —    |      —       |     ✅     |
| Review Aggregation         |    —    |      —       |     ✅     |
| Review Response Automation |    —    |      —       |     ✅     |
| Reputation Portal          |    —    |      —       |     ✅     |
| Global KPI Dashboard       |    —    |      ✅      |     ✅     |
| Real-Time Analytics        |    —    |      ✅      |     ✅     |
| Cross-Module Comparison    |    —    |      —       |     ✅     |
| Analytics Data Export      |    —    |      —       |     ✅     |
| Workflow Trigger Rules     |    —    |      ✅      |     ✅     |
| Business Process Engine    |    —    |      ✅      |     ✅     |
| n8n Enterprise Workflows   |    —    |      —       |     ✅     |
| Automation Suggestions     |    —    |      —       |     ✅     |
| Customer Live Chat         |    —    |      ✅      |     ✅     |
| SMS & Push Notifications   |    —    |      ✅      |     ✅     |
| URL Shortening (unlimited) |    —    |      ✅      |     ✅     |
| Password-Protected URLs    |    —    |      ✅      |     ✅     |
| Unlimited Surveys          |    —    |      ✅      |     ✅     |
| Advanced Audit Trail       |    —    |      ✅      |     ✅     |
| GDPR Consent & Retention   |    —    |      —       |     ✅     |
| Compliance Reporting       |    —    |      —       |     ✅     |
| SSO / SAML                 |    —    |      —       |     ✅     |
| Custom Branding            |    —    |      —       |     ✅     |
| Full API Access            |    —    |      ✅      |     ✅     |
| Webhook API Access         |    —    |      —       |     ✅     |

---

## Resume — 5-Point Project Summary

> **ERPjs** — Full-Stack AI-Powered ERP & Business Automation Platform  
> _Node.js · TypeScript · React · GraphQL · MongoDB · Socket.IO · OpenAI_

1. **Architected a multi-module ERP platform** covering CRM, invoicing, project management, document control, and recurring billing, serving three subscription tiers (Starter / Professional / Enterprise) with a centralized feature-gating system enforced at both API and UI layers.

2. **Built a multi-provider AI suite** integrating OpenAI GPT-4, Google Vertex AI, Azure OpenAI, and Hugging Face; delivered contextual AI assistants, NLP-based sentiment analysis, predictive churn/revenue models, anomaly detection, and a self-learning feedback loop that continuously improves response quality from user interactions.

3. **Engineered a visual workflow automation engine** with a drag-and-drop node designer (15+ node types), a behavioral trigger rule system, a business process engine, and enterprise-grade n8n orchestration integration — enabling no-code automation of cross-module business processes.

4. **Developed a full marketing intelligence stack** including multi-channel campaign execution (email/SMS/push), behavioral event-driven retargeting, A/B testing with statistical analysis, customer segmentation, AI-optimized send-time and content recommendations, and a URL shortener with geo/device/UTM click analytics.

5. **Implemented social media management and reputation control** with unified publishing across Facebook, Twitter/X, and Instagram; automated review aggregation from Google and Facebook; AI-generated review responses; real-time mention monitoring; and a cross-platform sentiment analytics dashboard surfaced through a global KPI reporting layer.
