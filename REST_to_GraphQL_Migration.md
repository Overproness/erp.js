# REST API to GraphQL Migration — Comprehensive Mapping

## Overview

This document maps **every REST API call** in the frontend to its **GraphQL equivalent** (existing or newly created).

---

## 1. Core Request Utility (`frontend/src/request/index.ts`)

The `Request` class provides generic REST methods. Most are used indirectly by other services.

| REST Method | HTTP | Endpoint Pattern | GraphQL Equivalent | Status |
|---|---|---|---|---|
| `post()` | POST | `{entity}` | `{entity}Create` mutation (crudFactory) | ✅ Already migrated in `redux/erp/actions.ts` |
| `get()` | GET | `{entity}/list` or `{entity}/{id}` | `{entity}List` / `{entity}Read` queries (crudFactory) | ✅ Already migrated |
| `list()` | GET | `{entity}/list` | `{entity}List` query | ✅ Already migrated |
| `summary()` | GET | `{entity}/summary` | `{entity}Summary` query | ✅ Already migrated |
| `create()` | POST | `{entity}` | `{entity}Create` mutation | ✅ Already migrated |
| `read()` | GET | `{entity}/{id}` | `{entity}Read` query | ✅ Already migrated |
| `update()` | PATCH | `{entity}/update/{id}` | `{entity}Update` mutation | ✅ Already migrated |
| `delete()` | DELETE | `{entity}/{id}` | `{entity}Delete` mutation | ✅ Already migrated |
| `search()` | GET | `{entity}/search?q=` | `{entity}Search` query | ✅ Already migrated |
| `advancedSearch()` | POST | `{entity}/advanced-search` | `{entity}Filter` query | ✅ Already migrated |
| `filter()` | GET | `{entity}/filter` | `{entity}Filter` query | ✅ Already migrated |
| `mail()` | POST | `{entity}/mail/` | `{entity}Mail` mutation | ✅ Already migrated |
| `convert()` | GET | `{entity}/convert/{id}` | `{entity}Convert` mutation | ✅ Already migrated |
| `listAll()` | GET | `{entity}/listAll` | `{entity}ListAll` query | ✅ Already migrated |
| `revertToOriginal()` | POST | `{entity}/{id}/revert/original` | `documentRevertToOriginal` mutation | 🔄 Migration needed |
| `revertToVersion()` | POST | `{entity}/{id}/revert/{ver}` | `documentRevertToVersion` mutation | 🔄 Migration needed |
| `upload()` | PATCH | `{entity}/upload/{id}` | N/A — File upload requires REST | ⚠️ Keep REST (binary) |
| `downloadDocument()` | GET | `{entity}/download/{id}` | `documentDownload` mutation | 🔄 Migration needed (metadata only) |
| `createAndUpload()` | POST | `{entity}/create` | N/A — multipart upload | ⚠️ Keep REST (binary) |
| `updateAndUpload()` | PATCH | `{entity}/update/{id}` | N/A — multipart upload | ⚠️ Keep REST (binary) |
| `getUrlAnalytics()` | GET | `url/{urlId}/analytics` | `urlAnalytics` query | 🔄 Migration needed |
| `getAnalyticsExport()` | GET | `url/{urlId}/analytics/export` | N/A — binary file export | ⚠️ Keep REST (binary) |
| `getAbTestSummary()` | GET | `abtest/summary` | `urlAbTestResults` query | 🔄 Migration needed |

### Workflow Methods in Request Utility

| REST Method | HTTP | Endpoint | GraphQL Equivalent | Status |
|---|---|---|---|---|
| `workflowCreate()` | POST | `/workflow` | `workflowCreate` mutation | 🔄 Migration needed |
| `workflowList()` | GET | `/workflow` | `workflowList` query (GET_WORKFLOWS) | 🔄 Migration needed |
| `workflowRead()` | GET | `/workflow/{id}` | `workflowRead` query (GET_WORKFLOW) | 🔄 Migration needed |
| `workflowUpdate()` | PATCH | `/workflow/{id}` | `workflowUpdate` mutation | 🔄 Migration needed |
| `workflowDelete()` | DELETE | `/workflow/{id}` | `workflowDelete` mutation | 🔄 Migration needed |
| `workflowToggleStatus()` | PATCH | `/workflow/{id}/status` | `workflowUpdate` mutation (TOGGLE_WORKFLOW_STATUS) | 🔄 Migration needed |
| `workflowTestCondition()` | POST | `/workflow/test-condition` | `workflowTestCondition` mutation (TEST_WORKFLOW_CONDITION) | 🔄 Migration needed |
| `workflowSimulate()` | POST | `/workflow/{id}/simulate` | `workflowExecute` mutation (SIMULATE_WORKFLOW) | 🔄 Migration needed |
| `workflowGetAvailableActions()` | GET | `/workflow/actions` | Need to create `workflowAvailableActions` query | 🆕 Create new |

---

## 2. Authentication (`frontend/src/auth/auth.service.ts`)

| Function | HTTP | Endpoint | GraphQL Equivalent | Status |
|---|---|---|---|---|
| `login()` | POST | `/login` | `login` mutation | 🔄 Migration needed |
| `register()` | POST | `/register` | `register` mutation | 🔄 Migration needed |
| `verify()` | GET | `/verify/{userId}/{emailToken}` | N/A — browser redirect URL | ⚠️ Keep REST (URL redirect) |
| `resetPassword()` | POST | `/resetpassword` | `resetPassword` mutation | 🔄 Migration needed |
| `logout()` | POST | `/logout` | `logout` mutation | 🔄 Migration needed |
| `forgotPassword()` | POST | `/forgetpassword` | `forgetPassword` mutation | 🔄 Migration needed |

---

## 3. Statistics Service (`frontend/src/hooks/services/statisticsService.ts`)

| Function | HTTP | Endpoint | GraphQL Equivalent | Status |
|---|---|---|---|---|
| `getDashboardStats()` | GET | `/stats/dashboard` | `statisticsDashboard` query | 🔄 Migration needed |
| `getClientStats()` | GET | `/stats/clients` | `statisticsClients` query | 🔄 Migration needed |
| `getInvoiceStats()` | GET | `/stats/invoices` | `statisticsInvoices` query | 🔄 Migration needed |
| `getQuoteStats()` | GET | `/stats/quotes` | `statisticsQuotes` query | 🔄 Migration needed |
| `getPaymentStats()` | GET | `/stats/payments` | `statisticsPayments` query | 🔄 Migration needed |
| `getTeamStats()` | GET | `/stats/teams` | `statisticsTeam` query | 🔄 Migration needed |
| `getTaskStats()` | GET | `/stats/tasks` | `statisticsTasks` query | 🔄 Migration needed |
| `getDocumentStats()` | GET | `/stats/documents` | Need to create `statisticsDocuments` | 🆕 Create new |
| `getPaymentModeStats()` | GET | `/stats/paymentmodes` | Need to create `statisticsPaymentModes` | 🆕 Create new |
| `getWorkflowStats()` | GET | `/stats/workflows` | Need to create `statisticsWorkflows` | 🆕 Create new |
| `getTaxStats()` | GET | `/stats/taxes` | Need to create `statisticsTaxes` | 🆕 Create new |

---

## 4. Task Requests (`frontend/src/request/taskRequest.ts`)

| Function | HTTP | Endpoint | GraphQL Equivalent | Status |
|---|---|---|---|---|
| `statistics()` | GET | `/stats/tasks` | `statisticsTasks` query | 🔄 Migration needed |
| `addComment()` | POST | `/task/{id}/comments` | Need to create `taskAddComment` mutation | 🆕 Create new |
| `getAIPrioritySuggestions()` | POST | `/task/ai/prioritize` | `taskAiPrioritize` mutation | 🔄 Migration needed |
| `batchUpdatePriorities()` | PATCH | `/task/batch/priorities` | `taskBatchUpdatePriorities` mutation | 🔄 Migration needed |

---

## 5. AI Enhanced Service (`frontend/src/services/aiEnhancedService.ts`)

| Function | HTTP | Endpoint | GraphQL Equivalent | Status |
|---|---|---|---|---|
| `queueChatMessage()` | POST | `ai-enhanced/chat-queue` | Need to create `aiEnhancedQueueMessage` mutation | 🆕 Create new |
| `getQueueStatus()` | GET | `ai-enhanced/chat-queue/{id}/status` | Need to create `aiEnhancedQueueStatus` query | 🆕 Create new |
| `getQueueStatistics()` | GET | `ai-enhanced/chat-queue/statistics` | Need to create `aiEnhancedQueueStatistics` query | 🆕 Create new |
| `recordAIFeedback()` | POST | `ai-enhanced/learning/{id}/feedback` | Need to create `aiEnhancedRecordFeedback` mutation | 🆕 Create new |
| `getEnhancedContext()` | POST | `ai-enhanced/context/enhanced` | `aiEnhancedInsights` query exists | 🔄 Migration needed |
| `getLearnedInsights()` | GET | `ai-enhanced/insights/learned` | `aiEnhancedRecommendations` query exists | 🔄 Migration needed |
| `implementSuggestion()` | POST | `ai-enhanced/automation/suggestions/{id}/implement` | `aiEnhancedOptimize` mutation | 🔄 Migration needed |
| `getLearningStatistics()` | GET | `ai-enhanced/learning/statistics` | Need to create `aiEnhancedLearningStats` query | 🆕 Create new |

---

## 6. Campaign API (`frontend/src/services/campaignApi.ts`)

| Function | HTTP | Endpoint | GraphQL Equivalent | Status |
|---|---|---|---|---|
| `scheduleCampaign()` | POST | `marketing/campaigns/{id}/schedule` | Need to create `campaignSchedule` mutation | 🆕 Create new |
| `optimizeCampaign()` | POST | `marketing/campaigns/{id}/optimize` | Need to create `campaignOptimize` mutation | 🆕 Create new |
| `bulkUpdateCampaigns()` | POST | `marketing/campaigns/bulk` | `campaignBulkUpdate` — need to create | 🆕 Create new |
| `generateCampaignReport()` | POST | `marketing/campaigns/{id}/report` | Need to create `campaignGenerateReport` mutation | 🆕 Create new |
| `getABTestResults()` | GET | `marketing/campaigns/{id}/ab-test/results` | Need to create `campaignAbTestResults` query | 🆕 Create new |
| `updateABTestMetrics()` | POST | `marketing/campaigns/{id}/ab-test/metrics` | Need to create `campaignUpdateAbTestMetrics` mutation | 🆕 Create new |

---

## 7. Chat Page (`frontend/src/pages/Chat/index.tsx`)

| Function | HTTP | Endpoint | GraphQL Equivalent | Status |
|---|---|---|---|---|
| `loadChatData()` users | GET | `/chat/users` | `adminList` query (company users) | 🔄 Migration needed |

---

## 8. Analytics Page (`frontend/src/pages/Analytics/index.tsx`)

| Function | HTTP | Endpoint | GraphQL Equivalent | Status |
|---|---|---|---|---|
| `fetchRealTimeData()` | GET | `/global-analytics/real-time` | `globalAnalyticsDashboard` query | 🔄 Migration needed |
| `fetchModuleData()` | GET | `/global-analytics/module/{module}` | `globalAnalyticsKPI` query | 🔄 Migration needed |

---

## 9. Document Editor (`frontend/src/components/DocumentEditor/DocumentEditor.tsx`)

| Function | HTTP | Endpoint | GraphQL Equivalent | Status |
|---|---|---|---|---|
| `fetchDocument()` content | GET | `document/content/{id}` | `documentGetContent` query | 🔄 Migration needed |
| `fetchDocument()` download | GET | `document/{id}/download` | `documentDownload` mutation | 🔄 Migration needed |
| `handleSave()` | POST | `document/edit/{id}` | `documentEdit` mutation | 🔄 Migration needed |
| `handleSignDocument()` refresh | GET | `document/content/{id}` (refresh) | `documentGetContent` query | 🔄 Migration needed |
| `handleRevertToVersion()` refresh | GET | `document/content/{id}` (refresh) | `documentGetContent` query | 🔄 Migration needed |

---

## 10. Redux ERP Actions (`frontend/src/redux/erp/actions.ts`)

| Action | HTTP | Endpoint | GraphQL Equivalent | Status |
|---|---|---|---|---|
| `revertToOriginal()` | POST | `{entity}/{id}/revert/original` | `documentRevertToOriginal` mutation | 🔄 Migration needed |
| `revertToVersion()` | POST | `{entity}/{id}/revert/{ver}` | `documentRevertToVersion` mutation | 🔄 Migration needed |
| `analyzeDocument()` | GET | `{entity}/{id}/analyze` | `documentAnalyze` mutation | 🔄 Migration needed |
| `getAuditTrail()` | GET | via `request.getAuditTrail()` | `documentAuditTrail` query | 🔄 Migration needed |

---

## 11. Redux AI Thunks (`frontend/src/redux/ai/aiThunks.ts`)

| Thunk | HTTP | Endpoint | GraphQL Equivalent | Status |
|---|---|---|---|---|
| `fetchUsageMetrics()` | GET | `aiAnalytics/list` | `aiAnalyticsList` query (crudFactory) | 🔄 Migration needed |
| `processOCR()` | POST | `ai/ocr/process` | N/A — file upload | ⚠️ Keep REST (binary) |
| `createExtractionTemplate()` | POST | `ai/templates` | Need to create `aiTemplateCreate` mutation | 🆕 Create new |
| `fetchExtractionTemplates()` | GET | `ai/templates` | Need to create `aiTemplateList` query | 🆕 Create new |
| `processWorkflow()` | POST | `ai/workflows/process` | `workflowExecute` mutation | 🔄 Migration needed |
| `fetchProcessingStats()` | GET | `ai/processing/stats` | Need to create `aiProcessingStats` query | 🆕 Create new |

---

## 12. Onboarding Settings (`frontend/src/pages/Onboarding/OnboardingModule/saveAllSettings.ts`)

| Call | HTTP | Endpoint | GraphQL Equivalent | Status |
|---|---|---|---|---|
| Settings batch save | POST | `setting/batch` | `settingUpdateMany` mutation | 🔄 Migration needed |

---

## 13. Data Import Wizard (`frontend/src/components/DataEntry/DataImportWizard.tsx`)

| Function | HTTP | Endpoint | GraphQL Equivalent | Status |
|---|---|---|---|---|
| `processOCR()` | POST | `data-entry/ocr/{module}` | N/A — file upload | ⚠️ Keep REST (binary) |
| OCR batch | POST | `data-entry/ocr/{module}/batch` | N/A — file upload | ⚠️ Keep REST (binary) |
| `processSpreadsheet()` | POST | `data-entry/spreadsheet/{module}` | N/A — file upload | ⚠️ Keep REST (binary) |
| `processURL()` | POST | `data-entry/url/{module}` | Need to create `dataEntryImportFromUrl` mutation | 🆕 Create new |
| `validateData()` | POST | `data-entry/validate/{module}` | `dataEntryValidate` query | 🔄 Migration needed |
| `saveData()` | POST | `data-entry/save/{module}` | `dataEntryImport` mutation | 🔄 Migration needed |

---

## 14. Public Endpoints (Keep REST)

These are **unauthenticated** public endpoints and must remain REST:

| File | Endpoint | Reason |
|---|---|---|
| `PublicSurvey/index.tsx` | `GET/POST /api/public/survey/{shortCode}` | Public, no auth |
| `PublicDocumentShare/index.tsx` | `GET/POST /api/public/document/shared/{shortCode}` | Public, no auth |
| `checkImage.ts` | `GET {path}` | Image validation |

---

## Summary

| Category | Total REST Calls | Migrate to GraphQL | Create New GraphQL | Keep REST |
|---|---|---|---|---|
| Core Request Utility | 21+ methods | 3 | 1 | 4 (binary) |
| Authentication | 6 | 5 | 0 | 1 (verify URL) |
| Statistics Service | 11 | 7 | 4 | 0 |
| Task Requests | 4 | 3 | 1 | 0 |
| AI Enhanced Service | 8 | 3 | 5 | 0 |
| Campaign API | 6 | 0 | 6 | 0 |
| Chat Page | 1 | 1 | 0 | 0 |
| Analytics Page | 2 | 2 | 0 | 0 |
| Document Editor | 5 | 5 | 0 | 0 |
| Redux ERP Actions | 4 | 4 | 0 | 0 |
| Redux AI Thunks | 6 | 2 | 3 | 1 (OCR) |
| Onboarding Settings | 2 | 2 | 0 | 0 |
| Data Import Wizard | 6 | 2 | 1 | 3 (binary) |
| Public Endpoints | 5 | 0 | 0 | 5 |
| **TOTAL** | **~87** | **~39** | **~21** | **~14** |
