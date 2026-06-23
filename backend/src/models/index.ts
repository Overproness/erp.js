// @ts-nocheck
// Models index file - exports all models for easy importing

// Core Models
import CompanyOwner from './coreModels/CompanyOwner';
import CompanyOwnerPassword from './coreModels/CompanyOwnerPassword';
import Counter from './coreModels/Counter';
import Setting from './coreModels/Setting';
import Upload from './coreModels/Upload';
// App Models - AI & Analytics
import AiAnalytics from './appModels/AiAnalytics';
import AiAssistant from './appModels/AiAssistant';
import AiConversation from './appModels/AiConversation';
import AiExtractionTemplate from './appModels/AiExtractionTemplate';
import AiKnowledgeBase from './appModels/AiKnowledgeBase';
import AILearningData from './appModels/AILearningData';
import AiProcessingWorkflow from './appModels/AiProcessingWorkflow';
import AiUserPreference from './appModels/AiUserPreference';
import AiWorkflow from './appModels/AiWorkflow';
// App Models - Core Business
import AuditTrail from './appModels/auditTrailModel';
import AutomatedReminder from './appModels/AutomatedReminder';
import Business from './appModels/Business';
import BusinessProcess from './appModels/BusinessProcess';
import Client from './appModels/Client';
import ConsentRecord from './appModels/consentRecordModel';
import CustomerBehavior from './appModels/CustomerBehavior';
import CustomerFollowUp from './appModels/CustomerFollowUp';
import CustomerJourney from './appModels/CustomerJourney';
import CustomerSegment from './appModels/CustomerSegment';
import DataRetentionPolicy from './appModels/dataRetentionPolicyModel';
import Document from './appModels/Document';
import DocumentAudit from './appModels/DocumentAudit';
import DocumentCompliance from './appModels/DocumentCompliance';
import DocumentVersion from './appModels/DocumentVersion';
import EnhancedWorkflow from './appModels/EnhancedWorkflow';
import Interaction from './appModels/Interaction';
import Invoice from './appModels/Invoice';
import Notification from './appModels/Notification';
import Payment from './appModels/Payment';
import PaymentMode from './appModels/PaymentMode';
import Project from './appModels/Project';
import Quote from './appModels/Quote';
import SavedSearch from './appModels/SavedSearch';
import Schedule from './appModels/Schedule';
import SearchHistory from './appModels/SearchHistory';
import SharedResource from './appModels/SharedResource';
// App Models - Chat
import ChatMessage from './appModels/ChatMessage';
import ChatQueue from './appModels/ChatQueue';
import ChatRoom from './appModels/ChatRoom';
// App Models - Social Media
import SocialAccount from './appModels/SocialAccount';
import SocialAnalytics from './appModels/SocialAnalytics';
import SocialCampaign from './appModels/SocialCampaign';
import SocialMention from './appModels/SocialMention';
import SocialPost from './appModels/SocialPost';
// App Models - Team & Tasks
import Task from './appModels/Task';
import Tax from './appModels/Taxes';
import Team from './appModels/Team';
import User from './appModels/User';
import Workflow from './appModels/Workflow';
import Campaign from './appModels/Campaign';
import Subscription from './appModels/Subscription';
import TriggerRule from './appModels/TriggerRule';
// URL Management Models
import URL from './appModels/URL';
import URLClick from './appModels/URLClick';
import ABTest from './appModels/ABTest';
// Workflow Execution Model
import WorkflowExecution from './appModels/WorkflowExecution';
// Survey Models
import Survey from './appModels/Survey';
import SurveyResponse from './appModels/SurveyResponse';
// Review and Appointment Models
import Review from './appModels/Review';
import ReviewLink from './appModels/ReviewLink';
import ReviewResponse from './appModels/ReviewResponse';
import ReviewTemplate from './appModels/ReviewTemplate';
import Appointment from './appModels/Appointment';
export {
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
  Tax as Taxes,
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
