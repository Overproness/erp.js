// ─────────────────────────────────────────────────────────────
// Import Core Dependencies
// ─────────────────────────────────────────────────────────────
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const fs = require('fs');

// ─────────────────────────────────────────────────────────────
// Load Models - MUST BE FIRST
// ─────────────────────────────────────────────────────────────
// Core Models
require('./models/coreModels/CompanyOwner');
require('./models/coreModels/CompanyOwnerPassword');
require('./models/coreModels/Setting');

// App Models
require('./models/appModels/User');
require('./models/appModels/Team');
require('./models/appModels/Document');
require('./models/appModels/DocumentVersion');
require('./models/appModels/DocumentCompliance');
require('./models/appModels/Client');
require('./models/appModels/Invoice');
require('./models/appModels/Quote');
require('./models/appModels/Payment');
require('./models/appModels/PaymentMode');
require('./models/appModels/Taxes');
require('./models/appModels/auditTrailModel');
require('./models/appModels/Task');
require('./models/appModels/Project');
require('./models/appModels/Schedule');
require('./models/appModels/SharedResource');
require('./models/appModels/Workflow');
require('./models/appModels/SavedSearch');
require('./models/appModels/AiExtractionTemplate');
require('./models/appModels/AiWorkflow');
require('./models/appModels/AiUserPreference');
require('./models/appModels/AiKnowledgeBase');
require('./models/appModels/ChatQueue');
require('./models/appModels/CustomerFollowUp');
require('./models/appModels/AILearningData');
require('./models/appModels/URL');
require('./models/appModels/URLClick');
require('./models/appModels/ABTest');
require('./models/appModels/Campaign');
require('./models/appModels/CustomerBehavior');
require('./models/appModels/CustomerSegment');
require('./models/appModels/TriggerRule');
require('./models/appModels/CustomerJourney');
require('./models/appModels/Interaction');
require('./models/appModels/Review');
require('./models/appModels/Business');
require('./models/appModels/ReviewLink');
require('./models/appModels/Appointment');
require('./models/appModels/BusinessProcess');
require('./models/appModels/AutomatedReminder');

// ─────────────────────────────────────────────────────────────
// Import Middleware and Handlers
// ─────────────────────────────────────────────────────────────
const errorHandlers = require('./handlers/errorHandlers');
const rateLimitMiddleware = require('./middlewares/rateLimitMiddleware');
const adminAuth = require('./controllers/coreControllers/adminAuth');
const behaviorTracking = require('./middlewares/behaviorTracking');
// const urlIntegration = require('./middlewares/urlIntegration');

// ─────────────────────────────────────────────────────────────
// Import Routes
// ─────────────────────────────────────────────────────────────
// Core Routes
const coreAuthRouter = require('./routes/coreRoutes/coreAuth');
const coreApiRouter = require('./routes/coreRoutes/coreApi');
const coreDownloadRouter = require('./routes/coreRoutes/coreDownloadRouter');
const corePublicRouter = require('./routes/coreRoutes/corePublicRouter');

// App Routes
const erpApiRouter = require('./routes/appRoutes/appApi');
const documentRouter = require('./routes/appRoutes/documentRoutes');
const teamRouter = require('./routes/appRoutes/teamRoutes');
const complianceRoutes = require('./routes/appRoutes/complianceRoutes');
const userRoutes = require('./routes/appRoutes/userRoutes');
const auditRoutes = require('./routes/appRoutes/auditRoutes');
const documentAuditRoutes = require('./routes/appRoutes/documentAuditRoutes');
const workflowExecutionRoutes = require('./routes/appRoutes/workflowExecutionRoutes');
const workflowRoutes = require('./routes/workflows-simple');
const marketingRoutes = require('./routes/appRoutes/marketingRoutes');
const taxesRoutes = require('./routes/appRoutes/taxesRoutes');
const paymentModeRoutes = require('./routes/appRoutes/paymentModeRoutes');
const appointmentRoutes = require('./routes/appRoutes/appointmentRoutes');
const businessProcessRoutes = require('./routes/appRoutes/businessProcessRoutes');
const reminderRoutes = require('./routes/appRoutes/reminderRoutes');
const taskRoutes = require('./routes/appRoutes/taskRoutes');

// AI Routes
const aiAssistantRoutes = require('./routes/appRoutes/aiAssistantRoutes');
const aiDataProcessorRoutes = require('./routes/appRoutes/aiDataProcessorRoutes');
const aiUserPreferenceRoutes = require('./routes/appRoutes/aiUserPreferenceRoutes');
const aiKnowledgeBaseRoutes = require('./routes/appRoutes/aiKnowledgeBaseRoutes');
const copilotRoutes = require('./routes/appRoutes/copilotRoutes');
const aiEnhancedRoutes = require('./routes/appRoutes/aiEnhancedRoutes');

// Social Media Routes
const socialMediaRoutes = require('./routes/appRoutes/socialMediaRoutes');
const socialMediaPublicRoutes = require('./routes/appRoutes/socialMediaPublicRoutes');

// Reputation Analytics Routes
const reputationAnalyticsRoutes = require('./routes/appRoutes/reputationAnalyticsRoutes');

// Public Team Invitation Routes
const teamPublicRoutes = require('./routes/appRoutes/teamPublicRoutes');

// URL Management Routes
const urlRoutes = require('./routes/appRoutes/urlRoutes');
const urlRedirectRoutes = require('./routes/appRoutes/urlRedirectRoutes');
const abTestRoutes = require('./routes/appRoutes/abTestRoutes');

// Chat Routes
const chatRoutes = require('./routes/appRoutes/chatRoutes');

// ─────────────────────────────────────────────────────────────
// Create Express App
// ─────────────────────────────────────────────────────────────
const app = express();

// ─────────────────────────────────────────────────────────────
// Setup Middleware
// ─────────────────────────────────────────────────────────────

// Request logging
app.use(morgan('dev'));

// Enable CORS with credentials
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'"
  );
  next();
});

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─────────────────────────────────────────────────────────────
// Health Check Endpoint - BEFORE any rate limiting or heavy middleware
// ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  // Minimal response to avoid any middleware overhead
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    pid: process.pid,
  });
});

// Debug logs for all requests
app.use((req, res, next) => {
  console.log('=== REQUEST DEBUG ===');
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Auth header:', req.headers.authorization ? 'Present' : 'Missing');
  console.log('=======================');
  next();
});

// ─────────────────────────────────────────────────────────────
// File Upload Middleware and Validation
// ─────────────────────────────────────────────────────────────
app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    useTempFiles: false,
    abortOnLimit: true,
    responseOnLimit: 'File size limit has been reached (max 50MB)',
    limitHandler: (req, res) =>
      res.status(413).json({
        success: false,
        result: null,
        message: 'File is too large. Maximum file size is 50MB.',
      }),
  })
);

// Custom file validation
const validateFileUpload = (req, res, next) => {
  if (!req.files) return next();

  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  const allowedExtensions = [
    '.pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.txt',
    '.csv',
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
  ];

  const files = Array.isArray(req.files) ? req.files : Object.values(req.files);

  for (let file of files) {
    const filesToCheck = Array.isArray(file) ? file : [file];
    for (let f of filesToCheck) {
      const ext = f.name.toLowerCase().substring(f.name.lastIndexOf('.'));
      if (!allowedExtensions.includes(ext)) {
        return res.status(400).json({
          success: false,
          message: `File type ${ext} not allowed. Allowed: ${allowedExtensions.join(', ')}`,
        });
      }

      if (!allowedMimeTypes.includes(f.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `MIME type ${f.mimetype} not allowed for file: ${f.name}`,
        });
      }

      const suspicious = [
        /\.exe$/,
        /\.bat$/,
        /\.cmd$/,
        /\.com$/,
        /\.scr$/,
        /\.vbs$/,
        /\.js$/,
        /\.php$/,
      ];
      if (suspicious.some((p) => p.test(f.name))) {
        return res.status(400).json({
          success: false,
          message: `Suspicious file name: ${f.name}`,
        });
      }
    }
  }

  next();
};

app.use(validateFileUpload);

// ─────────────────────────────────────────────────────────────
// Sanitize Inputs Globally
// ─────────────────────────────────────────────────────────────
app.use(errorHandlers.sanitizeInputs);

// ─────────────────────────────────────────────────────────────
// Rate Limiting
// ─────────────────────────────────────────────────────────────
app.use('/api/login', rateLimitMiddleware.enhancedLoginRateLimit);
app.use('/api/login', rateLimitMiddleware.recordFailedLogin);
app.use('/api/login', rateLimitMiddleware.createStrictRateLimit('login'));
app.use('/api/register', rateLimitMiddleware.createRateLimit('create'));
app.use('/api/logout', rateLimitMiddleware.createRateLimit('logout'));

// ─────────────────────────────────────────────────────────────
// Behavior Tracking Middleware - applied to all routes
// ─────────────────────────────────────────────────────────────
app.use(behaviorTracking.trackPageView);
app.use('/api', behaviorTracking.trackApiInteraction);

// ─────────────────────────────────────────────────────────────
// URL Integration Middleware
// ─────────────────────────────────────────────────────────────
// app.use('/s/:shortCode', urlIntegration.processCampaignUrl);
// app.use('/api/url/create', urlIntegration.attachCampaignParameters);
// app.use('/api/url/track/:urlId/click', urlIntegration.trackCampaignUrlClick);

// ─────────────────────────────────────────────────────────────
// Register Routes (Order Matters!)
// ─────────────────────────────────────────────────────────────
// Public Routes
app.use('/api', coreAuthRouter);
app.use(
  '/api/public/social-media',
  (req, res, next) => {
    delete req.headers.authorization;
    next();
  },
  socialMediaPublicRoutes
);

app.use(
  '/download',
  (req, res, next) => {
    delete req.headers.authorization;
    next();
  },
  coreDownloadRouter
);

app.use(
  '/api/public/url',
  (req, res, next) => {
    delete req.headers.authorization;
    next();
  },
  urlRedirectRoutes
);

app.use('/public', corePublicRouter);
app.use(
  '/api/public/team',
  (req, res, next) => {
    delete req.headers.authorization;
    next();
  },
  teamPublicRoutes
);

// Custom tracking endpoint
app.post('/api/track/event', behaviorTracking.trackCustomEvent);

// Temporary public test route for debugging retargeting API
app.get('/api/marketing/retargeting/test-public', (req, res) => {
  res.json({
    success: true,
    message: 'Public retargeting test route working',
    timestamp: new Date().toISOString(),
  });
});

// Protected Routes
app.use('/api', adminAuth.isValidAuthToken, coreApiRouter);
app.use('/api', adminAuth.isValidAuthToken, erpApiRouter);
app.use('/api/document', adminAuth.isValidAuthToken, documentRouter);
app.use('/api/team', adminAuth.isValidAuthToken, teamRouter);
app.use('/api/url', adminAuth.isValidAuthToken, urlRoutes);
app.use('/api/abtest', adminAuth.isValidAuthToken, abTestRoutes);
app.use('/api/chat', adminAuth.isValidAuthToken, chatRoutes);
app.use('/api/audit', adminAuth.isValidAuthToken, auditRoutes);
app.use('/api/document-audit', adminAuth.isValidAuthToken, documentAuditRoutes);
app.use('/api/ai', adminAuth.isValidAuthToken, aiDataProcessorRoutes);
app.use('/api/taxes', adminAuth.isValidAuthToken, taxesRoutes);
app.use('/api/paymentMode', adminAuth.isValidAuthToken, paymentModeRoutes);
app.use('/api/social-media', adminAuth.isValidAuthToken, socialMediaRoutes);
app.use('/api/reputation/analytics', adminAuth.isValidAuthToken, reputationAnalyticsRoutes);
app.use('/api/marketing', adminAuth.isValidAuthToken, marketingRoutes);
app.use('/api/user', adminAuth.isValidAuthToken, userRoutes);
app.use('/api/workflows', adminAuth.isValidAuthToken, workflowRoutes);
app.use('/api/appointments', adminAuth.isValidAuthToken, appointmentRoutes);
app.use('/api/business-processes', adminAuth.isValidAuthToken, businessProcessRoutes);
app.use('/api/reminders', adminAuth.isValidAuthToken, reminderRoutes);
app.use('/api/task', adminAuth.isValidAuthToken, taskRoutes);

// AI + Other Unprotected APIs
app.use('/api/aiAssistant', aiAssistantRoutes);
app.use('/api/aiUserPreference', aiUserPreferenceRoutes);
app.use('/api/aiKnowledgeBase', aiKnowledgeBaseRoutes);
app.use('/api/copilot', copilotRoutes);
app.use('/api/ai-enhanced', adminAuth.isValidAuthToken, aiEnhancedRoutes);
app.use('/api/workflow-execution', workflowExecutionRoutes);
app.use('/api/compliance', complianceRoutes);

// Marketing Campaign Routes
const campaignRoutes = require('./routes/appRoutes/campaignRoutes');
const triggerRoutes = require('./routes/appRoutes/triggerRoutes');
const analyticsRoutes = require('./routes/appRoutes/analyticsRoutes');
const retargetingRoutes = require('./routes/appRoutes/retargetingRoutes');

app.use('/api/campaigns', adminAuth.isValidAuthToken, campaignRoutes);
app.use('/api/triggers', adminAuth.isValidAuthToken, triggerRoutes);
app.use('/api/analytics', adminAuth.isValidAuthToken, analyticsRoutes);
app.use('/api/retargeting', adminAuth.isValidAuthToken, retargetingRoutes);

// ─────────────────────────────────────────────────────────────
// Generate campaign URLs
// app.post(
//   '/api/url/campaign/generate',
//   adminAuth.isValidAuthToken,
//   urlIntegration.generateCampaignUrls
// );

// ─────────────────────────────────────────────────────────────
// Error Handling and Not Found
// ─────────────────────────────────────────────────────────────
app.use(errorHandlers.notFound);
app.use(errorHandlers.productionErrors);

// ─────────────────────────────────────────────────────────────
// Ensure Upload Directory Exists
// ─────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, 'uploads/documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ─────────────────────────────────────────────────────────────
// Export App
// ─────────────────────────────────────────────────────────────
module.exports = app;
