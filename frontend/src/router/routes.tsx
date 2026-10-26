import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';

const PaymentUpdate = lazy(() => import('@/pages/Payment/PaymentUpdate'));
const Settings = lazy(() => import('@/pages/Settings/Settings'));

// Add a loading component for Suspense fallback
const LoadingComponent = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    Loading...
  </div>
);

// Login stuff
const Logout = lazy(() => import('@/pages/Logout/Logout.jsx'));
const Signup = lazy(() => import('@/pages/Signup/Signup'));
const Dashboard = lazy(() => import('@/pages/Dashboard/Dashboard'));

const NotFound = lazy(() => import('@/pages/NotFound/NotFound.jsx'));

const Customer = lazy(() => import('@/pages/Customer'));
const CustomerCreate = lazy(() => import('@/pages/Customer/CustomerCreate'));
const CustomerRead = lazy(() => import('@/pages/Customer/CustomerRead'));
const CustomerUpdate = lazy(() => import('@/pages/Customer/CustomerUpdate'));

const Document = lazy(() => import('@/pages/Document'));
const DocumentCreate = lazy(() => import('@/pages/Document/DocumentCreate'));
const DocumentRead = lazy(() => import('@/pages/Document/DocumentRead'));
const DocumentUpdate = lazy(() => import('@/pages/Document/DocumentUpdate'));
const DocumentEditor = lazy(() => import('@/pages/Document/DocumentEditor'));

const Invoice = lazy(() => import('@/pages/Invoice'));
const InvoiceCreate = lazy(() => import('@/pages/Invoice/InvoiceCreate'));
const InvoiceRead = lazy(() => import('@/pages/Invoice/InvoiceRead'));
const InvoiceUpdate = lazy(() => import('@/pages/Invoice/InvoiceUpdate'));
const InvoiceRecordPayment = lazy(() => import('@/pages/Invoice/InvoiceRecordPayment'));

const Quote = lazy(() => import('@/pages/Quote/index'));
const QuoteCreate = lazy(() => import('@/pages/Quote/QuoteCreate'));
const QuoteRead = lazy(() => import('@/pages/Quote/QuoteRead'));
const QuoteUpdate = lazy(() => import('@/pages/Quote/QuoteUpdate'));

const Payment = lazy(() => import('@/pages/Payment/index'));
const PaymentRead = lazy(() => import('@/pages/Payment/PaymentRead'));

const PaymentMode = lazy(() => import('@/pages/PaymentMode'));
const PaymentModeCreate = lazy(() => import('@/pages/PaymentMode/PaymentModeCreate'));
const PaymentModeRead = lazy(() => import('@/pages/PaymentMode/PaymentModeRead'));
const PaymentModeUpdate = lazy(() => import('@/pages/PaymentMode/PaymentModeUpdate'));

const Taxes = lazy(() => import('@/pages/Taxes'));
const TaxesCreate = lazy(() => import('@/pages/Taxes/TaxesCreate'));
const TaxesRead = lazy(() => import('@/pages/Taxes/TaxesRead'));
const TaxesUpdate = lazy(() => import('@/pages/Taxes/TaxesUpdate'));

const Profile = lazy(() => import('@/pages/Profile/Profile'));

const Tasks = lazy(() => import('@/pages/Tasks'));

// Business Process Automation
const Appointments = lazy(() => import('@/pages/Appointments'));
// const BusinessProcesses = lazy(() => import('@/pages/BusinessProcesses'));
// const TaskTracking = lazy(() => import('@/pages/TaskTracking'));

// AI Assistant
const AiAssistantModule = lazy(() => import('@/pages/AIAssistant/AiAssistant'));
const CreateAiAssistantModule = lazy(
  () => import('@/pages/AIAssistant/AiAssistantModule/CreateAiAssistantModule')
);
const ReadAiAssistantModule = lazy(
  () => import('@/pages/AIAssistant/AiAssistantModule/ReadAiAssistantModule')
);
const UpdateAiAssistantModule = lazy(
  () => import('@/pages/AIAssistant/AiAssistantModule/UpdateAiAssistantModule')
);
const AIChatModule = lazy(() => import('@/pages/AIAssistant/AiAssistantModule/AiChatModule'));
const AISettingsModule = lazy(
  () => import('@/pages/AIAssistant/AiAssistantModule/AiSettingsModule')
);
const AISuggestionsModule = lazy(
  () => import('@/pages/AIAssistant/AiAssistantModule/AiSuggestionsModule')
);
const AIAnalyticsModule = lazy(
  () => import('@/pages/AIAssistant/AiAssistantModule/AiAnalyticsModule')
);
const DataProcessorModule = lazy(
  () => import('@/pages/AIAssistant/AiAssistantModule/DataProcessorModule')
);

// Import Team components
const Team = lazy(() => import('@/pages/Team/index'));
const TeamCreate = lazy(() => import('@/pages/Team/TeamCreate'));
const TeamRead = lazy(() => import('@/pages/Team/TeamRead'));
const TeamUpdate = lazy(() => import('@/pages/Team/TeamUpdate'));
const AcceptInvitation = lazy(() => import('@/pages/Team/AcceptInvitation'));

// AI Enhanced Features
const FollowUpManagement = lazy(() => import('@/pages/AIEnhanced/FollowUpManagement'));
const AutomationSuggestions = lazy(() => import('@/pages/AIEnhanced/AutomationSuggestions'));
const AILearningDashboard = lazy(() => import('@/pages/AIEnhanced/AILearningDashboard'));

// Chat component
const Chat = lazy(() => import('@/pages/Chat'));

// Import Workflow component
const Workflow = lazy(() => import('@/pages/WorkflowBuilder/index'));

const SocialMedia = lazy(() => import('@/pages/SocialMedia'));
const PostManagement = lazy(
  () => import('@/pages/SocialMedia/SocialMediaModule/PostManagementModule')
);
const Analytics = lazy(() => import('@/pages/SocialMedia/SocialMediaModule/AnalyticsModule'));
const Mentions = lazy(() => import('@/pages/SocialMedia/SocialMediaModule/MentionModule'));
const AIContent = lazy(() => import('@/pages/SocialMedia/SocialMediaModule/AIContentModule'));

const UrlManager = lazy(() => import('@/pages/URL/UrlManager'));
const CreateUrl = lazy(() => import('@/pages/URL/CreateUrl'));
const UrlDetails = lazy(() => import('@/pages/URL/UrlDetails'));
const UpdateUrl = lazy(() => import('@/pages/URL/UpdateUrl'));
const UrlAnalytics = lazy(() => import('@/pages/URL/UrlAnalytics'));
const ABTesting = lazy(() => import('@/pages/URL/ABTesting'));
const CreateABTest = lazy(() => import('@/pages/URL/CreateABTest'));
const ABTestResults = lazy(() => import('@/pages/URL/ABTestResults'));

// Reputation Management
const ReputationManagement = lazy(() => import('@/pages/Reputation/ReputationManagement'));
const ReviewMonitoringModule = lazy(
  () => import('@/pages/Reputation/ReputationModule/ReviewMonitoringModule')
);
const CreateReviewLinkModule = lazy(
  () => import('@/pages/Reputation/ReputationModule/CreateReviewLinkModule')
);
const ReputationAnalytics = lazy(
  () => import('@/pages/Reputation/ReputationModule/ReviewAnalyticsModule')
);
// Marketing Management
const Marketing = lazy(() => import('@/pages/marketing/Marketing'));
const CampaignBuilder = lazy(() => import('@/pages/marketing/CampaignBuilder'));
const BehaviorTriggers = lazy(() => import('@/pages/marketing/BehaviorTriggers'));
const RetargetingAudiences = lazy(() => import('@/pages/marketing/RetargetingAudiences'));
const CampaignAnalysisModule = lazy(
  () => import('@/pages/marketing/MarketingModule/CampaignAnalysisModule')
);
const UpdateCampaignModule = lazy(
  () => import('@/pages/marketing/MarketingModule/UpdateCampaignModule')
);

// Survey Management
const Survey = lazy(() => import('@/pages/Surveys/index'));
const SurveyCreate = lazy(() => import('@/pages/Surveys/SurveyCreate'));
const SurveyRead = lazy(() => import('@/pages/Surveys/SurveyRead'));
const SurveyUpdate = lazy(() => import('@/pages/Surveys/SurveyUpdate'));
const SurveyAnalytics = lazy(() => import('@/pages/Surveys/SurveyAnalytics'));
const PublicSurvey = lazy(() => import('@/pages/PublicSurvey'));

// Analytics & Reporting
const AnalyticsReporting = lazy(() => import('@/pages/Analytics/index'));

// Subscription / Billing
const SubscriptionPage = lazy(() => import('@/pages/Subscription/index'));
const MasterLayoutShowcase = lazy(() => import('@/pages/DesignSystem/MasterLayoutShowcase'));

let routes = {
  expense: [],
  default: [
    {
      path: '/login',
      element: <Navigate to="/" />,
    },
    {
      path: '/logout',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <Logout />
        </Suspense>
      ),
    },
    {
      path: '/',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <Dashboard />
        </Suspense>
      ),
    },
    {
      path: '/signup',
      element: <Signup />,
    },
    {
      path: '/public/survey/:shortCode',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <PublicSurvey />
        </Suspense>
      ),
    },
    {
      path: '/client',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <Customer />
        </Suspense>
      ),
      permissions: ['customer:read'],
    },
    {
      path: '/client/create',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <CustomerCreate />
        </Suspense>
      ),
      permissions: ['customer:create'],
    },
    {
      path: '/client/read/:id',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <CustomerRead />
        </Suspense>
      ),
      permissions: ['customer:read'],
    },
    {
      path: '/client/update/:id',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <CustomerUpdate />
        </Suspense>
      ),
      permissions: ['customer:update'],
    },
    // {
    //   path: '/customer/profile/:id',
    //   element: <CustomerProfile />,
    // },
    {
      path: '/document',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <Document />
        </Suspense>
      ),
      permissions: ['document:read'],
    },
    {
      path: '/document/create',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <DocumentCreate />
        </Suspense>
      ),
      permissions: ['document:create'],
    },
    {
      path: '/document/read/:id',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <DocumentRead />
        </Suspense>
      ),
      permissions: ['document:read'],
    },
    {
      path: '/document/update/:id',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <DocumentUpdate />
        </Suspense>
      ),
      permissions: ['document:update'],
    },
    {
      path: '/document/editor/:id',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <DocumentEditor />
        </Suspense>
      ),
      permissions: ['document:update'],
    },
    {
      path: '/invoice',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <Invoice />
        </Suspense>
      ),
      permissions: ['invoice:read'],
    },
    {
      path: '/invoice/create',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <InvoiceCreate />
        </Suspense>
      ),
      permissions: ['invoice:create'],
    },
    {
      path: '/invoice/read/:id',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <InvoiceRead />
        </Suspense>
      ),
      permissions: ['invoice:read'],
    },
    {
      path: '/invoice/update/:id',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <InvoiceUpdate />
        </Suspense>
      ),
      permissions: ['invoice:update'],
    },
    {
      path: '/invoice/pay/:id',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <InvoiceRecordPayment />
        </Suspense>
      ),
      permissions: ['invoice:update', 'payment:create'],
      requireAll: true,
    },
    {
      path: '/quote',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <Quote />
        </Suspense>
      ),
      permissions: ['quote:read'],
    },
    {
      path: '/quote/create',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <QuoteCreate />
        </Suspense>
      ),
      permissions: ['quote:create'],
    },
    {
      path: '/quote/read/:id',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <QuoteRead />
        </Suspense>
      ),
      permissions: ['quote:read'],
    },
    {
      path: '/quote/update/:id',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <QuoteUpdate />
        </Suspense>
      ),
      permissions: ['quote:update'],
    },
    {
      path: '/payment',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <Payment />
        </Suspense>
      ),
      permissions: ['payment:read'],
    },
    {
      path: '/payment/read/:id',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <PaymentRead />
        </Suspense>
      ),
      permissions: ['payment:read'],
    },
    {
      path: '/payment/update/:id',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <PaymentUpdate />
        </Suspense>
      ),
      permissions: ['payment:update'],
    },
    {
      path: '/settings',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <Settings />
        </Suspense>
      ),
      permissions: ['settings:read'],
    },
    {
      path: '/settings/edit/:settingsKey',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <Settings />
        </Suspense>
      ),
      permissions: ['settings:update'],
    },
    {
      path: '/payment/mode',
      element: <PaymentMode />,
      permissions: ['payment:read'],
    },
    {
      path: '/payment/mode/create',
      element: <PaymentModeCreate />,
      permissions: ['payment:read'],
    },
    {
      path: '/payment/mode/read/:id',
      element: <PaymentModeRead />,
      permissions: ['payment:read'],
    },
    {
      path: '/payment/mode/update/:id',
      element: <PaymentModeUpdate />,
      permissions: ['payment:read'],
    },
    {
      path: '/taxes',
      element: <Taxes />,
      permissions: ['settings:read'],
    },
    {
      path: '/taxes/create',
      element: <TaxesCreate />,
      permissions: ['settings:read'],
    },
    {
      path: '/taxes/read/:id',
      element: <TaxesRead />,
      permissions: ['settings:read'],
    },
    {
      path: '/taxes/update/:id',
      element: <TaxesUpdate />,
      permissions: ['settings:read'],
    },
    {
      path: '/profile',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <Profile />
        </Suspense>
      ),
    },
    {
      path: '/workflow',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <Workflow />
        </Suspense>
      ),
      permissions: ['workflow:read'],
    },
    {
      path: '/tasks',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <Tasks />
        </Suspense>
      ),
      permissions: ['task:read'],
    },
    {
      path: '/team',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <Team />
        </Suspense>
      ),
      permissions: ['team:read'],
    },
    {
      path: '/team/create',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <TeamCreate />
        </Suspense>
      ),
      permissions: ['team:create'],
    },
    {
      path: '/team/read/:id',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <TeamRead />
        </Suspense>
      ),
      permissions: ['team:read'],
    },
    {
      path: '/team/update/:id',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <TeamUpdate />
        </Suspense>
      ),
      permissions: ['team:update'],
    },
    {
      path: '/team/invitation/:token',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <AcceptInvitation />
        </Suspense>
      ),
    },
    {
      path: '/chat',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <Chat />
        </Suspense>
      ),
      // Remove permissions - chat is open for all authenticated users
    },
    {
      path: '/chat/:selectedUserId',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <Chat />
        </Suspense>
      ),
      // Remove permissions - chat is open for all authenticated users
    },
    {
      path: '*',
      element: <NotFound />,
    },
    {
      path: '/ai-assistant/*',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <AiAssistantModule />
        </Suspense>
      ),
      permissions: ['ai:read'],
    },
    {
      path: '/ai-assistant/create',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <CreateAiAssistantModule />
        </Suspense>
      ),
      permissions: ['ai:create'],
    },
    {
      path: '/ai-assistant/update/:id',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <UpdateAiAssistantModule />
        </Suspense>
      ),
      permissions: ['ai:update'],
    },
    {
      path: '/ai-assistant/read/:id',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <ReadAiAssistantModule />
        </Suspense>
      ),
      permissions: ['ai:read'],
    },
    {
      path: '/ai-assistant/chat/:id',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <AIChatModule />
        </Suspense>
      ),
      permissions: ['ai:chat'],
    },
    {
      path: '/ai-assistant/settings',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <AISettingsModule />
        </Suspense>
      ),
      permissions: ['ai:settings'],
    },
    {
      path: '/ai-assistant/suggestions',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <AISuggestionsModule />
        </Suspense>
      ),
      permissions: ['ai:suggestions'],
    },
    {
      path: '/ai-assistant/analytics',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <AIAnalyticsModule />
        </Suspense>
      ),
      permissions: ['ai:analytics'],
    },
    {
      path: '/ai-assistant/data-processor',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <DataProcessorModule />
        </Suspense>
      ),
      permissions: ['ai:data-processor'],
    },
    // Social Media Routes
    {
      path: '/social-media',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <SocialMedia />
        </Suspense>
      ),
      permissions: ['social:read'],
    },
    {
      path: '/social-media/posts',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <PostManagement />
        </Suspense>
      ),
      permissions: ['social:posts'],
    },
    {
      path: '/social-media/analytics',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <Analytics />
        </Suspense>
      ),
      permissions: ['social:analytics'],
    },
    {
      path: '/social-media/mentions',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <Mentions />
        </Suspense>
      ),
      permissions: ['social:mentions'],
    },
    {
      path: '/social-media/ai-content',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <AIContent />
        </Suspense>
      ),
      permissions: ['social:ai-content'],
    },
    // URL Management Routes
    {
      path: '/url',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <UrlManager />
        </Suspense>
      ),
      permissions: ['url:read'],
    },
    {
      path: '/url/create',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <CreateUrl />
        </Suspense>
      ),
      permissions: ['url:create'],
    },
    {
      path: '/url/:id',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <UrlDetails />
        </Suspense>
      ),
      permissions: ['url:read'],
    },
    {
      path: '/url/update/:id',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <UpdateUrl />
        </Suspense>
      ),
      permissions: ['url:update'],
    },
    {
      path: '/url/analytics/:id',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <UrlAnalytics />
        </Suspense>
      ),
      permissions: ['url:analytics'],
    },
    {
      path: '/url/ab-testing',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <ABTesting />
        </Suspense>
      ),
      permissions: ['url:ab-testing'],
    },
    {
      path: '/url/ab-testing/create',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <CreateABTest />
        </Suspense>
      ),
      permissions: ['url:create-ab-test'],
    },
    {
      path: '/url/ab-testing/:id/results',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <ABTestResults />
        </Suspense>
      ),
      permissions: ['url:ab-test-results'],
    },

    // Reputation Management Routes
    {
      path: '/reputation',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <ReputationManagement />
        </Suspense>
      ),
      permissions: ['reputation:read'],
    },
    {
      path: '/reputation/reviews',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <ReviewMonitoringModule />
        </Suspense>
      ),
      permissions: ['reputation:reviews'],
    },
    {
      path: '/reputation/links',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <CreateReviewLinkModule mode="list" />
        </Suspense>
      ),
      permissions: ['reputation:links'],
    },
    {
      path: '/reputation/links/create',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <CreateReviewLinkModule mode="create" />
        </Suspense>
      ),
      permissions: ['reputation:create-link'],
    },
    {
      path: '/reputation/links/:linkId',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <CreateReviewLinkModule mode="edit" />
        </Suspense>
      ),
      permissions: ['reputation:edit-link'],
    },
    {
      path: '/reputation/analytics',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <ReputationAnalytics />
        </Suspense>
      ),
      permissions: ['reputation:analytics'],
    },
    // AI Enhanced Features Routes
    {
      path: '/ai-enhanced/follow-ups',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <FollowUpManagement />
        </Suspense>
      ),
      permissions: ['ai:read'],
    },
    // {
    //   path: '/ai-enhanced/automation',
    //   element: (
    //     <Suspense fallback={<LoadingComponent />}>
    //       <AutomationSuggestions />
    //     </Suspense>
    //   ),
    //   permissions: ['ai:read'],
    // },
    {
      path: '/ai-enhanced/learning',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <AILearningDashboard />
        </Suspense>
      ),
      permissions: ['ai:read'],
    },
    // Business Process Automation Routes
    {
      path: '/appointments',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <Appointments />
        </Suspense>
      ),
      permissions: ['workflow:read'],
    },
    // {
    //   path: '/business-processes',
    //   element: (
    //     <Suspense fallback={<LoadingComponent />}>
    //       <BusinessProcesses />
    //     </Suspense>
    //   ),
    //   permissions: ['workflow:read'],
    // },
    // {
    //   path: '/task-tracking',
    //   element: (
    //     <Suspense fallback={<LoadingComponent />}>
    //       <TaskTracking />
    //     </Suspense>
    //   ),
    //   permissions: ['task:read'],
    // },
    // Marketing Management Routes
    {
      path: '/marketing',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <Marketing />
        </Suspense>
      ),
      permissions: ['marketing:read'],
    },
    {
      path: '/marketing/campaign-builder',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <CampaignBuilder />
        </Suspense>
      ),
      permissions: ['marketing:campaign-builder'],
    },
    {
      path: '/marketing/campaign-builder/:campaignId',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <UpdateCampaignModule />
        </Suspense>
      ),
      permissions: ['marketing:update-campaign'],
    },
    {
      path: '/marketing/analytics/:campaignId',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <CampaignAnalysisModule />
        </Suspense>
      ),
      permissions: ['marketing:analytics'],
    },
    {
      path: '/marketing/behavior-triggers',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <BehaviorTriggers />
        </Suspense>
      ),
      permissions: ['marketing:behavior-triggers'],
    },
    {
      path: '/marketing/audiences',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <RetargetingAudiences />
        </Suspense>
      ),
      permissions: ['marketing:audiences'],
    },
    // Survey Management Routes
    {
      path: '/survey',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <Survey />
        </Suspense>
      ),
      permissions: ['survey:read'],
    },
    {
      path: '/survey/create',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <SurveyCreate />
        </Suspense>
      ),
      permissions: ['survey:create'],
    },
    {
      path: '/survey/:id',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <SurveyRead />
        </Suspense>
      ),
      permissions: ['survey:read'],
    },
    {
      path: '/survey/:id/edit',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <SurveyUpdate />
        </Suspense>
      ),
      permissions: ['survey:update'],
    },
    {
      path: '/survey/:id/analytics',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <SurveyAnalytics />
        </Suspense>
      ),
      permissions: ['survey:read'],
    },
    // Analytics & Reporting Routes
    {
      path: '/analytics',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <AnalyticsReporting />
        </Suspense>
      ),
      permissions: ['analytics:read'],
    },
    // Subscription / Billing
    {
      path: '/subscription',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <SubscriptionPage />
        </Suspense>
      ),
      permissions: [],
    },
    {
      path: '/design-system',
      element: (
        <Suspense fallback={<LoadingComponent />}>
          <MasterLayoutShowcase />
        </Suspense>
      ),
      permissions: [],
    },
  ],
};

export default routes;
