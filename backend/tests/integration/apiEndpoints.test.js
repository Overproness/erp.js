const request = require('supertest');
const { describe, it, beforeAll, beforeEach, expect } = require('@jest/globals');

describe('API Endpoints', () => {
  let app, testOwner, authToken;

  beforeAll(async () => {
    app = require('../../../src/app');
  });

  beforeEach(async () => {
    testOwner = await global.testUtils.createTestCompanyOwner();
    authToken = global.testUtils.createTestToken({ _id: testOwner._id, role: 'owner' });
  });

  describe('Authentication Endpoints', () => {
    describe('POST /api/auth/login', () => {
      it('should login with valid credentials', async () => {
        const loginData = {
          email: testOwner.email,
          password: testOwner.testPassword,
        };

        const response = await request(app).post('/api/auth/login').send(loginData).expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.token).toBeDefined();
        expect(response.body.user).toBeDefined();
        expect(response.body.user.email).toBe(testOwner.email);
      });

      it('should reject invalid credentials', async () => {
        const loginData = {
          email: testOwner.email,
          password: 'wrongpassword',
        };

        const response = await request(app).post('/api/auth/login').send(loginData).expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Invalid');
      });

      it('should reject non-existent user', async () => {
        const loginData = {
          email: 'nonexistent@example.com',
          password: 'password123',
        };

        const response = await request(app).post('/api/auth/login').send(loginData).expect(404);

        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/auth/register', () => {
      it('should register new user with valid data', async () => {
        const registerData = {
          name: 'New User',
          email: 'newuser@example.com',
          password: 'SecurePassword123!',
          confirmPassword: 'SecurePassword123!',
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(registerData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.user).toBeDefined();
        expect(response.body.user.email).toBe(registerData.email);
      });

      it('should reject duplicate email', async () => {
        const registerData = {
          name: 'Duplicate User',
          email: testOwner.email,
          password: 'SecurePassword123!',
          confirmPassword: 'SecurePassword123!',
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(registerData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('email');
      });

      it('should reject weak password', async () => {
        const registerData = {
          name: 'New User',
          email: 'newuser2@example.com',
          password: '123',
          confirmPassword: '123',
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(registerData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('password');
      });
    });

    describe('POST /api/auth/logout', () => {
      it('should logout authenticated user', async () => {
        const response = await request(app)
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('logged out');
      });
    });

    describe('GET /api/auth/verify', () => {
      it('should verify valid token', async () => {
        const response = await request(app)
          .get('/api/auth/verify')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.user).toBeDefined();
      });

      it('should reject invalid token', async () => {
        const response = await request(app)
          .get('/api/auth/verify')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Client Endpoints', () => {
    describe('GET /api/client/list', () => {
      it('should require authentication', async () => {
        const response = await request(app).get('/api/client/list').expect(401);

        expect(response.body.success).toBe(false);
      });

      it('should return paginated results', async () => {
        // Create test clients
        await global.testUtils.createTestClient(testOwner._id);
        await global.testUtils.createTestClient(testOwner._id);

        const response = await request(app)
          .get('/api/client/list?page=1&limit=1')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.pagination).toBeDefined();
        expect(response.body.pagination.page).toBe(1);
        expect(response.body.pagination.limit).toBe(1);
      });
    });

    describe('POST /api/client/create', () => {
      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/client/create')
          .set('Authorization', `Bearer ${authToken}`)
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('validation');
      });

      it('should sanitize input data', async () => {
        const maliciousData = {
          name: '<script>alert("xss")</script>Legit Company',
          email: 'test@company.com',
          customerType: 'company',
        };

        const response = await request(app)
          .post('/api/client/create')
          .set('Authorization', `Bearer ${authToken}`)
          .send(maliciousData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.result.name).not.toContain('<script>');
        expect(response.body.result.name).toContain('Legit Company');
      });
    });
  });

  describe('Invoice Endpoints', () => {
    let testClient;

    beforeEach(async () => {
      testClient = await global.testUtils.createTestClient(testOwner._id);
    });

    describe('POST /api/invoice/create', () => {
      it('should create invoice with valid data', async () => {
        const invoiceData = {
          client: testClient._id,
          items: [
            {
              itemName: 'Consulting Service',
              quantity: 1,
              price: 1000,
              total: 1000,
            },
          ],
          subTotal: 1000,
          total: 1000,
          currency: 'USD',
        };

        const response = await request(app)
          .post('/api/invoice/create')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invoiceData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.result.total).toBe(1000);
      });

      it('should validate invoice calculations', async () => {
        const invoiceData = {
          client: testClient._id,
          items: [
            {
              itemName: 'Service',
              quantity: 2,
              price: 500,
              total: 1000,
            },
          ],
          subTotal: 1000,
          taxRate: 10,
          taxTotal: 100,
          total: 1050, // Incorrect total
          currency: 'USD',
        };

        const response = await request(app)
          .post('/api/invoice/create')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invoiceData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('calculation');
      });
    });

    describe('GET /api/invoice/export', () => {
      it('should export invoices in specified format', async () => {
        await global.testUtils.createTestInvoice(testOwner._id, testClient._id);

        const response = await request(app)
          .get('/api/invoice/export?format=csv')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.headers['content-type']).toContain('text/csv');
      });

      it('should export invoices as PDF', async () => {
        await global.testUtils.createTestInvoice(testOwner._id, testClient._id);

        const response = await request(app)
          .get('/api/invoice/export?format=pdf')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.headers['content-type']).toContain('application/pdf');
      });
    });
  });

  describe('Analytics Endpoints', () => {
    describe('GET /api/analytics/dashboard', () => {
      it('should return dashboard statistics', async () => {
        // Create some test data
        const client = await global.testUtils.createTestClient(testOwner._id);
        await global.testUtils.createTestInvoice(testOwner._id, client._id);

        const response = await request(app)
          .get('/api/analytics/dashboard')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.result).toBeDefined();
        expect(response.body.result.totalClients).toBeDefined();
        expect(response.body.result.totalInvoices).toBeDefined();
        expect(response.body.result.totalRevenue).toBeDefined();
      });

      it('should filter analytics by date range', async () => {
        const startDate = new Date('2024-01-01').toISOString();
        const endDate = new Date('2024-12-31').toISOString();

        const response = await request(app)
          .get(`/api/analytics/dashboard?startDate=${startDate}&endDate=${endDate}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('GET /api/analytics/revenue', () => {
      it('should return revenue analytics', async () => {
        const response = await request(app)
          .get('/api/analytics/revenue?period=monthly&year=2024')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.result)).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/non-existent-endpoint')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/client/create')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle database connection errors gracefully', async () => {
      // Temporarily close database connection
      await mongoose.disconnect();

      const response = await request(app)
        .get('/api/client/list')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('database');

      // Reconnect for other tests
      const mongoUri = global.__MONGO_URI__;
      await mongoose.connect(mongoUri);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on API endpoints', async () => {
      // Make multiple rapid requests
      const requests = Array(10)
        .fill(null)
        .map(() =>
          request(app).get('/api/client/list').set('Authorization', `Bearer ${authToken}`)
        );

      const responses = await Promise.all(requests);

      // At least one should be rate limited (429 status)
      const rateLimitedResponses = responses.filter((res) => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
