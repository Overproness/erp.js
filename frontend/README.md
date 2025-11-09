# Frontend Documentation - Quickmation Automation Suite (Odoo Project)

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
- [Deployment](#deployment)
  - [Render.com Deployment](#rendercom-deployment)
  - [Docker Deployment](#docker-deployment)
- [Project Structure](#project-structure)
- [Core Components](#core-components)
  - [Application Root](#application-root)
  - [Redux Store](#redux-store)
  - [Routing System](#routing-system)
  - [Authentication System](#authentication-system)
  - [Layouts](#layouts)
  - [Components](#components)
  - [Forms](#forms)
  - [Data Fetching](#data-fetching)
- [Features](#features)
  - [Authentication & Authorization](#authentication--authorization)
  - [Dashboard](#dashboard)
  - [ERP Features](#erp-features)
  - [File Management](#file-management)
  - [Reports & Analytics](#reports--analytics)
  - [Advanced Search Functionality](#advanced-search-functionality)
- [State Management](#state-management)
  - [Redux Structure](#redux-structure)
  - [Reducers](#reducers)
  - [Actions](#actions)
  - [Selectors](#selectors)
- [Styling & Theming](#styling--theming)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Available Scripts](#available-scripts)
- [Build & Deployment](#build--deployment)
- [Troubleshooting](#troubleshooting)

## Overview

The frontend application for Quickmation Automation Suite is a React-based single-page application that provides an intuitive user interface for ERP/CRM operations, connects with the backend API, and delivers a responsive experience across devices.

## Technology Stack

- **React**: UI library for building component-based interfaces
- **React Router**: Declarative routing for React applications
- **Redux**: State management with Redux Toolkit for simplified architecture
- **Ant Design**: UI component library providing consistent and professional design system
- **Axios**: Promise-based HTTP client for API requests
- **React Query**: Data fetching and state management for asynchronous operations
- **CSS Modules & SASS**: For component styling
- **Vite**: Development server and build tool

## Getting Started

### Prerequisites

- Node.js v20.9.0 or higher
- npm v10.2.4 or higher or yarn v1.22.0 or higher
- Access to the backend API server

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to the frontend folder
cd d:/GitHub/Tech_Revisor_Automation_Suite/Odoo_Project/frontend

# Install dependencies
yarn install
# or
npm install

# Start development server
yarn start
# or
npm start
```

### Environment Configuration

Create a `.env` file in the frontend root directory with the following variables:

```
VITE_APP_API_BASE_URL=http://localhost:8888/api
VITE_APP_NAME=Quickmation Suite
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=Automation Suite for ERP/CRM Management
VITE_APP_PUBLIC_URL=/
```

## Deployment

### Render.com Deployment

This project is optimized for deployment on Render.com. The following optimizations have been implemented to prevent memory issues:

#### Memory Optimizations:

- **Source maps disabled** in production builds
- **Node.js memory limit** increased to 8GB for build process
- **Optimized chunk splitting** to reduce memory usage
- **Aggressive tree shaking** for smaller bundle sizes

#### Deploy Steps:

1. Connect your GitHub repository to Render.com
2. Use the following build settings:
   - **Build Command**: `npm install && npm run build:render`
   - **Publish Directory**: `./dist`
   - **Environment Variables**:
     - `NODE_ENV=production`
     - `NODE_OPTIONS=--max-old-space-size=8192`

#### Alternative Docker Deployment:

```bash
# Build Docker image
docker build -t odoo-frontend .

# Run container
docker run -p 3000:3000 odoo-frontend
```

### Local Build Testing:

```bash
# Test production build locally
npm run build:render

# Preview the build
npm run preview
```

## Project Structure

```
frontend/
├── public/            # Static files (images, fonts, etc.)
├── src/
│   ├── apps/          # Main application modules
│   │   └── ErpOs/  # Main application component
│   ├── components/    # Reusable UI components
│   ├── config/        # Application configuration
│   ├── forms/         # Form components and validation logic
│   ├── hooks/         # Custom React hooks
│   ├── layout/        # Layout components
│   ├── pages/         # Page components
│   ├── redux/         # Redux state management
│   │   ├── store.js   # Redux store configuration
│   │   ├── actions/   # Redux actions
│   │   ├── reducers/  # Redux reducers
│   │   └── selectors/ # Redux selectors
│   ├── routes/        # Application routing
│   ├── services/      # API services
│   ├── style/         # Global styles and themes
│   ├── utils/         # Utility functions
│   ├── RootApp.jsx    # Root component
│   └── main.jsx       # Entry point
├── .env               # Environment variables
├── package.json       # Project dependencies and scripts
├── vite.config.js     # Vite configuration
└── README.md          # This documentation
```

## Core Components

### Application Root

The application uses a structured approach with the root component (`RootApp.jsx`) providing:

- Redux Provider for state management
- Ant Design App wrapper for consistent theming
- React Router for navigation
- Suspense for code-splitting and lazy loading

### Redux Store

The Redux store (`redux/store.js`) is configured with:

- Redux Toolkit for simplified state management
- Thunk middleware for asynchronous actions
- Redux Persist for state persistence across sessions
- DevTools extension support for debugging

### Routing System

The routing system implements:

- Route-based code splitting for performance
- Protected routes with authentication checks
- Role-based access control
- Navigation guards
- Nested routing for complex page hierarchies

### Authentication System

Authentication features include:

- JWT token management
- Secure login/logout flow
- Session persistence
- Role-based access control
- Password reset functionality
- Authentication state management

### Layouts

Layout components provide:

- Consistent page structures
- Responsive design patterns
- Navigation components
- Header and footer elements
- Sidebar navigation
- Content containers

### Components

The component library includes:

- Form elements with validation
- Data visualization components
- Navigation components
- Tables and data grids
- Cards and panels
- Modal dialogs
- Notifications and alerts
- Loading indicators

### Forms

Form handling includes:

- Field validation
- Dynamic form generation
- Form submission handling
- Error display
- Field dependencies
- Multi-step forms

### Data Fetching

Data fetching is implemented with:

- Axios for API communication
- React Query for data caching and synchronization
- Loading state management
- Error handling
- Optimistic updates
- Data transformation

## Features

### Authentication & Authorization

- User login and registration
- Password management
- Role-based access control
- Session management

### Dashboard

- Overview metrics
- Activity feeds
- Quick actions
- Customizable widgets

### ERP Features

- Customer management
- Order processing
- Inventory management
- Financial reporting
- User management

### File Management

The document management system now includes enhanced functionality:

- File uploads and downloads
- Document previews
- File organization
- Version control
- Document editing and e-signing

#### Document Versioning Features

The system now uses a simplified versioning approach:

- **Version 0**: Always represents the original document as uploaded
- **Version 1+**: Represents subsequent edits and modifications
- **Reverting**: Users can revert to any version (including version 0) to restore previous states
  - To revert to the original version, use the endpoint `/api/document/:id/revert/original`
  - To revert to a specific version, use `/api/document/:id/revert/:versionNumber`
- **Version History**: All versions are tracked with metadata including:
  - Who made the change
  - When the change was made
  - Description of the changes

To access these features:

1. From the Documents list, click on the "Edit Content" icon (pencil) for supported document types
2. From the Document details page, click on "Edit Content" or "View & Sign" based on document type
3. Use the Version History button to see all previous versions and optionally revert to any of them

**Important**: To restore the original document, simply revert to Version 0 from the version history panel.

#### Document Editing Features

The system supports direct editing and version control for documents:

- **Direct Content Editing**: Edit text files, CSV, JSON, Markdown, and HTML directly in the browser
- **PDF Viewing**: View PDF documents with navigation controls
- **E-Signature**: Add electronic signatures to PDF documents with:
  - Text-based signatures
  - Custom positioning on any page
  - Signature reason tracking
- **Version Management**:
  - View all previous versions including the original (Version 0)
  - Revert to any version (including the original) at any time
  - Track who made changes and when
  - View change descriptions

To access these features:

1. From the Documents list, click on the "Edit Content" icon (pencil) for supported document types
2. From the Document details page, click on "Edit Content" or "View & Sign" based on document type
3. Use the Version History button to see and manage previous versions

**Important**: The document editor is accessed through the `/document/editor/:id` route, which is configured in the application routes.

### Reports & Analytics

- Data visualization
- Custom report generation
- Export functionality
- Real-time analytics

### Advanced Search Functionality

The system now includes a powerful advanced search capability that allows users to:

- Perform full-text searches across document content
- Search by metadata fields (title, description, document type, etc.)
- Filter by file types
- Filter by date ranges
- Filter and search by document tags
- Sort results by various criteria

To access these features:

1. From the Documents page, click on "Advanced Search" button
2. Use the search interface to specify search criteria
3. Results will be displayed with highlighted search terms
4. Use the pagination controls to navigate through results

The advanced search interface supports:

- **Full-Text Search**: Search across all document text content
- **Metadata Search**: Search by document properties like title, type, tags
- **Date Filtering**: Filter documents by creation/update dates
- **Tag Filtering**: Search or filter by document tags
- **Custom Sorting**: Sort results by relevance, date, title, etc.

The system maintains both the simple search capability and the new advanced search functionality to accommodate different user needs.

## State Management

### Redux Structure

Redux state is organized into domains:

- Auth: Authentication state
- UI: UI-related state (theme, sidebar, notifications)
- Entities: Domain data (customers, orders, products)
- Forms: Form state management
- App: Application-level state

### Reducers

Reducers handle state transitions for:

- User authentication
- Data loading states
- CRUD operations
- UI state changes
- Error handling

### Actions

Actions implement:

- API requests
- Authentication flows
- Data manipulation
- UI state changes
- Background processes

### Selectors

Selectors provide:

- Memoized data access
- Derived state calculations
- Data transformation
- State filtering

## Styling & Theming

The application's styling system includes:

- Ant Design component library with customized theme
- CSS modules for component-scoped styling
- SASS for advanced styling features
- Responsive design patterns
- Dark/light mode support
- Theme customization

## Error Handling

Error handling strategies include:

- Global error boundary
- API error handling
- Form validation errors
- Graceful UI degradation
- Error logging and reporting

## Testing

Testing infrastructure includes:

- Jest for unit tests
- React Testing Library for component tests
- Mock service worker for API mocks
- Cypress for end-to-end testing
- Test utilities and helpers

## Available Scripts

```bash
# Start development server
yarn start
# or
npm start

# Build for production
yarn build
# or
npm run build

# Run tests
yarn test
# or
npm test

# Lint code
yarn lint
# or
npm run lint

# Format code
yarn format
# or
npm run format
```

## Build & Deployment

Build process:

- Production builds are optimized for performance
- Assets are minified and hashed
- Code splitting for optimal loading
- Environment-specific configurations

Deployment options:

- Static hosting (Netlify, Vercel, AWS S3)
- Docker containerization
- CI/CD pipeline integration
- Environment-specific builds

## Troubleshooting

Common issues and solutions:

1. **API Connection Issues**

   - Verify backend server is running
   - Check API base URL in .env file
   - Inspect network requests for errors
   - Verify CORS configuration

2. **Authentication Problems**

   - Clear browser storage and cookies
   - Check token expiration handling
   - Verify credentials
   - Check for proper logout procedure

3. **Build Failures**

   - Check for dependency conflicts
   - Resolve ESLint/TypeScript errors
   - Verify Node.js version compatibility
   - Check for environment variable issues

4. **Performance Issues**

   - Identify components causing re-renders
   - Implement memoization for expensive calculations
   - Use virtualization for large lists
   - Optimize bundle size

5. **UI Inconsistencies**

   - Ensure proper responsive design implementation
   - Check browser compatibility
   - Verify theme consistency
   - Test across different device sizes

6. **Document Editing Issues**

   - If document content doesn't load: Check file permissions on server
   - If e-signing fails: Ensure PDF structure is valid
   - Version history issues: Verify MongoDB connection and permissions
   - If the editor page shows a 404 error:
     - Make sure the route `/document/editor/:id` is properly configured in your AppRouter.jsx
     - Check that DocumentEditor component is correctly imported
     - Verify that you're using the correct route path when navigating
   - For PDF viewing issues: Check if the PDF.js worker is properly loaded from CDN
   - If documents download with incorrect file extensions:
     - This issue has been fixed. The system now properly detects file types from both
       content-type headers and custom X-File-Extension headers provided by the backend.
     - If you still experience issues, check network responses to ensure proper content types.
   - If document reversion is not working:
     - This issue has been fixed. The system now properly handles document version reversion.
     - Make sure you're using the correct API endpoint formats:
       - For original version: `/api/document/:id/revert/original`
       - For specific versions: `/api/document/:id/revert/:versionNumber`
     - After reversion, the system will automatically fetch the updated document content.
     - If content doesn't update immediately, try refreshing the page.
