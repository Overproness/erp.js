import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';
import fs from 'fs';

// ─────────────────────────────────────────────────────────────
// Load All Mongoose Models (must be before anything else)
// ─────────────────────────────────────────────────────────────
const { globSync } = require('glob');
const modelFiles: string[] = globSync('./models/**/*.{js,ts}', { cwd: __dirname });
for (const filePath of modelFiles) {
  try {
    require(path.resolve(path.join(__dirname, filePath)));
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
const app: Application & { setupGraphQL?: () => Promise<void> } = express();

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
app.get('/api/health', (req: Request, res: Response) => {
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
const fileUploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api/data-entry/ocr') || req.path.startsWith('/api/data-entry/spreadsheet')) {
    return next();
  }
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    useTempFiles: false,
    abortOnLimit: true,
    limitHandler: (req: Request, res: Response) =>
      res.status(413).json({ success: false, result: null, message: 'File is too large. Maximum file size is 50MB.' }),
  })(req, res, next);
};

const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
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

  const files: any[] = Array.isArray(req.files) ? req.files : Object.values(req.files);
  for (const file of files) {
    const filesToCheck: any[] = Array.isArray(file) ? file : [file];
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
const stripAuth = (req: Request, res: Response, next: NextFunction) => { delete req.headers.authorization; next(); };

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
(app as any).setupGraphQL = setupGraphQL;

// ─────────────────────────────────────────────────────────────
// Legacy REST routes removed — all CRUD and business logic
// is now handled by GraphQL at /graphql
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// Serve Frontend Build (Production)
// ─────────────────────────────────────────────────────────────
const frontendBuildPath = path.join(__dirname, '../../frontend/dist');

if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/graphql')) return next();
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
} else {
  app.get('/s/:shortCode', (req: Request, res: Response) => {
    res.redirect(`http://localhost:3000/s/${req.params.shortCode}`);
  });
}

// ─────────────────────────────────────────────────────────────
// NOTE: Error handlers (notFound, productionErrors) are registered
// in server.ts AFTER setupGraphQL() so the /graphql route sits
// before the 404 handler in Express's middleware stack.
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// Ensure Upload Directory Exists
// ─────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, 'uploads/documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export default app;
module.exports = app;
