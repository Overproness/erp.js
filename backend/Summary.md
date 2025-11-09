# Backend Summary - Tech Revisor Automation Suite (Odoo Project)

## 1. Overview

The backend is a **Node.js Express-based ERP/CRM system** built with MongoDB and Mongoose ODM. It provides comprehensive business management capabilities including customer management, invoicing, quoting, payment processing, document management, team collaboration, workflow automation, AI assistance, and social media management.

## 2. Architecture & Technology Stack

### 2.1 Core Technologies

- **Runtime**: Node.js v20.9.0
- **Framework**: Express.js v4.18.2
- **Database**: MongoDB with Mongoose ODM v8.1.1
- **Authentication**: JWT-based with bcryptjs password hashing
- **File Upload**: express-fileupload with 50MB limit
- **Email**: Nodemailer for SMTP email functionality
- **PDF Generation**: html-pdf, pdf-lib for document generation
- **Validation**: Joi for request validation
- **Template Engine**: Pug for PDF templates
- **Compression**: Built-in gzip compression
- **CORS**: Enabled for cross-origin requests
- **AI Integration**: OpenAI API integration for intelligent features

### 2.2 Project Structure

```
backend/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── server.js              # Server initialization & MongoDB connection
│   ├── controllers/           # Request handlers & business logic
│   │   ├── coreControllers/   # Authentication & settings
│   │   ├── appControllers/    # Business entities & AI
│   │   └── socialMedia/       # Social media management
│   ├── models/                # Mongoose schemas & models
│   │   ├── coreModels/        # User, auth, settings models
│   │   ├── appModels/         # Business entity models
│   │   ├── aiModels/          # AI assistant models
│   │   └── socialMedia/       # Social media models
│   ├── routes/                # API route definitions
│   ├── middlewares/           # Custom middleware functions
│   ├── services/              # Business service layer
│   ├── helpers/               # Utility functions & calculations
│   ├── handlers/              # Error handlers
│   ├── pdf/                   # PDF template files (Pug)
│   ├── uploads/               # File storage directory
│   ├── setup/                 # Database setup & initialization scripts
│   ├── settings/              # Settings management
│   ├── locale/                # Internationalization support
│   └── utils/                 # Shared utilities
├── package.json              # Dependencies & scripts
└── jsconfig.json            # JavaScript configuration
```

## 3. Data Models & Database Schema

### 3.1 Core User Models

**CompanyOwner Model** (`/models/coreModels/CompanyOwner.js`)
- Primary admin user who owns a company account
- Fields: `email`, `password`, `companyName`, `role`, `onboardingComplete`
- Has ownership of all company data (customers, invoices, settings, etc.)
- Referenced by `owner` field in most other models

**User Model** (`/models/coreModels/User.js`)
- Team members/employees under a CompanyOwner
- Fields: `email`, `password`, `role`, `permissions`, `team`, `companyOwner`
- Access controlled by permissions array
- Can reference either a `team` or directly to `companyOwner`

**Team Model** (`/models/coreModels/Team.js`)
- Groups of users under a company owner
- Fields: `teamName`, `teamDescription`, `members[]`, `owner` (CompanyOwner)

### 3.2 Settings & Configuration Models

**Setting Model** (`/models/coreModels/Setting.js`)
- Flexible key-value settings storage
- Fields: `settingKey`, `settingValue`, `settingCategory`, `valueType`, `owner`
- Supports company-specific vs global settings via `owner` field
- Categories: `company_settings`, `money_format_settings`, `app_settings`, `finance_settings`

**FinanceSettings Model** (`/models/appModels/FinanceSettings.js`)
- Company-specific financial configuration
- Nested objects for currency, tax, and general settings
- References Currency model for default currency
- Fields: `currencySettings`, `taxSettings`, `generalSettings`, `invoice`, `quote`, `payment`

**Currency Model** (`/models/appModels/Currency.js`)
- Multi-currency support for international businesses
- Fields: `name`, `code`, `symbol`, `decimal_separator`, `thousand_separator`, `cent_precision`
- Owner-specific currencies with `isDefault` flag

### 3.3 Business Entity Models

**Customer Model** (`/models/appModels/Customer.js`)
- Both individual and business customers
- Fields: `removed`, `enabled`, `name`, `email`, `phone`, `website`, `address`
- Custom fields support via `customFields` array
- Owner-specific data isolation

**Invoice Model** (`/models/appModels/Invoice.js`)
- Complete invoicing system with line items
- Status workflow: `draft` → `pending` → `sent` → `paid` → `overdue`
- Relationships: `customer`, `items[]`, `payment`
- Automatic numbering and PDF generation

**Quote Model** (`/models/appModels/Quote.js`)
- Sales quotation system with expiration dates
- Can be converted to invoices
- Status: `draft`, `sent`, `accepted`, `declined`, `expired`

**Payment Model** (`/models/appModels/Payment.js`)
- Payment tracking and reconciliation
- Links to invoices and customers
- Multiple payment methods support

### 3.4 AI Models

**AiAssistant Model** (`/models/aiModels/AiAssistant.js`)
- AI assistant configurations and capabilities
- Fields: `name`, `description`, `type`, `capabilities`, `configuration`, `isActive`
- Types: `general`, `document`, `workflow`, `analytics`, `customer`, `financial`
- Owner-specific AI assistants

**AiChat Model** (`/models/aiModels/AiChat.js`)
- Chat conversations with AI assistants
- Fields: `messages[]`, `context`, `assistant`, `user`, `sessionId`
- Conversation history and context management

**AiAnalytics Model** (`/models/aiModels/AiAnalytics.js`)
- AI usage analytics and performance tracking
- Fields: `usageStats`, `responseMetrics`, `userSatisfaction`
- Performance monitoring and optimization data

### 3.5 Social Media Models

**SocialMediaAccount Model** (`/models/socialMedia/SocialMediaAccount.js`)
- Connected social media platform accounts
- Fields: `platform`, `accountId`, `accessToken`, `refreshToken`, `profile`
- Platforms: `facebook`, `instagram`, `twitter`, `linkedin`
- OAuth token management and refresh

**SocialMediaPost Model** (`/models/socialMedia/SocialMediaPost.js`)
- Social media posts and content
- Fields: `content`, `media[]`, `platforms[]`, `scheduledDate`, `status`
- Status: `draft`, `scheduled`, `published`, `failed`
- Multi-platform posting support

**SocialMediaCampaign Model** (`/models/socialMedia/SocialMediaCampaign.js`)
- Marketing campaign management
- Fields: `name`, `description`, `posts[]`, `budget`, `startDate`, `endDate`
- Campaign performance tracking and ROI analysis

**SocialMediaAnalytics Model** (`/models/socialMedia/SocialMediaAnalytics.js`)
- Performance metrics and engagement data
- Fields: `postId`, `platform`, `impressions`, `clicks`, `engagement`, `reach`
- Real-time analytics aggregation

### 3.6 URL Management Models

**Url Model** (`/models/urlModels/Url.js`)
- URL shortening and management
- Fields: `originalUrl`, `shortCode`, `title`, `description`, `clicks`, `isActive`
- Click tracking and analytics integration

**UrlAnalytics Model** (`/models/urlModels/UrlAnalytics.js`)
- Detailed URL analytics and reporting
- Fields: `urlId`, `clickData`, `geographic`, `devices`, `referrers`
- Advanced analytics with geographic and device breakdown

**ABTest Model** (`/models/urlModels/ABTest.js`)
- A/B testing for URLs and campaigns
- Fields: `testName`, `variants[]`, `metrics`, `results`, `status`
- Statistical analysis and winner determination

### 3.7 Document & Communication Models

**Document Model** (`/models/appModels/Document.js`)
- File storage and document management
- Supports multiple file types and versions
- Owner access control and collaboration features

**Email Model** (`/models/appModels/Email.js`)
- Email communication tracking
- Links to customers and other entities
- Template management and tracking

### Communication Models

**ChatMessage Model** (`/models/appModels/ChatMessage.js`)
- Real-time messaging between users and company owners
- Fields: `sender`, `receiver`, `message`, `companyID`, `isRead`, `readAt`
- Company-based data isolation for secure messaging
- Message read status tracking and timestamps
- Persistent chat history with MongoDB storage

## 4. Authentication & Authorization

### 4.1 Authentication Architecture

The system implements **hierarchical authentication** with three user types:

```javascript
// Authentication flow priority:
1. CompanyOwner (primary admin) - Full access to company data
2. User (team member) - Limited access based on permissions  
3. Team-based access - Users access data through team owner
```

**JWT Token Structure:**
- CompanyOwner tokens: `{ id: companyOwnerId, iat, exp }`
- User tokens: `{ id: userId, isUser: true, iat, exp }`

**Permission System:**
```javascript
// User permissions array controls access to features
permissions: [
  'can_read_customers',
  'can_create_invoices', 
  'can_update_quotes',
  'can_delete_payments',
  'can_use_ai_assistant',
  'can_manage_social_media'
];
```

### 4.2 Data Isolation Strategy

All business data models include an `owner` field that references the CompanyOwner:

```javascript
// Example query pattern for data isolation
const customers = await Customer.find({
  owner: req.companyOwner._id,
  removed: false,
});
```

Team members (Users) access data through their associated CompanyOwner, ensuring complete data isolation between different companies.

## 5. Settings Management System

### 5.1 Multi-Layer Settings Architecture

The system supports **hierarchical settings** with the following priority:

1. **Company-Specific Settings** (`owner: companyOwnerId`)
   - Stored in Setting model with owner reference
   - Override global defaults
   - Include currency, company info, preferences

2. **Global Settings** (`owner: null`)  
   - System-wide defaults
   - Fallback when company settings don't exist

3. **FinanceSettings Integration**
   - Specialized financial configuration
   - Currency and tax settings
   - Document numbering sequences

### 5.2 Settings Categories

**Company Settings (`company_settings`)**
```javascript
{
  company_name: "Tech Revisor Inc",
  company_address: "123 Business St", 
  company_email: "admin@techrevisor.com",
  company_phone: "+1-555-0123"
}
```

**Money Format Settings (`money_format_settings`)**
```javascript
{
  currency_code: "JPY",
  currency_symbol: "¥", 
  currency_position: "before",
  decimal_sep: ".",
  thousand_sep: ",",
  cent_precision: 2
}
```

**AI Settings (`ai_settings`)**
```javascript
{
  openai_api_key: "sk-...",
  ai_model: "gpt-4",
  ai_enabled: true,
  max_tokens: 1000,
  temperature: 0.7
}
```

**Social Media Settings (`social_media_settings`)**
```javascript
{
  auto_posting_enabled: true,
  default_hashtags: ["#business", "#growth"],
  content_approval_required: false,
  analytics_tracking: true
}
```

### 5.3 Settings API Endpoints

- `GET /setting` - List all settings for authenticated user
- `POST /setting/batch` - Bulk update multiple settings  
- `PATCH /setting/updateManySetting` - Update existing settings

## 6. Business Logic Controllers

### 6.1 Core Controllers (`/controllers/coreControllers/`)

**Admin Controller** (`adminController/`)
- User registration, login, password reset
- Company setup and onboarding
- Profile management  
- Team member invitation system

**Setting Controller** (`settingController/`)
- Settings CRUD operations
- Batch updates for onboarding
- Company-specific vs global settings management

### 6.2 App Controllers (`/controllers/appControllers/`)

**Customer Controller** (`customerController/`)
```javascript
// CRUD operations for customers
- create() // Create new customer with validation
- read()   // List customers with pagination and search  
- update() // Update customer details
- delete() // Soft delete (set removed: true)
- search() // Advanced search with filters
```

**Invoice Controller** (`invoiceController/`)
```javascript
// Complete invoicing workflow
- create()     // Create draft invoice
- read()       // List invoices with status filters
- update()     // Modify invoice details  
- delete()     // Remove invoice
- convertFromQuote() // Convert quote to invoice
- sendByEmail() // Email invoice to customer
- generatePDF() // Create PDF document
```

**AI Assistant Controller** (`aiAssistantController/`)
```javascript  
// AI functionality management
- chat()       // Process chat interactions
- analyze()    // Document and data analysis
```

**Marketing Automation** (`utils/`)
```javascript
// Marketing automation utilities
- marketingURLHelper   // Campaign URL generation and tracking
- segmentMatcher      // Customer segment qualification algorithms
- triggerEvaluator    // Behavioral trigger processing
- campaignScheduler   // Optimize campaign timing and scheduling
```

### 6.3 Social Media Controllers (`/controllers/socialMedia/`)

**Social Media Account Controller**
```javascript
// Platform account management
- connect()    // OAuth connection to platforms
- refresh()    // Token refresh and validation
- profile()    // Account profile information
- disconnect() // Remove platform connection
```

**Social Media Post Controller**
```javascript
// Content creation and publishing
- create()     // Create new post
- schedule()   // Schedule post publication
- publish()    // Immediate publication
- analytics()  // Post performance metrics
```

**Campaign Controller**
```javascript
// Marketing campaign management
- createCampaign()   // Campaign setup
- manageBudget()     // Budget allocation
- getCampaigns()     // List all campaigns
- getCampaign()      // Get campaign details
- updateCampaign()   // Update campaign settings
- deleteCampaign()   // Delete a campaign
- getCampaignAnalytics() // Campaign performance metrics
- getActiveCampaigns()   // Get only active campaigns
```

### 6.4 Marketing Automation Controllers (`/controllers/marketingAutomation/`)

**Campaign Controller**
```javascript
// Campaign management
- create()           // Create automation campaign
- update()           // Update campaign settings
- activate()         // Activate campaign
- pause()            // Pause campaign
- duplicate()        // Clone existing campaign
- getAnalytics()     // Campaign performance data
- getTargetAudience()// Retrieve campaign audience
```

**Behavior Controller**
```javascript
// Customer behavior tracking
- trackEvent()       // Log customer behavior event
- getCustomerEvents()// Retrieve customer timeline
- getTriggerEvents() // Get events that can trigger actions
- processEvent()     // Process event against triggers
```

**Segment Controller**
```javascript
// Audience segmentation
- createSegment()    // Create customer segment
- calculateSegment() // Calculate segment membership
- getSegmentMembers()// Get customers in segment
- testConditions()   // Test segment conditions
```

**Trigger Controller**
```javascript
// Behavioral triggers
- createTrigger()    // Create behavior trigger
- evaluateTrigger()  // Test trigger against events
- executeTriggerActions() // Run trigger actions
- getTriggerLogs()   // View trigger execution logs
```

### 6.5 Document Generation

**PDF Generation System** (`/pdf/` templates)
- **Invoice.pug** - Professional invoice layout
- **Quote.pug** - Sales quotation format  
- **Payment.pug** - Payment receipt template
- **Document.pug** - Generic document wrapper

**PDF Controller Features:**
```javascript
// Dynamic content generation
- Company logo and branding
- Multi-currency support
- Tax calculations
- Custom terms and conditions
- Digital signatures
```

## 7. AI Assistant Integration

### 7.1 AI Service Architecture (`/services/aiService.js`)

**Core AI Capabilities:**
- Natural language processing for business queries
- Document analysis and data extraction
- Predictive analytics and insights
- Automated workflow suggestions
- Customer behavior analysis

**AI Model Integration:**
```javascript
// OpenAI integration
- GPT-4 for general assistance
- GPT-3.5-turbo for quick responses
- Custom fine-tuned models for domain-specific tasks
- Embeddings for semantic search
```

### 7.2 AI Features

**Document Processing:**
- Automatic data extraction from invoices and receipts
- Document categorization and tagging
- Content summarization and insights
- Compliance checking and validation

**Business Intelligence:**
- Sales forecasting and trend analysis
- Customer segmentation and insights
- Payment pattern analysis
- Revenue optimization suggestions

**Workflow Automation:**
- Smart task assignment based on workload
- Automated follow-up suggestions
- Process optimization recommendations
- Anomaly detection in business operations

### 7.3 AI Analytics & Monitoring

**Usage Tracking:**
- AI request/response metrics
- Model performance monitoring
- User satisfaction scoring
- Cost optimization tracking

## 8. Social Media Management

### 8.1 Platform Integration

**Supported Platforms:**
- Facebook (Meta Business API)
- Instagram (Instagram Graph API)
- Twitter (Twitter API v2)
- LinkedIn (LinkedIn Marketing API)

**OAuth Authentication Flow:**
```javascript
// Platform connection process
1. Initiate OAuth flow
2. Handle callback and token exchange
3. Store encrypted tokens
4. Set up webhook listeners
5. Sync account information
```

### 8.2 Content Management Features

**Post Creation & Scheduling:**
- Multi-platform content creation
- AI-powered content optimization
- Scheduling with optimal timing suggestions
- Media upload and processing
- Character limit validation per platform

**Campaign Management:**
- Campaign planning and execution
- Budget allocation and tracking
- A/B testing for content variants
- ROI measurement and reporting

### 8.3 Analytics & Reporting

**Real-time Metrics:**
- Engagement rates and reach
- Click-through rates and conversions
- Audience demographics and insights
- Competitor analysis and benchmarking

**Performance Tracking:**
- Post performance analytics
- Campaign effectiveness measurement
- Social media ROI calculation
- Growth tracking and trends

## 9. URL Management & Analytics

### 9.1 URL Shortening Service

**Core Features:**
- Custom short URL generation
- QR code generation for URLs
- Password protection for sensitive links
- Expiration date management
- Bulk URL operations

### 9.2 Advanced Analytics

**Click Tracking:**
- Real-time click monitoring
- Geographic distribution analysis
- Device and browser statistics
- Referrer source tracking

**A/B Testing:**
- URL variant testing
- Statistical significance calculation
- Conversion rate optimization
- Winner determination algorithms

## 10. Email & Communication System

### 10.1 Email Infrastructure (`/helpers/sendMail.js`)

**SMTP Configuration:**
```javascript
// Supports multiple email providers
- Gmail SMTP
- Custom SMTP servers
- Environment-based configuration  
- HTML email templates
```

**Email Templates** (`/emailTemplate/`)
- `emailVerification.js` - Account verification emails
- `SendEmailTemplate.js` - Dynamic template system
- AI-generated personalized email content

### 10.2 Advanced Email Features

**Automated Campaigns:**
- Drip email sequences
- Behavioral trigger emails
- Customer journey automation
- A/B testing for email content

## 11. File Upload & Document Management

### 11.1 Upload System (`/middlewares/uploadMiddleware/`)

**Configuration:**
```javascript
// File upload limits and validation
- Max file size: 50MB
- Supported formats: PDF, images, documents
- AI-powered content analysis
- Automatic file organization
```

**Storage Structure:**
```
uploads/
├── documents/        # General documents
├── images/          # Image assets  
├── logos/           # Company logos
├── invoices/        # Generated PDFs
├── social-media/    # Social media content
└── ai-analysis/     # AI-processed files
```

### 11.2 Document Intelligence

**AI-Powered Features:**
- Automatic document classification
- Content extraction and indexing
- Compliance checking
- Version comparison and change detection

## 12. Workflow Automation (`/services/workflowService.js`)

### 12.1 Automation Engine

**Workflow Capabilities:**
- Invoice status automation
- Payment reminders
- Quote expiration notifications
- Customer follow-up sequences
- AI-triggered process optimization

**Trigger Types:**
```javascript
// Event-based automation
- Time-based triggers (scheduled)
- Status change triggers  
- Customer action triggers
- Document generation triggers
- AI-detected pattern triggers
```

### 12.2 Smart Workflow Features

**AI-Enhanced Automation:**
- Intelligent task routing
- Predictive workflow suggestions
- Anomaly detection and alerts
- Performance optimization recommendations

## 13. API Architecture & Routing

### 13.1 Route Structure (`/routes/`)

**Core Routes** (`coreRoutes/`)
```javascript
// Authentication and user management
/api/admin/*          # Admin operations
/api/user/*           # Team member operations
/api/setting/*        # Settings management
/api/auth/*           # Authentication endpoints
```

**App Routes** (`appRoutes/`)
```javascript
// Business entity management  
/api/customer/*       # Customer operations
/api/invoice/*        # Invoice management
/api/quote/*          # Quote handling
/api/payment/*        # Payment processing
/api/product/*        # Product catalog
/api/currency/*       # Currency management
/api/finance-settings/* # Financial configuration
/api/chat/*           # Chat messaging system

// AI Assistant Routes
/api/ai-assistant/*   # AI assistant management
/api/ai-chat/*        # Chat interactions
/api/ai-analytics/*   # AI usage analytics

// Social Media Routes
/api/social-accounts/* # Platform account management
/api/social-posts/*   # Content management
/api/social-campaigns/* # Campaign management
/api/social-analytics/* # Performance metrics

// URL Management Routes
/api/url/*            # URL shortening and management
/api/url-analytics/*  # URL analytics and reporting
/api/abtest/*         # A/B testing for URLs
```

**Public Routes** (`publicRoutes/`)
```javascript
// Public access endpoints
/s/:shortCode         # URL redirection
/s/:shortCode/preview # URL preview
/s/:shortCode/qr      # QR code generation
/public/url/*         # Public URL operations
```

## 14. Security Implementation

### 14.1 Security Measures

**Authentication Security:**
- JWT token expiration and refresh
- Password hashing with bcrypt
- Multi-factor authentication support
- Session management and invalidation

**Data Security:**
- Owner-based data isolation
- Input validation and sanitization
- File upload security scanning
- API rate limiting and throttling

**AI Security:**
- Prompt injection prevention
- Response content filtering
- Usage quota management
- Model access control

### 14.2 Access Control

**Permission-Based Access:**
```javascript
// Fine-grained permissions
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (req.user && req.user.permissions.includes(permission)) {
      next();
    } else {
      res.status(403).json({ error: 'Insufficient permissions' });
    }
  };
};
```

## 15. Performance & Optimization

### 15.1 Database Optimization

**Query Optimization:**
- Efficient indexes on frequently queried fields
- Pagination for large datasets
- Aggregation pipelines for reports and analytics
- Connection pooling and optimization

**Caching Strategy:**
- Redis caching for frequently accessed data
- Settings caching in memory
- AI response caching for common queries
- Social media data caching

### 15.2 AI Performance Optimization

**Model Optimization:**
- Response caching for similar queries
- Batch processing for multiple requests
- Token usage optimization
- Model selection based on query complexity

## 16. Integration Capabilities

### 16.1 External API Integration

**Ready Integrations:**
- OpenAI API for AI capabilities
- Social media platform APIs
- Payment gateways (Stripe, PayPal)
- Email service providers
- Cloud storage (AWS S3)
- Analytics services (Google Analytics)

### 16.2 Webhook System

**Event Broadcasting:**
- Invoice created/updated events
- Payment received notifications
- AI analysis completed events
- Social media post published events
- Campaign performance alerts

## 17. Deployment & Configuration

### 17.1 Production Setup

**Server Requirements:**
- Node.js v20.9.0+
- MongoDB 5.0+
- Redis 6.0+ (for caching)
- 4GB+ RAM recommended
- SSL certificate for HTTPS

**Environment Configuration:**
```env
NODE_ENV=production
DATABASE=mongodb://...
JWT_SECRET=secure_random_string
OPENAI_API_KEY=sk-...
REDIS_URL=redis://...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
UPLOAD_DIR=/var/uploads
```

### 17.2 Scaling Considerations

**Horizontal Scaling:**
- Stateless architecture
- Database connection pooling
- Redis cluster support
- Load balancer compatible
- Microservice-ready design

## 18. Development & Testing

### 18.1 Development Setup

**Installation:**
```bash
cd backend
npm install
npm start  # Production server
npm run dev  # Development server with nodemon
```

**Testing Infrastructure:**
- Test framework setup (`/test/`)
- API endpoint testing
- AI model testing utilities
- Mock data generators

### 18.2 Code Organization

**Best Practices:**
- Separation of concerns (MVC pattern)
- Modular architecture
- Consistent error handling
- Comprehensive logging
- Environment-based configuration

## 19. Monitoring & Analytics

### 19.1 System Monitoring

**Performance Metrics:**
- API response times
- Database query performance
- AI model response times
- Social media API rate limits
- Memory and CPU usage

### 19.2 Business Analytics

**Dashboard Metrics:**
- User engagement and activity
- Revenue and financial trends
- AI usage and effectiveness
- Social media performance
- Document processing statistics

---

This backend provides a comprehensive, production-ready ERP/CRM system with advanced AI capabilities, social media management, URL analytics, and extensive business automation features. The modular architecture ensures scalability while maintaining security and performance at enterprise level.

    - Default currency selection

11. **FinanceSettings** - Financial configuration
    - Tax settings & default rates
    - Currency preferences
    - Invoice/quote numbering
    - Financial year configuration

### Document Management

12. **Document** - File management system

    - File metadata & storage
    - Version control with DocumentVersion
    - Tag-based organization
    - Full-text search indexing
    - Audit trail with DocumentAudit

13. **DocumentCompliance** - Compliance tracking

    - Regulatory compliance status
    - Compliance notes & requirements

14. **AuditTrail** - Activity logging
    - User action tracking
    - Document interaction history
    - IP address & user agent logging

### Workflow & Task Management

15. **Workflow** - Business process automation

    - JSON-based workflow definitions
    - Trigger conditions & scheduling
    - Execution history & logging
    - Status management (draft, active, archived)

16. **Task** - Task management system

    - Assignment & deadline tracking
    - Progress monitoring
    - Comments & activity logging
    - Priority & status management

17. **Team** - Team organization
    - Team member management
    - Role-based access control
    - Team lead assignment

## Authentication & Authorization

### Multi-Model Authentication System

The backend supports two types of users:

- **CompanyOwner**: Primary admin users with full system access
- **User**: Team members with limited, permission-based access

### JWT Token Management

- 24-hour token expiration (365 hours if "remember me")
- Session tracking with logged sessions array
- Token invalidation on logout
- Automatic token refresh mechanisms

### Permission System

Team members have granular permissions:

- `canViewInvoices`, `canCreateInvoices`, `canUpdateInvoices`, `canDeleteInvoices`
- `canViewClients`, `canCreateClients`, `canUpdateClients`, `canDeleteClients`
- `canViewPayments`, `canCreatePayments`, `canUpdatePayments`, `canDeletePayments`
- `canViewQuotes`, `canCreateQuotes`, `canUpdateQuotes`, `canDeleteQuotes`
- `canViewOffers`, `canCreateOffers`, `canUpdateOffers`, `canDeleteOffers`
- `canViewMarketing`, `canCreateMarketing`, `canUpdateMarketing`, `canDeleteMarketing`
- `canViewReputation`, `canUpdateReputation`
- `canViewTasks`, `canCreateTasks`, `canUpdateTasks`, `canDeleteTasks`
- `canViewDocuments`, `canCreateDocuments`, `canUpdateDocuments`, `canDeleteDocuments`
- `canViewReports`, `canCreateReports`, `canUpdateReports`, `canDeleteReports`
- `canViewAnalytics`, `canCreateAnalytics`, `canUpdateAnalytics`, `canDeleteAnalytics`
- `canViewSettings`, `canCreateSettings`, `canUpdateSettings`, `canDeleteSettings`
- `canViewNotifications`, `canCreateNotifications`, `canUpdateNotifications`, `canDeleteNotifications`
- `canViewAiAssistants`, `canCreateAiAssistants`, `canUpdateAiAssistants`, `canDeleteAiAssistants`
- `canViewTaxes`, `canCreateTaxes`, `canUpdateTaxes`, `canDeleteTaxes`
- `canViewCurrency`, `canCreateCurrency`, `canUpdateCurrency`, `canDeleteCurrency`
- `canViewTeams`, `canCreateTeams`, `canUpdateTeams`, `canDeleteTeams`
- `canViewWorkflows`, `canCreateWorkflows`, `canUpdateWorkflows`, `canDeleteWorkflows`
- `canViewSocialAccounts`, `canCreateSocialAccounts`, `canUpdateSocialAccounts`, `canDeleteSocialAccounts`
- `canViewSocialPosts`, `canCreateSocialPosts`, `canUpdateSocialPosts`, `canDeleteSocialPosts`
- `canViewSocialCampaigns`, `canCreateSocialCampaigns`, `canUpdateSocialCampaigns`, `canDeleteSocialCampaigns`
- `canViewUrls`, `canCreateUrls`, `canUpdateUrls`, `canDeleteUrls`
- Role-based access (member, lead, admin)

### Owner Isolation

All business data is isolated by `owner` field, ensuring multi-tenant data separation.

## API Architecture

### Route Organization

```
/api/                    # Core authenticated routes
├── auth/               # Authentication endpoints
├── admin/              # Admin management
├── setting/            # Settings management
├── client/             # Client CRUD operations
├── invoice/            # Invoice management
├── quote/              # Quote management
├── payment/            # Payment processing
├── document/           # Document management
├── team/               # Team management
├── workflow/           # Workflow operations
└── tasks/              # Task management

/public/                # Public routes (no auth required)
├── settings/           # Public settings for onboarding
└── team/              # Public team invitation handling

/download/              # Protected file downloads
```

### CRUD Controller Factory

The system uses a factory pattern for consistent CRUD operations:

- **createCRUDController()**: Generates standard CRUD methods
- Automatic owner filtering for data isolation
- Pagination, search, and filtering capabilities
- Consistent error handling and response formats

### Standard CRUD Operations

All models support:

- `CREATE`: Owner assignment & validation
- `READ`: Owner-filtered retrieval
- `UPDATE`: Owner permission checks
- `DELETE`: Soft deletion with timestamps
- `LIST`: Paginated listing with search
- `SEARCH`: Text-based searching with MongoDB text indexes
- `FILTER`: Advanced filtering capabilities

## Middleware System

### Authentication Middleware

- **isValidAuthToken**: JWT validation with multi-model support
- Automatic user type detection (CompanyOwner vs User)
- Session validation and management
- Public endpoint bypass mechanisms

### File Upload Middleware

- **express-fileupload**: 50MB file size limit
- Image and document upload support
- Automatic file type validation
- Secure file storage with unique naming

### Settings Middleware

- **loadSettings**: Dynamic settings loading
- Admin-specific setting retrieval
- Settings caching and optimization

### Error Handling

- **catchErrors**: Async error wrapper
- Centralized error response formatting
- Development vs production error messages

## Business Logic & Services

### Financial Calculations

- **helpers/calculate.js**: Tax and total calculations
- Automatic subtotal, tax, and grand total computation
- Multi-currency calculation support
- Discount and credit application

### Customer Segmentation

- **helpers/customerSegmentation.js**: Customer value analysis
- Automated customer tier assignment
- Purchase history analysis
- Customer lifetime value calculations

### Email Services

- **helpers/sendMail.js**: SMTP email functionality
- Template-based email composition
- Email verification and notifications
- Invoice/quote email delivery

### Document Processing

- **utils/pdfUtils.js**: PDF generation and manipulation
- **utils/docxUtils.js**: Word document processing
- Document content extraction and indexing
- Version control and comparison

### Workflow Engine

- **services/workflowService.js**: Business process automation
- Trigger-based workflow execution
- Conditional logic evaluation
- Task assignment and notifications

## Security Features

### Data Protection

- **bcryptjs** password hashing with salt
- JWT token encryption
- Owner-based data isolation
- Soft deletion for audit trails

### Input Validation

- **Joi** schema validation for all inputs
- SQL injection prevention through Mongoose
- XSS protection through input sanitization
- File upload security with type checking

### Access Control

- Multi-level permission system
- Resource-level authorization
- Team-based access restrictions
- API rate limiting capabilities

## Database Setup & Management

### Setup Scripts

- **setup/setup.js**: Complete database initialization
- **setup/reset.js**: Database cleanup and reset
- **setup/check.js**: Interactive database browser (blessed TUI)
- **setup/setupConfig.json**: Configuration management

### Default Data Initialization

- **setup/defaultSettings/**: JSON-based default settings
- Automatic tax and payment mode creation
- Company owner account setup
- Finance settings initialization

### Data Migration

- Automatic schema migration support
- Version-compatible data updates
- Settings synchronization between versions

## File Management

### Document Storage

- **uploads/documents/**: File storage directory
- Automatic directory creation
- File metadata tracking
- Version control with document history

### PDF Generation

- **pdf/\*.pug**: Template files for documents
- Dynamic PDF generation for invoices/quotes
- Custom styling and branding support
- Multi-language PDF templates

## Internationalization

### Language Support

- **locale/languages.js**: Language definitions
- **locale/translation/**: Translation files
- **locale/useLanguage.js**: Language selection utilities
- Multi-language email templates

## Development Tools

### Scripts

- `npm start`: Production server
- `npm run dev`: Development with nodemon
- `npm run setup`: Database initialization
- `npm run reset`: Database reset
- `npm run check`: Interactive database browser

### Configuration

- **jsconfig.json**: Path aliases and IDE support
- **module-alias**: Runtime path resolution
- Environment variable management (.env support)

## Performance Optimizations

### Database

- MongoDB indexes for search performance
- Mongoose autopopulation for related data
- Aggregation pipelines for analytics
- Connection pooling and optimization

### Caching

- Settings caching for reduced database queries
- File upload optimization
- Compression middleware for responses

### Memory Management

- Efficient file handling for large uploads
- Stream-based PDF generation
- Garbage collection optimization

## Error Handling & Logging

### Error Management

- **handlers/errorHandlers.js**: Centralized error handling
- Production vs development error responses
- Automatic error logging and reporting
- User-friendly error messages

### Logging

- **morgan**: HTTP request logging
- Console-based debug logging
- Error stack trace management
- Performance monitoring hooks

## API Response Format

### Standard Response Structure

```json
{
  "success": boolean,
  "result": any,
  "message": string,
  "pagination": {
    "page": number,
    "pages": number,
    "count": number
  }
}
```

### Error Responses

```json
{
  "success": false,
  "result": null,
  "message": "Error description",
  "error": "Detailed error info (dev only)"
}
```

## Integration Points

### External Services

- **AWS S3**: Optional cloud file storage
- **SMTP**: Email service integration
- **PDF Services**: Document generation
- **Payment Gateways**: Future payment integration

### Frontend Integration

- RESTful API design
- CORS configuration for frontend access
- JWT-based authentication
- File upload/download endpoints

## Scalability Considerations

### Database Scaling

- MongoDB sharding support
- Connection pooling
- Index optimization
- Aggregation pipeline efficiency

### Application Scaling

- Stateless design for horizontal scaling
- File storage abstraction
- Microservice-ready architecture
- Environment-based configuration

## Maintenance & Monitoring

### Health Checks

- Database connection monitoring
- File system health checks
- Memory usage tracking
- API response time monitoring

### Backup & Recovery

- Database backup procedures
- File storage backup strategies
- Configuration backup
- Disaster recovery planning

## 18. AI Assistant Module

### 18.1 Overview

The AI Assistant module provides intelligent automation and decision support across the entire ERP system. It leverages OpenAI's GPT models to offer context-aware assistance, pattern recognition, predictive analytics, and process optimization suggestions.

### 18.2 Architecture

**Core Components:**
