const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DATABASE_URL = 'mongodb://localhost:27017/test';

// Global test setup
let mongoServer;

// Shorter timeout for setup operations
const SETUP_TIMEOUT = 60000; // 1 minute

// Setup before all tests
beforeAll(async () => {
  try {
    console.log('Starting MongoDB Memory Server...');

    // Create MongoDB Memory Server with minimal config
    mongoServer = await MongoMemoryServer.create({
      instance: {
        port: 0,
        ip: '127.0.0.1',
      },
      binary: {
        version: '5.0.0', // Use a more recent stable version
        downloadDir: process.env.MONGOMS_DOWNLOAD_DIR || './tmp/mongodb-binaries',
      },
    });

    const mongoUri = mongoServer.getUri();
    console.log('MongoDB URI:', mongoUri);

    // Close any existing connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Connect to in-memory database
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      maxPoolSize: 1,
    });

    console.log('Connected to test database');

    // Load only essential models
    require('../../src/models/coreModels/CompanyOwner');
    require('../../src/models/coreModels/CompanyOwnerPassword');
    require('../../src/models/appModels/Client');
    require('../../src/models/appModels/Invoice');
    require('../../src/models/appModels/Payment');
    require('../../src/models/appModels/Quote');

    console.log('Essential models loaded');
  } catch (error) {
    console.error('Test setup failed:', error);
    throw error;
  }
}, SETUP_TIMEOUT);

// Cleanup after each test
afterEach(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      const collections = mongoose.connection.collections;
      const cleanupPromises = [];

      for (const key in collections) {
        cleanupPromises.push(collections[key].deleteMany({}));
      }

      await Promise.all(cleanupPromises);
    }
  } catch (error) {
    console.warn('Cleanup warning:', error.message);
  }
}, 10000);

// Cleanup after all tests
afterAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('Test cleanup completed');
  } catch (error) {
    console.warn('Final cleanup warning:', error.message);
  }
}, 15000);

// Set global timeout for Jest
jest.setTimeout(30000); // 30 seconds default

// Simple test utilities
global.testUtils = {
  // Create test JWT token
  createTestToken: (payload = { _id: 'test-user-id', role: 'owner' }) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  },

  // Create test company owner
  createTestCompanyOwner: async () => {
    const CompanyOwner = mongoose.model('CompanyOwner');
    const CompanyOwnerPassword = mongoose.model('CompanyOwnerPassword');
    const bcrypt = require('bcryptjs');

    try {
      // Create the CompanyOwner
      const companyOwner = await CompanyOwner.create({
        name: 'Test Owner',
        email: `owner-${Date.now()}@example.com`,
        role: 'owner',
        enabled: true,
        onboardingComplete: true,
      });

      // Create the password record
      const salt = bcrypt.genSaltSync(10);
      const defaultPassword = 'TestPassword123!';

      await CompanyOwnerPassword.create({
        user: companyOwner._id,
        salt: salt,
        password: bcrypt.hashSync(salt + defaultPassword),
        emailVerified: true,
        authType: 'email',
        loggedSessions: [],
      });

      companyOwner.testPassword = defaultPassword;
      return companyOwner;
    } catch (error) {
      console.error('Failed to create test company owner:', error);
      throw error;
    }
  },

  // Create test client
  createTestClient: async (ownerId) => {
    const Client = mongoose.model('Client');
    return await Client.create({
      name: 'Test Client',
      email: `client-${Date.now()}-${Math.random().toString(36).substr(2, 5)}@example.com`,
      phone: '+1234567890',
      owner: ownerId,
      customerType: 'company',
      enabled: true,
      removed: false,
    });
  },

  // Create test invoice
  createTestInvoice: async (ownerId, clientId, overrides = {}) => {
    const Invoice = mongoose.model('Invoice');
    return await Invoice.create({
      number: 1,
      year: 2024,
      date: new Date(),
      expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      client: clientId,
      owner: ownerId,
      items: [
        {
          itemName: 'Test Item',
          quantity: 1,
          price: 100,
          total: 100,
        },
      ],
      subTotal: 100,
      total: 100,
      status: 'draft',
      ...overrides,
    });
  },

  // Create test payment
  createTestPayment: async (ownerId, clientId, invoiceId, overrides = {}) => {
    const Payment = mongoose.model('Payment');
    return await Payment.create({
      number: 1,
      year: 2024,
      date: new Date(),
      amount: 100,
      client: clientId,
      invoice: invoiceId,
      owner: ownerId,
      paymentMode: 'cash',
      ...overrides,
    });
  },
};

// Custom Jest matchers
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

module.exports = {
  mongoServer: () => mongoServer,
};
