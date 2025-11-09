const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const jwt = require('jsonwebtoken');

// Global test setup
let mongoServer;

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DATABASE_URL = 'mongodb://localhost:27017/test';

// Global timeout for test operations - REDUCED for faster execution
const TEST_TIMEOUT = 60000; // 1 minute instead of 3 minutes

// Setup before all tests
beforeAll(async () => {
  try {
    console.log('Starting MongoDB Memory Server...');

    // Create MongoDB Memory Server with optimized settings
    mongoServer = await MongoMemoryServer.create({
      instance: {
        port: 0,
        ip: '127.0.0.1',
      },
      binary: {
        version: '5.0.0',
        downloadDir: './tmp/mongodb-binaries',
      },
    });

    const mongoUri = mongoServer.getUri();
    console.log('MongoDB started successfully');

    // Close any existing connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Connect to in-memory database with proper timeouts
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      maxPoolSize: 1,
    });

    console.log('Connected to test database');

    // Load only essential models to avoid complexity
    require('../../src/models/coreModels/CompanyOwner');
    require('../../src/models/coreModels/CompanyOwnerPassword');
    require('../../src/models/coreModels/Setting');
    require('../../src/models/appModels/Client');
    require('../../src/models/appModels/Invoice');
    require('../../src/models/appModels/Payment');
    require('../../src/models/appModels/Quote');

    console.log('Essential models loaded');
  } catch (error) {
    console.error('Test setup failed:', error);
    throw error;
  }
}, 90000); // Reduced from 150 seconds to 90 seconds

// Cleanup after each test with timeout
afterEach(async () => {
  let timeoutId;
  const cleanupPromise = (async () => {
    if (mongoose.connection.readyState === 1) {
      const collections = mongoose.connection.collections;
      const cleanupPromises = [];

      for (const key in collections) {
        const collection = collections[key];
        cleanupPromises.push(collection.deleteMany({}));
      }
      await Promise.all(cleanupPromises);
    }
  })();

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Cleanup timed out')), 15000);
  });

  try {
    await Promise.race([cleanupPromise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}, 20000);

// Cleanup after all tests with timeout
afterAll(async () => {
  let timeoutId;
  const cleanupPromise = (async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  })();

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Final cleanup timed out')), 15000);
  });

  try {
    await Promise.race([cleanupPromise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}, 20000);

// Set global timeout for Jest
jest.setTimeout(TEST_TIMEOUT);

// Global test utilities
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

    // Create the CompanyOwner
    const companyOwner = await CompanyOwner.create({
      name: 'Test Owner',
      email: `owner1-${Date.now()}@example.com`, // Unique email
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

    // Add password to the object for test convenience
    companyOwner.testPassword = defaultPassword;

    return companyOwner;
  },

  // Create test client
  createTestClient: async (ownerId) => {
    const Client = mongoose.model('Client');
    return await Client.create({
      name: 'Test Client',
      email: `client-${Date.now()}-${Math.random().toString(36).substr(2, 5)}@example.com`,
      phone: '+1234567890',
      owner: ownerId,
      createdBy: ownerId,
      customerType: 'company',
    });
  },

  // Create test invoice
  createTestInvoice: async (ownerId, clientId) => {
    const Invoice = mongoose.model('Invoice');
    return await Invoice.create({
      number: 1,
      year: 2024,
      date: new Date(),
      expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      client: clientId,
      owner: ownerId,
      createdBy: ownerId,
      items: [
        {
          itemName: 'Test Item',
          quantity: 1,
          price: 100,
          total: 100,
        },
      ],
      subTotal: 100,
      taxRate: 10,
      taxTotal: 10,
      total: 110,
      currency: 'USD',
      paymentStatus: 'unpaid',
    });
  },

  // Create test payment
  createTestPayment: async (ownerId, clientId, invoiceId) => {
    const Payment = mongoose.model('Payment');
    return await Payment.create({
      number: 1,
      year: 2024,
      date: new Date(),
      client: clientId,
      invoice: invoiceId,
      owner: ownerId,
      createdBy: ownerId,
      amount: 100,
      currency: 'USD',
      paymentMethod: 'bank_transfer',
      description: 'Test Payment',
    });
  },

  // Generate test data with faker
  generateTestData: {
    email: () => faker.internet.email(),
    phone: () => faker.phone.phoneNumber(),
    name: () => faker.name.fullName(),
    company: () => faker.company.name(),
    amount: () => faker.datatype.number({ min: 100, max: 10000 }),
    currency: () => 'USD',
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

// Mock external dependencies
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  }),
}));

// Suppress console.log during tests unless running with --verbose
if (!process.argv.includes('--verbose')) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}
