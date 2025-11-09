const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../src/app');
const TestDataFactory = require('../../utils/testDataFactory');
const { setupTestDatabase, cleanupTestDatabase } = require('../../utils/testSetup');

// Import models for data setup
const Invoice = require('../../../src/models/appModels/Invoice');
const Quote = require('../../../src/models/appModels/Quote');
const Payment = require('../../../src/models/appModels/Payment');
const Client = require('../../../src/models/appModels/Client');
const Team = require('../../../src/models/appModels/Team');
const Task = require('../../../src/models/appModels/Task');

describe('Statistics Controller', () => {
  let authToken;
  let testOwner;

  beforeAll(async () => {
    // Set up test database connection
    const mongoUri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/test_erp_system';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    // Setup test database and models
    await setupTestDatabase();

    // Create test owner and get auth token
    testOwner = await TestDataFactory.createCompanyOwner();

    // Use simple auth token instead of session-validated token for testing
    authToken = TestDataFactory.generateAuthToken(testOwner, true);
    console.log('Test token created for owner:', testOwner.email);
  });

  beforeEach(async () => {
    // Clean up collections before each test but preserve CompanyOwner
    await Promise.all([
      Invoice.deleteMany({}),
      Quote.deleteMany({}),
      Payment.deleteMany({}),
      Client.deleteMany({}),
      Team.deleteMany({}),
      Task.deleteMany({}),
    ]);

    // Verify testOwner still exists and refresh token
    const CompanyOwner = mongoose.model('CompanyOwner');
    const existingOwner = await CompanyOwner.findById(testOwner._id);
    if (!existingOwner) {
      console.log('testOwner was deleted, recreating...');
      testOwner = await TestDataFactory.createCompanyOwner();
    }

    authToken = TestDataFactory.generateAuthToken(testOwner, true);
  });

  afterAll(async () => {
    // Clean up and close database connection
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  describe('GET /api/stats/dashboard', () => {
    it('should return dashboard statistics with empty data', async () => {
      const response = await request(app)
        .get('/api/stats/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result).toHaveProperty('invoices');
      expect(response.body.result).toHaveProperty('quotes');
      expect(response.body.result).toHaveProperty('payments');
      expect(response.body.result).toHaveProperty('clients');
      expect(response.body.result).toHaveProperty('performance');

      // Check empty data structure
      expect(response.body.result.invoices.total).toBe(0);
      expect(response.body.result.quotes.total).toBe(0);
      expect(response.body.result.payments.total).toBe(0);
      expect(response.body.result.clients.total).toBe(0);
    });

    it('should return dashboard statistics with sample data', async () => {
      // Create sample data with owner relationship
      const client = await TestDataFactory.createClient(testOwner, {
        name: 'Test Client',
        email: 'client@example.com',
        phone: '1234567890',
        enabled: true,
        customerType: 'individual',
      });

      const invoice = await TestDataFactory.createInvoice(testOwner, client, {
        number: 1001,
        total: 1000,
        status: 'sent',
        paymentStatus: 'paid',
        date: new Date(),
        currency: 'USD',
      });

      await TestDataFactory.createQuote(testOwner, client, {
        number: 2001,
        total: 500,
        status: 'pending',
        date: new Date(),
        currency: 'USD',
      });

      await TestDataFactory.createPayment(testOwner, client, invoice, {
        number: 1,
        amount: 1000,
        date: new Date(),
        currency: 'USD',
      });

      const response = await request(app)
        .get('/api/stats/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.invoices.total).toBe(1);
      expect(response.body.result.invoices.totalAmount).toBe(1000);
      expect(response.body.result.quotes.total).toBe(1);
      expect(response.body.result.quotes.totalAmount).toBe(500);
      expect(response.body.result.payments.total).toBe(1);
      expect(response.body.result.payments.totalAmount).toBe(1000);
      expect(response.body.result.clients.total).toBe(1);
    });

    it('should filter data by timeframe', async () => {
      const client = await TestDataFactory.createClient(testOwner, {
        name: 'Test Client',
        email: 'client@example.com',
        phone: '1234567890',
        enabled: true,
        customerType: 'individual',
      });

      // Create old invoice (outside timeframe)
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 60);

      await TestDataFactory.createInvoice(testOwner, client, {
        number: 1000,
        total: 500,
        status: 'sent',
        paymentStatus: 'paid',
        date: oldDate,
        created: oldDate, // Set the created date explicitly for filtering
        currency: 'USD',
      });

      // Create recent invoice
      await TestDataFactory.createInvoice(testOwner, client, {
        number: 1001,
        total: 1000,
        status: 'sent',
        paymentStatus: 'paid',
        date: new Date(),
        currency: 'USD',
      });

      const response = await request(app)
        .get('/api/stats/dashboard?timeframe=30')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.result.invoices.total).toBe(2); // Total includes all invoices
      expect(response.body.result.invoices.thisMonth).toBe(1); // Only recent one
    });
  });

  describe('GET /api/stats/invoices', () => {
    it('should return invoice statistics', async () => {
      const client = await TestDataFactory.createClient(testOwner, {
        name: 'Test Client',
        email: 'client@example.com',
        phone: '1234567890',
        enabled: true,
        customerType: 'individual',
      });

      // Create invoices with different statuses
      await Invoice.create({
        number: 1001,
        year: new Date().getFullYear(),
        date: new Date(),
        expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        client: client._id,
        items: [
          {
            itemName: 'Test Item 1',
            quantity: 1,
            price: 1000,
            total: 1000,
          },
        ],
        subTotal: 1000,
        total: 1000,
        status: 'sent',
        paymentStatus: 'paid',
        currency: 'USD',
        owner: testOwner._id,
        createdBy: testOwner._id,
      });

      await Invoice.create({
        number: 1002,
        year: new Date().getFullYear(),
        date: new Date(),
        expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        client: client._id,
        items: [
          {
            itemName: 'Test Item 2',
            quantity: 1,
            price: 500,
            total: 500,
          },
        ],
        subTotal: 500,
        total: 500,
        status: 'draft',
        paymentStatus: 'unpaid',
        currency: 'USD',
        owner: testOwner._id,
        createdBy: testOwner._id,
      });

      const response = await request(app)
        .get('/api/stats/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.totalInvoices).toBe(2);
      expect(response.body.result.totalAmount).toBe(1500);
      expect(response.body.result.byStatus).toHaveLength(2);
    });
  });

  describe('GET /api/stats/quotes', () => {
    it('should return quote statistics', async () => {
      const client = await TestDataFactory.createClient(testOwner, {
        name: 'Test Client',
        email: 'client@example.com',
        phone: '1234567890',
        enabled: true,
        customerType: 'individual',
      });

      await Quote.create({
        number: 2001,
        year: new Date().getFullYear(),
        date: new Date(),
        expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        client: client._id,
        items: [
          {
            itemName: 'Test Quote Item',
            quantity: 1,
            price: 500,
            total: 500,
          },
        ],
        subTotal: 500,
        total: 500,
        status: 'pending',
        currency: 'USD',
        owner: testOwner._id,
        createdBy: testOwner._id,
      });

      const response = await request(app)
        .get('/api/stats/quotes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.totalQuotes).toBe(1);
      expect(response.body.result.totalAmount).toBe(500);
      expect(response.body.result.byStatus).toHaveLength(1);
    });
  });

  describe('GET /api/stats/payments', () => {
    it('should return payment statistics', async () => {
      const client = await TestDataFactory.createClient(testOwner, {
        name: 'Test Client',
        email: 'client@example.com',
        phone: '1234567890',
        enabled: true,
        customerType: 'individual',
      });

      const invoice = await TestDataFactory.createInvoice(testOwner, client);

      const paymentMode = await TestDataFactory.createPaymentMode(testOwner);

      await Payment.create({
        number: 3001,
        client: client._id,
        invoice: invoice._id,
        amount: 1000,
        date: new Date(),
        currency: 'USD',
        paymentMode: paymentMode._id,
        owner: testOwner._id,
        createdBy: testOwner._id,
      });

      const response = await request(app)
        .get('/api/stats/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.totalPayments).toBe(1);
      expect(response.body.result.totalAmount).toBe(1000);
    });
  });

  describe('GET /api/stats/clients', () => {
    it('should return client statistics', async () => {
      await TestDataFactory.createClient(testOwner, {
        name: 'Test Client 1',
        email: 'client1@example.com',
        phone: '1234567890',
        enabled: true,
        customerType: 'individual',
      });

      await TestDataFactory.createClient(testOwner, {
        name: 'Test Company',
        email: 'company@example.com',
        phone: '0987654321',
        enabled: true,
        customerType: 'company',
      });

      const response = await request(app)
        .get('/api/stats/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.total).toBe(2);
      expect(response.body.result.active).toBe(2);
      expect(response.body.result.byType).toBeDefined();
    });
  });

  describe('GET /api/stats/teams', () => {
    it('should return team statistics', async () => {
      // Create users for team members
      const user1 = await TestDataFactory.createUser(testOwner);
      const user2 = await TestDataFactory.createUser(testOwner);

      const team = await Team.create({
        name: 'Test Team',
        description: 'Test team description',
        owner: testOwner._id,
        teamLead: user1.user._id,
        members: [
          {
            user: user1.user._id,
            role: 'lead',
            joinedAt: new Date(),
            updatedAt: new Date(),
          },
          {
            user: user2.user._id,
            role: 'member',
            joinedAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      await Task.create({
        title: 'Test Task',
        description: 'Test task description',
        status: 'completed',
        assignedTeam: team._id,
        owner: user1.user._id,
        createdBy: user1.user._id,
      });

      const response = await request(app)
        .get('/api/stats/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.totalTeams).toBeGreaterThanOrEqual(1);
      expect(response.body.result.activeTeams).toBeGreaterThanOrEqual(1);
      expect(response.body.result.totalMembers).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle unauthorized requests', async () => {
      const response = await request(app).get('/api/stats/dashboard').expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle invalid timeframe parameter', async () => {
      const response = await request(app)
        .get('/api/stats/dashboard?timeframe=invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200); // Should still work with default timeframe

      expect(response.body.success).toBe(true);
      expect(response.body.result.timeframe).toBe(30); // Default timeframe
    });
  });
});
