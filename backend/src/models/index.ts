// @ts-nocheck
// Models index file - exports all models for easy importing

// Core Models
const CompanyOwner = require('./coreModels/CompanyOwner');
const CompanyOwnerPassword = require('./coreModels/CompanyOwnerPassword');
const Counter = require('./coreModels/Counter');
const Setting = require('./coreModels/Setting');
const Upload = require('./coreModels/Upload');

// App Models - AI & Analytics
const AiAnalytics = require('./appModels/AiAnalytics');
const AiAssistant = require('./appModels/AiAssistant');
const AiConversation = require('./appModels/AiConversation');
const AiExtractionTemplate = require('./appModels/AiExtractionTemplate');
const AiKnowledgeBase = require('./appModels/AiKnowledgeBase');
const AILearningData = require('./appModels/AILearningData');
const AiProcessingWorkflow = require('./appModels/AiProcessingWorkflow');
const AiUserPreference = require('./appModels/AiUserPreference');
const AiWorkflow = require('./appModels/AiWorkflow');

// App Models - Core Business
const AuditTrail = require('./appModels/auditTrailModel');
const AutomatedReminder = require('./appModels/AutomatedReminder');
const Business = require('./appModels/Business');
const BusinessProcess = require('./appModels/BusinessProcess');
const Client = require('./appModels/Client');
const ConsentRecord = require('./appModels/consentRecordModel');
const CustomerBehavior = require('./appModels/CustomerBehavior');
const CustomerFollowUp = require('./appModels/CustomerFollowUp');
const CustomerJourney = require('./appModels/CustomerJourney');
const CustomerSegment = require('./appModels/CustomerSegment');
const DataRetentionPolicy = require('./appModels/dataRetentionPolicyModel');
const Document = require('./appModels/Document');
const DocumentAudit = require('./appModels/DocumentAudit');
const DocumentCompliance = require('./appModels/DocumentCompliance');
const DocumentVersion = require('./appModels/DocumentVersion');
const EnhancedWorkflow = require('./appModels/EnhancedWorkflow');
const Interaction = require('./appModels/Interaction');
const Invoice = require('./appModels/Invoice');
const Notification = require('./appModels/Notification');
const Payment = require('./appModels/Payment');
const PaymentMode = require('./appModels/PaymentMode');
const Project = require('./appModels/Project');
const Quote = require('./appModels/Quote');
const SavedSearch = require('./appModels/SavedSearch');
const Schedule = require('./appModels/Schedule');
const SearchHistory = require('./appModels/SearchHistory');
const SharedResource = require('./appModels/SharedResource');

// App Models - Chat
const ChatMessage = require('./appModels/ChatMessage');
const ChatQueue = require('./appModels/ChatQueue');
const ChatRoom = require('./appModels/ChatRoom');

// App Models - Social Media
const SocialAccount = require('./appModels/SocialAccount');
const SocialAnalytics = require('./appModels/SocialAnalytics');
const SocialCampaign = require('./appModels/SocialCampaign');
const SocialMention = require('./appModels/SocialMention');
const SocialPost = require('./appModels/SocialPost');

// App Models - Team & Tasks
const Task = require('./appModels/Task');
const Tax = require('./appModels/Taxes');
const Team = require('./appModels/Team');
const User = require('./appModels/User');
const Workflow = require('./appModels/Workflow');

const Campaign = require('./appModels/Campaign');
const Subscription = require('./appModels/Subscription');
const TriggerRule = require('./appModels/TriggerRule');

// URL Management Models
const URL = require('./appModels/URL');
const URLClick = require('./appModels/URLClick');
const ABTest = require('./appModels/ABTest');

// Workflow Execution Model
const WorkflowExecution = require('./appModels/WorkflowExecution');

// Survey Models
const Survey = require('./appModels/Survey');
const SurveyResponse = require('./appModels/SurveyResponse');

// Review and Appointment Models
const Review = require('./appModels/Review');
const ReviewLink = require('./appModels/ReviewLink');
const ReviewResponse = require('./appModels/ReviewResponse');
const ReviewTemplate = require('./appModels/ReviewTemplate');
const Appointment = require('./appModels/Appointment');

module.exports = {
  // Core Models
  CompanyOwner,
  CompanyOwnerPassword,
  Counter,
  Setting,
  Upload,

  // App Models
  AiAnalytics,
  AiAssistant,
  AiConversation,
  AiExtractionTemplate,
  AiKnowledgeBase,
  AILearningData,
  AiProcessingWorkflow,
  AiUserPreference,
  AiWorkflow,
  AuditTrail,
  AutomatedReminder,
  Business,
  BusinessProcess,
  Campaign,
  ChatMessage,
  ChatQueue,
  ChatRoom,
  Client,
  ConsentRecord,
  CustomerBehavior,
  CustomerFollowUp,
  CustomerJourney,
  CustomerSegment,
  DataRetentionPolicy,
  Document,
  DocumentAudit,
  DocumentCompliance,
  DocumentVersion,
  EnhancedWorkflow,
  Interaction,
  Invoice,
  Notification,
  Payment,
  PaymentMode,
  Project,
  Quote,
  SavedSearch,
  Schedule,
  SearchHistory,
  SharedResource,
  SocialAccount,
  SocialAnalytics,
  SocialCampaign,
  SocialMention,
  SocialPost,
  Subscription,
  Task,
  Tax,
  Taxes: Tax,
  Team,
  User,
  Workflow,
  URL,
  URLClick,
  ABTest,
  WorkflowExecution,
  TriggerRule,
  Survey,
  SurveyResponse,
  Review,
  ReviewLink,
  ReviewResponse,
  ReviewTemplate,
  Appointment,
};
