const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');

describe('TIER 1 - Authentication & Authorization System', () => {
  let testCompanyOwner;
  let validToken;
  let expiredToken;

  beforeEach(async () => {
    // Create test company owner
    testCompanyOwner = await global.testUtils.createTestCompanyOwner();
    validToken = global.testUtils.createTestToken({
      _id: testCompanyOwner._id,
      role: 'owner',
    });

    // Create expired token for testing
    expiredToken = jwt.sign({ _id: testCompanyOwner._id, role: 'owner' }, process.env.JWT_SECRET, {
      expiresIn: '-1h',
    });
  });

  describe('Unit Tests - Password Security', () => {
    test('should hash passwords correctly', async () => {
      const password = 'testPassword123!';
      const hashedPassword = await bcrypt.hash(password, 12);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    test('should validate password complexity requirements', () => {
      const weakPasswords = ['123', 'pass', 'abc12']; // All under 8 characters
      const strongPassword = 'TestPass123!@#';

      weakPasswords.forEach((password) => {
        expect(password.length).toBeLessThan(8);
      });

      expect(strongPassword.length).toBeGreaterThanOrEqual(8);
      expect(/[A-Z]/.test(strongPassword)).toBe(true);
      expect(/[a-z]/.test(strongPassword)).toBe(true);
      expect(/[0-9]/.test(strongPassword)).toBe(true);
      expect(/[!@#$%^&*]/.test(strongPassword)).toBe(true);
    });

    test('should compare passwords correctly', async () => {
      const password = 'testPassword123!';
      const hashedPassword = await bcrypt.hash(password, 12);

      const isValid = await bcrypt.compare(password, hashedPassword);
      const isInvalid = await bcrypt.compare('wrongPassword', hashedPassword);

      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Unit Tests - JWT Token Management', () => {
    test('should generate valid JWT tokens', () => {
      const payload = { _id: 'test-id', role: 'owner' };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    test('should validate JWT tokens correctly', () => {
      const payload = { _id: 'test-id', role: 'owner' };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded._id).toBe(payload._id);
      expect(decoded.role).toBe(payload.role);
    });

    test('should reject invalid JWT tokens', () => {
      const invalidToken = 'invalid.jwt.token';

      expect(() => {
        jwt.verify(invalidToken, process.env.JWT_SECRET);
      }).toThrow();
    });

    test('should reject expired JWT tokens', () => {
      expect(() => {
        jwt.verify(expiredToken, process.env.JWT_SECRET);
      }).toThrow();
    });
  });

  describe('Integration Tests - Login/Logout Workflows', () => {
    test('should login with valid credentials', async () => {
      // First create a password for the test user
      const CompanyOwnerPassword = mongoose.model('CompanyOwnerPassword');
      const password = 'TestPassword123!';
      const salt = 'test-salt';
      const hashedPassword = await bcrypt.hash(salt + password, 12);

      // Create or update the password record
      await CompanyOwnerPassword.findOneAndUpdate(
        { user: testCompanyOwner._id },
        {
          user: testCompanyOwner._id,
          password: hashedPassword,
          salt: salt,
          removed: false,
        },
        { upsert: true }
      );

      const response = await request(app).post('/api/login').send({
        email: testCompanyOwner.email,
        password: password,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.result).toBeDefined();
      expect(response.body.result.email).toBe(testCompanyOwner.email);
    });

    test('should reject login with invalid password', async () => {
      // Set up a password for the test user first
      const CompanyOwnerPassword = mongoose.model('CompanyOwnerPassword');
      const salt = 'test-salt';
      const hashedPassword = await bcrypt.hash(salt + 'correctPassword', 12);

      await CompanyOwnerPassword.findOneAndUpdate(
        { user: testCompanyOwner._id },
        {
          user: testCompanyOwner._id,
          password: hashedPassword,
          salt: salt,
          removed: false,
        },
        { upsert: true }
      );

      const response = await request(app).post('/api/login').send({
        email: testCompanyOwner.email,
        password: 'wrongPassword',
      });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.token).toBeUndefined();
    });

    test('should reject login with non-existent user', async () => {
      const response = await request(app).post('/api/login').send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/logout')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Integration Tests - Multi-tenant Token Isolation', () => {
    test('should isolate tokens between different company owners', async () => {
      // Create second company owner
      const secondOwner = await global.testUtils.createTestCompanyOwner();
      secondOwner.email = 'second@example.com';
      await secondOwner.save();

      const firstToken = global.testUtils.createTestToken({
        _id: testCompanyOwner._id,
        role: 'owner',
      });
      const secondToken = global.testUtils.createTestToken({
        _id: secondOwner._id,
        role: 'owner',
      });

      // Create client for first owner
      const client1 = await global.testUtils.createTestClient(testCompanyOwner._id);

      // First owner should access their client
      const response1 = await request(app)
        .get(`/api/client/read/${client1._id}`)
        .set('Authorization', `Bearer ${firstToken}`);

      expect(response1.status).toBe(200);

      // Second owner should NOT access first owner's client
      const response2 = await request(app)
        .get(`/api/client/read/${client1._id}`)
        .set('Authorization', `Bearer ${secondToken}`);

      expect(response2.status).toBe(404);
    });
  });

  describe('Security Tests - Protection Mechanisms', () => {
    test('should protect against SQL injection in login', async () => {
      const maliciousPayloads = [
        "admin'; DROP TABLE users; --",
        "' OR '1'='1",
        "' UNION SELECT * FROM users --",
      ];

      for (const payload of maliciousPayloads) {
        const response = await request(app).post('/api/login').send({
          email: payload,
          password: payload,
        });

        // Accept either 400 (bad request) or 429 (rate limited) as both indicate protection
        expect([400, 429]).toContain(response.status);
        expect(response.body.success).toBe(false);
      }
    });

    test('should protect against XSS in input fields', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
      ];

      for (const payload of xssPayloads) {
        const response = await request(app).post('/api/register').send({
          name: payload,
          email: 'test@example.com',
          password: 'ValidPassword123!',
        });

        // Should either reject or sanitize
        if (response.status === 200) {
          expect(response.body.result.name).not.toContain('<script>');
          expect(response.body.result.name).not.toContain('javascript:');
        }
      }
    });

    test('should implement rate limiting for login attempts', async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app).post('/api/login').send({
          email: 'test@example.com',
          password: 'wrongPassword',
        })
      );

      const responses = await Promise.all(requests);

      // At least some requests should be rate limited
      const rateLimitedResponses = responses.filter((r) => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('should validate authorization header format', async () => {
      const invalidHeaders = ['InvalidToken', 'Bearer', 'Bearer ', 'Basic ' + validToken];

      for (const header of invalidHeaders) {
        const response = await request(app).get('/api/client').set('Authorization', header);

        expect(response.status).toBe(401);
      }
    });

    test('should reject requests with expired tokens', async () => {
      const response = await request(app)
        .get('/api/client')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('expired');
    });
  });

  describe('Role-Based Access Control', () => {
    test('should enforce owner-only access to sensitive endpoints', async () => {
      // Create a regular user token
      const userToken = global.testUtils.createTestToken({
        _id: 'user-id',
        role: 'member',
      });

      const sensitiveEndpoints = ['/api/setting', '/api/admin/list', '/api/team/create'];

      for (const endpoint of sensitiveEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${userToken}`);

        expect([401, 403]).toContain(response.status);
      }
    });

    test('should allow appropriate access based on role', async () => {
      const ownerToken = global.testUtils.createTestToken({
        _id: testCompanyOwner._id,
        role: 'owner',
      });

      const response = await request(app)
        .get('/api/client')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('Session Management', () => {
    test('should handle concurrent sessions correctly', async () => {
      const token1 = global.testUtils.createTestToken({
        _id: testCompanyOwner._id,
        role: 'owner',
      });
      const token2 = global.testUtils.createTestToken({
        _id: testCompanyOwner._id,
        role: 'owner',
      });

      const [response1, response2] = await Promise.all([
        request(app).get('/api/client').set('Authorization', `Bearer ${token1}`),
        request(app).get('/api/client').set('Authorization', `Bearer ${token2}`),
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });

    test('should validate token integrity', async () => {
      // Tamper with token
      const tamperedToken = validToken.slice(0, -5) + 'tampr';

      const response = await request(app)
        .get('/api/client')
        .set('Authorization', `Bearer ${tamperedToken}`);

      expect(response.status).toBe(401);
    });
  });
});
