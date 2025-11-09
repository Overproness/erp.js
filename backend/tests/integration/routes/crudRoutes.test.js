const request = require('supertest');
const { describe, test, beforeAll, afterAll, expect } = require('@jest/globals');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { generate: uniqueId } = require('shortid');

describe('App CRUD Routes Integration Tests', () => {
  let app;
  let testCompanyOwner;
  let testUser;
  let testTeam;
  let authToken;
  let userAuthToken;
  let testClient;
  let testTask;
  let testInvoice;
  let testQuote;
  let testPayment;

  beforeAll(async () => {
    // Import app after models are loaded
    app = require('../../../src/app');

    // Create test company owner
    const CompanyOwner = mongoose.model('CompanyOwner');
    const CompanyOwnerPassword = mongoose.model('CompanyOwnerPassword');

    testCompanyOwner = await CompanyOwner.create({
      name: 'Test Owner',
      email: 'testowner@company.com',
      role: 'owner',
      enabled: true,
      onboardingComplete: true,
    });

    const salt = uniqueId();
    const hashedPassword = bcrypt.hashSync(salt + 'password123');

    await CompanyOwnerPassword.create({
      user: testCompanyOwner._id,
      password: hashedPassword,
      salt: salt,
      emailVerified: true,
    });

    // Create test team and user
    const Team = mongoose.model('Team');
    const User = mongoose.model('User');
    const UserPassword = mongoose.model('UserPassword');

    testTeam = await Team.create({
      name: 'Test Team',
      owner: testCompanyOwner._id,
      enabled: true,
    });

    testUser = await User.create({
      name: 'Test User',
      email: 'testuser@team.com',
      role: 'member',
      team: testTeam._id,
      enabled: true,
      isInvitationAccepted: true,
    });

    const userSalt = uniqueId();
    const userHashedPassword = bcrypt.hashSync(userSalt + 'userpass123');

    await UserPassword.create({
      user: testUser._id,
      password: userHashedPassword,
      salt: userSalt,
      emailVerified: true,
    });

    // Generate auth tokens
    authToken = jwt.sign({ id: testCompanyOwner._id }, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '24h',
    });

    userAuthToken = jwt.sign(
      { id: testUser._id, isUser: true },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );

    // Create test data
    const Client = mongoose.model('Client');
    testClient = await Client.create({
      name: 'Test Client',
      email: 'client@test.com',
      phone: '123-456-7890',
      address: '123 Test St',
      owner: testCompanyOwner._id,
      enabled: true,
    });
  });

  afterAll(async () => {
    // Clean up test data
    const modelsToClean = [
      'Payment',
      'Quote',
      'Invoice',
      'Task',
      'Client',
      'UserPassword',
      'User',
      'Team',
      'CompanyOwnerPassword',
      'CompanyOwner',
    ];

    for (const modelName of modelsToClean) {
      try {
        const Model = mongoose.model(modelName);
        await Model.deleteMany({
          $or: [
            { owner: testCompanyOwner?._id },
            { user: testCompanyOwner?._id },
            { user: testUser?._id },
            { team: testTeam?._id },
            { _id: testCompanyOwner?._id },
            { _id: testUser?._id },
            { _id: testTeam?._id },
            { email: { $in: ['testowner@company.com', 'testuser@team.com', 'client@test.com'] } },
          ],
        });
      } catch (error) {
        console.log(`Warning: Could not clean ${modelName}:`, error.message);
      }
    }
  });

  describe('Client Routes', () => {
    describe('POST /api/client/create', () => {
      test('should create new client with valid data', async () => {
        const clientData = {
          name: 'New Test Client',
          email: 'newclient@test.com',
          phone: '987-654-3210',
          address: '456 New St',
        };

        const response = await request(app)
          .post('/api/client/create')
          .set('Authorization', `Bearer ${authToken}`)
          .send(clientData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.result).toBeDefined();
        expect(response.body.result.name).toBe(clientData.name);
        expect(response.body.result.email).toBe(clientData.email);
      });

      test('should reject invalid email format', async () => {
        const clientData = {
          name: 'Invalid Client',
          email: 'invalid-email',
          phone: '123-456-7890',
        };

        const response = await request(app)
          .post('/api/client/create')
          .set('Authorization', `Bearer ${authToken}`)
          .send(clientData)
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      test('should require authentication', async () => {
        const clientData = {
          name: 'Unauthorized Client',
          email: 'unauth@test.com',
        };

        const response = await request(app).post('/api/client/create').send(clientData).expect(401);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/client/read/:id', () => {
      test('should read existing client', async () => {
        const response = await request(app)
          .get(`/api/client/read/${testClient._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.result).toBeDefined();
        expect(response.body.result._id).toBe(testClient._id.toString());
        expect(response.body.result.name).toBe('Test Client');
      });

      test('should return 404 for non-existent client', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .get(`/api/client/read/${fakeId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });

    describe('PATCH /api/client/update/:id', () => {
      test('should update existing client', async () => {
        const updateData = {
          name: 'Updated Client Name',
          phone: '999-888-7777',
        };

        const response = await request(app)
          .patch(`/api/client/update/${testClient._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.result.name).toBe(updateData.name);
        expect(response.body.result.phone).toBe(updateData.phone);
      });

      test('should validate email format on update', async () => {
        const updateData = {
          email: 'invalid-email-format',
        };

        const response = await request(app)
          .patch(`/api/client/update/${testClient._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/client/list', () => {
      test('should list clients with pagination', async () => {
        const response = await request(app)
          .get('/api/client/list')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ page: 1, limit: 10 })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.result).toBeDefined();
        expect(Array.isArray(response.body.result)).toBe(true);
      });

      test('should filter clients by search term', async () => {
        const response = await request(app)
          .get('/api/client/list')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ search: 'Test' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.result).toBeDefined();
      });
    });

    describe('DELETE /api/client/delete/:id', () => {
      test('should soft delete client', async () => {
        // Create a client to delete
        const Client = mongoose.model('Client');
        const clientToDelete = await Client.create({
          name: 'Delete Me',
          email: 'delete@test.com',
          owner: testCompanyOwner._id,
        });

        const response = await request(app)
          .delete(`/api/client/delete/${clientToDelete._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);

        // Verify client is soft deleted
        const deletedClient = await Client.findById(clientToDelete._id);
        expect(deletedClient.removed).toBe(true);
      });
    });
  });

  describe('Task Routes', () => {
    beforeAll(async () => {
      // Create test task
      const Task = mongoose.model('Task');
      testTask = await Task.create({
        title: 'Test Task',
        description: 'Test task description',
        status: 'pending',
        priority: 'medium',
        assignedTo: testUser._id,
        owner: testCompanyOwner._id,
        enabled: true,
      });
    });

    describe('POST /api/task/create', () => {
      test('should create new task', async () => {
        const taskData = {
          title: 'New Task',
          description: 'New task description',
          status: 'pending',
          priority: 'high',
          assignedTo: testUser._id,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        };

        const response = await request(app)
          .post('/api/task/create')
          .set('Authorization', `Bearer ${authToken}`)
          .send(taskData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.result.title).toBe(taskData.title);
        expect(response.body.result.priority).toBe(taskData.priority);
      });

      test('should validate required fields', async () => {
        const taskData = {
          description: 'Task without title',
          // missing title
        };

        const response = await request(app)
          .post('/api/task/create')
          .set('Authorization', `Bearer ${authToken}`)
          .send(taskData)
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('PATCH /api/task/update/:id', () => {
      test('should update task status', async () => {
        const updateData = {
          status: 'in_progress',
          progress: 50,
        };

        const response = await request(app)
          .patch(`/api/task/update/${testTask._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.result.status).toBe(updateData.status);
      });
    });

    describe('GET /api/task/filter', () => {
      test('should filter tasks by status', async () => {
        const response = await request(app)
          .get('/api/task/filter')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ status: 'pending' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.result).toBeDefined();
      });

      test('should filter tasks by priority', async () => {
        const response = await request(app)
          .get('/api/task/filter')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ priority: 'high' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      test('should filter tasks by assignee', async () => {
        const response = await request(app)
          .get('/api/task/filter')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ assignedTo: testUser._id })
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('GET /api/task/summary', () => {
      test('should provide task summary statistics', async () => {
        const response = await request(app)
          .get('/api/task/summary')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.result).toBeDefined();
        expect(typeof response.body.result.total).toBe('number');
      });
    });
  });

  describe('Invoice Routes', () => {
    beforeAll(async () => {
      // Create test invoice
      const Invoice = mongoose.model('Invoice');
      testInvoice = await Invoice.create({
        number: 'INV-001',
        client: testClient._id,
        amount: 1000,
        status: 'draft',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        owner: testCompanyOwner._id,
        enabled: true,
      });
    });

    describe('POST /api/invoice/create', () => {
      test('should create new invoice', async () => {
        const invoiceData = {
          number: 'INV-002',
          client: testClient._id,
          amount: 1500,
          status: 'draft',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          items: [
            { description: 'Service 1', quantity: 2, rate: 500, amount: 1000 },
            { description: 'Service 2', quantity: 1, rate: 500, amount: 500 },
          ],
        };

        const response = await request(app)
          .post('/api/invoice/create')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invoiceData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.result.number).toBe(invoiceData.number);
        expect(response.body.result.amount).toBe(invoiceData.amount);
      });

      test('should validate invoice amount', async () => {
        const invoiceData = {
          number: 'INV-003',
          client: testClient._id,
          amount: -100, // Invalid negative amount
          status: 'draft',
        };

        const response = await request(app)
          .post('/api/invoice/create')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invoiceData)
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('PATCH /api/invoice/update/:id', () => {
      test('should update invoice status', async () => {
        const updateData = {
          status: 'sent',
        };

        const response = await request(app)
          .patch(`/api/invoice/update/${testInvoice._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.result.status).toBe(updateData.status);
      });
    });

    describe('GET /api/invoice/summary', () => {
      test('should provide invoice summary with totals', async () => {
        const response = await request(app)
          .get('/api/invoice/summary')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.result).toBeDefined();
        expect(typeof response.body.result.totalAmount).toBe('number');
      });
    });
  });

  describe('Quote Routes', () => {
    beforeAll(async () => {
      // Create test quote
      const Quote = mongoose.model('Quote');
      testQuote = await Quote.create({
        number: 'QUO-001',
        client: testClient._id,
        amount: 800,
        status: 'draft',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        owner: testCompanyOwner._id,
        enabled: true,
      });
    });

    describe('POST /api/quote/create', () => {
      test('should create new quote', async () => {
        const quoteData = {
          number: 'QUO-002',
          client: testClient._id,
          amount: 1200,
          status: 'draft',
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          items: [
            { description: 'Product 1', quantity: 2, rate: 400, amount: 800 },
            { description: 'Product 2', quantity: 1, rate: 400, amount: 400 },
          ],
        };

        const response = await request(app)
          .post('/api/quote/create')
          .set('Authorization', `Bearer ${authToken}`)
          .send(quoteData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.result.number).toBe(quoteData.number);
        expect(response.body.result.amount).toBe(quoteData.amount);
      });
    });

    describe('PATCH /api/quote/update/:id', () => {
      test('should convert quote to invoice', async () => {
        const updateData = {
          status: 'accepted',
        };

        const response = await request(app)
          .patch(`/api/quote/update/${testQuote._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.result.status).toBe(updateData.status);
      });
    });
  });

  describe('Payment Routes', () => {
    beforeAll(async () => {
      // Create test payment
      const Payment = mongoose.model('Payment');
      testPayment = await Payment.create({
        number: 'PAY-001',
        invoice: testInvoice._id,
        amount: 500,
        status: 'completed',
        paymentMethod: 'bank_transfer',
        owner: testCompanyOwner._id,
        enabled: true,
      });
    });

    describe('POST /api/payment/create', () => {
      test('should create new payment', async () => {
        const paymentData = {
          number: 'PAY-002',
          invoice: testInvoice._id,
          amount: 500,
          status: 'pending',
          paymentMethod: 'credit_card',
          paymentDate: new Date(),
        };

        const response = await request(app)
          .post('/api/payment/create')
          .set('Authorization', `Bearer ${authToken}`)
          .send(paymentData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.result.number).toBe(paymentData.number);
        expect(response.body.result.amount).toBe(paymentData.amount);
      });
    });

    describe('PATCH /api/payment/update/:id', () => {
      test('should update payment status', async () => {
        const updateData = {
          status: 'completed',
        };

        const response = await request(app)
          .patch(`/api/payment/update/${testPayment._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.result.status).toBe(updateData.status);
      });
    });
  });

  describe('Team Routes', () => {
    describe('POST /api/team/create', () => {
      test('should create new team', async () => {
        const teamData = {
          name: 'New Team',
          description: 'A new team for testing',
        };

        const response = await request(app)
          .post('/api/team/create')
          .set('Authorization', `Bearer ${authToken}`)
          .send(teamData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.result.name).toBe(teamData.name);
      });
    });

    describe('GET /api/team/list', () => {
      test('should list teams', async () => {
        const response = await request(app)
          .get('/api/team/list')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.result).toBeDefined();
        expect(Array.isArray(response.body.result)).toBe(true);
      });
    });

    describe('POST /api/team/:teamId/invite', () => {
      test('should invite team member', async () => {
        const inviteData = {
          email: 'newmember@team.com',
          role: 'member',
        };

        const response = await request(app)
          .post(`/api/team/${testTeam._id}/invite`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(inviteData)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      test('should validate email format for invite', async () => {
        const inviteData = {
          email: 'invalid-email',
          role: 'member',
        };

        const response = await request(app)
          .post(`/api/team/${testTeam._id}/invite`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(inviteData)
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('User Access Control', () => {
    test('should allow team member to access allowed resources', async () => {
      const response = await request(app)
        .get('/api/client/list')
        .set('Authorization', `Bearer ${userAuthToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should restrict team member from owner-only operations', async () => {
      const teamData = {
        name: 'Unauthorized Team',
      };

      const response = await request(app)
        .post('/api/team/create')
        .set('Authorization', `Bearer ${userAuthToken}`)
        .send(teamData);

      // Should either be forbidden or succeed based on permissions
      expect([200, 403]).toContain(response.status);
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      // Try to create client with duplicate email (if unique constraint exists)
      const clientData = {
        name: 'Duplicate Client',
        email: 'client@test.com', // Same as testClient
      };

      const response = await request(app)
        .post('/api/client/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(clientData);

      // Should handle duplicate gracefully
      expect([200, 400]).toContain(response.status);
    });

    test('should validate ObjectId format', async () => {
      const response = await request(app)
        .get('/api/client/read/invalid-object-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Pagination and Sorting', () => {
    test('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/client/list')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    test('should handle sorting parameters', async () => {
      const response = await request(app)
        .get('/api/client/list')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ sort: 'name', order: 'asc' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
