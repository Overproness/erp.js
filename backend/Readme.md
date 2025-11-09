# Backend Documentation - Quickmation Automation Suite (Odoo Project)

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
- [Project Structure](#project-structure)
- [Core Components](#core-components)
  - [Server Configuration](#server-configuration)
  - [Express Application](#express-application)
  - [Database Connection](#database-connection)
  - [Authentication System](#authentication-system)
  - [Routes](#routes)
  - [Controllers](#controllers)
  - [Models](#models)
  - [Error Handling](#error-handling)
- [API Endpoints](#api-endpoints)
  - [Authentication Routes](#authentication-routes)
  - [Core API Routes](#core-api-routes)
  - [ERP API Routes](#erp-api-routes)
  - [Download Routes](#download-routes)
  - [Public Routes](#public-routes)
- [Middleware](#middleware)
- [File Upload Functionality](#file-upload-functionality)
- [Document Management](#document-management)
- [External Services Integration](#external-services-integration)
  - [OpenAI Integration](#openai-integration)
  - [AWS S3 Integration](#aws-s3-integration)
- [Workflow System](#workflow-system)
  - [Workflow Components](#workflow-components)
  - [Module Integration](#module-integration)
  - [Available Module Actions](#available-module-actions)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Updated Models](#updated-models)

## Overview

This backend system is part of the Quickmation Automation Suite for the Odoo Project. It provides a robust API infrastructure for ERP/CRM operations, integrates with various external services, and handles authentication, data processing, and file management operations.

## Updated Models

The system has been updated with new model names for clarity and organization:

- `Admin` has been renamed to `CompanyOwner`
- `AdminPassword` has been renamed to `CompanyOwnerPassword`
- `TeamMember` has been renamed to `User`

This better reflects the relationship between entities in the system, with Company Owners managing their teams and Users belonging to teams within the organization.

## Technology Stack

- **Node.js** (v20.9.0+): JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database with Mongoose ODM
- **Authentication**: JWT-based authentication system
- **File Processing**: Express-fileupload and Multer
- **PDF Generation**: HTML-PDF
- **External APIs**: OpenAI, AWS S3
- **Email Service**: Nodemailer, Resend
- **Other Tools**: Compression, Morgan, CORS, etc.

## Getting Started

### Prerequisites

- Node.js v20.9.0 or higher
- npm v10.2.4 or higher
- MongoDB instance (local or cloud-based)
- Required API keys for external services (OpenAI, AWS S3, etc.)

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to the backend folder
cd d:/GitHub/Tech_Revisor_Automation_Suite/Odoo_Project/backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Environment Configuration

Create a `.env` file in the root directory with the following variables:

```
# Server
PORT=8888
NODE_ENV=development

# Authentication
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_BUCKET_NAME=your_bucket_name

# Email configuration
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
```

## Project Structure

```
backend/
├── package.json        # Project dependencies and scripts
├── .env                # Environment variables
├── .env.local          # Local environment overrides
├── src/
│   ├── server.js       # Entry point for the application
│   ├── app.js          # Express application setup
│   ├── models/         # MongoDB models
│   ├── controllers/    # Request handlers
│   │   ├── coreControllers/ # Core functionality controllers
│   │   └── appControllers/  # Application specific controllers
│   ├── routes/         # API routes
│   │   ├── coreRoutes/ # Core routes
│   │   └── appRoutes/  # Application specific routes
│   ├── services/       # Business logic services
│   │   ├── workflowService.js       # Workflow processing service
│   │   └── moduleIntegrationService.js # Cross-module integration service
│   ├── handlers/       # Error handlers and utility handlers
│   ├── setup/          # Setup and maintenance scripts
│   └── config/         # Configuration files
│   └── uploads/        # File uploads directory
│       └── documents/  # Document storage directory
```

## Core Components

### Server Configuration

The server setup (`server.js`) handles:

- Node.js version validation (requires v20+)
- Environment variable loading
- MongoDB connection
- API key initialization
- Model loading
- Starting the Express application

### Express Application

The Express app (`app.js`) configures:

- Middleware (CORS, compression, logging, body parsing)
- Cookie handling
- Route registration
- Error handling

### Database Connection

- Uses Mongoose to connect to MongoDB
- Connection string defined in `.env` file
- Error handling for connection failures
- Auto-loading of all models in the models directory

### Authentication System

- JWT-based authentication
- Secure password hashing using bcryptjs
- Role-based access control
- Token validation middleware
- Multiple token delivery methods:
  - Standard Bearer token in Authorization header
  - Query parameter token (`?token=xyz`) for direct file downloads and document access
  - Token validation and security measures for all authentication methods

### Routes

The application is organized into several route categories:

1. **Core Auth Routes** (`coreAuthRouter`): Authentication functionality
2. **Core API Routes** (`coreApiRouter`): Core business logic endpoints (requires authentication)
3. **ERP API Routes** (`erpApiRouter`): ERP-specific endpoints (requires authentication)
4. **Download Routes** (`coreDownloadRouter`): File download endpoints
5. **Public Routes** (`corePublicRouter`): Publicly accessible endpoints

### Controllers

Controllers handle the business logic for each route:

- Request validation
- Data processing
- Database operations
- Response formatting

### Models

MongoDB models define the data structure and business logic:

### Core Models

- **CompanyOwner**: Represents company owners/administrators 
- **CompanyOwnerPassword**: Stores secure password data for company owners
- **Setting**: Stores application settings
- **Token**: Manages authentication tokens

### Application Models

- **User**: Team members belonging to specific teams
- **Team**: Groups of users working together
- **Client**: Customer information
- **Currency**: Currency configuration
- **FinanceSettings**: Financial system settings
- **Invoice**: Invoice data
- **Payment**: Payment records

### Error Handling

Centralized error handling system:

- 404 Not Found handler
- Development vs. Production error responses
- Error logging

## API Endpoints

### Authentication Routes

- `POST /api/login`: User authentication
- `POST /api/register`: User registration
- `POST /api/forgot-password`: Password reset request
- `POST /api/reset-password`: Password reset execution

### Core API Routes

Protected routes that require authentication:

- User management endpoints
- Settings and configuration endpoints
- System administration endpoints

### ERP API Routes

Protected routes for ERP functionality:

- Customer management
- Order processing
- Inventory management
- Reporting and analytics

### Download Routes

Routes for file downloads:

- `GET /download/{fileId}`: Download files with authorization checks
- PDF report downloads

### Public Routes

Publicly accessible endpoints:

- Public file access
- Public API endpoints

### Document Management API

(The controller is available in Controllers/appControllers/documentController/)

- `GET /api/document/list` - List all documents with pagination
- `GET /api/document/read/:id` - Get details of a specific document
- `POST /api/document/create` - Upload and create a new document
- `PATCH /api/document/update/:id` - Update document metadata
- `DELETE /api/document/delete/:id` - Delete a document
- `GET /api/document/download/:id` - Download the document file
- `GET /api/document/:id/content` - Retrieve document content for editing
- `POST /api/document/:id/edit` - Save edited document content
- `POST /api/document/:id/esign` - Apply electronic signature to a document

### Advanced Search API

The backend now supports advanced search capabilities through enhanced endpoints:

- `GET /api/document/search?advanced=true` - Perform advanced search with multiple parameters:
  - `text` - Full-text search across document content (uses MongoDB text indexes)
  - `title` - Search by document title
  - `description` - Search in document descriptions
  - `documentType` - Filter by document type
  - `tags` - Filter by document tags (comma-separated or array)
  - `fileType` - Filter by file extension/type
  - `dateFrom` - Filter documents created after this date (YYYY-MM-DD)
  - `dateTo` - Filter documents created before this date (YYYY-MM-DD)
  - `sortField` - Field to sort by (e.g., 'title', 'created', 'updated')
  - `sortOrder` - Sort direction ('asc' or 'desc')
  - `page` - Page number for pagination
  - `limit` - Number of results per page

The advanced search endpoint returns:

- Result documents matching search criteria
- Pagination information (current page, page size, total results)
- Success/failure status

## Middleware

The application uses several middleware components:

- Authentication middleware
- Request logging (Morgan)
- CORS handling
- Body parsing
- Compression
- Cookie parsing
- Rate limiting

## File Upload Functionality

File uploads are handled using:

- express-fileupload for general file uploads
- multer for more complex upload scenarios
- AWS S3 integration for cloud storage

### File Upload Limits

The system now supports larger files with the following configurations:

- Maximum file size: 50MB (increased from 10MB)
- Supported file types: PDF, DOC, DOCX, XLS, XLSX, TXT, CSV, JPG, JPEG, PNG, etc.
- Files exceeding the size limit will receive a clear 413 Payload Too Large error

## Document Management

The application includes a document management system that allows:

- Upload of various file types
- Organization with document types and tags
- Document metadata management
- Secure document download functionality
  - Documents are downloaded via the endpoint `/api/document/download/:id`
  - The download controller streams files directly from the server
  - Content-Type and Content-Disposition headers are properly set based on file type
  - Custom headers are added for better file type handling in the frontend
  - Support for authenticated downloads via token query parameter (`?token=xyz`)
- PDF preview generation
- Search and filtering capabilities
- Version control and history tracking
- Document editing with version tracking
- E-signature capability for PDF documents

### Document Version Control

The document management system now includes a streamlined version control approach:

- **Version 0**: Represents the original document as uploaded
  - Always preserved as the baseline version
  - Can be restored at any time through the version history
- **Version 1+**: Represents subsequent edits and modifications
- **Version Metadata**: Each version stores:
  - Document content
  - Metadata (title, description, tags, etc.)
  - File information
  - Change description
  - User who created the version
  - Timestamp
- **Version Restoration**: Any version can be restored as the current version while preserving the version history

#### Version Control API Endpoints

- `GET /api/document/:id/versions` - List all versions of a document with pagination
- `POST /api/document/:id/revert/:versionNumber` - Revert document to a specific version (version 1 or higher)
- `POST /api/document/:id/revert/original` - Revert document to the original version (version 0)

### Document Editing

The system supports direct editing of certain document types, with each edit automatically creating a new version:

- **Supported Edit Formats**:
  - Plain text (TXT)
  - CSV files
  - JSON files
  - Markdown (MD)
  - HTML documents
  - PDF documents (for e-signing only)

#### Document Editing API Endpoints

- `GET /api/document/read/:id` - Retrieve document metadata
- `GET /api/document/:id/content` - Retrieve document content for editing
- `POST /api/document/:id/edit` - Save edited document content
- `POST /api/document/:id/esign` - Apply an electronic signature to a PDF document

### E-Signature Functionality

The system includes e-signature capabilities for PDF documents:

- **Text-Based Signatures**: Add text signatures to PDF documents
- **Position Control**: Specify exact location for signatures
- **Multi-Page Support**: Sign any page in a PDF document
- **Signature Metadata**: Include reason for signing and timestamp
- **Version Tracking**: Each signed version is stored in version history

## External Services Integration

### OpenAI Integration

The application integrates with OpenAI for:

- Text processing
- Content generation
- AI-assisted features

### AWS S3 Integration

AWS S3 is used for:

- File storage and retrieval
- Secure access to uploaded files
- Managing media assets

## Workflow System

The application includes a powerful workflow system that allows creating automated processes across different modules. The workflow system consists of nodes and edges that define the flow and business logic.

### Workflow Components

- **Node Types**:

  - **Start Node**: Entry point for a workflow
  - **End Node**: Termination point for a workflow
  - **Condition Node**: Evaluates conditions to determine flow direction
  - **Action Node**: Performs specific actions (module integration, script execution, context updates)

- **Edge Types**:

  - **Standard Edge**: Normal flow from one node to another
  - **Conditional Edge**: Flow based on condition evaluation (true/false paths)

- **Workflow Execution**:
  - Workflows are executed from start to end, following the defined paths
  - Conditions determine which branches to follow
  - Actions are executed when their nodes are reached
  - Context data is maintained throughout execution and can be updated by action nodes

### Module Integration

The workflow system can integrate with different modules to automate cross-module processes. The `moduleIntegrationService` handles communications between the workflow system and other modules:

- **HR Module Actions**:

  - Approve/reject leave requests
  - Notify managers
  - Update employee records

- **Sales Module Actions**:

  - Create invoices from deals
  - Send follow-up emails
  - Update deal statuses

- **Project Module Actions**:

  - Assign tasks
  - Update task statuses
  - Create project milestones

- **Common Actions**:
  - Send emails
  - Create notifications

### Available Module Actions

The system provides the following actions for workflow integration:

#### HR Module

- **approveLeaveRequest**: Approves a leave request
  - Parameters: `leaveRequestId`, `approverId`, `comments` (optional)
- **rejectLeaveRequest**: Rejects a leave request
  - Parameters: `leaveRequestId`, `rejectorId`, `reason`
- **notifyManager**: Sends a notification to a manager
  - Parameters: `managerId`, `subject`, `message`

#### Sales Module

- **createInvoice**: Creates an invoice from a deal
  - Parameters: `dealId`, `creatorId`
- **sendFollowUp**: Sends a follow-up email for a deal
  - Parameters: `dealId`, `template`
- **updateDealStatus**: Updates a deal's status
  - Parameters: `dealId`, `status`, `updaterId`

#### Projects Module

- **assignTask**: Assigns a task to a user
  - Parameters: `taskId`, `assigneeId`, `assignerId`
- **updateTaskStatus**: Updates a task's status
  - Parameters: `taskId`, `status`, `updaterId`
- **createProjectMilestone**: Creates a project milestone
  - Parameters: `projectId`, `title`, `description`, `dueDate`, `creatorId`

#### Email Module

- **sendEmail**: Sends an email
  - Parameters: `to`, `subject`, `body` (or `template` and `data`)

#### Common Module

- **createNotification**: Creates a notification for a user
  - Parameters: `userId`, `title`, `message`, `type`

### Using Workflows for Automation

Workflows can be used to automate various business processes:

1. **Leave Approval Process**:

   - Start when a leave request is submitted
   - Check if the employee has available leave balance
   - Route to appropriate manager for approval
   - Send notification emails
   - Update leave records

2. **Sales Deal Processing**:

   - Start when a deal reaches a specific stage
   - Create invoices automatically
   - Send confirmation emails
   - Update deal status
   - Create follow-up tasks

3. **Project Management**:

   - Automatically assign tasks based on project milestones
   - Send notifications when tasks are completed
   - Update project status based on task completion
   - Generate reports on project progress

4. **Document Processing**:
   - Route documents for approval
   - Send notifications to stakeholders
   - Update document metadata
   - Archive completed documents

### Workflow API Endpoints

- `GET /api/workflow/list` - List all workflows
- `GET /api/workflow/:id` - Get a specific workflow
- `POST /api/workflow/create` - Create a new workflow
- `PUT /api/workflow/:id` - Update a workflow
- `DELETE /api/workflow/:id` - Delete a workflow
- `POST /api/workflow/:id/execute` - Execute a workflow with provided context
- `GET /api/workflow/actions` - Get all available module actions for workflows
- `GET /api/workflow/executions` - Get history of workflow executions

## Available Scripts

```bash
# Start production server
npm start

# Start development server with hot reloading
npm run dev

# Start in production mode
npm run production

# Initial setup
npm run setup

# Upgrade system
npm run upgrade

# Reset system
npm run reset
```

## Deployment

Deployment considerations:

- Set NODE_ENV=production for optimized performance
- Use process managers (PM2, Forever) for production deployments
- Configure proper security headers
- Set up monitoring and logging
- Implement CI/CD pipelines

## Troubleshooting

Common issues and solutions:

1. **Database Connection Issues**

   - Verify MongoDB is running
   - Check connection string in .env file
   - Ensure network connectivity to the database server

2. **Authentication Problems**

   - Validate JWT_SECRET is properly set
   - Check token expiration settings
   - Verify user credentials
   - **"Invalid Signature" Error**: Usually indicates mismatched JWT_SECRET values or environment variables not loaded correctly
     - Ensure .env file is properly configured with a strong JWT_SECRET
     - Verify no console.log statements are exposing the JWT_SECRET
     - Check that the same JWT_SECRET is used for both signing and verification
     - Restart the server after updating environment variables

3. **File Upload Issues**

   - Check directory permissions
   - Verify AWS credentials if using S3
   - Ensure proper MIME types are allowed

4. **Performance Problems**
   - Enable compression for larger responses
   - Implement caching strategies
   - Add database indexes for frequently queried fields
5. **API Integration Failures**

   - Verify API keys are correctly configured
   - Check rate limits for external services
   - Implement proper error handling for external service failures

6. **Document Upload Issues**

   - Check file size limits (maximum 50MB, increased from 10MB)
   - Ensure upload directories have proper permissions
   - Verify supported file types
   - Check for disk space issues
   - If you receive a "413 Payload Too Large" error, your file exceeds the 50MB limit

7. **Document Download Problems**

   - If files were downloading as text files regardless of their actual type:
     - This issue has been fixed. The system now properly sets Content-Type headers based on file extensions.
     - The backend now provides additional headers (X-Original-Filename and X-File-Extension) to help the
       frontend correctly determine file type.
     - If you still experience issues, verify that these headers are being sent properly in the response.
   - If you see a 401 Unauthorized error when downloading documents in a new tab:
     - The system now supports token-based authentication via URL query parameters
     - Check if the download URL includes the `?token=` parameter
     - If using direct links, generate them through the `getAuthenticatedDownloadUrl` utility
     - The token is automatically added when opening document versions in new tabs

8. **Document Version Control Issues**

   - If document reversion was not working properly:
     - This issue has been fixed. The system now properly handles document version reversion.
     - For reverting to the original version, use: `/api/document/:id/revert/original`
     - For reverting to a specific version, use: `/api/document/:id/revert/:versionNumber`
     - After reversion, the API now automatically updates the document content
     - Make sure your MongoDB has write permissions for the document collection
   - If versions are not displaying correctly after reversion:
     - The version list is now automatically refreshed after reversion
     - Check your MongoDB connection settings if version history is inconsistent
     - Ensure proper error handling in your client-side code

9. **Model Conflict Issues**
   - If you encounter a "Cannot overwrite model once compiled" error:
     - Ensure model names are unique across all files
     - The application now uses 'Client' for the app models and 'LegacyClient' for the older model definition
     - When adding new models, check existing model names to avoid conflicts
     - Restart the server after any model changes

## Document Analysis with In-House NLP

The system now uses an in-house NLP (Natural Language Processing) solution for document analysis, removing the dependency on external AI services like OpenAI. This provides several benefits:

- **No API costs**: No external API calls means no usage charges
- **Privacy**: Document content never leaves your server
- **Customizability**: The NLP system can be easily modified for your specific needs
- **No rate limits**: Process as many documents as needed without restrictions

### NLP Capabilities

The in-house NLP system provides the following functionality:

1. **Document Type Classification**: Analyzes text content to determine the document type (Invoice, Contract, Report, etc.)
2. **Tag Extraction**: Identifies relevant tags based on document content
3. **Summary Generation**: Creates a brief summary of the document content

### Usage

To analyze a document:

- **API Endpoint**: `GET /api/document/:id/analyze`
- **Frontend Action**: `erp.analyzeDocument({ entity: 'document', id })`

The system will extract text from supported file types (PDF, DOCX, TXT, etc.), process it with the NLP utilities, and return the analysis results.

### Customizing the NLP System

The NLP system uses a rule-based approach that can be customized in `src/utils/nlpUtils.js`:

- Extend keyword lists for better document type detection
- Add domain-specific terminology for improved tag extraction
- Modify summary generation logic to match your needs
- Implement additional analysis capabilities
