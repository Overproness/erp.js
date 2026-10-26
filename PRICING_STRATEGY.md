# ERPjs Pricing Strategy & Feature Allocation

## Step 1: Feature Mapping & Taxonomy

### Category 1 — Core Infrastructure

| Feature                  | Description                                             | Dependencies   |
| ------------------------ | ------------------------------------------------------- | -------------- |
| Authentication & SSO     | Login, register, JWT tokens, password recovery          | None           |
| User Management          | User CRUD, profiles, permissions                        | Authentication |
| Settings & Configuration | System settings, company setup, tax/payment mode config | Authentication |
| File Storage & Uploads   | File upload (50MB), static serving, download handling   | Authentication |
| Health Monitoring        | Health check endpoint, uptime tracking                  | None           |
| Real-time WebSockets     | Live notifications, chat sockets                        | Authentication |

### Category 2 — CRM & Sales

| Feature                   | Description                                                 | Dependencies                  |
| ------------------------- | ----------------------------------------------------------- | ----------------------------- |
| Contact Management        | Client CRUD, bulk operations, search, filter                | Core Infrastructure           |
| Lead Scoring              | AI-powered lead scoring and recalculation                   | Contact Management, AI Suite  |
| Customer Segmentation     | Segment creation, member management, auto-refresh           | Contact Management            |
| Customer Journey Tracking | Journey initialization, stage transitions, analytics        | Contact Management, Analytics |
| Customer Follow-ups       | Follow-up scheduling, completion tracking, per-client views | Contact Management            |
| Appointments & Scheduling | Appointment CRUD, date-range queries, cancel/reschedule     | Contact Management            |

### Category 3 — Finance & Billing

| Feature           | Description                                               | Dependencies       |
| ----------------- | --------------------------------------------------------- | ------------------ |
| Invoicing         | Invoice CRUD, bulk operations, search, filter, summary    | Contact Management |
| Quoting           | Quote CRUD, email delivery, bulk send, convert-to-invoice | Contact Management |
| Payments          | Payment CRUD, bulk operations, payment mode management    | Invoicing          |
| Tax Management    | Tax CRUD, default tax settings                            | Finance base       |
| Payment Modes     | Payment method configuration                              | Finance base       |
| Recurring Billing | Recurring invoice history and automation                  | Invoicing          |

### Category 4 — Operations & Productivity

| Feature             | Description                                             | Dependencies        |
| ------------------- | ------------------------------------------------------- | ------------------- |
| Task Management     | Task CRUD, bulk ops, delegation, reassignment, comments | Core Infrastructure |
| Project Management  | Project CRUD, task association                          | Task Management     |
| Document Management | Upload, versioning, content extraction, search          | Core Infrastructure |
| Document Sharing    | Public share URLs, password protection, short codes     | Document Management |
| E-Signatures        | Digital signing of documents                            | Document Management |
| Document Compliance | Compliance records, audit trails per document           | Document Management |
| Reminders           | Automated reminders, scheduling                         | Core Infrastructure |

### Category 5 — AI & Intelligence

| Feature                          | Description                                                      | Dependencies                      |
| -------------------------------- | ---------------------------------------------------------------- | --------------------------------- |
| AI Assistant (Conversations)     | Multi-turn AI conversations, context-aware responses             | Core Infrastructure               |
| AI Content Generation            | Email drafting, text generation, tone control                    | AI Assistant                      |
| AI Text Analysis & Summarization | Sentiment analysis, text summarization, translation              | AI Assistant                      |
| AI Copilot                       | Contextual suggestions, prompt-based actions, session management | AI Assistant                      |
| AI Knowledge Base                | Knowledge articles, semantic search, bulk import, reindexing     | AI Assistant                      |
| AI Document Processing           | Document classification, entity extraction, anomaly detection    | Document Management, AI Assistant |
| AI Enhanced Analytics            | AI-driven insights, recommendations, forecasting, auto-tagging   | Analytics, AI Assistant           |
| AI Lead Scoring                  | ML-powered lead scoring with feedback loop                       | CRM, AI Assistant                 |
| AI Task Prioritization           | Automatic task priority assignment                               | Task Management, AI Assistant     |
| Predictive Analytics             | Trend prediction, pattern recognition                            | Analytics, AI Assistant           |
| AI Preferences & Multi-Provider  | OpenAI / Claude / Gemini provider switching, model selection     | Settings                          |
| Self-Learning Engine             | Self-improving models, feedback recording                        | AI Assistant                      |
| OCR & Data Extraction            | Image/PDF text extraction, batch processing                      | AI Assistant                      |

### Category 6 — Marketing & Campaigns

| Feature                     | Description                                                      | Dependencies                   |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------ |
| Campaign Management         | Campaign CRUD, launch/pause/resume/stop, scheduling, duplication | Contact Management             |
| Campaign Analytics          | Per-campaign analytics, report generation                        | Campaign Management, Analytics |
| A/B Testing                 | Test creation, start/stop, winner declaration                    | Campaign Management            |
| Retargeting Engine          | Retargeting campaigns, launch/pause/stop, analytics              | Campaign Management            |
| Email Campaigns             | Email template sending, bulk delivery                            | Campaign Management            |
| Behavior Tracking           | Page views, API interactions, custom events                      | Core Infrastructure            |
| Customer Behavior Analytics | Behavioral data processing, analytics dashboard                  | Behavior Tracking              |

### Category 7 — Social Media & Reputation

| Feature                      | Description                                              | Dependencies                                   |
| ---------------------------- | -------------------------------------------------------- | ---------------------------------------------- |
| Social Account Management    | Connect Facebook, Instagram, Twitter accounts            | Core Infrastructure                            |
| Social Post Scheduling       | Create, schedule, bulk-schedule, publish posts           | Social Account Management                      |
| Social Campaign Management   | Social-specific campaign CRUD, launch                    | Social Account Management, Campaign Management |
| Social Analytics             | Per-account analytics, engagement overview               | Social Account Management                      |
| Social Mention Monitoring    | Mention tracking, filtering                              | Social Account Management                      |
| Review Aggregation           | Multi-platform review collection (Google, Facebook)      | Core Infrastructure                            |
| Review Response Automation   | Auto-respond to reviews, templates, bulk status updates  | Review Aggregation                             |
| Review Analytics & Sentiment | Sentiment analysis by platform, review analytics summary | Review Aggregation, AI Suite                   |
| Review Request Automation    | Send review requests via templates to clients            | Review Aggregation, Contact Management         |
| Reputation Portal            | Public review portal with branded links                  | Review Aggregation                             |

### Category 8 — Workflow Automation

| Feature                      | Description                                              | Dependencies              |
| ---------------------------- | -------------------------------------------------------- | ------------------------- |
| Basic Workflows              | Workflow CRUD, simple step-based automation              | Core Infrastructure       |
| Trigger Rules                | Event-based triggers, activate/deactivate, test          | Workflows                 |
| Business Processes           | Multi-step business process management, step advancement | Workflows                 |
| Workflow Execution Tracking  | Execution history, status monitoring                     | Workflows                 |
| n8n Workflow Engine          | Full visual workflow builder, 400+ integrations          | Enterprise infrastructure |
| Automation Suggestion Engine | AI-suggested automations based on usage patterns         | Workflows, AI Suite       |

### Category 9 — Analytics & Reporting

| Feature                        | Description                                                                | Dependencies        |
| ------------------------------ | -------------------------------------------------------------------------- | ------------------- |
| Dashboard Statistics           | Overview stats for all modules                                             | Core Infrastructure |
| Module-Level Statistics        | Client, invoice, quote, payment, task, team, document, workflow, tax stats | Respective modules  |
| Analytics Overview & Dashboard | Revenue, clients, conversion, engagement, trends                           | Core Infrastructure |
| Global Analytics               | KPI tracking, cross-module comparison, data export, real-time dashboard    | Analytics           |
| URL Analytics                  | Click tracking, analytics per URL                                          | URL Management      |

### Category 10 — Communication

| Feature              | Description                                                    | Dependencies        |
| -------------------- | -------------------------------------------------------------- | ------------------- |
| In-App Notifications | Create, read, mark-read, bulk operations, real-time push       | Core Infrastructure |
| Internal Chat        | Chat rooms, messages, editing, deletion, mark-read             | Core Infrastructure |
| Customer Live Chat   | Public chat rooms via token, room management, archiving, stats | Contact Management  |
| Email Service        | Transactional emails, templates                                | Core Infrastructure |
| SMS Service          | SMS messaging                                                  | Core Infrastructure |
| Push Notifications   | Browser/mobile push                                            | Core Infrastructure |

### Category 11 — URLs & Link Management

| Feature                 | Description                                            | Dependencies        |
| ----------------------- | ------------------------------------------------------ | ------------------- |
| URL Shortening          | Create short URLs, custom codes, bulk create           | Core Infrastructure |
| QR Code Generation      | QR codes for shortened URLs                            | URL Shortening      |
| Click Analytics         | Click history, analytics per URL                       | URL Shortening      |
| Password-Protected URLs | Password gate for sensitive links                      | URL Shortening      |
| CRM URLs                | Entity-linked URLs, per-entity analytics, deactivation | URL Shortening, CRM |

### Category 12 — Compliance & Security

| Feature                            | Description                                                     | Dependencies        |
| ---------------------------------- | --------------------------------------------------------------- | ------------------- |
| Audit Trail                        | Full audit logging, per-entity/per-user trails, search, reports | Core Infrastructure |
| Consent Management                 | GDPR consent records, grant/revoke tracking                     | Core Infrastructure |
| Data Retention Policies            | Policy CRUD, automated execution                                | Core Infrastructure |
| GDPR Data Export/Deletion          | User data export, right-to-erasure                              | Consent Management  |
| Compliance Reporting               | Cross-module compliance reports                                 | Audit Trail         |
| Input Sanitization & Rate Limiting | XSS prevention, brute-force protection                          | Core Infrastructure |

### Category 13 — Surveys & Feedback

| Feature                    | Description                             | Dependencies        |
| -------------------------- | --------------------------------------- | ------------------- |
| Survey Builder             | Survey CRUD, publish/close lifecycle    | Core Infrastructure |
| Public Survey Links        | Short-code access, partial save, submit | Survey Builder      |
| Survey Analytics           | Response analytics per survey           | Survey Builder      |
| Survey Response Management | Response listing, reading, deletion     | Survey Builder      |

---

## Step 2: Tier Allocation Strategy

### Tier Overview

|            | **Starter**                          | **Professional**          | **Enterprise (Default)**          |
| ---------- | ------------------------------------ | ------------------------- | --------------------------------- |
| **Target** | Small teams / Freelancers / Startups | Growing SMBs / Mid-market | Everyone / Full platform access   |
| **Price**  | $0/mo (Free Forever)                 | $0/mo (Free Forever)      | $0/mo (Free Forever)              |
| **Users**  | Unlimited                            | Unlimited                 | Unlimited                         |
| **Trial**  | None required (Instant Free Access)  | None (Instant Free)       | None (Instant Free Forever)       |

### Allocation & Compute Policy

**100% Free Highest-Tier Model:**
All organizations automatically receive full access to the Enterprise plan for free. All CRM, invoicing, project management, marketing campaigns, AI Copilot, and native visual workflow tools are completely unlocked at $0/month with no credit card required.

**Compute-Allocated n8n Integration:**
Native workflow builder, trigger rules, and business process automation are 100% free with unlimited workflow executions. External n8n visual pipelines run in dedicated Docker container instances which consume heavy server cluster compute. Because compute resources are limited, n8n instances are allocated to organizations on-demand subject to cluster compute availability.

### Value & Compute Allocation

| Lever                   | Platform Core & AI                                                                 | n8n Visual Pipeline Orchestration                                                           |
| ----------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Availability**        | 100% Free & instant for all users                                                  | Provisioned on-demand based on cluster compute availability                                 |
| **AI Intelligence**     | Full AI Suite (Assistant, Copilot, content gen, lead scoring, predictions)        | External orchestration nodes connectable to n8n pipelines                                   |
| **Workflow Automation** | Unlimited native rules + visual trigger engine + A/B testing                       | Dedicated multi-tenant n8n container instances (400+ external integrations)                 |
| **Users**               | Unlimited users across all accounts                                                | Multi-tenant per-organization workspace                                                     |
| **Data & Compliance**   | Full GDPR compliance + consent management + audit logs + data export               | Isolated container database environment                                                     |

---

## Step 3: Feature Comparison Matrix

> Drop this directly into the frontend pricing page component.

### CRM & Sales

| Feature                   | Starter | Professional | Enterprise |
| ------------------------- | ------- | ------------ | ---------- |
| Contact Management        | ✓       | ✓            | ✓          |
| Client Search & Filtering | ✓       | ✓            | ✓          |
| Bulk Import / Export      | ✓       | ✓            | ✓          |
| Appointments & Scheduling | ✓       | ✓            | ✓          |
| Lead Scoring (AI)         | —       | ✓            | ✓          |
| Customer Segmentation     | —       | ✓            | ✓          |
| Customer Journey Tracking | —       | ✓            | ✓          |
| Follow-up Automation      | —       | ✓            | ✓          |

### Finance & Billing

| Feature                     | Starter | Professional | Enterprise |
| --------------------------- | ------- | ------------ | ---------- |
| Invoicing & Quoting         | ✓       | ✓            | ✓          |
| Payments & Payment Modes    | ✓       | ✓            | ✓          |
| Tax Management              | ✓       | ✓            | ✓          |
| Quote-to-Invoice Conversion | ✓       | ✓            | ✓          |
| Bulk Email Quotes           | —       | ✓            | ✓          |
| Recurring Billing           | —       | ✓            | ✓          |
| PDF Generation & Download   | ✓       | ✓            | ✓          |

### Operations & Productivity

| Feature                     | Starter | Professional | Enterprise |
| --------------------------- | ------- | ------------ | ---------- |
| Task Management             | ✓       | ✓            | ✓          |
| Project Management          | ✓       | ✓            | ✓          |
| Document Management         | ✓       | ✓            | ✓          |
| Document Versioning         | ✓       | ✓            | ✓          |
| Document Sharing & Links    | ✓       | ✓            | ✓          |
| E-Signatures                | —       | ✓            | ✓          |
| Document Compliance & Audit | —       | —            | ✓          |
| Automated Reminders         | ✓       | ✓            | ✓          |
| AI Task Prioritization      | —       | ✓            | ✓          |

### Workflow Automation

| Feature                     | Starter  | Professional | Enterprise |
| --------------------------- | -------- | ------------ | ---------- |
| Automated Rules             | Up to 10 | Unlimited    | Unlimited  |
| Trigger Rules               | —        | ✓            | ✓          |
| Business Process Engine     | —        | ✓            | ✓          |
| Workflow Execution Tracking | ✓        | ✓            | ✓          |
| n8n Visual Workflow Builder | —        | —            | ✓          |
| Automation Suggestions (AI) | —        | —            | ✓          |

### Artificial Intelligence

| Feature                                    | Starter | Professional | Enterprise |
| ------------------------------------------ | ------- | ------------ | ---------- |
| AI Assistant                               | —       | Standard     | Advanced   |
| AI Copilot                                 | —       | ✓            | ✓          |
| AI Content Generation                      | —       | ✓            | ✓          |
| AI Text Summarization                      | —       | ✓            | ✓          |
| AI Translation                             | —       | ✓            | ✓          |
| AI Document Tagging                        | —       | ✓            | ✓          |
| OCR & Data Extraction                      | —       | ✓            | ✓          |
| AI Sentiment Analysis                      | —       | ✓            | ✓          |
| AI Knowledge Base                          | —       | —            | ✓          |
| Predictive Analytics                       | —       | ✓            | ✓          |
| AI Anomaly Detection                       | —       | —            | ✓          |
| Multi-Provider AI (OpenAI, Claude, Gemini) | —       | —            | ✓          |
| Self-Learning Engine                       | —       | —            | ✓          |

### Marketing & Campaigns

| Feature                     | Starter | Professional | Enterprise |
| --------------------------- | ------- | ------------ | ---------- |
| Campaign Management         | —       | ✓            | ✓          |
| Campaign Analytics          | —       | ✓            | ✓          |
| Email Campaigns             | —       | ✓            | ✓          |
| A/B Testing                 | —       | ✓            | ✓          |
| Retargeting Engine          | —       | ✓            | ✓          |
| Behavior Tracking           | Basic   | Advanced     | Advanced   |
| Customer Behavior Analytics | —       | ✓            | ✓          |

### Social Media & Reputation

| Feature                      | Starter | Professional | Enterprise |
| ---------------------------- | ------- | ------------ | ---------- |
| Social Account Management    | —       | Up to 5      | Unlimited  |
| Social Post Scheduling       | —       | ✓            | ✓          |
| Social Campaign Management   | —       | ✓            | ✓          |
| Social Analytics             | —       | ✓            | ✓          |
| Social Mention Monitoring    | —       | —            | ✓          |
| Review Aggregation           | —       | —            | ✓          |
| Review Response Automation   | —       | —            | ✓          |
| Review Analytics & Sentiment | —       | —            | ✓          |
| Review Request Automation    | —       | —            | ✓          |
| Public Reputation Portal     | —       | —            | ✓          |

### Analytics & Reporting

| Feature                 | Starter | Professional | Enterprise |
| ----------------------- | ------- | ------------ | ---------- |
| Dashboard Statistics    | ✓       | ✓            | ✓          |
| Module-Level Stats      | ✓       | ✓            | ✓          |
| Revenue Analytics       | Basic   | Advanced     | Advanced   |
| Global KPI Dashboard    | —       | ✓            | ✓          |
| Real-time Analytics     | —       | ✓            | ✓          |
| Analytics Data Export   | —       | —            | ✓          |
| Cross-Module Comparison | —       | —            | ✓          |
| URL Click Analytics     | ✓       | ✓            | ✓          |

### Communication

| Feature              | Starter | Professional | Enterprise |
| -------------------- | ------- | ------------ | ---------- |
| In-App Notifications | ✓       | ✓            | ✓          |
| Internal Team Chat   | ✓       | ✓            | ✓          |
| Email Notifications  | ✓       | ✓            | ✓          |
| Customer Live Chat   | —       | ✓            | ✓          |
| SMS Notifications    | —       | ✓            | ✓          |
| Push Notifications   | —       | ✓            | ✓          |

### URLs & Link Management

| Feature                  | Starter  | Professional | Enterprise |
| ------------------------ | -------- | ------------ | ---------- |
| URL Shortening           | Up to 50 | Unlimited    | Unlimited  |
| QR Code Generation       | ✓        | ✓            | ✓          |
| Click Tracking           | ✓        | ✓            | ✓          |
| Password-Protected Links | —        | ✓            | ✓          |
| CRM-Linked URLs          | —        | ✓            | ✓          |

### Surveys & Feedback

| Feature                    | Starter        | Professional | Enterprise |
| -------------------------- | -------------- | ------------ | ---------- |
| Survey Builder             | Up to 3 active | Unlimited    | Unlimited  |
| Public Survey Links        | ✓              | ✓            | ✓          |
| Survey Analytics           | Basic          | Advanced     | Advanced   |
| Survey Response Management | ✓              | ✓            | ✓          |

### Compliance & Security

| Feature                                       | Starter | Professional | Enterprise |
| --------------------------------------------- | ------- | ------------ | ---------- |
| Basic Audit Trail                             | ✓       | ✓            | ✓          |
| Advanced Audit (per-entity, per-user, search) | —       | ✓            | ✓          |
| Consent Management (GDPR)                     | —       | —            | ✓          |
| Data Retention Policies                       | —       | —            | ✓          |
| GDPR Data Export / Deletion                   | —       | —            | ✓          |
| Compliance Reporting                          | —       | —            | ✓          |
| SSO / SAML                                    | —       | —            | ✓          |
| Custom Branding (White-label)                 | —       | —            | ✓          |

### Support

| Feature                  | Starter      | Professional | Enterprise      |
| ------------------------ | ------------ | ------------ | --------------- |
| Email Support            | 48h response | 12h response | 1h SLA          |
| Knowledge Base Access    | ✓            | ✓            | ✓               |
| Onboarding Assistance    | —            | ✓            | ✓               |
| Personal Account Manager | —            | —            | ✓               |
| Custom Training Sessions | —            | —            | ✓               |
| API Access               | Read-only    | Full         | Full + Webhooks |
