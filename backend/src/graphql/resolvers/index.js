const createAuthResolvers = require('./auth');
const { generateCRUDResolvers, wrapController, createReqRes } = require('./crud');
const createEntitySpecificResolvers = require('./entities');

// Controllers will be passed in when the app initializes
let resolversInstance = null;

function initializeResolvers(controllers) {
  const authController = controllers.adminAuth;
  const authResolvers = createAuthResolvers(authController);
  const entityResolvers = createEntitySpecificResolvers(controllers);

  // Generate CRUD resolvers for each entity
  const crudEntities = [
    // Core CRM
    { name: 'client', controller: controllers.clientController },
    { name: 'invoice', controller: controllers.invoiceController },
    { name: 'quote', controller: controllers.quoteController },
    { name: 'payment', controller: controllers.paymentController },
    { name: 'project', controller: controllers.projectController },
    { name: 'schedule', controller: controllers.scheduleController },
    // Financial
    { name: 'taxes', controller: controllers.taxesController },
    { name: 'paymentMode', controller: controllers.paymentModeController },
    // Team & Task
    { name: 'team', controller: controllers.teamController },
    { name: 'task', controller: controllers.taskController },
    { name: 'reminder', controller: controllers.reminderController },
    // Documents
    { name: 'document', controller: controllers.documentController },
    // Communication
    { name: 'notification', controller: controllers.notificationController },
    // URL & A/B Testing
    { name: 'url', controller: controllers.urlController },
    { name: 'abTest', controller: controllers.abTestController },
    // Survey
    { name: 'survey', controller: controllers.surveyController },
    { name: 'surveyResponse', controller: controllers.surveyResponseController },
    // Workflow
    { name: 'workflow', controller: controllers.workflowController },
    { name: 'businessProcess', controller: controllers.businessProcessController },
    // Appointments
    { name: 'appointment', controller: controllers.appointmentController },
    // Campaign & Triggers
    { name: 'campaign', controller: controllers.campaignController },
    { name: 'triggerRule', controller: controllers.triggerRuleController },
    // Social Media
    { name: 'socialAccount', controller: controllers.socialAccountController },
    { name: 'socialPost', controller: controllers.socialPostController },
    { name: 'socialCampaign', controller: controllers.socialCampaignController },
    { name: 'socialMention', controller: controllers.socialMentionController },
    // Marketing
    { name: 'customerSegment', controller: controllers.segmentController },
    { name: 'customerFollowUp', controller: controllers.followUpController },
    // Reputation
    { name: 'review', controller: controllers.reviewController },
    { name: 'reviewLink', controller: controllers.reviewLinkController },
    { name: 'reviewResponse', controller: controllers.reviewResponseController },
    { name: 'reviewTemplate', controller: controllers.reviewTemplateController },
    // AI
    { name: 'aiKnowledgeBase', controller: controllers.aiKnowledgeBaseController },
    { name: 'aiUserPreference', controller: controllers.aiUserPreferenceController },
    // Compliance
    { name: 'consentRecord', controller: controllers.consentRecordController },
    { name: 'dataRetentionPolicy', controller: controllers.dataRetentionPolicyController },
    { name: 'auditTrail', controller: controllers.auditTrailController },
    // Misc
    { name: 'savedSearch', controller: controllers.savedSearchController },
    { name: 'sharedResource', controller: controllers.sharedResourceController },
  ];

  const mergedQueries = {
    _health: () => 'OK',
    ...authResolvers.Query,
    ...entityResolvers.Query,
  };

  const mergedMutations = {
    _noop: () => null,
    ...authResolvers.Mutation,
    ...entityResolvers.Mutation,
  };

  // Add CRUD resolvers for each entity
  crudEntities.forEach(({ name, controller }) => {
    if (controller) {
      const crud = generateCRUDResolvers(name, controller);
      Object.assign(mergedQueries, crud.Query);
      Object.assign(mergedMutations, crud.Mutation);
    }
  });

  resolversInstance = {
    Query: mergedQueries,
    Mutation: mergedMutations,
  };

  return resolversInstance;
}

// Default export: returns a minimal resolver set if not initialized
// The app should call initializeResolvers() during setup
const defaultResolvers = {
  Query: {
    _health: () => 'OK',
  },
  Mutation: {
    _noop: () => null,
  },
};

module.exports = defaultResolvers;
module.exports.initializeResolvers = initializeResolvers;
module.exports.generateCRUDResolvers = generateCRUDResolvers;
module.exports.wrapController = wrapController;
module.exports.createReqRes = createReqRes;
