// Jest setup file for backend testing
require('dotenv').config({ path: '.env.test' });

// Global test configuration
global.console = {
  ...console,
  // Suppress console logs during testing unless needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn,
  error: console.error,
};

// Mock external services for testing
jest.mock('../../src/services/emailService', () => ({
  sendEmail: jest.fn(),
  validateTemplate: jest.fn().mockReturnValue(true),
}));

jest.mock('../../src/services/smsService', () => ({
  sendSMS: jest.fn(),
  validatePhoneNumber: jest.fn().mockReturnValue(true),
}));

jest.mock('../../src/services/AIOptimizer', () => ({
  analyzePerformance: jest.fn().mockResolvedValue({
    suggestions: ['Optimize subject line', 'Improve send time'],
    confidence: 0.85,
  }),
  optimizeCampaign: jest.fn().mockResolvedValue({
    improvements: ['Better targeting', 'Enhanced content'],
    expectedImprovement: 15,
  }),
}));

// Database cleanup helper
global.cleanupDatabase = async () => {
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
};

// Test data generators
global.generateTestUser = () => ({
  name: 'Test User',
  email: 'test@example.com',
  password: 'testpass123',
  role: 'admin',
});

global.generateTestCampaign = (overrides = {}) => ({
  name: 'Test Campaign',
  type: 'email',
  status: 'draft',
  description: 'Test campaign description',
  channels: ['email'],
  content: {
    subject: 'Test Subject',
    body: 'Test campaign content',
  },
  targeting: {
    segments: [],
    audience: 'all_customers',
  },
  schedule: {
    type: 'immediate',
    timezone: 'UTC',
  },
  budget: {
    total: 1000,
    currency: 'USD',
  },
  ...overrides,
});

global.generateTestEmailTemplate = (overrides = {}) => ({
  name: 'Test Template',
  subject: 'Test Subject {{customerName}}',
  htmlContent: '<h1>Hello {{customerName}}</h1>',
  textContent: 'Hello {{customerName}}',
  category: 'promotional',
  variables: ['customerName'],
  ...overrides,
});

// Setup and teardown helpers
beforeAll(async () => {
  // Any global setup
});

afterAll(async () => {
  // Any global cleanup
});

beforeEach(async () => {
  // Clear mocks before each test
  jest.clearAllMocks();
});

afterEach(async () => {
  // Cleanup after each test
});
