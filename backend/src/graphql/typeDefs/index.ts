// @ts-nocheck
const { gql } = require('graphql-tag');
const commonTypeDefs = require('./common');
const authTypeDefs = require('./auth');

// Module type definitions
const settingsTypeDefs = require('./settings');
const adminTypeDefs = require('./admin');
const clientTypeDefs = require('./client');
const taxesTypeDefs = require('./taxes');
const paymentModeTypeDefs = require('./paymentMode');
const invoiceTypeDefs = require('./invoice');
const quoteTypeDefs = require('./quote');
const paymentTypeDefs = require('./payment');
const teamTypeDefs = require('./team');
const taskTypeDefs = require('./task');
const reminderTypeDefs = require('./reminder');
const documentTypeDefs = require('./document');
const notificationTypeDefs = require('./notification');
const chatTypeDefs = require('./chat');
const urlTypeDefs = require('./url');
const abTestTypeDefs = require('./abTest');
const surveyTypeDefs = require('./survey');
const workflowTypeDefs = require('./workflow');
const businessProcessTypeDefs = require('./businessProcess');
const workflowExecutionTypeDefs = require('./workflowExecution');
const appointmentTypeDefs = require('./appointment');
const campaignTypeDefs = require('./campaign');
const triggerTypeDefs = require('./trigger');
const analyticsTypeDefs = require('./analytics');
const reputationAnalyticsTypeDefs = require('./reputationAnalytics');
const globalAnalyticsTypeDefs = require('./globalAnalytics');
const statisticsTypeDefs = require('./statistics');
const socialMediaTypeDefs = require('./socialMedia');
const marketingTypeDefs = require('./marketing');
const retargetingTypeDefs = require('./retargeting');
const complianceTypeDefs = require('./compliance');
const auditTypeDefs = require('./audit');
const aiAssistantTypeDefs = require('./aiAssistant');
const aiDataProcessorTypeDefs = require('./aiDataProcessor');
const aiEnhancedTypeDefs = require('./aiEnhanced');
const aiPreferencesTypeDefs = require('./aiPreferences');
const aiKnowledgeBaseTypeDefs = require('./aiKnowledgeBase');
const copilotTypeDefs = require('./copilot');
const crmUrlsTypeDefs = require('./crmUrls');
const dataEntryTypeDefs = require('./dataEntry');
const subscriptionTypeDefs = require('./subscriptions');
const projectTypeDefs = require('./project');
const savedSearchTypeDefs = require('./savedSearch');

// Root types that all extensions build on
const rootTypeDefs = gql`
  type Query {
    _health: String!
  }

  type Mutation {
    _noop: String
  }

  type Subscription {
    _noop: String
  }
`;

module.exports = [
  rootTypeDefs,
  commonTypeDefs,
  authTypeDefs,
  settingsTypeDefs,
  adminTypeDefs,
  clientTypeDefs,
  taxesTypeDefs,
  paymentModeTypeDefs,
  invoiceTypeDefs,
  quoteTypeDefs,
  paymentTypeDefs,
  teamTypeDefs,
  taskTypeDefs,
  reminderTypeDefs,
  documentTypeDefs,
  notificationTypeDefs,
  chatTypeDefs,
  urlTypeDefs,
  abTestTypeDefs,
  surveyTypeDefs,
  workflowTypeDefs,
  businessProcessTypeDefs,
  workflowExecutionTypeDefs,
  appointmentTypeDefs,
  campaignTypeDefs,
  triggerTypeDefs,
  analyticsTypeDefs,
  reputationAnalyticsTypeDefs,
  globalAnalyticsTypeDefs,
  statisticsTypeDefs,
  socialMediaTypeDefs,
  marketingTypeDefs,
  retargetingTypeDefs,
  complianceTypeDefs,
  auditTypeDefs,
  aiAssistantTypeDefs,
  aiDataProcessorTypeDefs,
  aiEnhancedTypeDefs,
  aiPreferencesTypeDefs,
  aiKnowledgeBaseTypeDefs,
  copilotTypeDefs,
  crmUrlsTypeDefs,
  dataEntryTypeDefs,
  subscriptionTypeDefs,
  projectTypeDefs,
  savedSearchTypeDefs,
];
