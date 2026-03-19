# Comprehensive Migration Plan: REST → GraphQL + JavaScript → TypeScript

> **Project**: Quickmation (ERP/CRM Suite)  
> **Created**: March 19, 2026  
> **Scope**: Full-stack migration — Backend REST to GraphQL, JavaScript to TypeScript, Redux overhaul  
> **Approach**: One route at a time — never move forward without completing the current replacement

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture Map](#2-current-architecture-map)
3. [Target Architecture](#3-target-architecture)
4. [Pre-Migration Setup (Phase 0)](#4-pre-migration-setup-phase-0)
5. [Phase 1: TypeScript Foundation](#5-phase-1-typescript-foundation)
6. [Phase 2: GraphQL Schema Expansion](#6-phase-2-graphql-schema-expansion)
7. [Phase 3: Redux Overhaul + Apollo Client Migration](#7-phase-3-redux-overhaul--apollo-client-migration)
8. [Phase 4: REST Route-by-Route Replacement](#8-phase-4-rest-route-by-route-replacement)
9. [Phase 5: Frontend TypeScript Conversion](#9-phase-5-frontend-typescript-conversion)
10. [Phase 6: Cleanup and Final Removal](#10-phase-6-cleanup-and-final-removal)
11. [Terminology Transition Reference](#11-terminology-transition-reference)
12. [Complete File Inventory](#12-complete-file-inventory)
13. [Risk Register & Rollback Strategy](#13-risk-register--rollback-strategy)

---

## 1. Executive Summary

### What We're Doing

| Dimension           | FROM                                             | TO                                                           |
| ------------------- | ------------------------------------------------ | ------------------------------------------------------------ |
| API Protocol        | REST (Express routes)                            | GraphQL (Apollo Server)                                      |
| Language            | JavaScript (.js/.jsx)                            | TypeScript (.ts/.tsx)                                        |
| State Management    | Redux + Axios REST calls                         | Redux Toolkit + Apollo Client (useQuery/useMutation)         |
| CRUD Pattern        | Generic `request.list/create/read/update/delete` | Typed GraphQL operations (queries, mutations, subscriptions) |
| Backend Structure   | Routes → Controllers → Models                    | Types → Resolvers → Services → Models                        |
| Frontend Data Layer | 11 Redux slices with async thunks                | Apollo cache + minimal Redux for UI-only state               |

### Migration Rules

1. **One route at a time** — remove a REST endpoint only after its GraphQL replacement is fully operational
2. **Each route migration is atomic** — backend type def + resolver + frontend query/mutation + Redux removal = one unit of work
3. **No broken states** — every commit must leave the application fully functional
4. **TypeScript conversion happens alongside** — when touching a file for GraphQL migration, convert it to TypeScript in the same pass

---

## 2. Current Architecture Map

### 2.1 Backend File Structure

```
backend/src/
├── app.js                          # Express app — mounts all routes + GraphQL middleware
├── server.js                       # HTTP server, MongoDB connection, Socket.io
├── helpers.js                      # Backend helpers
├── config/                         # 7 config files (aiSettings, analytics, channels, etc.)
├── controllers/
│   ├── appControllers/             # ~65 controller modules (client, invoice, AI, social, etc.)
│   ├── coreControllers/            # adminAuth, adminController, settingController
│   ├── middlewaresControllers/     # createAuthMiddleware, createCRUDController, createUserController
│   └── pdfController/             # PDF generation
├── core/
│   └── WorkflowEngine.js
├── database/migrations/
├── emailTemplate/                  # 3 email template files
├── emailTemplates/                 # 4 HTML campaign templates
├── graphql/                        # EXISTING (partial) — Apollo Server setup
│   ├── index.js                    # createApolloServer + buildContext
│   ├── resolvers/
│   │   ├── index.js                # EMPTY — resolvers not wired
│   │   ├── auth.js                 # Auth resolvers (login, register, logout, etc.)
│   │   ├── crud.js                 # Generic CRUD resolver factory (generateCRUDResolvers)
│   │   └── entities.js             # Entity-specific resolvers (statistics, invoices, etc.)
│   └── typeDefs/
│       ├── index.js                # Merges root + common + auth + entity type defs
│       ├── auth.js                 # Auth types (LoginInput, AuthResponse, etc.)
│       ├── common.js               # EMPTY
│       └── entities.js             # EMPTY
├── handlers/                       # Error handlers, download handler
├── helpers/                        # 20 helper files (AI, analytics, URL, review, etc.)
├── integration/                    # Facebook/Google reviews, URL integration
├── locale/                         # Translation system
├── middlewares/                    # 12+ middleware files (auth, rate limit, analytics, etc.)
├── models/
│   ├── appModels/                  # 63 Mongoose models
│   ├── coreModels/                 # 5 core models (CompanyOwner, Setting, etc.)
│   └── utils/
├── pdf/                            # PDF templates
├── routes/
│   ├── appRoutes/                  # 39 route files
│   ├── coreRoutes/                 # 6 route files
│   ├── dataEntryRoutes.js
│   ├── publicSurveyRoutes.js
│   ├── surveyRoutes.js
│   └── workflows-simple.js
├── services/                       # 48+ service files + 2 subdirectories
├── settings/                       # App settings utilities
├── setup/                          # Setup/migration scripts
├── sockets/                        # chatSocket.js, notificationSocket.js
├── utils/                          # 22+ utility files
└── validators/                     # 6 validator files
```

### 2.2 Frontend File Structure

```
frontend/src/
├── main.jsx                        # React 18 root
├── RootApp.jsx                     # Provider tree (Redux + Apollo + Ant Design + Router)
├── apps/                           # 6 files (ErpApp, ErpOs, Header, Navigation)
├── auth/                           # Auth guards
├── components/                     # 107+ component files (Workflow, URL, Forms, AI, etc.)
├── config/                         # 5 config files (serverApiConfig, theme, etc.)
├── context/                        # 12 context files (Notification, Copilot, AI, CRUD, ERP, etc.)
├── data/                           # Static data
├── forms/                          # 19 form files (Login, Register, Customer, Document, etc.)
├── graphql/
│   ├── client.js                   # Apollo Client setup (InMemoryCache, auth link)
│   └── operations.js               # EMPTY — no operations defined yet
├── hooks/                          # 14 custom hooks (useFetch, usePermissions, useUrl, etc.)
├── layout/                         # 8 layout files
├── locale/                         # i18n
├── pages/                          # 290+ page files (Dashboard, URL, Settings, Marketing, etc.)
├── polyfills/
├── redux/                          # STATE MANAGEMENT (see 2.3 below)
├── request/                        # REST API CLIENT (see 2.4 below)
├── router/                         # 4 router files (AppRouter, AuthRouter, ProtectedRoutes, routes)
├── services/                       # 4 service files (aiEnhanced, campaign, socket, workflow)
├── settings/
├── style/
└── utils/
```

### 2.3 Redux Store Structure (11 Slices)

| Slice         | Pattern                                     | API Method                                         | Files                                                            |
| ------------- | ------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------- |
| `auth`        | Legacy (dispatch/types)                     | Axios via `request` module                         | actions.js, reducer.js, types.js, selectors.js                   |
| `crud`        | Legacy (dispatch/types)                     | Axios via `request.list/create/read/update/delete` | actions.js, reducer.js, types.js, selectors.js                   |
| `erp`         | Legacy (dispatch/types)                     | Axios via custom `apiCall.js`                      | apiCall.js, actions.js, reducer.js, types.js, selectors.js       |
| `settings`    | Legacy (dispatch/types)                     | Axios via `request` module                         | actions.js, reducer.js, types.js, selectors.js                   |
| `ai`          | **Modern** (createSlice + createAsyncThunk) | Axios direct calls                                 | aiSlice.js, aiThunks.js, aiActions.js, aiSelectors.js            |
| `socialMedia` | Legacy (dispatch/types)                     | Axios via `request` module                         | actions.js, reducer.js, types.js, selectors.js                   |
| `url`         | **Modern** (createSlice + createAsyncThunk) | Axios direct calls                                 | urlSlice.js, urlSelectors.js                                     |
| `reputation`  | **Modern** (createSlice + createAsyncThunk) | Axios direct calls                                 | reputationSlice.js, reputationActions.js, reputationSelectors.js |
| `marketing`   | **Modern** (createSlice)                    | Axios direct calls                                 | marketingSlice.js                                                |
| `behavior`    | **Modern** (createSlice)                    | Axios direct calls                                 | behaviorSlice.js                                                 |
| `retargeting` | **Modern** (createSlice)                    | Axios direct calls                                 | retargetingSlice.js                                              |
| `campaign`    | **Modern** (createSlice)                    | Axios direct calls                                 | campaignSlice.js                                                 |
| `permissions` | Legacy (dispatch/types)                     | Axios via `request` module                         | actions.js, reducer.js, types.js, selectors.js                   |

**Key Problems Found:**

- Mixed patterns: some slices use legacy `dispatch({ type })`, others use `createSlice/createAsyncThunk`
- `crud` slice is a generic catch-all — same reducer handles Client, Invoice, Quote, Payment, etc. via dynamic `entity` parameter
- `erp` slice duplicates CRUD logic with its own `apiCall.js`
- Multiple API call patterns: `request.list()`, `axios.get()`, `apiCall()`, custom thunks
- No TypeScript types — state shapes are implicit
- Stale state bugs likely from shared generic CRUD state

### 2.4 REST API Request Layer

**`frontend/src/request/index.js`** — The `Request` class:

- Base URL: `http://localhost:8888/api/` (dev)
- Auth: Bearer token from `storePersist.get('auth')`
- Methods: `list`, `get`, `create`, `read`, `update`, `delete`, `search`, `summary`, `createAndUpload`, `uploadDocument`
- Pattern: `entity` string parameter builds URLs like `GET /api/{entity}/list`, `POST /api/{entity}`, etc.
- Error handling via interceptors (401 → logout, 403 → forbidden, etc.)

### 2.5 Complete REST Endpoint Inventory (350+ endpoints)

#### Core Auth (6 endpoints)

| Method | Path                  | Route File  | Controller                 |
| ------ | --------------------- | ----------- | -------------------------- |
| POST   | `/api/login`          | coreAuth.js | adminAuth/login            |
| POST   | `/api/register`       | coreAuth.js | adminAuth/register         |
| POST   | `/api/forgetpassword` | coreAuth.js | adminAuth/forgetPassword   |
| POST   | `/api/resetpassword`  | coreAuth.js | adminAuth/resetPassword    |
| POST   | `/api/logout`         | coreAuth.js | adminAuth/logout           |
| GET    | `/api/verify-token`   | coreAuth.js | adminAuth/isValidAuthToken |

#### Admin/Setting CRUD (18 endpoints)

| Method     | Path                                          | Route File  | Controller        |
| ---------- | --------------------------------------------- | ----------- | ----------------- |
| POST       | `/api/admin/password-update/:id`              | coreAuth.js | adminController   |
| POST       | `/api/admin/completeCompanySetup`             | coreAuth.js | adminController   |
| PATCH      | `/api/admin/profile/password`                 | coreAuth.js | adminController   |
| PATCH      | `/api/admin/profile/update`                   | coreAuth.js | adminController   |
| GET        | `/api/admin/read/:id`                         | coreAuth.js | adminController   |
| GET        | `/api/admin/list`                             | coreAuth.js | adminController   |
| POST       | `/api/setting/create`                         | coreApi.js  | settingController |
| GET        | `/api/setting/read/:id`                       | coreApi.js  | settingController |
| PATCH      | `/api/setting/update/:id`                     | coreApi.js  | settingController |
| GET        | `/api/setting/search`                         | coreApi.js  | settingController |
| GET        | `/api/setting/list`                           | coreApi.js  | settingController |
| GET        | `/api/setting/listAll`                        | coreApi.js  | settingController |
| GET        | `/api/setting/filter`                         | coreApi.js  | settingController |
| GET        | `/api/setting/readBySettingKey/:settingKey`   | coreApi.js  | settingController |
| GET        | `/api/setting/listBySettingKey`               | coreApi.js  | settingController |
| PATCH      | `/api/setting/updateBySettingKey/:settingKey` | coreApi.js  | settingController |
| PATCH      | `/api/setting/upload/:settingKey`             | coreApi.js  | settingController |
| PATCH/POST | `/api/setting/updateManySetting`              | coreApi.js  | settingController |

#### Generic ERP CRUD (appApi.js — dynamic entity routing)

| Method | Path                       | Route File | Controller           |
| ------ | -------------------------- | ---------- | -------------------- |
| POST   | `/api/{entity}/create`     | appApi.js  | createCRUDController |
| GET    | `/api/{entity}/read/:id`   | appApi.js  | createCRUDController |
| PATCH  | `/api/{entity}/update/:id` | appApi.js  | createCRUDController |
| DELETE | `/api/{entity}/delete/:id` | appApi.js  | createCRUDController |
| GET    | `/api/{entity}/search`     | appApi.js  | createCRUDController |
| GET    | `/api/{entity}/list`       | appApi.js  | createCRUDController |
| GET    | `/api/{entity}/listAll`    | appApi.js  | createCRUDController |
| GET    | `/api/{entity}/filter`     | appApi.js  | createCRUDController |
| GET    | `/api/{entity}/summary`    | appApi.js  | createCRUDController |

_Entities handled by appApi.js:_ Client, Invoice, Quote, Payment, Project, Schedule, etc.

#### URL Shortener & Analytics (~25 endpoints)

| Method | Path                                     | Route File         |
| ------ | ---------------------------------------- | ------------------ |
| GET    | `/api/s/:shortCode`                      | (direct in app.js) |
| GET    | `/api/s/:shortCode/preview`              | (direct in app.js) |
| GET    | `/api/s/:shortCode/qr`                   | (direct in app.js) |
| POST   | `/api/s/:shortCode/password`             | (direct in app.js) |
| GET    | `/api/url`                               | urlRoutes.js       |
| POST   | `/api/url`                               | urlRoutes.js       |
| GET    | `/api/url/search`                        | urlRoutes.js       |
| GET    | `/api/url/summary`                       | urlRoutes.js       |
| POST   | `/api/url/bulk`                          | urlRoutes.js       |
| GET    | `/api/url/list`                          | urlRoutes.js       |
| GET    | `/api/url/:id`                           | urlRoutes.js       |
| DELETE | `/api/url/:id`                           | urlRoutes.js       |
| PATCH  | `/api/url/update/:id`                    | urlRoutes.js       |
| POST   | `/api/url/:id/clone`                     | urlRoutes.js       |
| GET    | `/api/url/:id/analytics`                 | urlRoutes.js       |
| GET    | `/api/url/:id/analytics/history`         | urlRoutes.js       |
| GET    | `/api/url/:id/analytics/geographic`      | urlRoutes.js       |
| GET    | `/api/url/:id/analytics/devices`         | urlRoutes.js       |
| GET    | `/api/url/:id/analytics/traffic-sources` | urlRoutes.js       |
| GET    | `/api/url/:id/analytics/export`          | urlRoutes.js       |
| GET    | `/api/url/:id/analytics/realtime`        | urlRoutes.js       |
| GET    | `/api/url/:id/analytics/conversions`     | urlRoutes.js       |

#### Team Management (~12 endpoints)

| Method | Path                                              | Route File    |
| ------ | ------------------------------------------------- | ------------- |
| GET    | `/api/team`                                       | teamRoutes.js |
| GET    | `/api/team/list`                                  | teamRoutes.js |
| POST   | `/api/team`                                       | teamRoutes.js |
| GET    | `/api/team/:id`                                   | teamRoutes.js |
| PATCH  | `/api/team/update/:id`                            | teamRoutes.js |
| DELETE | `/api/team/:id`                                   | teamRoutes.js |
| POST   | `/api/team/:teamId/invite`                        | teamRoutes.js |
| GET    | `/api/team/:teamId/members`                       | teamRoutes.js |
| PATCH  | `/api/team/:teamId/members/:memberId`             | teamRoutes.js |
| DELETE | `/api/team/:teamId/members/:memberId`             | teamRoutes.js |
| GET    | `/api/team/:teamId/members/:memberId/performance` | teamRoutes.js |

#### User Management (~4 endpoints)

| Method | Path                         | Route File    |
| ------ | ---------------------------- | ------------- |
| GET    | `/api/user/profile`          | userRoutes.js |
| PATCH  | `/api/user/profile/update`   | userRoutes.js |
| PATCH  | `/api/user/profile/password` | userRoutes.js |
| GET    | `/api/user/permissions`      | userRoutes.js |

#### Chat & Customer Chat (~12 endpoints)

| Method | Path                                      | Route File            |
| ------ | ----------------------------------------- | --------------------- |
| POST   | `/api/chat/send`                          | chatRoutes.js         |
| GET    | `/api/chat/history/:userId`               | chatRoutes.js         |
| GET    | `/api/chat/list`                          | chatRoutes.js         |
| GET    | `/api/chat/users`                         | chatRoutes.js         |
| GET    | `/api/customer-chat/room`                 | customerChatRoutes.js |
| POST   | `/api/customer-chat/:id/generate`         | customerChatRoutes.js |
| GET    | `/api/customer-chat/room/:roomId`         | customerChatRoutes.js |
| GET    | `/api/customer-chat/my-rooms`             | customerChatRoutes.js |
| POST   | `/api/customer-chat/room/:roomId/close`   | customerChatRoutes.js |
| POST   | `/api/customer-chat/room/:roomId/archive` | customerChatRoutes.js |
| DELETE | `/api/customer-chat/room/:roomId`         | customerChatRoutes.js |
| GET    | `/api/customer-chat/stats`                | customerChatRoutes.js |

#### Documents (~35 endpoints)

| Method | Path                                       | Route File        |
| ------ | ------------------------------------------ | ----------------- |
| GET    | `/api/document/list`                       | documentRoutes.js |
| POST   | `/api/document`                            | documentRoutes.js |
| POST   | `/api/document/create`                     | documentRoutes.js |
| GET    | `/api/document/search`                     | documentRoutes.js |
| POST   | `/api/document/advanced-search`            | documentRoutes.js |
| GET    | `/api/document/filter`                     | documentRoutes.js |
| GET    | `/api/document/analyze/:id`                | documentRoutes.js |
| POST   | `/api/document/ai/suggest-tags`            | documentRoutes.js |
| POST   | `/api/document/:id/ai/apply-tags`          | documentRoutes.js |
| GET    | `/api/document/:id/ai/summarize`           | documentRoutes.js |
| POST   | `/api/document/ai/summarize-batch`         | documentRoutes.js |
| POST   | `/api/document/bulk-import-urls`           | documentRoutes.js |
| POST   | `/api/document/:id/share-url`              | documentRoutes.js |
| GET    | `/api/document/:id/share-urls`             | documentRoutes.js |
| GET    | `/api/document/read/:id`                   | documentRoutes.js |
| PATCH  | `/api/document/update/:id`                 | documentRoutes.js |
| DELETE | `/api/document/delete/:id`                 | documentRoutes.js |
| GET    | `/api/document/download/:id`               | documentRoutes.js |
| GET    | `/api/document/:id/versions`               | documentRoutes.js |
| GET    | `/api/document/:id/version/:versionNumber` | documentRoutes.js |
| POST   | `/api/document/:id/version`                | documentRoutes.js |
| POST   | `/api/document/:id/revert`                 | documentRoutes.js |
| GET    | `/api/document/:id/content`                | documentRoutes.js |
| POST   | `/api/document/:id/edit`                   | documentRoutes.js |
| POST   | `/api/document/:id/esign`                  | documentRoutes.js |
| POST   | `/api/document/:id/annotate`               | documentRoutes.js |
| GET    | `/api/document/:id/compliance`             | documentRoutes.js |
| POST   | `/api/document/:id/compliance`             | documentRoutes.js |
| GET    | `/api/document/:id/audit-trail`            | documentRoutes.js |
| POST   | `/api/document/:id/share`                  | documentRoutes.js |
| POST   | `/api/document/:id/link`                   | documentRoutes.js |
| POST   | `/api/document/reprocess-text`             | documentRoutes.js |

#### Data Entry/OCR (~6 endpoints)

| Method   | Path                                         | Route File         |
| -------- | -------------------------------------------- | ------------------ |
| GET      | `/api/data-entry/modules`                    | dataEntryRoutes.js |
| GET      | `/api/data-entry/modules/:moduleName/schema` | dataEntryRoutes.js |
| POST     | `/api/data-entry/ocr/:moduleName`            | dataEntryRoutes.js |
| POST     | `/api/data-entry/spreadsheet/:moduleName`    | dataEntryRoutes.js |
| POST     | `/api/data-entry/url/:moduleName`            | dataEntryRoutes.js |
| GET/POST | `/api/data-entry/validation/:moduleName`     | dataEntryRoutes.js |

#### Surveys (~18 endpoints)

| Method | Path                                  | Route File      |
| ------ | ------------------------------------- | --------------- |
| GET    | `/api/surveys`                        | surveyRoutes.js |
| GET    | `/api/surveys/list`                   | surveyRoutes.js |
| POST   | `/api/surveys`                        | surveyRoutes.js |
| GET    | `/api/surveys/:id`                    | surveyRoutes.js |
| PATCH  | `/api/surveys/:id`                    | surveyRoutes.js |
| DELETE | `/api/surveys/:id`                    | surveyRoutes.js |
| POST   | `/api/surveys/:id/publish`            | surveyRoutes.js |
| POST   | `/api/surveys/:id/pause`              | surveyRoutes.js |
| POST   | `/api/surveys/:id/close`              | surveyRoutes.js |
| POST   | `/api/surveys/:id/duplicate`          | surveyRoutes.js |
| GET    | `/api/surveys/:id/analytics`          | surveyRoutes.js |
| GET    | `/api/surveys/:id/ai-suggestions`     | surveyRoutes.js |
| GET    | `/api/surveys/:id/nps`                | surveyRoutes.js |
| GET    | `/api/surveys/:id/export`             | surveyRoutes.js |
| GET    | `/api/surveys/:id/responses`          | surveyRoutes.js |
| GET    | `/api/surveys/response/:id`           | surveyRoutes.js |
| PATCH  | `/api/surveys/response/:id/follow-up` | surveyRoutes.js |
| DELETE | `/api/surveys/response/:id`           | surveyRoutes.js |

#### Campaigns & Triggers (~17 endpoints)

| Method | Path                                        | Route File        |
| ------ | ------------------------------------------- | ----------------- |
| POST   | `/api/campaigns`                            | campaignRoutes.js |
| GET    | `/api/campaigns`                            | campaignRoutes.js |
| GET    | `/api/campaigns/:id`                        | campaignRoutes.js |
| PATCH  | `/api/campaigns/:id`                        | campaignRoutes.js |
| DELETE | `/api/campaigns/:id`                        | campaignRoutes.js |
| POST   | `/api/campaigns/:id/start`                  | campaignRoutes.js |
| POST   | `/api/campaigns/:id/pause`                  | campaignRoutes.js |
| POST   | `/api/campaigns/:id/schedule`               | campaignRoutes.js |
| POST   | `/api/campaigns/:id/optimize`               | campaignRoutes.js |
| POST   | `/api/campaigns/:id/duplicate`              | campaignRoutes.js |
| GET    | `/api/campaigns/:id/analytics`              | campaignRoutes.js |
| POST   | `/api/triggers/events`                      | triggerRoutes.js  |
| GET    | `/api/triggers/events`                      | triggerRoutes.js  |
| GET    | `/api/triggers/events/customer/:customerId` | triggerRoutes.js  |
| GET    | `/api/triggers/events/summary/:customerId`  | triggerRoutes.js  |
| POST   | `/api/triggers/evaluate/:customerId`        | triggerRoutes.js  |
| GET    | `/api/triggers/trends`                      | triggerRoutes.js  |
| POST   | `/api/triggers/patterns`                    | triggerRoutes.js  |

#### Analytics (~15 endpoints)

| Method | Path                                            | Route File         |
| ------ | ----------------------------------------------- | ------------------ |
| GET    | `/api/analytics/dashboard`                      | analyticsRoutes.js |
| GET    | `/api/analytics/utm-performance`                | analyticsRoutes.js |
| GET    | `/api/analytics/campaign/:id`                   | analyticsRoutes.js |
| GET    | `/api/analytics/campaign/:campaignId/insights`  | analyticsRoutes.js |
| GET    | `/api/analytics/campaign/:campaignId/real-time` | analyticsRoutes.js |
| GET    | `/api/analytics/customer-journey/:customerId`   | analyticsRoutes.js |
| POST   | `/api/analytics/compare`                        | analyticsRoutes.js |
| POST   | `/api/analytics/export`                         | analyticsRoutes.js |

#### Reputation Analytics (~8 endpoints)

| Method | Path                                            | Route File                   |
| ------ | ----------------------------------------------- | ---------------------------- |
| GET    | `/api/reputation/analytics/overview`            | reputationAnalyticsRoutes.js |
| GET    | `/api/reputation/analytics/sentiment`           | reputationAnalyticsRoutes.js |
| GET    | `/api/reputation/analytics/trends`              | reputationAnalyticsRoutes.js |
| GET    | `/api/reputation/analytics/platform-comparison` | reputationAnalyticsRoutes.js |
| GET    | `/api/reputation/analytics/business-comparison` | reputationAnalyticsRoutes.js |
| GET    | `/api/reputation/analytics/metrics`             | reputationAnalyticsRoutes.js |
| POST   | `/api/reputation/analytics/export`              | reputationAnalyticsRoutes.js |

#### Global Analytics (~20 endpoints)

| Method | Path                                         | Route File               |
| ------ | -------------------------------------------- | ------------------------ |
| GET    | `/api/global-analytics/dashboard`            | globalAnalyticsRoutes.js |
| GET    | `/api/global-analytics/real-time`            | globalAnalyticsRoutes.js |
| GET    | `/api/global-analytics/module/:moduleName`   | globalAnalyticsRoutes.js |
| GET    | `/api/global-analytics/modules/overview`     | globalAnalyticsRoutes.js |
| POST   | `/api/global-analytics/reports/create`       | globalAnalyticsRoutes.js |
| GET    | `/api/global-analytics/reports/list`         | globalAnalyticsRoutes.js |
| GET    | `/api/global-analytics/reports/:id`          | globalAnalyticsRoutes.js |
| POST   | `/api/global-analytics/reports/:id/generate` | globalAnalyticsRoutes.js |
| DELETE | `/api/global-analytics/reports/:id`          | globalAnalyticsRoutes.js |
| POST   | `/api/global-analytics/schedules/create`     | globalAnalyticsRoutes.js |
| GET    | `/api/global-analytics/schedules/list`       | globalAnalyticsRoutes.js |
| GET    | `/api/global-analytics/schedules/:id`        | globalAnalyticsRoutes.js |
| PATCH  | `/api/global-analytics/schedules/:id`        | globalAnalyticsRoutes.js |
| DELETE | `/api/global-analytics/schedules/:id`        | globalAnalyticsRoutes.js |
| POST   | `/api/global-analytics/predict`              | globalAnalyticsRoutes.js |
| GET    | `/api/global-analytics/trends/:metric`       | globalAnalyticsRoutes.js |
| POST   | `/api/global-analytics/ai-insights`          | globalAnalyticsRoutes.js |
| POST   | `/api/global-analytics/ai-insights/modules`  | globalAnalyticsRoutes.js |
| POST   | `/api/global-analytics/export`               | globalAnalyticsRoutes.js |

#### Statistics (~10 endpoints)

| Method | Path                      | Route File           |
| ------ | ------------------------- | -------------------- |
| GET    | `/api/stats/dashboard`    | (via coreApi/appApi) |
| GET    | `/api/stats/clients`      | statisticsRoutes.js  |
| GET    | `/api/stats/invoices`     | statisticsRoutes.js  |
| GET    | `/api/stats/quotes`       | statisticsRoutes.js  |
| GET    | `/api/stats/payments`     | statisticsRoutes.js  |
| GET    | `/api/stats/teams`        | statisticsRoutes.js  |
| GET    | `/api/stats/tasks`        | statisticsRoutes.js  |
| GET    | `/api/stats/documents`    | statisticsRoutes.js  |
| GET    | `/api/stats/paymentmodes` | statisticsRoutes.js  |
| GET    | `/api/stats/workflows`    | statisticsRoutes.js  |
| GET    | `/api/stats/taxes`        | statisticsRoutes.js  |

#### Tasks & Reminders (~20 endpoints)

| Method | Path                                    | Route File        |
| ------ | --------------------------------------- | ----------------- |
| POST   | `/api/task/create`                      | taskRoutes.js     |
| GET    | `/api/task/read/:id`                    | taskRoutes.js     |
| PATCH  | `/api/task/update/:id`                  | taskRoutes.js     |
| DELETE | `/api/task/delete/:id`                  | taskRoutes.js     |
| GET    | `/api/task/search`                      | taskRoutes.js     |
| GET    | `/api/task/list`                        | taskRoutes.js     |
| GET    | `/api/task/listAll`                     | taskRoutes.js     |
| GET    | `/api/task/filter`                      | taskRoutes.js     |
| GET    | `/api/task/summary`                     | taskRoutes.js     |
| POST   | `/api/task/ai/prioritize`               | taskRoutes.js     |
| PATCH  | `/api/task/batch/priorities`            | taskRoutes.js     |
| PATCH  | `/api/task/:taskId/progress`            | taskRoutes.js     |
| PATCH  | `/api/task/:taskId/watchers`            | taskRoutes.js     |
| POST   | `/api/task/:taskId/comments`            | taskRoutes.js     |
| PATCH  | `/api/task/:taskId/comments/:commentId` | taskRoutes.js     |
| DELETE | `/api/task/:taskId/comments/:commentId` | taskRoutes.js     |
| POST   | `/api/task/:taskId/attachments`         | taskRoutes.js     |
| PATCH  | `/api/task/:taskId/related-items`       | taskRoutes.js     |
| POST   | `/api/reminders`                        | reminderRoutes.js |
| GET    | `/api/reminders`                        | reminderRoutes.js |
| GET    | `/api/reminders/due`                    | reminderRoutes.js |
| GET    | `/api/reminders/stats`                  | reminderRoutes.js |
| GET    | `/api/reminders/:id`                    | reminderRoutes.js |
| PATCH  | `/api/reminders/:id`                    | reminderRoutes.js |
| DELETE | `/api/reminders/:id`                    | reminderRoutes.js |
| POST   | `/api/reminders/:id/cancel`             | reminderRoutes.js |
| POST   | `/api/reminders/:id/send`               | reminderRoutes.js |

#### Workflows & Business Processes (~18 endpoints)

| Method | Path                                                                          | Route File                 |
| ------ | ----------------------------------------------------------------------------- | -------------------------- |
| GET    | `/api/workflows`                                                              | workflows-simple.js        |
| GET    | `/api/workflows/:id`                                                          | workflows-simple.js        |
| POST   | `/api/workflows`                                                              | workflows-simple.js        |
| PUT    | `/api/workflows/:id`                                                          | workflows-simple.js        |
| DELETE | `/api/workflows/:id`                                                          | workflows-simple.js        |
| POST   | `/api/business-processes`                                                     | businessProcessRoutes.js   |
| GET    | `/api/business-processes/list`                                                | businessProcessRoutes.js   |
| GET    | `/api/business-processes/:id`                                                 | businessProcessRoutes.js   |
| PATCH  | `/api/business-processes/:id`                                                 | businessProcessRoutes.js   |
| DELETE | `/api/business-processes/:id`                                                 | businessProcessRoutes.js   |
| POST   | `/api/business-processes/:id/execute`                                         | businessProcessRoutes.js   |
| POST   | `/api/business-processes/:id/execution/:executionIndex/step/:stepId/complete` | businessProcessRoutes.js   |
| GET    | `/api/business-processes/:id/analytics`                                       | businessProcessRoutes.js   |
| POST   | `/api/business-processes/:id/duplicate-template`                              | businessProcessRoutes.js   |
| POST   | `/api/workflow-execution/execute`                                             | workflowExecutionRoutes.js |
| GET    | `/api/workflow-execution/history`                                             | workflowExecutionRoutes.js |
| GET    | `/api/workflow-execution/detail/:id`                                          | workflowExecutionRoutes.js |
| GET    | `/api/workflow-execution/stats`                                               | workflowExecutionRoutes.js |
| GET    | `/api/workflow-execution/bottlenecks`                                         | workflowExecutionRoutes.js |
| GET    | `/api/workflow-execution/live`                                                | workflowExecutionRoutes.js |

#### Appointments (~10 endpoints)

| Method | Path                            | Route File           |
| ------ | ------------------------------- | -------------------- |
| POST   | `/api/appointments`             | appointmentRoutes.js |
| GET    | `/api/appointments/list`        | appointmentRoutes.js |
| GET    | `/api/appointments/upcoming`    | appointmentRoutes.js |
| GET    | `/api/appointments/:id`         | appointmentRoutes.js |
| PATCH  | `/api/appointments/:id`         | appointmentRoutes.js |
| DELETE | `/api/appointments/:id`         | appointmentRoutes.js |
| POST   | `/api/appointments/:id/confirm` | appointmentRoutes.js |
| POST   | `/api/appointments/:id/cancel`  | appointmentRoutes.js |

#### Notifications (~8 endpoints)

| Method | Path                                | Route File            |
| ------ | ----------------------------------- | --------------------- |
| GET    | `/api/notifications`                | notificationRoutes.js |
| GET    | `/api/notifications/unread-count`   | notificationRoutes.js |
| GET    | `/api/notifications/stats`          | notificationRoutes.js |
| GET    | `/api/notifications/aggregated`     | notificationRoutes.js |
| GET    | `/api/notifications/:id`            | notificationRoutes.js |
| PATCH  | `/api/notifications/:id/read`       | notificationRoutes.js |
| PATCH  | `/api/notifications/mark-many-read` | notificationRoutes.js |
| PATCH  | `/api/notifications/mark-all-read`  | notificationRoutes.js |
| DELETE | `/api/notifications/:id`            | notificationRoutes.js |

#### A/B Testing (~11 endpoints)

| Method | Path                             | Route File      |
| ------ | -------------------------------- | --------------- |
| GET    | `/api/abtest`                    | abTestRoutes.js |
| POST   | `/api/abtest`                    | abTestRoutes.js |
| GET    | `/api/abtest/summary`            | abTestRoutes.js |
| GET    | `/api/abtest/:id`                | abTestRoutes.js |
| PATCH  | `/api/abtest/:id`                | abTestRoutes.js |
| DELETE | `/api/abtest/:id`                | abTestRoutes.js |
| POST   | `/api/abtest/:id/start`          | abTestRoutes.js |
| POST   | `/api/abtest/:id/stop`           | abTestRoutes.js |
| POST   | `/api/abtest/:id/declare-winner` | abTestRoutes.js |
| GET    | `/api/abtest/:id/results`        | abTestRoutes.js |
| GET    | `/api/abtest/:id/performance`    | abTestRoutes.js |

#### AI Assistant & Copilot (~25 endpoints)

| Method | Path                                                                   | Route File           |
| ------ | ---------------------------------------------------------------------- | -------------------- |
| POST   | `/api/aiAssistant`                                                     | aiAssistantRoutes.js |
| GET    | `/api/aiAssistant/list`                                                | aiAssistantRoutes.js |
| GET    | `/api/aiAssistant/search`                                              | aiAssistantRoutes.js |
| GET    | `/api/aiAssistant/:id`                                                 | aiAssistantRoutes.js |
| PATCH  | `/api/aiAssistant/:id`                                                 | aiAssistantRoutes.js |
| DELETE | `/api/aiAssistant/:id`                                                 | aiAssistantRoutes.js |
| POST   | `/api/aiAssistant/:assistantId/chat`                                   | aiAssistantRoutes.js |
| POST   | `/api/aiAssistant/:assistantId/analyze`                                | aiAssistantRoutes.js |
| POST   | `/api/aiAssistant/:assistantId/suggest`                                | aiAssistantRoutes.js |
| POST   | `/api/aiAssistant/:assistantId/predict`                                | aiAssistantRoutes.js |
| GET    | `/api/aiAssistant/:assistantId/conversations`                          | aiAssistantRoutes.js |
| GET    | `/api/aiAssistant/:assistantId/conversations/:conversationId`          | aiAssistantRoutes.js |
| PATCH  | `/api/aiAssistant/:assistantId/conversations/:conversationId`          | aiAssistantRoutes.js |
| DELETE | `/api/aiAssistant/:assistantId/conversations/:conversationId`          | aiAssistantRoutes.js |
| GET    | `/api/aiAssistant/:assistantId/conversations/:conversationId/messages` | aiAssistantRoutes.js |
| POST   | `/api/copilot/chat/:assistantId?`                                      | copilotRoutes.js     |
| POST   | `/api/copilot/suggestions`                                             | copilotRoutes.js     |
| POST   | `/api/copilot/customer-insights/:customerId`                           | copilotRoutes.js     |
| GET    | `/api/copilot/modules`                                                 | copilotRoutes.js     |
| GET    | `/api/copilot/models`                                                  | copilotRoutes.js     |

#### AI Data Processor (~10 endpoints)

| Method | Path                            | Route File               |
| ------ | ------------------------------- | ------------------------ |
| POST   | `/api/ai/ocr/process`           | aiDataProcessorRoutes.js |
| POST   | `/api/ai/data/extract`          | aiDataProcessorRoutes.js |
| GET    | `/api/ai/templates`             | aiDataProcessorRoutes.js |
| POST   | `/api/ai/templates`             | aiDataProcessorRoutes.js |
| GET    | `/api/ai/templates/:id`         | aiDataProcessorRoutes.js |
| PATCH  | `/api/ai/templates/:id`         | aiDataProcessorRoutes.js |
| DELETE | `/api/ai/templates/:id`         | aiDataProcessorRoutes.js |
| POST   | `/api/ai/workflows/process`     | aiDataProcessorRoutes.js |
| GET    | `/api/ai/processing/stats`      | aiDataProcessorRoutes.js |
| GET    | `/api/ai/processing/stats/list` | aiDataProcessorRoutes.js |

#### AI Enhanced (~15 endpoints)

| Method | Path                                                              | Route File          |
| ------ | ----------------------------------------------------------------- | ------------------- |
| POST   | `/api/ai-enhanced/chat-queue`                                     | aiEnhancedRoutes.js |
| GET    | `/api/ai-enhanced/chat-queue/:queueId/status`                     | aiEnhancedRoutes.js |
| GET    | `/api/ai-enhanced/chat-queue/statistics`                          | aiEnhancedRoutes.js |
| POST   | `/api/ai-enhanced/follow-up`                                      | aiEnhancedRoutes.js |
| GET    | `/api/ai-enhanced/follow-up`                                      | aiEnhancedRoutes.js |
| GET    | `/api/ai-enhanced/follow-up/analytics`                            | aiEnhancedRoutes.js |
| POST   | `/api/ai-enhanced/follow-up/:followUpId/response`                 | aiEnhancedRoutes.js |
| DELETE | `/api/ai-enhanced/follow-up/:followUpId`                          | aiEnhancedRoutes.js |
| GET    | `/api/ai-enhanced/automation/suggestions`                         | aiEnhancedRoutes.js |
| POST   | `/api/ai-enhanced/automation/suggestions/:suggestionId/implement` | aiEnhancedRoutes.js |
| GET    | `/api/ai-enhanced/automation/analytics`                           | aiEnhancedRoutes.js |
| POST   | `/api/ai-enhanced/context/enhanced`                               | aiEnhancedRoutes.js |
| GET    | `/api/ai-enhanced/insights/learned`                               | aiEnhancedRoutes.js |
| GET    | `/api/ai-enhanced/predict/customer/:clientId`                     | aiEnhancedRoutes.js |
| POST   | `/api/ai-enhanced/learning/:learningId/feedback`                  | aiEnhancedRoutes.js |
| GET    | `/api/ai-enhanced/learning/statistics`                            | aiEnhancedRoutes.js |
| GET    | `/api/ai-enhanced/learning/interactions`                          | aiEnhancedRoutes.js |

#### AI User Preferences & Knowledge Base (~10 endpoints)

| Method | Path                                | Route File                |
| ------ | ----------------------------------- | ------------------------- |
| GET    | `/api/aiUserPreference`             | aiUserPreferenceRoutes.js |
| POST   | `/api/aiUserPreference`             | aiUserPreferenceRoutes.js |
| PATCH  | `/api/aiUserPreference/usage`       | aiUserPreferenceRoutes.js |
| GET    | `/api/aiKnowledgeBase`              | aiKnowledgeBaseRoutes.js  |
| POST   | `/api/aiKnowledgeBase`              | aiKnowledgeBaseRoutes.js  |
| GET    | `/api/aiKnowledgeBase/:id`          | aiKnowledgeBaseRoutes.js  |
| PATCH  | `/api/aiKnowledgeBase/:id`          | aiKnowledgeBaseRoutes.js  |
| DELETE | `/api/aiKnowledgeBase/:id`          | aiKnowledgeBaseRoutes.js  |
| POST   | `/api/aiKnowledgeBase/:id/feedback` | aiKnowledgeBaseRoutes.js  |

#### Social Media (~50+ endpoints)

| Method                | Path                                   | Route File           |
| --------------------- | -------------------------------------- | -------------------- |
| GET/POST/PATCH/DELETE | `/api/social-media/accounts[/:id]`     | socialMediaRoutes.js |
| GET/POST/PATCH/DELETE | `/api/social-media/posts[/:id]`        | socialMediaRoutes.js |
| POST                  | `/api/social-media/posts/bulk`         | socialMediaRoutes.js |
| POST                  | `/api/social-media/posts/:id/publish`  | socialMediaRoutes.js |
| POST                  | `/api/social-media/posts/:id/schedule` | socialMediaRoutes.js |
| GET/POST/PATCH/DELETE | `/api/social-media/campaigns[/:id]`    | socialMediaRoutes.js |
| GET                   | `/api/social-media/analytics/*`        | socialMediaRoutes.js |
| GET/POST/PATCH/DELETE | `/api/social-media/mentions[/:id]`     | socialMediaRoutes.js |
| POST                  | `/api/social-media/ai/*`               | socialMediaRoutes.js |
| POST                  | `/api/social-media/media/*`            | socialMediaRoutes.js |
| POST                  | `/api/social-media/urls/*`             | socialMediaRoutes.js |

#### Marketing & Retargeting (~10 endpoints)

| Method         | Path                                  | Route File           |
| -------------- | ------------------------------------- | -------------------- |
| POST/GET/PATCH | `/api/retargeting/audiences[/:id]`    | retargetingRoutes.js |
| POST           | `/api/retargeting/campaign`           | retargetingRoutes.js |
| GET            | `/api/retargeting/opportunities`      | retargetingRoutes.js |
| POST           | `/api/retargeting/automated-campaign` | retargetingRoutes.js |
| GET            | `/api/retargeting/performance`        | retargetingRoutes.js |
| GET            | `/api/marketing/*`                    | marketingRoutes.js   |

#### Compliance, Audit, Taxes, Payment Modes (~20 endpoints)

| Method                | Path                              | Route File             |
| --------------------- | --------------------------------- | ---------------------- |
| POST/GET/PATCH/DELETE | `/api/compliance/*`               | complianceRoutes.js    |
| GET                   | `/api/audit/*`                    | auditRoutes.js         |
| GET                   | `/api/document-audit/:documentId` | documentAuditRoutes.js |
| GET/POST/PATCH/DELETE | `/api/taxes[/:id]`                | taxesRoutes.js         |
| GET/POST/PATCH/DELETE | `/api/paymentMode[/:id]`          | paymentModeRoutes.js   |

#### CRM URL Generation (~12 endpoints)

| Method | Path                                       | Route File      |
| ------ | ------------------------------------------ | --------------- |
| POST   | `/api/client/:id/generate-url/portal`      | crmUrlRoutes.js |
| POST   | `/api/client/:id/generate-url/payment`     | crmUrlRoutes.js |
| POST   | `/api/client/:id/generate-url/document`    | crmUrlRoutes.js |
| POST   | `/api/client/:id/generate-url/appointment` | crmUrlRoutes.js |
| POST   | `/api/client/:id/generate-url/survey`      | crmUrlRoutes.js |
| POST   | `/api/client/:id/generate-url/review`      | crmUrlRoutes.js |
| POST   | `/api/client/:id/generate-url/quote`       | crmUrlRoutes.js |
| POST   | `/api/client/:id/generate-url/invoice`     | crmUrlRoutes.js |
| POST   | `/api/client/:id/generate-url/event`       | crmUrlRoutes.js |
| GET    | `/api/client/:id/urls`                     | crmUrlRoutes.js |
| POST   | `/api/client/generate-url/bulk`            | crmUrlRoutes.js |

#### Public Routes (no auth)

| Method   | Path                                            | Route File                 |
| -------- | ----------------------------------------------- | -------------------------- |
| GET      | `/api/public/survey/:shortCode`                 | publicSurveyRoutes.js      |
| POST     | `/api/public/survey/:shortCode/submit`          | publicSurveyRoutes.js      |
| POST     | `/api/public/survey/:shortCode/save`            | publicSurveyRoutes.js      |
| GET      | `/api/public/document/shared/:shortId`          | documentPublicRoutes.js    |
| POST     | `/api/public/document/shared/:shortId`          | documentPublicRoutes.js    |
| GET      | `/api/public/document/shared/:shortId/download` | documentPublicRoutes.js    |
| GET/POST | `/api/appointments/book/:shortCode`             | appointmentRoutes.js       |
| \*       | `/api/public/social-media/*`                    | socialMediaPublicRoutes.js |
| \*       | `/api/public/team/*`                            | teamPublicRoutes.js        |
| \*       | `/api/public/url/*`                             | urlRedirectRoutes.js       |

#### Download Routes

| Method | Path                                | Route File            |
| ------ | ----------------------------------- | --------------------- |
| GET    | `/download/:directory/:file`        | coreDownloadRouter.js |
| GET    | `/public/:subPath/:directory/:file` | corePublicRouter.js   |

### 2.6 Existing GraphQL Layer (Partial)

**Status**: GraphQL is already partially set up but mostly unused:

- Apollo Server 4 is initialized in `graphql/index.js`
- Auth type defs and resolvers exist and work (login, register, logout, etc.)
- A `generateCRUDResolvers` factory exists in `resolvers/crud.js` that wraps Express controllers
- `typeDefs/common.js` — EMPTY
- `typeDefs/entities.js` — EMPTY
- `resolvers/index.js` — EMPTY (resolvers not wired to the schema)
- Entity-specific resolvers exist in `resolvers/entities.js` but are never registered
- Frontend Apollo Client is configured in `graphql/client.js` but `operations.js` is EMPTY

---

## 3. Target Architecture

### 3.1 Backend Target Structure

```
backend/src/
├── index.ts                        # Server entry point
├── app.ts                          # Express + Apollo Server setup
├── config/
│   ├── index.ts
│   ├── database.ts
│   └── ...
├── graphql/
│   ├── index.ts                    # Apollo Server factory
│   ├── context.ts                  # Context builder (typed)
│   ├── scalars/                    # Custom scalars (DateTime, JSON, Upload)
│   ├── typeDefs/
│   │   ├── index.ts                # Merges all type defs
│   │   ├── common.ts               # Shared types (Pagination, MutationResponse, etc.)
│   │   ├── auth.ts
│   │   ├── client.ts
│   │   ├── invoice.ts
│   │   ├── quote.ts
│   │   ├── payment.ts
│   │   ├── document.ts
│   │   ├── task.ts
│   │   ├── team.ts
│   │   ├── workflow.ts
│   │   ├── url.ts
│   │   ├── survey.ts
│   │   ├── campaign.ts
│   │   ├── socialMedia.ts
│   │   ├── ai.ts
│   │   ├── notification.ts
│   │   ├── analytics.ts
│   │   ├── reputation.ts
│   │   └── ... (one per domain module)
│   ├── resolvers/
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   ├── client.ts
│   │   ├── invoice.ts
│   │   └── ... (mirrors typeDefs)
│   └── directives/                # Auth directives (@auth, @hasRole)
├── models/                         # Mongoose models (.ts, typed schemas)
├── services/                       # Business logic (called by resolvers)
├── middlewares/                     # Express middlewares (for file upload REST routes only)
├── helpers/
├── utils/
├── types/                          # Shared TypeScript types/interfaces
│   ├── context.ts
│   ├── models.ts
│   └── graphql.ts
└── rest/                            # REST routes that MUST stay REST
    ├── fileUpload.ts               # File upload endpoints
    ├── webhooks.ts                 # External webhook endpoints
    ├── publicAccess.ts             # Public short-links, redirects
    └── downloads.ts               # Binary file downloads
```

### 3.2 Frontend Target Structure

```
frontend/src/
├── main.tsx
├── App.tsx
├── graphql/
│   ├── client.ts                   # Apollo Client with typed cache policies
│   ├── generated/                  # Auto-generated types from schema
│   │   └── graphql.ts
│   ├── operations/
│   │   ├── auth.ts                 # Auth queries/mutations
│   │   ├── client.ts
│   │   ├── invoice.ts
│   │   ├── ... (one per domain)
│   └── fragments/
│       ├── client.ts
│       └── ...
├── hooks/                          # Custom hooks using Apollo
│   ├── useAuth.ts
│   ├── useClient.ts
│   ├── ...
├── redux/                          # MINIMAL — UI-only state
│   ├── store.ts
│   ├── slices/
│   │   ├── uiSlice.ts             # Theme, sidebar, modals
│   │   ├── authSlice.ts           # Auth token + logged-in state only
│   │   └── permissionsSlice.ts
│   └── hooks.ts                    # Typed useAppDispatch, useAppSelector
├── types/                          # Shared TypeScript types
├── components/                     # (.tsx)
├── pages/                          # (.tsx)
├── layouts/                        # (.tsx)
├── forms/                          # (.tsx)
└── ...
```

### 3.3 What Stays REST (and Why)

| Endpoint Pattern                             | Reason                                                      |
| -------------------------------------------- | ----------------------------------------------------------- |
| `GET /api/s/:shortCode`                      | URL redirect — needs HTTP 302 response                      |
| `GET /download/*`                            | Binary file streaming — not suitable for GraphQL            |
| `POST /api/document` (with file upload)      | Multipart form data — use REST + graphql-upload or separate |
| `POST /api/data-entry/ocr/*`                 | File upload + processing                                    |
| `POST /api/data-entry/spreadsheet/*`         | File upload + processing                                    |
| `GET /api/health`                            | Health check — standard REST pattern                        |
| `POST /api/track/event`                      | Lightweight tracking pixel/beacon                           |
| `POST /api/public/social-media/webhooks/*`   | External platform webhooks (Facebook, Instagram, Twitter)   |
| `GET /api/public/document/shared/:shortId`   | Public document access (no auth, SEO-friendly)              |
| `GET /api/public/survey/:shortCode`          | Public survey access                                        |
| `GET/POST /api/appointments/book/:shortCode` | Public booking page                                         |

---

## 4. Pre-Migration Setup (Phase 0)

### 0.1 Create a `migration` branch

```
git checkout -b migration/rest-to-graphql-typescript
```

### 0.2 Add TypeScript to Backend

| Step  | Action                          | Files Modified                 |
| ----- | ------------------------------- | ------------------------------ |
| 0.2.1 | Install TS dependencies         | `backend/package.json`         |
| 0.2.2 | Create `tsconfig.json`          | `backend/tsconfig.json`        |
| 0.2.3 | Configure path aliases          | `backend/tsconfig.json`        |
| 0.2.4 | Add `ts-node` and `tsx` for dev | `backend/package.json` scripts |
| 0.2.5 | Update `.eslintrc` for TS       | `backend/.eslintrc`            |

**Dependencies to install:**

```
typescript ts-node tsx @types/node @types/express @types/cors @types/cookie-parser
@types/compression @types/morgan @types/jsonwebtoken @types/bcryptjs
@typescript-eslint/parser @typescript-eslint/eslint-plugin
```

**`backend/tsconfig.json`:**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"],
      "@models/*": ["./models/*"],
      "@services/*": ["./services/*"],
      "@graphql/*": ["./graphql/*"],
      "@config/*": ["./config/*"],
      "@utils/*": ["./utils/*"],
      "@types/*": ["./types/*"]
    },
    "allowJs": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 0.3 Add TypeScript to Frontend

| Step  | Action                    | Files Modified                  |
| ----- | ------------------------- | ------------------------------- |
| 0.3.1 | Install TS dependencies   | `frontend/package.json`         |
| 0.3.2 | Create `tsconfig.json`    | `frontend/tsconfig.json`        |
| 0.3.3 | Update Vite config for TS | `frontend/vite.config.js → .ts` |
| 0.3.4 | Add TS path aliases       | `frontend/tsconfig.json`        |

**Dependencies to install:**

```
typescript @types/react @types/react-dom @types/react-router-dom
@graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations
@graphql-codegen/typescript-react-apollo
```

### 0.4 Install GraphQL Codegen

Create `codegen.ts` in project root:

```typescript
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "http://localhost:8888/graphql",
  documents: "frontend/src/graphql/**/*.ts",
  generates: {
    "frontend/src/graphql/generated/graphql.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-apollo",
      ],
      config: {
        withHooks: true,
        withComponent: false,
        withHOC: false,
      },
    },
  },
};

export default config;
```

### 0.5 Wire Existing GraphQL Resolver Index

The existing `resolvers/index.js` is empty. First step is to wire the existing auth and CRUD resolvers.

| Step  | File                                  | Action                                                     |
| ----- | ------------------------------------- | ---------------------------------------------------------- |
| 0.5.1 | `graphql/resolvers/index.js`          | Import and merge auth + entity resolvers                   |
| 0.5.2 | `graphql/typeDefs/common.js`          | Add shared types (PaginationInput, MutationResponse, etc.) |
| 0.5.3 | Test GraphQL playground/introspection | Verify auth mutations work                                 |

### 0.6 Create Shared Types File

Create `backend/src/types/` directory with:

- `context.ts` — GraphQL context type (req, res, admin)
- `common.ts` — Shared response types
- `models/` — Typed interfaces for each Mongoose model

---

## 5. Phase 1: TypeScript Foundation

> **Goal**: Enable TypeScript compilation without breaking existing JS code. Use `allowJs: true` so .js and .ts files coexist.

### 1.1 Backend Core Files → TypeScript

Convert these files first (they're imported by everything):

| Order | File                                  | Priority | Reason                     |
| ----- | ------------------------------------- | -------- | -------------------------- |
| 1.1.1 | `src/types/context.ts`                | CREATE   | New — GraphQL context type |
| 1.1.2 | `src/types/common.ts`                 | CREATE   | New — shared interfaces    |
| 1.1.3 | `src/config/index.js → .ts`           | HIGH     | Used everywhere            |
| 1.1.4 | `src/graphql/index.js → .ts`          | HIGH     | Apollo Server setup        |
| 1.1.5 | `src/graphql/resolvers/crud.js → .ts` | HIGH     | Resolver factory           |
| 1.1.6 | `src/handlers/errorHandlers.js → .ts` | HIGH     | Middleware                 |
| 1.1.7 | `src/middlewares/auth.js → .ts`       | HIGH     | Auth middleware            |

### 1.2 Model Type Definitions

For each of the 68 Mongoose models, create a TypeScript interface:

| Model Group   | Models                                                                                                                                              | Count  |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Core          | CompanyOwner, CompanyOwnerPassword, Counter, Setting, Upload                                                                                        | 5      |
| CRM           | Client, Invoice, Quote, Payment, Project, Schedule                                                                                                  | 6      |
| Documents     | Document, DocumentAudit, DocumentCompliance, DocumentVersion                                                                                        | 4      |
| Tasks         | Task, AutomatedReminder                                                                                                                             | 2      |
| Teams         | Team, User                                                                                                                                          | 2      |
| Workflows     | Workflow, EnhancedWorkflow, WorkflowExecution, BusinessProcess                                                                                      | 4      |
| URL           | URL, URLClick, ABTest                                                                                                                               | 3      |
| Surveys       | Survey, SurveyResponse                                                                                                                              | 2      |
| Campaigns     | Campaign, TriggerRule                                                                                                                               | 2      |
| Social Media  | SocialAccount, SocialPost, SocialCampaign, SocialMention, SocialAnalytics                                                                           | 5      |
| AI            | AiAssistant, AiConversation, AiExtractionTemplate, AiKnowledgeBase, AILearningData, AiProcessingWorkflow, AiUserPreference, AiWorkflow, AiAnalytics | 9      |
| Chat          | ChatMessage, ChatRoom, ChatQueue                                                                                                                    | 3      |
| Notifications | Notification                                                                                                                                        | 1      |
| Marketing     | CustomerBehavior, CustomerFollowUp, CustomerJourney, CustomerSegment                                                                                | 4      |
| Reputation    | Review, ReviewLink, ReviewResponse, ReviewTemplate                                                                                                  | 4      |
| Financial     | PaymentMode, Taxes, Business                                                                                                                        | 3      |
| Interaction   | Interaction                                                                                                                                         | 1      |
| Compliance    | consentRecordModel, dataRetentionPolicyModel, auditTrailModel                                                                                       | 3      |
| Misc          | SavedSearch, SearchHistory, SharedResource                                                                                                          | 3      |
| **TOTAL**     |                                                                                                                                                     | **68** |

### 1.3 Frontend Core Files → TypeScript

| Order | File                                  | Action                                                  |
| ----- | ------------------------------------- | ------------------------------------------------------- |
| 1.3.1 | `src/main.jsx → .tsx`                 | Convert entry point                                     |
| 1.3.2 | `src/RootApp.jsx → .tsx`              | Convert provider tree                                   |
| 1.3.3 | `src/config/serverApiConfig.js → .ts` | Add types to API config                                 |
| 1.3.4 | `src/graphql/client.js → .ts`         | Type Apollo Client                                      |
| 1.3.5 | `src/redux/store.js → .ts`            | Type the Redux store                                    |
| 1.3.6 | `src/redux/rootReducer.js → .ts`      | Type combined reducer                                   |
| 1.3.7 | `src/redux/hooks.ts`                  | CREATE — `useAppDispatch`, `useAppSelector` typed hooks |

---

## 6. Phase 2: GraphQL Schema Expansion

> **Goal**: Build out all GraphQL type definitions and resolvers to mirror every REST endpoint, domain by domain.

### Approach

For each domain module:

1. Create `typeDefs/{module}.ts` with all types, inputs, queries, and mutations
2. Create `resolvers/{module}.ts` wiring to existing controllers/services
3. Add to the merged schema in `typeDefs/index.ts` and `resolvers/index.ts`
4. Test via GraphQL playground before touching frontend

### 2.1 Common Types (typeDefs/common.ts)

```graphql
scalar DateTime
scalar JSON
scalar Upload

type PaginationInfo {
  page: Int!
  count: Int!
  pages: Int!
}
input PaginationInput {
  page: Int
  limit: Int
  sortBy: String
  sortValue: String
}
input FilterInput {
  field: String!
  value: String!
}
type MutationResponse {
  success: Boolean!
  result: JSON
  message: String!
}
type ListResponse {
  success: Boolean!
  result: [JSON]
  pagination: PaginationInfo
  message: String
}
```

### 2.2 Module-by-Module Schema Creation Order

Each module below gets a type def file and a resolver file. Order is by dependency (least dependent first).

| Order  | Module                   | TypeDef File                      | Resolver File                      | Est. Types | Est. Operations |
| ------ | ------------------------ | --------------------------------- | ---------------------------------- | ---------- | --------------- |
| 2.2.1  | **Settings**             | `typeDefs/setting.ts`             | `resolvers/setting.ts`             | 3          | 12              |
| 2.2.2  | **Admin/User**           | `typeDefs/user.ts`                | `resolvers/user.ts`                | 4          | 8               |
| 2.2.3  | **Client**               | `typeDefs/client.ts`              | `resolvers/client.ts`              | 5          | 10              |
| 2.2.4  | **Taxes**                | `typeDefs/taxes.ts`               | `resolvers/taxes.ts`               | 2          | 5               |
| 2.2.5  | **PaymentMode**          | `typeDefs/paymentMode.ts`         | `resolvers/paymentMode.ts`         | 2          | 5               |
| 2.2.6  | **Invoice**              | `typeDefs/invoice.ts`             | `resolvers/invoice.ts`             | 5          | 12              |
| 2.2.7  | **Quote**                | `typeDefs/quote.ts`               | `resolvers/quote.ts`               | 5          | 12              |
| 2.2.8  | **Payment**              | `typeDefs/payment.ts`             | `resolvers/payment.ts`             | 4          | 8               |
| 2.2.9  | **Team**                 | `typeDefs/team.ts`                | `resolvers/team.ts`                | 5          | 12              |
| 2.2.10 | **Task**                 | `typeDefs/task.ts`                | `resolvers/task.ts`                | 6          | 18              |
| 2.2.11 | **Reminder**             | `typeDefs/reminder.ts`            | `resolvers/reminder.ts`            | 3          | 9               |
| 2.2.12 | **Document**             | `typeDefs/document.ts`            | `resolvers/document.ts`            | 8          | 35              |
| 2.2.13 | **Notification**         | `typeDefs/notification.ts`        | `resolvers/notification.ts`        | 3          | 9               |
| 2.2.14 | **Chat**                 | `typeDefs/chat.ts`                | `resolvers/chat.ts`                | 5          | 12              |
| 2.2.15 | **URL**                  | `typeDefs/url.ts`                 | `resolvers/url.ts`                 | 8          | 25              |
| 2.2.16 | **A/B Test**             | `typeDefs/abTest.ts`              | `resolvers/abTest.ts`              | 4          | 11              |
| 2.2.17 | **Survey**               | `typeDefs/survey.ts`              | `resolvers/survey.ts`              | 5          | 18              |
| 2.2.18 | **Workflow**             | `typeDefs/workflow.ts`            | `resolvers/workflow.ts`            | 6          | 18              |
| 2.2.19 | **Business Process**     | `typeDefs/businessProcess.ts`     | `resolvers/businessProcess.ts`     | 4          | 10              |
| 2.2.20 | **Workflow Execution**   | `typeDefs/workflowExecution.ts`   | `resolvers/workflowExecution.ts`   | 3          | 6               |
| 2.2.21 | **Appointment**          | `typeDefs/appointment.ts`         | `resolvers/appointment.ts`         | 3          | 8               |
| 2.2.22 | **Campaign**             | `typeDefs/campaign.ts`            | `resolvers/campaign.ts`            | 5          | 12              |
| 2.2.23 | **Trigger**              | `typeDefs/trigger.ts`             | `resolvers/trigger.ts`             | 4          | 8               |
| 2.2.24 | **Analytics**            | `typeDefs/analytics.ts`           | `resolvers/analytics.ts`           | 6          | 8               |
| 2.2.25 | **Reputation Analytics** | `typeDefs/reputationAnalytics.ts` | `resolvers/reputationAnalytics.ts` | 5          | 8               |
| 2.2.26 | **Global Analytics**     | `typeDefs/globalAnalytics.ts`     | `resolvers/globalAnalytics.ts`     | 8          | 20              |
| 2.2.27 | **Statistics**           | `typeDefs/statistics.ts`          | `resolvers/statistics.ts`          | 3          | 11              |
| 2.2.28 | **Social Media**         | `typeDefs/socialMedia.ts`         | `resolvers/socialMedia.ts`         | 12         | 50              |
| 2.2.29 | **Marketing**            | `typeDefs/marketing.ts`           | `resolvers/marketing.ts`           | 5          | 10              |
| 2.2.30 | **Retargeting**          | `typeDefs/retargeting.ts`         | `resolvers/retargeting.ts`         | 4          | 7               |
| 2.2.31 | **Compliance**           | `typeDefs/compliance.ts`          | `resolvers/compliance.ts`          | 5          | 10              |
| 2.2.32 | **Audit**                | `typeDefs/audit.ts`               | `resolvers/audit.ts`               | 2          | 3               |
| 2.2.33 | **AI Assistant**         | `typeDefs/aiAssistant.ts`         | `resolvers/aiAssistant.ts`         | 8          | 25              |
| 2.2.34 | **AI Data Processor**    | `typeDefs/aiDataProcessor.ts`     | `resolvers/aiDataProcessor.ts`     | 5          | 10              |
| 2.2.35 | **AI Enhanced**          | `typeDefs/aiEnhanced.ts`          | `resolvers/aiEnhanced.ts`          | 6          | 16              |
| 2.2.36 | **AI Preferences**       | `typeDefs/aiPreferences.ts`       | `resolvers/aiPreferences.ts`       | 2          | 3               |
| 2.2.37 | **AI Knowledge Base**    | `typeDefs/aiKnowledgeBase.ts`     | `resolvers/aiKnowledgeBase.ts`     | 3          | 6               |
| 2.2.38 | **Copilot**              | `typeDefs/copilot.ts`             | `resolvers/copilot.ts`             | 4          | 5               |
| 2.2.39 | **CRM URLs**             | `typeDefs/crmUrl.ts`              | `resolvers/crmUrl.ts`              | 3          | 12              |
| 2.2.40 | **Data Entry**           | `typeDefs/dataEntry.ts`           | `resolvers/dataEntry.ts`           | 3          | 6               |

### 2.3 Subscriptions

Add GraphQL subscriptions for real-time features currently handled by Socket.io:

| Subscription           | Replaces                                               |
| ---------------------- | ------------------------------------------------------ |
| `notificationReceived` | `notificationSocket.js` → `notification:new` event     |
| `notificationUpdated`  | `notificationSocket.js` → `notification:updated` event |
| `chatMessageReceived`  | `chatSocket.js` → `message:new` event                  |
| `chatRoomUpdated`      | `chatSocket.js` → `room:updated` event                 |

**Note**: Socket.io can remain for real-time features as a transport layer. GraphQL subscriptions (via WebSocket) can replace it if desired, but this is optional and lower priority.

---

## 7. Phase 3: Redux Overhaul + Apollo Client Migration

> **Goal**: Replace REST-based Redux async thunks with Apollo Client hooks. Slim down Redux to UI-only state.

### 3.1 Redux Problems to Fix

| Problem                      | Current Behavior                                                                                  | Fix                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Generic CRUD slice**       | One `crud` reducer handles ALL entities — state collisions when two pages load different entities | Replace with Apollo cache — each entity type has its own cache key |
| **Duplicate ERP slice**      | `erp` slice is a copy of `crud` with slightly different API call pattern                          | Remove entirely — use Apollo                                       |
| **Mixed patterns**           | Some slices use `dispatch({ type })`, others use `createAsyncThunk`                               | Standardize on Apollo `useQuery`/`useMutation`                     |
| **Stale state**              | Generic CRUD state doesn't clear between page navigations                                         | Apollo's normalized cache handles this automatically               |
| **No TypeScript**            | All state shapes are implicit, no type safety                                                     | Generated types from GraphQL schema                                |
| **Context/Redux overlap**    | Same data fetched via both Context (`appContext`, `crud`, `advancedCrud`, `erp`) and Redux        | Single source of truth: Apollo cache                               |
| **Request class complexity** | `request/index.js` Request class with 10+ methods, interceptors, error handling                   | Apollo links handle auth + errors                                  |

### 3.2 Migration Strategy Per Slice

| Redux Slice   | Migration Path                                                     | New Location                        |
| ------------- | ------------------------------------------------------------------ | ----------------------------------- |
| `auth`        | Keep in Redux (minimal) — stores token + isLoggedIn                | `redux/slices/authSlice.ts`         |
| `crud`        | **DELETE** — replace all uses with Apollo `useQuery`/`useMutation` | `graphql/operations/{entity}.ts`    |
| `erp`         | **DELETE** — replace all uses with Apollo                          | `graphql/operations/{entity}.ts`    |
| `settings`    | Replace with Apollo query + cache                                  | `graphql/operations/settings.ts`    |
| `ai`          | Replace async thunks with Apollo mutations                         | `graphql/operations/ai.ts`          |
| `socialMedia` | Replace with Apollo                                                | `graphql/operations/socialMedia.ts` |
| `url`         | Replace async thunks with Apollo                                   | `graphql/operations/url.ts`         |
| `reputation`  | Replace with Apollo                                                | `graphql/operations/reputation.ts`  |
| `marketing`   | Replace with Apollo                                                | `graphql/operations/marketing.ts`   |
| `behavior`    | Replace with Apollo                                                | `graphql/operations/behavior.ts`    |
| `retargeting` | Replace with Apollo                                                | `graphql/operations/retargeting.ts` |
| `campaign`    | Replace with Apollo                                                | `graphql/operations/campaign.ts`    |
| `permissions` | Keep in Redux (minimal) — stores role/permission checks            | `redux/slices/permissionsSlice.ts`  |

### 3.3 Context Cleanup

| Context                          | Action                                                 |
| -------------------------------- | ------------------------------------------------------ |
| `appContext/`                    | **DELETE** — replaced by Apollo cache                  |
| `crud/`                          | **DELETE** — replaced by Apollo `useQuery`             |
| `advancedCrud/` (adavancedCrud/) | **DELETE** — replaced by Apollo                        |
| `erp/`                           | **DELETE** — replaced by Apollo                        |
| `profileContext/`                | **DELETE** — replaced by Apollo query for user profile |
| `NotificationContext.jsx`        | KEEP — wraps Socket.io connection                      |
| `CopilotContext.jsx`             | KEEP — UI state for chatbot visibility                 |
| `AiContext.js`                   | KEEP or replace with Apollo                            |
| `MarketingContext.jsx`           | **DELETE** — replaced by Apollo                        |

### 3.4 Frontend GraphQL Operations Creation

For each domain, create an operations file with typed queries and mutations:

```
frontend/src/graphql/operations/
├── auth.ts           # LOGIN_MUTATION, REGISTER_MUTATION, VERIFY_TOKEN_QUERY, etc.
├── settings.ts       # SETTINGS_LIST_QUERY, UPDATE_SETTING_MUTATION, etc.
├── client.ts         # CLIENT_LIST_QUERY, CLIENT_READ_QUERY, CREATE_CLIENT_MUTATION, etc.
├── invoice.ts
├── quote.ts
├── payment.ts
├── team.ts
├── task.ts
├── reminder.ts
├── document.ts
├── notification.ts
├── chat.ts
├── url.ts
├── abTest.ts
├── survey.ts
├── workflow.ts
├── businessProcess.ts
├── workflowExecution.ts
├── appointment.ts
├── campaign.ts
├── trigger.ts
├── analytics.ts
├── reputationAnalytics.ts
├── globalAnalytics.ts
├── statistics.ts
├── socialMedia.ts
├── marketing.ts
├── retargeting.ts
├── compliance.ts
├── audit.ts
├── aiAssistant.ts
├── aiDataProcessor.ts
├── aiEnhanced.ts
├── aiPreferences.ts
├── aiKnowledgeBase.ts
├── copilot.ts
├── crmUrl.ts
├── taxes.ts
├── paymentMode.ts
└── dataEntry.ts
```

### 3.5 Custom Hook Layer

Create typed hooks that wrap Apollo operations:

```
frontend/src/hooks/
├── useAuth.ts              # Login, register, logout, verify
├── useSettings.ts          # Settings CRUD
├── useClient.ts            # Client queries/mutations
├── useInvoice.ts           # Invoice operations
├── useQuote.ts
├── usePayment.ts
├── useTeam.ts
├── useTask.ts
├── useReminder.ts
├── useDocument.ts
├── useNotifications.ts     # (update existing)
├── useChat.ts
├── useUrl.ts               # (update existing)
├── useABTest.ts
├── useSurvey.ts
├── useWorkflow.ts
├── useBusinessProcess.ts
├── useAppointment.ts
├── useCampaign.ts
├── useAnalytics.ts
├── useStatistics.ts        # (update existing)
├── useSocialMedia.ts       # (update existing)
├── useReputation.ts
├── useMarketing.ts
├── useRetargeting.ts
├── useCompliance.ts
├── useAI.ts
├── useCopilot.ts
├── usePermissions.ts       # (update existing)
└── useCrmUrl.ts
```

---

## 8. Phase 4: REST Route-by-Route Replacement

> **CRITICAL RULE**: Remove ONE route at a time. Do NOT move to the next route until the current one is fully replaced (backend schema + resolver + frontend operation + tested).

### Replacement Procedure (for every single route)

```
For each REST route:
  1. ✅ Verify GraphQL typeDef exists for this operation
  2. ✅ Verify GraphQL resolver exists and works (test in playground)
  3. ✅ Create/update frontend GraphQL operation (query/mutation)
  4. ✅ Find ALL frontend files that call this REST endpoint
  5. ✅ Replace each frontend call with Apollo hook
  6. ✅ Test the frontend flow end-to-end
  7. ✅ Remove the REST route from the route file
  8. ✅ Remove the route import from app.js (if entire file is empty)
  9. ✅ Run full test suite
  10. ✅ Commit with message: "migrate: replace REST {METHOD} {path} with GraphQL {operation}"
```

### 4.1 Migration Order (Route by Route)

#### Batch A: Auth Routes (already partially done)

| #   | REST Endpoint              | GraphQL Operation         | Frontend Files to Update                                |
| --- | -------------------------- | ------------------------- | ------------------------------------------------------- |
| A1  | `POST /api/login`          | `mutation login`          | `redux/auth/actions.js`, `forms/LoginForm.jsx`          |
| A2  | `POST /api/register`       | `mutation register`       | `redux/auth/actions.js`, `forms/RegisterForm.jsx`       |
| A3  | `POST /api/logout`         | `mutation logout`         | `redux/auth/actions.js`, header/nav components          |
| A4  | `POST /api/forgetpassword` | `mutation forgetPassword` | `redux/auth/actions.js`, `forms/ForgetPasswordForm.jsx` |
| A5  | `POST /api/resetpassword`  | `mutation resetPassword`  | `redux/auth/actions.js`, `forms/ResetPasswordForm.jsx`  |
| A6  | `GET /api/verify-token`    | `query verifyToken`       | `redux/auth/actions.js`, `router/ProtectedRoutes.jsx`   |

#### Batch B: Settings (high usage, foundational)

| #   | REST Endpoint                                | GraphQL Operation             | Frontend Files                              |
| --- | -------------------------------------------- | ----------------------------- | ------------------------------------------- |
| B1  | `GET /api/setting/list`                      | `query settingList`           | `redux/settings/actions.js`, Settings pages |
| B2  | `GET /api/setting/listAll`                   | `query settingListAll`        | Settings pages                              |
| B3  | `GET /api/setting/read/:id`                  | `query settingRead`           | Settings detail pages                       |
| B4  | `GET /api/setting/readBySettingKey/:key`     | `query settingByKey`          | Multiple components                         |
| B5  | `GET /api/setting/listBySettingKey`          | `query settingListByKey`      | Settings pages                              |
| B6  | `POST /api/setting/create`                   | `mutation settingCreate`      | Settings forms                              |
| B7  | `PATCH /api/setting/update/:id`              | `mutation settingUpdate`      | Settings forms                              |
| B8  | `PATCH /api/setting/updateBySettingKey/:key` | `mutation settingUpdateByKey` | Settings forms                              |
| B9  | `PATCH /api/setting/upload/:key`             | `mutation settingUpload`      | Settings file upload                        |
| B10 | `PATCH/POST /api/setting/updateManySetting`  | `mutation settingUpdateMany`  | Batch settings                              |
| B11 | `POST /api/setting/batch`                    | `mutation settingBatch`       | Batch settings                              |
| B12 | `GET /api/setting/search`                    | `query settingSearch`         | Settings search                             |
| B13 | `GET /api/setting/filter`                    | `query settingFilter`         | Settings filter                             |
| B14 | `POST /api/setting/testOpenAI`               | `mutation testOpenAI`         | AI settings                                 |
| B15 | `POST /api/setting/testGemini`               | `mutation testGemini`         | AI settings                                 |
| B16 | `POST /api/setting/testClaude`               | `mutation testClaude`         | AI settings                                 |

#### Batch C: Admin & User Management

| #   | REST Endpoint                          | GraphQL Operation                |
| --- | -------------------------------------- | -------------------------------- |
| C1  | `GET /api/admin/list`                  | `query adminList`                |
| C2  | `GET /api/admin/read/:id`              | `query adminRead`                |
| C3  | `POST /api/admin/password-update/:id`  | `mutation adminPasswordUpdate`   |
| C4  | `POST /api/admin/completeCompanySetup` | `mutation completeCompanySetup`  |
| C5  | `PATCH /api/admin/profile/password`    | `mutation updateProfilePassword` |
| C6  | `PATCH /api/admin/profile/update`      | `mutation updateProfile`         |
| C7  | `GET /api/user/profile`                | `query userProfile`              |
| C8  | `PATCH /api/user/profile/update`       | `mutation updateUserProfile`     |
| C9  | `PATCH /api/user/profile/password`     | `mutation updateUserPassword`    |
| C10 | `GET /api/user/permissions`            | `query userPermissions`          |

#### Batch D: Generic ERP CRUD (Client, Invoice, Quote, Payment, Project, Schedule)

This is the **largest batch** — the generic CRUD routes via `appApi.js` and `coreApi.js`.

| #   | Entity       | Operations to Migrate                                                            | Frontend Slice     |
| --- | ------------ | -------------------------------------------------------------------------------- | ------------------ |
| D1  | **Client**   | create, read, update, delete, list, listAll, search, filter, summary             | `crud` slice       |
| D2  | **Invoice**  | create, read, update, delete, list, listAll, search, filter, summary + recurring | `crud`/`erp` slice |
| D3  | **Quote**    | create, read, update, delete, list, listAll, search, filter, summary + delivery  | `crud`/`erp` slice |
| D4  | **Payment**  | create, read, update, delete, list, listAll, search, filter, summary             | `crud`/`erp` slice |
| D5  | **Project**  | create, read, update, delete, list, listAll, search, filter, summary             | `crud` slice       |
| D6  | **Schedule** | create, read, update, delete, list, listAll, search, filter                      | `crud` slice       |

**For each entity in D1-D6:**
| Sub-step | REST Pattern | GraphQL Pattern |
|----------|-------------|-----------------|
| x.1 | `GET /api/{entity}/list` | `query {entity}List(pagination: PaginationInput)` |
| x.2 | `GET /api/{entity}/listAll` | `query {entity}ListAll` |
| x.3 | `GET /api/{entity}/read/:id` | `query {entity}Read(id: ID!)` |
| x.4 | `GET /api/{entity}/search` | `query {entity}Search(q: String, pagination: PaginationInput)` |
| x.5 | `GET /api/{entity}/filter` | `query {entity}Filter(filter: [FilterInput])` |
| x.6 | `GET /api/{entity}/summary` | `query {entity}Summary` |
| x.7 | `POST /api/{entity}/create` | `mutation {entity}Create(input: {Entity}Input!)` |
| x.8 | `PATCH /api/{entity}/update/:id` | `mutation {entity}Update(id: ID!, input: {Entity}Input!)` |
| x.9 | `DELETE /api/{entity}/delete/:id` | `mutation {entity}Delete(id: ID!)` |

#### Batch E: Taxes & Payment Modes

| #   | REST Endpoint                 | GraphQL Operation            |
| --- | ----------------------------- | ---------------------------- |
| E1  | `GET /api/taxes`              | `query taxesList`            |
| E2  | `POST /api/taxes`             | `mutation taxesCreate`       |
| E3  | `GET /api/taxes/:id`          | `query taxesRead`            |
| E4  | `PATCH /api/taxes/:id`        | `mutation taxesUpdate`       |
| E5  | `DELETE /api/taxes/:id`       | `mutation taxesDelete`       |
| E6  | `GET /api/paymentMode`        | `query paymentModeList`      |
| E7  | `POST /api/paymentMode`       | `mutation paymentModeCreate` |
| E8  | `GET /api/paymentMode/:id`    | `query paymentModeRead`      |
| E9  | `PATCH /api/paymentMode/:id`  | `mutation paymentModeUpdate` |
| E10 | `DELETE /api/paymentMode/:id` | `mutation paymentModeDelete` |

#### Batch F: Team Management

| #   | REST Endpoint                                         | GraphQL Operation             |
| --- | ----------------------------------------------------- | ----------------------------- |
| F1  | `GET /api/team`                                       | `query teamList`              |
| F2  | `GET /api/team/list`                                  | `query teamListPaginated`     |
| F3  | `POST /api/team`                                      | `mutation teamCreate`         |
| F4  | `GET /api/team/:id`                                   | `query teamRead`              |
| F5  | `PATCH /api/team/update/:id`                          | `mutation teamUpdate`         |
| F6  | `DELETE /api/team/:id`                                | `mutation teamDelete`         |
| F7  | `POST /api/team/:teamId/invite`                       | `mutation teamInviteMember`   |
| F8  | `GET /api/team/:teamId/members`                       | `query teamMembers`           |
| F9  | `PATCH /api/team/:teamId/members/:memberId`           | `mutation teamUpdateMember`   |
| F10 | `DELETE /api/team/:teamId/members/:memberId`          | `mutation teamRemoveMember`   |
| F11 | `GET /api/team/:teamId/members/:memberId/performance` | `query teamMemberPerformance` |

#### Batch G: Tasks & Reminders

| #       | REST Endpoint                                  | GraphQL Operation                 |
| ------- | ---------------------------------------------- | --------------------------------- |
| G1      | `POST /api/task/create`                        | `mutation taskCreate`             |
| G2      | `GET /api/task/read/:id`                       | `query taskRead`                  |
| G3      | `PATCH /api/task/update/:id`                   | `mutation taskUpdate`             |
| G4      | `DELETE /api/task/delete/:id`                  | `mutation taskDelete`             |
| G5      | `GET /api/task/search`                         | `query taskSearch`                |
| G6      | `GET /api/task/list`                           | `query taskList`                  |
| G7      | `GET /api/task/listAll`                        | `query taskListAll`               |
| G8      | `GET /api/task/filter`                         | `query taskFilter`                |
| G9      | `GET /api/task/summary`                        | `query taskSummary`               |
| G10     | `POST /api/task/ai/prioritize`                 | `mutation taskAIPrioritize`       |
| G11     | `PATCH /api/task/batch/priorities`             | `mutation taskBatchPriorities`    |
| G12     | `PATCH /api/task/:taskId/progress`             | `mutation taskUpdateProgress`     |
| G13     | `PATCH /api/task/:taskId/watchers`             | `mutation taskUpdateWatchers`     |
| G14     | `POST /api/task/:taskId/comments`              | `mutation taskAddComment`         |
| G15     | `PATCH /api/task/:taskId/comments/:commentId`  | `mutation taskUpdateComment`      |
| G16     | `DELETE /api/task/:taskId/comments/:commentId` | `mutation taskDeleteComment`      |
| G17     | `POST /api/task/:taskId/attachments`           | `mutation taskAddAttachment`      |
| G18     | `PATCH /api/task/:taskId/related-items`        | `mutation taskUpdateRelatedItems` |
| G19-G27 | All reminder routes                            | `query/mutation reminder*`        |

#### Batch H: Notifications

| #   | REST Endpoint                             | GraphQL Operation                   |
| --- | ----------------------------------------- | ----------------------------------- |
| H1  | `GET /api/notifications`                  | `query notifications`               |
| H2  | `GET /api/notifications/unread-count`     | `query notificationUnreadCount`     |
| H3  | `GET /api/notifications/stats`            | `query notificationStats`           |
| H4  | `GET /api/notifications/aggregated`       | `query notificationsAggregated`     |
| H5  | `GET /api/notifications/:id`              | `query notificationRead`            |
| H6  | `PATCH /api/notifications/:id/read`       | `mutation notificationMarkRead`     |
| H7  | `PATCH /api/notifications/mark-many-read` | `mutation notificationMarkManyRead` |
| H8  | `PATCH /api/notifications/mark-all-read`  | `mutation notificationMarkAllRead`  |
| H9  | `DELETE /api/notifications/:id`           | `mutation notificationDelete`       |

#### Batch I: Chat

| #      | REST Endpoint                   | GraphQL Operation              |
| ------ | ------------------------------- | ------------------------------ |
| I1     | `POST /api/chat/send`           | `mutation chatSend`            |
| I2     | `GET /api/chat/history/:userId` | `query chatHistory`            |
| I3     | `GET /api/chat/list`            | `query chatList`               |
| I4     | `GET /api/chat/users`           | `query chatUsers`              |
| I5-I12 | Customer chat routes            | `query/mutation customerChat*` |

#### Batch J: URL Shortener & Analytics

| #       | REST Endpoint               | GraphQL Operation        |
| ------- | --------------------------- | ------------------------ |
| J1      | `GET /api/url`              | `query urlList`          |
| J2      | `POST /api/url`             | `mutation urlCreate`     |
| J3      | `GET /api/url/search`       | `query urlSearch`        |
| J4      | `GET /api/url/summary`      | `query urlSummary`       |
| J5      | `POST /api/url/bulk`        | `mutation urlBulkCreate` |
| J6      | `GET /api/url/list`         | `query urlListPaginated` |
| J7      | `GET /api/url/:id`          | `query urlRead`          |
| J8      | `DELETE /api/url/:id`       | `mutation urlDelete`     |
| J9      | `PATCH /api/url/update/:id` | `mutation urlUpdate`     |
| J10     | `POST /api/url/:id/clone`   | `mutation urlClone`      |
| J11-J18 | URL analytics routes        | `query urlAnalytics*`    |

**Note**: `GET /api/s/:shortCode` STAYS REST (HTTP redirect)

#### Batch K: A/B Testing

| #      | REST Endpoint     | GraphQL Operation        |
| ------ | ----------------- | ------------------------ |
| K1-K11 | All abtest routes | `query/mutation abTest*` |

#### Batch L: Documents (non-upload operations only)

| #       | REST Endpoint                        | GraphQL Operation                    |
| ------- | ------------------------------------ | ------------------------------------ |
| L1      | `GET /api/document/list`             | `query documentList`                 |
| L2      | `GET /api/document/search`           | `query documentSearch`               |
| L3      | `POST /api/document/advanced-search` | `query documentAdvancedSearch`       |
| L4      | `GET /api/document/filter`           | `query documentFilter`               |
| L5      | `GET /api/document/read/:id`         | `query documentRead`                 |
| L6      | `PATCH /api/document/update/:id`     | `mutation documentUpdate`            |
| L7      | `DELETE /api/document/delete/:id`    | `mutation documentDelete`            |
| L8-L10  | Document AI operations               | `mutation documentAI*`               |
| L11-L18 | Document version operations          | `query/mutation documentVersion*`    |
| L19-L23 | Document compliance/audit            | `query/mutation documentCompliance*` |
| L24-L27 | Document share/link/edit/esign       | `mutation document*`                 |

**Note**: `POST /api/document` (file upload) and `GET /api/document/download/:id` STAY REST

#### Batch M: Surveys

| #      | REST Endpoint     | GraphQL Operation        |
| ------ | ----------------- | ------------------------ |
| M1-M18 | All survey routes | `query/mutation survey*` |

#### Batch N: Campaigns & Triggers

| #       | REST Endpoint   | GraphQL Operation          |
| ------- | --------------- | -------------------------- |
| N1-N11  | Campaign routes | `query/mutation campaign*` |
| N12-N18 | Trigger routes  | `query/mutation trigger*`  |

#### Batch O: Workflows & Business Processes

| #       | REST Endpoint             | GraphQL Operation                   |
| ------- | ------------------------- | ----------------------------------- |
| O1-O5   | Workflow CRUD             | `query/mutation workflow*`          |
| O6-O14  | Business process routes   | `query/mutation businessProcess*`   |
| O15-O20 | Workflow execution routes | `query/mutation workflowExecution*` |

#### Batch P: Appointments

| #     | REST Endpoint      | GraphQL Operation             |
| ----- | ------------------ | ----------------------------- |
| P1-P8 | Appointment routes | `query/mutation appointment*` |

**Note**: `GET/POST /api/appointments/book/:shortCode` STAYS REST (public booking)

#### Batch Q: Analytics & Statistics

| #       | REST Endpoint        | GraphQL Operation                 |
| ------- | -------------------- | --------------------------------- |
| Q1-Q8   | Analytics routes     | `query analytics*`                |
| Q9-Q15  | Reputation analytics | `query reputationAnalytics*`      |
| Q16-Q35 | Global analytics     | `query/mutation globalAnalytics*` |
| Q36-Q46 | Statistics routes    | `query statistics*`               |

#### Batch R: Social Media

| #       | REST Endpoint                      | GraphQL Operation                |
| ------- | ---------------------------------- | -------------------------------- |
| R1-R8   | Social account routes              | `query/mutation socialAccount*`  |
| R9-R20  | Social post routes                 | `query/mutation socialPost*`     |
| R21-R28 | Social campaign routes             | `query/mutation socialCampaign*` |
| R29-R36 | Social analytics routes            | `query socialAnalytics*`         |
| R37-R50 | Social mention/AI/media/URL routes | `query/mutation social*`         |

#### Batch S: Marketing & Retargeting

| #      | REST Endpoint      | GraphQL Operation             |
| ------ | ------------------ | ----------------------------- |
| S1-S7  | Retargeting routes | `query/mutation retargeting*` |
| S2-S10 | Marketing routes   | `query/mutation marketing*`   |

#### Batch T: Compliance & Audit

| #       | REST Endpoint     | GraphQL Operation            |
| ------- | ----------------- | ---------------------------- |
| T1-T10  | Compliance routes | `query/mutation compliance*` |
| T11-T13 | Audit routes      | `query audit*`               |

#### Batch U: AI Assistant & Copilot

| #       | REST Endpoint       | GraphQL Operation             |
| ------- | ------------------- | ----------------------------- |
| U1-U15  | AI Assistant routes | `query/mutation aiAssistant*` |
| U16-U20 | Copilot routes      | `query/mutation copilot*`     |

#### Batch V: AI Data Processor & Enhanced

| #       | REST Endpoint            | GraphQL Operation                 |
| ------- | ------------------------ | --------------------------------- |
| V1-V10  | AI Data Processor routes | `query/mutation aiDataProcessor*` |
| V11-V27 | AI Enhanced routes       | `query/mutation aiEnhanced*`      |

#### Batch W: AI Preferences & Knowledge Base

| #     | REST Endpoint            | GraphQL Operation                 |
| ----- | ------------------------ | --------------------------------- |
| W1-W3 | AI Preferences routes    | `query/mutation aiPreference*`    |
| W4-W9 | AI Knowledge Base routes | `query/mutation aiKnowledgeBase*` |

#### Batch X: CRM URL Generation

| #      | REST Endpoint  | GraphQL Operation             |
| ------ | -------------- | ----------------------------- |
| X1-X11 | CRM URL routes | `mutation clientGenerateUrl*` |

#### Batch Y: Data Entry (non-upload only)

| #     | REST Endpoint                                    | GraphQL Operation                     |
| ----- | ------------------------------------------------ | ------------------------------------- |
| Y1    | `GET /api/data-entry/modules`                    | `query dataEntryModules`              |
| Y2    | `GET /api/data-entry/modules/:moduleName/schema` | `query dataEntryModuleSchema`         |
| Y3-Y4 | Validation routes                                | `query/mutation dataEntryValidation*` |

**Note**: OCR and spreadsheet upload routes STAY REST

---

## 9. Phase 5: Frontend TypeScript Conversion

> **Goal**: Convert all remaining .jsx/.js files to .tsx/.ts as they're touched during GraphQL migration.

### 5.1 Conversion Order (by dependency)

#### Tier 1: Infrastructure (convert first)

| #     | File(s)                                                | Type       |
| ----- | ------------------------------------------------------ | ---------- |
| 5.1.1 | `config/*.js → .ts`                                    | Config     |
| 5.1.2 | `utils/*.js → .ts`                                     | Utilities  |
| 5.1.3 | `redux/store.js → .ts`                                 | Store      |
| 5.1.4 | `redux/rootReducer.js → .ts`                           | Reducer    |
| 5.1.5 | All Redux slice files → `.ts`                          | State      |
| 5.1.6 | `request/index.js → .ts` (then delete after migration) | API        |
| 5.1.7 | `graphql/client.js → .ts`                              | Apollo     |
| 5.1.8 | `graphql/operations.js → .ts`                          | Operations |

#### Tier 2: Hooks and Context

| #     | File(s)                    | Count    |
| ----- | -------------------------- | -------- |
| 5.2.1 | All `hooks/*.jsx → .ts`    | 14 files |
| 5.2.2 | All `context/*.jsx → .tsx` | 12 files |

#### Tier 3: Router and Layout

| #     | File(s)               | Count   |
| ----- | --------------------- | ------- |
| 5.3.1 | `router/*.jsx → .tsx` | 4 files |
| 5.3.2 | `layout/*.jsx → .tsx` | 8 files |

#### Tier 4: Forms

| #     | File(s)                  | Count    |
| ----- | ------------------------ | -------- |
| 5.4.1 | All `forms/*.jsx → .tsx` | 19 files |

#### Tier 5: Components

| #     | File(s)                          | Count      |
| ----- | -------------------------------- | ---------- |
| 5.5.1 | All `components/**/*.jsx → .tsx` | 107+ files |

#### Tier 6: Pages

| #     | File(s)                     | Count      |
| ----- | --------------------------- | ---------- |
| 5.6.1 | All `pages/**/*.jsx → .tsx` | 290+ files |

#### Tier 7: Apps and Entry

| #     | File(s)               | Count   |
| ----- | --------------------- | ------- |
| 5.7.1 | `apps/*.jsx → .tsx`   | 6 files |
| 5.7.2 | `services/*.js → .ts` | 4 files |

### 5.2 TypeScript Conversion Procedure

For each file:

1. Rename `.js` → `.ts` or `.jsx` → `.tsx`
2. Add type annotations to function parameters
3. Add return types to functions
4. Type component props with interfaces
5. Replace `any` with proper types (use generated GraphQL types)
6. Fix all TypeScript compiler errors
7. Run `tsc --noEmit` to verify
8. Run the app to verify no runtime errors

---

## 10. Phase 6: Cleanup and Final Removal

### 6.1 Backend Cleanup

| Step  | Action                                                                | Files Affected                                    |
| ----- | --------------------------------------------------------------------- | ------------------------------------------------- |
| 6.1.1 | Delete all empty route files                                          | `routes/appRoutes/*.js`, `routes/coreRoutes/*.js` |
| 6.1.2 | Delete `routes/` directory entirely (after all routes migrated)       | Entire directory                                  |
| 6.1.3 | Remove legacy route imports from `app.ts`                             | `app.ts`                                          |
| 6.1.4 | Delete `controllers/middlewaresControllers/createCRUDController/`     | Generic CRUD factory                              |
| 6.1.5 | Consolidate controllers → services (resolvers call services directly) | All controllers                                   |
| 6.1.6 | Remove unused middleware for REST-only patterns                       | Various                                           |
| 6.1.7 | Update `package.json` — remove unused REST-only dependencies          | `package.json`                                    |
| 6.1.8 | Delete all `.js` files that have been converted to `.ts`              | All converted files                               |

### 6.2 Frontend Cleanup

| Step   | Action                                                            | Files Affected                                 |
| ------ | ----------------------------------------------------------------- | ---------------------------------------------- |
| 6.2.1  | Delete `request/index.js` (Request class)                         | Main REST client                               |
| 6.2.2  | Delete `request/request.js`                                       | Re-export file                                 |
| 6.2.3  | Delete `request/errorHandler.js`                                  | REST error handler (Apollo handles errors now) |
| 6.2.4  | Delete `request/successHandler.js`                                | REST success handler                           |
| 6.2.5  | Delete `request/customRequests.js`                                | Custom REST requests                           |
| 6.2.6  | Delete `request/teamCustomRequests.js`                            | Team requests                                  |
| 6.2.7  | Delete `request/taskRequest.js`                                   | Task requests                                  |
| 6.2.8  | Delete `request/codeMessage.js`                                   | Error code mapper                              |
| 6.2.9  | Delete entire `request/` directory                                | All REST client code                           |
| 6.2.10 | Delete `redux/crud/` directory                                    | Generic CRUD slice                             |
| 6.2.11 | Delete `redux/erp/` directory                                     | ERP slice                                      |
| 6.2.12 | Delete `redux/settings/` directory (if fully Apollo)              | Settings slice                                 |
| 6.2.13 | Delete `redux/socialMedia/` directory                             | Social media slice                             |
| 6.2.14 | Delete `redux/ai/` directory (data-fetching parts)                | AI slice                                       |
| 6.2.15 | Delete `redux/url/` directory                                     | URL slice                                      |
| 6.2.16 | Delete `redux/reputation/` directory                              | Reputation slice                               |
| 6.2.17 | Delete `redux/marketing/` directory                               | Marketing slice                                |
| 6.2.18 | Delete `context/appContext/`                                      | Generic app context                            |
| 6.2.19 | Delete `context/crud/`                                            | CRUD context                                   |
| 6.2.20 | Delete `context/adavancedCrud/`                                   | Advanced CRUD context                          |
| 6.2.21 | Delete `context/erp/`                                             | ERP context                                    |
| 6.2.22 | Delete `context/profileContext/`                                  | Profile context                                |
| 6.2.23 | Delete all `.jsx`/`.js` files that have `.tsx`/`.ts` replacements | All converted files                            |
| 6.2.24 | Update `rootReducer.ts` to only include remaining slices          | `rootReducer.ts`                               |

### 6.3 Final Verification

| Check                           | Command                                                                                | Expected                                |
| ------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------- |
| Backend TypeScript compilation  | `npx tsc --noEmit`                                                                     | 0 errors                                |
| Frontend TypeScript compilation | `npx tsc --noEmit`                                                                     | 0 errors                                |
| Frontend build                  | `npm run build`                                                                        | No errors                               |
| GraphQL schema valid            | Apollo Server starts                                                                   | No schema errors                        |
| All REST routes removed         | Search codebase for `router.get\|router.post\|router.patch\|router.delete\|router.put` | Only REST-must-stay routes              |
| No REST API calls in frontend   | Search for `axios.get\|axios.post\|request.list\|request.create`                       | 0 matches (except file upload)          |
| Redux only has UI state         | Check `rootReducer.ts`                                                                 | Only `auth`, `permissions`, `ui` slices |
| All files are TypeScript        | `find . -name "*.js" -o -name "*.jsx"` in src/                                         | 0 matches                               |

---

## 11. Terminology Transition Reference

### 11.1 REST → GraphQL Terminology

| REST Term                      | GraphQL Term                | Context                |
| ------------------------------ | --------------------------- | ---------------------- |
| Endpoint / Route               | Operation                   | A single API operation |
| GET request                    | Query                       | Read data              |
| POST request (create)          | Mutation                    | Create data            |
| PUT/PATCH request              | Mutation                    | Update data            |
| DELETE request                 | Mutation                    | Delete data            |
| Request body                   | Input type / Variables      | Data sent to server    |
| Response body                  | Return type                 | Data received          |
| URL parameters (`:id`)         | Arguments (`id: ID!`)       | Operation parameters   |
| Query string (`?page=1`)       | Variables (`$page: Int`)    | Filtering/pagination   |
| HTTP status codes              | Errors / extensions         | Error handling         |
| REST API                       | GraphQL API                 | Overall API layer      |
| API endpoint                   | GraphQL operation           | Single callable unit   |
| CRUD operations                | Queries and Mutations       | Data operations        |
| `router.get/post/patch/delete` | `Query/Mutation` in schema  | Route definition       |
| Express Router                 | GraphQL Resolver            | Request handler        |
| Route handler / Controller     | Resolver function           | Business logic entry   |
| Middleware                     | GraphQL directive / Context | Cross-cutting concerns |
| Request interceptor            | Apollo Link                 | Request modification   |
| Response interceptor           | Apollo afterware            | Response processing    |
| `req.params.id`                | `args.id`                   | Path parameters        |
| `req.body`                     | `args.input`                | Request payload        |
| `req.query`                    | `args` (variables)          | Query parameters       |

### 11.2 Code-Level Renaming

| Old Pattern                                             | New Pattern                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------ |
| `request.list({ entity: 'client' })`                    | `useQuery(CLIENT_LIST_QUERY)`                                |
| `request.create({ entity: 'client', jsonData })`        | `useMutation(CREATE_CLIENT_MUTATION)`                        |
| `request.read({ entity: 'client', id })`                | `useQuery(CLIENT_READ_QUERY, { variables: { id } })`         |
| `request.update({ entity: 'client', id, jsonData })`    | `useMutation(UPDATE_CLIENT_MUTATION)`                        |
| `request.delete({ entity: 'client', id })`              | `useMutation(DELETE_CLIENT_MUTATION)`                        |
| `dispatch(crud.list({ entity: 'client' }))`             | `const { data, loading } = useQuery(CLIENT_LIST_QUERY)`      |
| `dispatch(crud.create({ entity: 'client', jsonData }))` | `const [createClient] = useMutation(CREATE_CLIENT_MUTATION)` |
| `useSelector(selectListItems)`                          | `data?.clientList.result` (from Apollo cache)                |
| `isLoading` from Redux                                  | `loading` from `useQuery`                                    |
| `isSuccess` from Redux                                  | Check `data` is not undefined                                |
| `axios.get('/api/...')`                                 | `useQuery(OPERATION)` or `client.query()`                    |
| `axios.post('/api/...')`                                | `useMutation(OPERATION)`                                     |

### 11.3 File Naming Conventions

| Old Convention                   | New Convention                                                    |
| -------------------------------- | ----------------------------------------------------------------- |
| `*Routes.js`                     | DELETE (GraphQL handles routing)                                  |
| `*Controller.js`                 | `*Resolver.ts` (for GraphQL) + `*Service.ts` (for business logic) |
| `*actions.js` (Redux)            | `*Operations.ts` (GraphQL operations)                             |
| `*reducer.js` (Redux)            | DELETE (Apollo cache replaces reducers)                           |
| `*types.js` (Redux action types) | DELETE                                                            |
| `*selectors.js` (Redux)          | DELETE (Apollo provides data directly)                            |
| `request/*.js`                   | DELETE (Apollo Client replaces axios)                             |

---

## 12. Complete File Inventory

### 12.1 Files to DELETE (after migration)

#### Backend (routes — 45 files)

```
src/routes/appRoutes/abTestRoutes.js
src/routes/appRoutes/aiAssistantRoutes.js
src/routes/appRoutes/aiDataProcessorRoutes.js
src/routes/appRoutes/aiEnhancedRoutes.js
src/routes/appRoutes/aiKnowledgeBaseRoutes.js
src/routes/appRoutes/aiUserPreferenceRoutes.js
src/routes/appRoutes/analyticsRoutes.js
src/routes/appRoutes/appApi.js
src/routes/appRoutes/appointmentRoutes.js
src/routes/appRoutes/auditRoutes.js
src/routes/appRoutes/businessProcessRoutes.js
src/routes/appRoutes/campaignRoutes.js
src/routes/appRoutes/chatRoutes.js
src/routes/appRoutes/complianceRoutes.js
src/routes/appRoutes/copilotRoutes.js
src/routes/appRoutes/crmUrlRoutes.js
src/routes/appRoutes/customerChatRoutes.js
src/routes/appRoutes/documentAuditRoutes.js
src/routes/appRoutes/documentRoutes.js
src/routes/appRoutes/globalAnalyticsRoutes.js
src/routes/appRoutes/marketingRoutes.js
src/routes/appRoutes/notificationRoutes.js
src/routes/appRoutes/paymentModeRoutes.js
src/routes/appRoutes/reminderRoutes.js
src/routes/appRoutes/reputationAnalyticsRoutes.js
src/routes/appRoutes/retargetingRoutes.js
src/routes/appRoutes/socialMediaRoutes.js
src/routes/appRoutes/statisticsRoutes.js
src/routes/appRoutes/taskRoutes.js
src/routes/appRoutes/taxesRoutes.js
src/routes/appRoutes/teamRoutes.js
src/routes/appRoutes/triggerRoutes.js
src/routes/appRoutes/urlRoutes.js
src/routes/appRoutes/userRoutes.js
src/routes/appRoutes/workflowExecutionRoutes.js
src/routes/coreRoutes/coreApi.js
src/routes/coreRoutes/coreAuth.js
src/routes/dataEntryRoutes.js (partially — keep upload routes)
src/routes/surveyRoutes.js
src/routes/workflows-simple.js
```

#### Frontend (request layer — 10 files)

```
src/request/index.js
src/request/request.js
src/request/errorHandler.js
src/request/successHandler.js
src/request/customRequests.js
src/request/teamCustomRequests.js
src/request/taskRequest.js
src/request/downloadDocument.js (keep if still used for binary downloads)
src/request/checkImage.js
src/request/codeMessage.js
```

#### Frontend (Redux slices to delete — ~40 files)

```
src/redux/crud/ (entire directory — 5 files)
src/redux/erp/ (entire directory — 6 files)
src/redux/settings/ (entire directory — 5 files)
src/redux/socialMedia/ (entire directory — 5 files)
src/redux/ai/ (entire directory — 5 files)
src/redux/url/ (entire directory — 3 files)
src/redux/reputation/ (entire directory — 4 files)
src/redux/marketing/ (entire directory — 6 files)
```

#### Frontend (Contexts to delete — ~20 files)

```
src/context/appContext/ (4 files)
src/context/crud/ (5 files)
src/context/adavancedCrud/ (5 files)
src/context/erp/ (4 files)
src/context/profileContext/ (5 files)
```

### 12.2 Files to CREATE

#### Backend (GraphQL layer — ~80 new files)

```
src/types/context.ts
src/types/common.ts
src/types/models/*.ts (per model — 68 files)
src/graphql/typeDefs/common.ts (populate from empty)
src/graphql/typeDefs/setting.ts
src/graphql/typeDefs/user.ts
src/graphql/typeDefs/client.ts
src/graphql/typeDefs/invoice.ts
src/graphql/typeDefs/quote.ts
src/graphql/typeDefs/payment.ts
src/graphql/typeDefs/team.ts
src/graphql/typeDefs/task.ts
src/graphql/typeDefs/reminder.ts
src/graphql/typeDefs/document.ts
src/graphql/typeDefs/notification.ts
src/graphql/typeDefs/chat.ts
src/graphql/typeDefs/url.ts
src/graphql/typeDefs/abTest.ts
src/graphql/typeDefs/survey.ts
src/graphql/typeDefs/workflow.ts
src/graphql/typeDefs/businessProcess.ts
src/graphql/typeDefs/workflowExecution.ts
src/graphql/typeDefs/appointment.ts
src/graphql/typeDefs/campaign.ts
src/graphql/typeDefs/trigger.ts
src/graphql/typeDefs/analytics.ts
src/graphql/typeDefs/reputationAnalytics.ts
src/graphql/typeDefs/globalAnalytics.ts
src/graphql/typeDefs/statistics.ts
src/graphql/typeDefs/socialMedia.ts
src/graphql/typeDefs/marketing.ts
src/graphql/typeDefs/retargeting.ts
src/graphql/typeDefs/compliance.ts
src/graphql/typeDefs/audit.ts
src/graphql/typeDefs/aiAssistant.ts
src/graphql/typeDefs/aiDataProcessor.ts
src/graphql/typeDefs/aiEnhanced.ts
src/graphql/typeDefs/aiPreferences.ts
src/graphql/typeDefs/aiKnowledgeBase.ts
src/graphql/typeDefs/copilot.ts
src/graphql/typeDefs/crmUrl.ts
src/graphql/typeDefs/dataEntry.ts
src/graphql/typeDefs/taxes.ts
src/graphql/typeDefs/paymentMode.ts
(+ matching resolvers/*.ts for each)
```

#### Frontend (GraphQL operations — ~40 new files)

```
src/graphql/operations/auth.ts
src/graphql/operations/settings.ts
src/graphql/operations/client.ts
src/graphql/operations/invoice.ts
src/graphql/operations/quote.ts
src/graphql/operations/payment.ts
src/graphql/operations/team.ts
src/graphql/operations/task.ts
src/graphql/operations/reminder.ts
src/graphql/operations/document.ts
src/graphql/operations/notification.ts
src/graphql/operations/chat.ts
src/graphql/operations/url.ts
src/graphql/operations/abTest.ts
src/graphql/operations/survey.ts
src/graphql/operations/workflow.ts
src/graphql/operations/businessProcess.ts
src/graphql/operations/workflowExecution.ts
src/graphql/operations/appointment.ts
src/graphql/operations/campaign.ts
src/graphql/operations/trigger.ts
src/graphql/operations/analytics.ts
src/graphql/operations/reputationAnalytics.ts
src/graphql/operations/globalAnalytics.ts
src/graphql/operations/statistics.ts
src/graphql/operations/socialMedia.ts
src/graphql/operations/marketing.ts
src/graphql/operations/retargeting.ts
src/graphql/operations/compliance.ts
src/graphql/operations/audit.ts
src/graphql/operations/aiAssistant.ts
src/graphql/operations/aiDataProcessor.ts
src/graphql/operations/aiEnhanced.ts
src/graphql/operations/aiPreferences.ts
src/graphql/operations/aiKnowledgeBase.ts
src/graphql/operations/copilot.ts
src/graphql/operations/crmUrl.ts
src/graphql/operations/taxes.ts
src/graphql/operations/paymentMode.ts
src/graphql/operations/dataEntry.ts
```

#### Frontend (new hooks — ~30 files)

```
src/hooks/useAuth.ts
src/hooks/useSettings.ts
src/hooks/useClient.ts
src/hooks/useInvoice.ts
src/hooks/useQuote.ts
src/hooks/usePayment.ts
src/hooks/useTeam.ts
src/hooks/useTask.ts
src/hooks/useReminder.ts
src/hooks/useDocument.ts
src/hooks/useChat.ts
src/hooks/useABTest.ts
src/hooks/useSurvey.ts
src/hooks/useWorkflow.ts
src/hooks/useBusinessProcess.ts
src/hooks/useAppointment.ts
src/hooks/useCampaign.ts
src/hooks/useTrigger.ts
src/hooks/useAnalytics.ts
src/hooks/useGlobalAnalytics.ts
src/hooks/useCompliance.ts
src/hooks/useAI.ts
src/hooks/useAIDataProcessor.ts
src/hooks/useAIEnhanced.ts
src/hooks/useAIKnowledgeBase.ts
src/hooks/useCrmUrl.ts
src/hooks/useTaxes.ts
src/hooks/usePaymentMode.ts
src/hooks/useDataEntry.ts
src/hooks/useMarketing.ts
src/hooks/useRetargeting.ts
```

### 12.3 Files to CONVERT (JS → TS)

**Backend: ~200+ files**

- All 68 models (`.js → .ts`)
- All 65+ controllers (`.js → .ts`)
- All 48+ services (`.js → .ts`)
- All 20 helpers (`.js → .ts`)
- All 22+ utils (`.js → .ts`)
- All 12+ middlewares (`.js → .ts`)
- All 6 validators (`.js → .ts`)
- Config, setup, handler files (`.js → .ts`)

**Frontend: ~500+ files**

- All 290+ pages (`.jsx → .tsx`)
- All 107+ components (`.jsx → .tsx`)
- All 19 forms (`.jsx → .tsx`)
- All 14 hooks (`.jsx/.js → .ts`)
- All 12 contexts (`.jsx/.js → .tsx/.ts`)
- All 8 layouts (`.jsx → .tsx`)
- All 6 apps (`.jsx → .tsx`)
- All 4 router files (`.jsx → .tsx`)
- All 4 services (`.js → .ts`)
- Config, utils, data files (`.js → .ts`)

---

## 13. Risk Register & Rollback Strategy

### 13.1 Risks

| Risk                                       | Severity | Mitigation                                         |
| ------------------------------------------ | -------- | -------------------------------------------------- |
| Breaking changes during migration          | HIGH     | One route at a time; every commit is functional    |
| Redux state loss during conversion         | HIGH     | Keep old slices until Apollo replacement verified  |
| GraphQL N+1 query performance              | MEDIUM   | Use DataLoader for batch resolution                |
| File upload via GraphQL complexity         | LOW      | Keep REST for file uploads — proven pattern        |
| TypeScript strict mode errors              | MEDIUM   | Start with `strict: false`, tighten gradually      |
| Apollo cache invalidation bugs             | MEDIUM   | Define proper cache policies per entity            |
| Real-time features (Socket.io) disruption  | MEDIUM   | Keep Socket.io; optionally add subscriptions later |
| Frontend build breaks from .tsx conversion | MEDIUM   | Convert incrementally, test build after each batch |

### 13.2 Rollback Strategy

- **Git branches**: Each batch (A through X) gets its own branch off `migration/rest-to-graphql-typescript`
- **Feature flags**: For critical routes, add a `USE_GRAPHQL` env variable that toggles between REST and GraphQL on the frontend
- **Dual-running**: REST routes stay mounted until their entire batch is verified — removal happens in a separate commit
- **Database**: No database changes — Mongoose models stay the same, just get TypeScript types added

### 13.3 Testing Strategy

| Level               | Tool                       | What to Test                                |
| ------------------- | -------------------------- | ------------------------------------------- |
| GraphQL Schema      | Apollo Studio / Playground | All queries and mutations resolve correctly |
| Resolvers           | Jest / Vitest              | Each resolver returns correct data          |
| Frontend Operations | React Testing Library      | Components render with Apollo MockProvider  |
| Integration         | Cypress / Playwright       | Full user flows (login → CRUD → logout)     |
| TypeScript          | `tsc --noEmit`             | All types compile correctly                 |
| Build               | `npm run build`            | Frontend + Backend build without errors     |

---

## Summary Statistics

| Metric                                                | Count                              |
| ----------------------------------------------------- | ---------------------------------- |
| Total REST endpoints to migrate                       | ~350                               |
| REST endpoints to keep (uploads, redirects, webhooks) | ~15                                |
| Backend route files to delete                         | 45                                 |
| Frontend Redux files to delete                        | ~40                                |
| Frontend request files to delete                      | 10                                 |
| Frontend context files to delete                      | ~20                                |
| New GraphQL type def files                            | ~40                                |
| New GraphQL resolver files                            | ~40                                |
| New frontend operation files                          | ~40                                |
| New frontend hook files                               | ~30                                |
| Backend files to convert JS → TS                      | ~200+                              |
| Frontend files to convert JSX/JS → TSX/TS             | ~500+                              |
| Total migration batches                               | 24 (A through X)                   |
| Mongoose models                                       | 68                                 |
| Redux slices to remove                                | 9 of 11                            |
| Redux slices to keep                                  | 2 (auth, permissions) + 1 new (ui) |
