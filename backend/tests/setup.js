const { expect, jest, beforeAll, afterEach, afterAll } = require('@jest/globals');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DATABASE_URL = 'mongodb://localhost:27017/test';

// Ensure all models are loaded before any tests
require('../src/models/coreModels/CompanyOwner');
require('../src/models/coreModels/CompanyOwnerPassword');
require('../src/models/coreModels/Setting');
require('../src/models/appModels/User');
require('../src/models/appModels/Team');
require('../src/models/appModels/Document'); // Fixed: use Document instead of documentModel
require('../src/models/appModels/DocumentVersion');
require('../src/models/appModels/DocumentCompliance');
require('../src/models/appModels/Client');
require('../src/models/appModels/Invoice');
require('../src/models/appModels/Quote');
require('../src/models/appModels/Payment');
require('../src/models/appModels/PaymentMode');
require('../src/models/appModels/Taxes');
require('../src/models/appModels/auditTrailModel');
require('../src/models/appModels/Task');
require('../src/models/appModels/Workflow');
require('../src/models/WorkflowExecution');
require('../src/models/appModels/SavedSearch');

// Global test utilities
const TestDataFactory = require('./utils/testDataFactory');

// Set up global test utilities
global.testUtils = {
  createTestCompanyOwner: TestDataFactory.createCompanyOwner,
  createTestUser: TestDataFactory.createUser,
  createTestClient: TestDataFactory.createClient,
  createTestInvoice: TestDataFactory.createInvoice,
  createTestPayment: TestDataFactory.createPayment,
  createTestDocument: TestDataFactory.createDocument,
  createTestQuote: TestDataFactory.createQuote,
  generateTestToken: TestDataFactory.generateAuthToken,
  generateValidToken: TestDataFactory.generateValidToken,
  createTestToken: async (payload = { _id: 'test-user-id', role: 'owner' }) => {
    console.log('=== createTestToken DEBUG ===');
    console.log('Payload:', payload);

    // For tests, we just need to create a proper token that matches an existing CompanyOwner
    const mockUser = {
      _id: payload._id || payload.id,
      email: payload.email || 'test@example.com',
      role: payload.role || 'owner',
    };

    console.log('Mock user:', mockUser);

    // Generate the token (isOwner = true since this is for CompanyOwner)
    const token = TestDataFactory.generateAuthToken(mockUser, true);
    console.log('Generated token (first 20 chars):', token.substring(0, 20) + '...');

    return token;
  },
};

// Custom toBeOneOf matcher
expect.extend({
  toBeOneOf(received, validOptions) {
    const pass = validOptions.includes(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be one of [${validOptions.join(', ')}]`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of [${validOptions.join(', ')}]`,
        pass: false,
      };
    }
  },
});

// Set longer timeout for integration tests
jest.setTimeout(15000);

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  if (!process.env.CI) {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  }
});

// Cleanup after each test
afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    const promises = [];
    for (const key in collections) {
      promises.push(collections[key].deleteMany({}));
    }
    await Promise.all(promises);
  }
});

// Cleanup after all tests
afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});
