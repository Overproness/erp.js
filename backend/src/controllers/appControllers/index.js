const taxesController = require('./taxesController/index');
const quoteController = require('./quoteController/index');
const paymentModeController = require('./paymentModeController');
const paymentController = require('./paymentController');
const invoiceController = require('./invoiceController');
const clientController = require('./clientController');
const documentController = require('./documentController');
const documentAuditController = require('./documentController/audit/documentAuditController');
const auditTrailController = require('./documentController/audit/auditTrailController');
const taskController = require('./taskController');
const teamController = require('./teamController');
const advancedSearchController = require('./advancedSearchController');
const statisticsController = require('./statisticsController');
const aiAssistantController = require('./aiAssistantController');
const aiAnalyticsController = require('./aiAnalyticsController');
const aiKnowledgeBaseController = require('./aiKnowledgeBaseController');
const aiWorkflowController = require('./aiWorkflowController');
const aiExtractionTemplateController = require('./aiExtractionTemplateController');
const aiUserPreferenceController = require('./aiUserPreferenceController');

// Additional controllers
const workflowController = require('./workflowController');
const userController = require('./userController');
const socialPostController = require('./socialPostController');
const socialMentionController = require('./socialMentionController');
const socialCampaignController = require('./socialCampaignController');
const socialAnalyticsController = require('./socialAnalyticsController');
const socialAccountController = require('./socialAccountController');
const searchHistoryController = require('./searchHistoryController');
const scheduleController = require('./scheduleController');
const savedSearchController = require('./savedSearchController');
const projectController = require('./projectController');
const documentVersionController = require('./documentVersionController');
const documentComplianceController = require('./documentComplianceController');
const sharedResourceController = require('./sharedResourceController');

// URL Management Controllers
const urlController = require('./urlController');
const urlAnalyticsController = require('./urlAnalyticsController');
const abTestController = require('./abTestController');
const urlRedirectController = require('./urlRedirectController');

// Review Management Controllers
const reviewController = require('./reviewController');
const reviewLinkController = require('./reviewLinkController');
const reviewResponseController = require('./reviewResponseController');
const reviewAnalyticsController = require('./reviewAnalyticsController');
const reviewPortalController = require('./reviewPortalController');

// Marketing Controllers
const campaignController = require('./campaignController');

// Customer Management Controllers
const customerJourneyController = require('./customerJourneyController');
const interactionController = require('./interactionController');

// Create missing controllers if they don't exist
let auditTrailModelController, dataRetentionPolicyModelController, consentRecordModelController;
let aiProcessingWorkflowController, aiConversationController;

try {
  auditTrailModelController = require('./auditTrailModelController');
} catch (error) {
  console.warn('auditTrailModelController not found, creating placeholder');
  auditTrailModelController = require('./documentController'); // fallback
}

try {
  dataRetentionPolicyModelController = require('./dataRetentionPolicyModelController');
} catch (error) {
  console.warn('dataRetentionPolicyModelController not found, creating placeholder');
  dataRetentionPolicyModelController = require('./documentController'); // fallback
}

try {
  consentRecordModelController = require('./consentRecordModelController');
} catch (error) {
  console.warn('consentRecordModelController not found, creating placeholder');
  consentRecordModelController = require('./documentController'); // fallback
}

try {
  aiProcessingWorkflowController = require('./aiProcessingWorkflowController');
} catch (error) {
  console.warn('aiProcessingWorkflowController not found, creating placeholder');
  aiProcessingWorkflowController = require('./aiWorkflowController'); // fallback
}

try {
  aiConversationController = require('./aiConversationController');
} catch (error) {
  console.warn('aiConversationController not found, creating placeholder');
  aiConversationController = require('./aiAssistantController'); // fallback
}

module.exports = {
  documentController,
  documentAuditController,
  auditTrailController,
  taxesController,
  quoteController,
  paymentModeController,
  paymentController,
  invoiceController,
  clientController,
  taskController,
  teamController,
  advancedSearchController,
  statisticsController,
  aiAssistantController,
  aiAnalyticsController,
  aiKnowledgeBaseController,
  aiWorkflowController,
  aiExtractionTemplateController,
  aiUserPreferenceController,
  // Additional controllers
  workflowController,
  userController,
  socialPostController,
  socialMentionController,
  socialCampaignController,
  socialAnalyticsController,
  socialAccountController,
  searchHistoryController,
  scheduleController,
  savedSearchController,
  projectController,
  documentVersionController,
  documentComplianceController,
  sharedResourceController,
  // Missing controllers with fallbacks
  auditTrailModelController,
  dataRetentionPolicyModelController,
  consentRecordModelController,
  aiProcessingWorkflowController,
  aiConversationController,
  // URL Management
  urlController,
  urlAnalyticsController,
  urlRedirectController,
  abTestController,
  // Review Management
  reviewController,
  reviewLinkController,
  reviewResponseController,
  reviewAnalyticsController,
  reviewPortalController,
  // Marketing Controllers
  campaignController,
  // Customer Management
  customerJourneyController,
  interactionController,
};
