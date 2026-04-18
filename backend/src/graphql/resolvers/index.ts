// @ts-nocheck
const createAuthResolvers = require('./auth');
const { generateCRUDResolvers, wrapController, createReqRes } = require('./crud');
const createEntitySpecificResolvers = require('./entities');
const { requirePlanFeature } = require('../utils/requirePlanFeature');

// Map CRUD entity names to their required plan feature keys.
// Entities not listed here are available on all plans (starter+).
const ENTITY_FEATURE_MAP = {
  // CRM extras
  customerSegment: 'CUSTOMER_SEGMENTATION',
  customerFollowUp: 'FOLLOW_UP_AUTOMATION',
  // Campaigns & Marketing
  campaign: 'CAMPAIGN_MANAGEMENT',
  abTest: 'AB_TESTING',
  // Social Media
  socialAccount: 'SOCIAL_MANAGEMENT',
  socialPost: 'SOCIAL_MANAGEMENT',
  socialCampaign: 'SOCIAL_MANAGEMENT',
  socialMention: 'SOCIAL_MENTION_MONITORING',
  // Reputation
  review: 'REVIEW_AGGREGATION',
  reviewLink: 'REVIEW_AGGREGATION',
  reviewTemplate: 'REVIEW_AGGREGATION',
  // AI
  aiAssistant: 'AI_SUITE',
  aiKnowledgeBase: 'AI_KNOWLEDGE_BASE',
  // Workflow & Automation
  triggerRule: 'TRIGGER_RULES',
  businessProcess: 'BUSINESS_PROCESS_ENGINE',
  // Compliance
  consentRecord: 'GDPR_CONSENT',
  dataRetentionPolicy: 'DATA_RETENTION',
};

/** Wraps a resolver map (Query/Mutation) with a plan feature check */
function guardResolvers(resolverMap, featureKey) {
  const guarded = {};
  for (const [name, fn] of Object.entries(resolverMap)) {
    guarded[name] = (parent, args, context, info) => {
      requirePlanFeature(context, featureKey);
      return fn(parent, args, context, info);
    };
  }
  return guarded;
}

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
    { name: 'reviewTemplate', controller: controllers.reviewTemplateController },
    // AI
    { name: 'aiAssistant', controller: controllers.aiAssistantController },
    { name: 'aiKnowledgeBase', controller: controllers.aiKnowledgeBaseController },
    // Compliance
    { name: 'consentRecord', controller: controllers.consentRecordController },
    { name: 'dataRetentionPolicy', controller: controllers.dataRetentionPolicyController },
    { name: 'auditTrail', controller: controllers.auditTrailController },
    // Misc
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
      const featureKey = ENTITY_FEATURE_MAP[name];
      if (featureKey) {
        // Apply plan feature guard to all resolvers for this entity
        Object.assign(mergedQueries, guardResolvers(crud.Query, featureKey));
        Object.assign(mergedMutations, guardResolvers(crud.Mutation, featureKey));
      } else {
        Object.assign(mergedQueries, crud.Query);
        Object.assign(mergedMutations, crud.Mutation);
      }
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
