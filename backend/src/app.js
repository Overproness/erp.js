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
// Load All Mongoose Models (must be before anything else)
// ─────────────────────────────────────────────────────────────
const { globSync } = require('glob');
const modelFiles = globSync('./src/models/**/*.js', { cwd: path.join(__dirname, '..') });
for (const filePath of modelFiles) {
  try {
    require(path.resolve(path.join(__dirname, '..', filePath)));
  } catch (e) {
    // Skip non-model files in models directory
  }
}

// ─────────────────────────────────────────────────────────────
// Import Middleware and Handlers
// ─────────────────────────────────────────────────────────────
const errorHandlers = require('./handlers/errorHandlers');
const rateLimitMiddleware = require('./middlewares/rateLimitMiddleware');
const adminAuth = require('./controllers/coreControllers/adminAuth');
const behaviorTracking = require('./middlewares/behaviorTracking');
const { expressMiddleware } = require('@apollo/server/express4');
const { createApolloServer, buildContext } = require('./graphql');

// ─────────────────────────────────────────────────────────────
// Import REST Routes (only for operations GraphQL can't handle)
// ─────────────────────────────────────────────────────────────
// Auth (login/register)
const coreAuthRouter = require('./routes/coreRoutes/coreAuth');
// File downloads (binary streams)
const coreDownloadRouter = require('./routes/coreRoutes/coreDownloadRouter');
// Public routes (no auth needed)
const corePublicRouter = require('./routes/coreRoutes/corePublicRouter');
// URL redirects (short code redirects need special handling)
const urlRedirectController = require('./controllers/appControllers/urlRedirectController');
const urlRedirectRoutes = require('./routes/appRoutes/urlRedirectRoutes');
// Public routes that need REST (webhooks, callbacks, public access)
const documentPublicRoutes = require('./routes/appRoutes/documentPublicRoutes');
const socialMediaPublicRoutes = require('./routes/appRoutes/socialMediaPublicRoutes');
const teamPublicRoutes = require('./routes/appRoutes/teamPublicRoutes');
const publicSurveyRoutes = require('./routes/publicSurveyRoutes');
const customerChatRoutes = require('./routes/appRoutes/customerChatRoutes');
// File upload routes (multipart form data)
const dataEntryRoutes = require('./routes/dataEntryRoutes');
const documentRouter = require('./routes/appRoutes/documentRoutes');

// ─────────────────────────────────────────────────────────────
// Create Express App
// ─────────────────────────────────────────────────────────────
const app = express();

// ─────────────────────────────────────────────────────────────
// Core Middleware Stack
// ─────────────────────────────────────────────────────────────
app.use(morgan('dev'));

app.use(cors({
  origin: true,
  credentials: true,
}));

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
// Health Check (no middleware overhead)
// ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─────────────────────────────────────────────────────────────
// File Upload Middleware (only for REST upload routes)
// ─────────────────────────────────────────────────────────────
const fileUploadMiddleware = (req, res, next) => {
  if (req.path.startsWith('/api/data-entry/ocr') || req.path.startsWith('/api/data-entry/spreadsheet')) {
    return next();
  }
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    useTempFiles: false,
    abortOnLimit: true,
    limitHandler: (req, res) =>
      res.status(413).json({ success: false, result: null, message: 'File is too large. Maximum file size is 50MB.' }),
  })(req, res, next);
};

const validateFileUpload = (req, res, next) => {
  if (!req.files) return next();

  const allowedMimeTypes = [
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  ];
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv', '.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const suspiciousPatterns = [/\.exe$/, /\.bat$/, /\.cmd$/, /\.com$/, /\.scr$/, /\.vbs$/, /\.js$/, /\.php$/];

  const files = Array.isArray(req.files) ? req.files : Object.values(req.files);
  for (const file of files) {
    const filesToCheck = Array.isArray(file) ? file : [file];
    for (const f of filesToCheck) {
      const ext = f.name.toLowerCase().substring(f.name.lastIndexOf('.'));
      if (!allowedExtensions.includes(ext)) {
        return res.status(400).json({ success: false, message: `File type ${ext} not allowed.` });
      }
      if (!allowedMimeTypes.includes(f.mimetype)) {
        return res.status(400).json({ success: false, message: `MIME type ${f.mimetype} not allowed.` });
      }
      if (suspiciousPatterns.some((p) => p.test(f.name))) {
        return res.status(400).json({ success: false, message: `Suspicious file: ${f.name}` });
      }
    }
  }
  next();
};

// ─────────────────────────────────────────────────────────────
// Input Sanitization
// ─────────────────────────────────────────────────────────────
app.use(errorHandlers.sanitizeInputs);

// ─────────────────────────────────────────────────────────────
// Rate Limiting (auth endpoints only)
// ─────────────────────────────────────────────────────────────
app.use('/api/login', rateLimitMiddleware.enhancedLoginRateLimit);
app.use('/api/login', rateLimitMiddleware.recordFailedLogin);
app.use('/api/login', rateLimitMiddleware.createStrictRateLimit('login'));
app.use('/api/register', rateLimitMiddleware.createRateLimit('create'));
app.use('/api/logout', rateLimitMiddleware.createRateLimit('logout'));

// ─────────────────────────────────────────────────────────────
// Behavior Tracking
// ─────────────────────────────────────────────────────────────
app.use(behaviorTracking.trackPageView);
app.use('/api', behaviorTracking.trackApiInteraction);

// ─────────────────────────────────────────────────────────────
// PUBLIC REST Routes (no auth, before GraphQL)
// ─────────────────────────────────────────────────────────────
const { catchErrors } = errorHandlers;
const stripAuth = (req, res, next) => { delete req.headers.authorization; next(); };

// URL shortcode redirects
app.get('/api/s/:shortCode', stripAuth, catchErrors(urlRedirectController.getUrl));
app.get('/api/s/:shortCode/preview', stripAuth, catchErrors(urlRedirectController.preview));
app.get('/api/s/:shortCode/qr', stripAuth, catchErrors(urlRedirectController.generateQRCode));
app.post('/api/s/:shortCode/password', stripAuth, catchErrors(urlRedirectController.checkPassword));

// Auth routes (login/register/logout)
app.use('/api', coreAuthRouter);

// Public routes
app.use('/api/public/social-media', stripAuth, socialMediaPublicRoutes);
app.use('/api/public/url', stripAuth, urlRedirectRoutes);
app.use('/api/public/team', stripAuth, teamPublicRoutes);
app.use('/api/public/document', stripAuth, documentPublicRoutes);
app.use('/api/public/survey', stripAuth, publicSurveyRoutes);
app.use('/public', corePublicRouter);
app.use('/download', stripAuth, coreDownloadRouter);

// Customer chat (has its own selective auth)
app.use('/api/customer-chat', customerChatRoutes);

// Tracking endpoint
app.post('/api/track/event', behaviorTracking.trackCustomEvent);

// ─────────────────────────────────────────────────────────────
// PROTECTED REST Routes (file uploads, binary operations)
// ─────────────────────────────────────────────────────────────
app.use('/api/document', adminAuth.isValidAuthToken, fileUploadMiddleware, validateFileUpload, documentRouter);
app.use('/api/data-entry', adminAuth.isValidAuthToken, dataEntryRoutes);

// ─────────────────────────────────────────────────────────────
// GraphQL Endpoint (handles all CRUD and business logic)
// ─────────────────────────────────────────────────────────────
async function setupGraphQL() {
  const apolloServer = await createApolloServer();

  app.use(
    '/graphql',
    express.json(),
    expressMiddleware(apolloServer, {
      context: buildContext,
    })
  );

  console.log('🚀 GraphQL endpoint ready at /graphql');
}

// Initialize GraphQL (called from server.js after DB connection)
app.setupGraphQL = setupGraphQL;

// ─────────────────────────────────────────────────────────────
// Legacy REST API Routes (backward compatibility)
// These will be gradually replaced by GraphQL queries/mutations
// ─────────────────────────────────────────────────────────────
const coreApiRouter = require('./routes/coreRoutes/coreApi');
const erpApiRouter = require('./routes/appRoutes/appApi');
const teamRouter = require('./routes/appRoutes/teamRoutes');
const userRoutes = require('./routes/appRoutes/userRoutes');
const urlRoutes = require('./routes/appRoutes/urlRoutes');
const abTestRoutes = require('./routes/appRoutes/abTestRoutes');
const crmUrlRoutes = require('./routes/appRoutes/crmUrlRoutes');
const chatRoutes = require('./routes/appRoutes/chatRoutes');
const auditRoutes = require('./routes/appRoutes/auditRoutes');
const documentAuditRoutes = require('./routes/appRoutes/documentAuditRoutes');
const taxesRoutes = require('./routes/appRoutes/taxesRoutes');
const paymentModeRoutes = require('./routes/appRoutes/paymentModeRoutes');
const socialMediaRoutes = require('./routes/appRoutes/socialMediaRoutes');
const reputationAnalyticsRoutes = require('./routes/appRoutes/reputationAnalyticsRoutes');
const marketingRoutes = require('./routes/appRoutes/marketingRoutes');
const surveyRoutes = require('./routes/surveyRoutes');
const workflowRoutes = require('./routes/workflows-simple');
const appointmentRoutes = require('./routes/appRoutes/appointmentRoutes');
const businessProcessRoutes = require('./routes/appRoutes/businessProcessRoutes');
const reminderRoutes = require('./routes/appRoutes/reminderRoutes');
const taskRoutes = require('./routes/appRoutes/taskRoutes');
const notificationRoutes = require('./routes/appRoutes/notificationRoutes');
const aiAssistantRoutes = require('./routes/appRoutes/aiAssistantRoutes');
const aiDataProcessorRoutes = require('./routes/appRoutes/aiDataProcessorRoutes');
const aiUserPreferenceRoutes = require('./routes/appRoutes/aiUserPreferenceRoutes');
const aiKnowledgeBaseRoutes = require('./routes/appRoutes/aiKnowledgeBaseRoutes');
const copilotRoutes = require('./routes/appRoutes/copilotRoutes');
const aiEnhancedRoutes = require('./routes/appRoutes/aiEnhancedRoutes');
const complianceRoutes = require('./routes/appRoutes/complianceRoutes');
const workflowExecutionRoutes = require('./routes/appRoutes/workflowExecutionRoutes');
const campaignRoutes = require('./routes/appRoutes/campaignRoutes');
const triggerRoutes = require('./routes/appRoutes/triggerRoutes');
const analyticsRoutes = require('./routes/appRoutes/analyticsRoutes');
const retargetingRoutes = require('./routes/appRoutes/retargetingRoutes');
const globalAnalyticsRoutes = require('./routes/appRoutes/globalAnalyticsRoutes');

// Core + ERP
app.use('/api', adminAuth.isValidAuthToken, coreApiRouter);
app.use('/api/client', adminAuth.isValidAuthToken, crmUrlRoutes);
app.use('/api', adminAuth.isValidAuthToken, erpApiRouter);

// Entity routes
app.use('/api/team', adminAuth.isValidAuthToken, teamRouter);
app.use('/api/user', adminAuth.isValidAuthToken, userRoutes);
app.use('/api/url', adminAuth.isValidAuthToken, urlRoutes);
app.use('/api/abtest', adminAuth.isValidAuthToken, abTestRoutes);
app.use('/api/chat', adminAuth.isValidAuthToken, chatRoutes);
app.use('/api/audit', adminAuth.isValidAuthToken, auditRoutes);
app.use('/api/document-audit', adminAuth.isValidAuthToken, documentAuditRoutes);
app.use('/api/taxes', adminAuth.isValidAuthToken, taxesRoutes);
app.use('/api/paymentMode', adminAuth.isValidAuthToken, paymentModeRoutes);
app.use('/api/social-media', adminAuth.isValidAuthToken, socialMediaRoutes);
app.use('/api/reputation/analytics', adminAuth.isValidAuthToken, reputationAnalyticsRoutes);
app.use('/api/marketing', adminAuth.isValidAuthToken, marketingRoutes);
app.use('/api/surveys', adminAuth.isValidAuthToken, surveyRoutes);
app.use('/api/workflows', adminAuth.isValidAuthToken, workflowRoutes);
app.use('/api/appointments', adminAuth.isValidAuthToken, appointmentRoutes);
app.use('/api/business-processes', adminAuth.isValidAuthToken, businessProcessRoutes);
app.use('/api/reminders', adminAuth.isValidAuthToken, reminderRoutes);
app.use('/api/task', adminAuth.isValidAuthToken, taskRoutes);
app.use('/api/notifications', adminAuth.isValidAuthToken, notificationRoutes);

// AI routes (these should be protected - fixing security issue)
app.use('/api/aiAssistant', adminAuth.isValidAuthToken, aiAssistantRoutes);
app.use('/api/aiUserPreference', adminAuth.isValidAuthToken, aiUserPreferenceRoutes);
app.use('/api/aiKnowledgeBase', adminAuth.isValidAuthToken, aiKnowledgeBaseRoutes);
app.use('/api/copilot', adminAuth.isValidAuthToken, copilotRoutes);
app.use('/api/ai', adminAuth.isValidAuthToken, aiDataProcessorRoutes);
app.use('/api/ai-enhanced', adminAuth.isValidAuthToken, aiEnhancedRoutes);
app.use('/api/workflow-execution', adminAuth.isValidAuthToken, workflowExecutionRoutes);
app.use('/api/compliance', adminAuth.isValidAuthToken, complianceRoutes);

// Marketing & Analytics
app.use('/api/campaigns', adminAuth.isValidAuthToken, campaignRoutes);
app.use('/api/triggers', adminAuth.isValidAuthToken, triggerRoutes);
app.use('/api/analytics', adminAuth.isValidAuthToken, analyticsRoutes);
app.use('/api/retargeting', adminAuth.isValidAuthToken, retargetingRoutes);
app.use('/api/global-analytics', adminAuth.isValidAuthToken, globalAnalyticsRoutes);

// ─────────────────────────────────────────────────────────────
// Serve Frontend Build (Production)
// ─────────────────────────────────────────────────────────────
const frontendBuildPath = path.join(__dirname, '../../frontend/dist');

if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/graphql')) return next();
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
} else {
  app.get('/s/:shortCode', (req, res) => {
    res.redirect(`http://localhost:3000/s/${req.params.shortCode}`);
  });
}

// ─────────────────────────────────────────────────────────────
// Error Handling
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

module.exports = app;
