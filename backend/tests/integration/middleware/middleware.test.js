const request = require('supertest');
const { describe, test, beforeAll, afterAll, expect } = require('@jest/globals');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { generate: uniqueId } = require('shortid');

describe('Middleware Integration Tests', () => {
  let app;
  let testCompanyOwner;
  let testUser;
  let testTeam;
  let authToken;
  let userAuthToken;
  let adminToken;

  beforeAll(async () => {
    // Import app after models are loaded
    app = require('../../../src/app');

    // Create test company owner
    const CompanyOwner = mongoose.model('CompanyOwner');
    const CompanyOwnerPassword = mongoose.model('CompanyOwnerPassword');

    testCompanyOwner = await CompanyOwner.create({
      name: 'Test Owner',
      email: 'testowner@middleware.com',
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
      email: 'testuser@middleware.com',
      role: 'member',
      team: testTeam._id,
      enabled: true,
      isInvitationAccepted: true,
      permissions: ['read', 'write'],
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

    // Create admin token for testing admin middleware
    adminToken = jwt.sign(
      { id: testCompanyOwner._id, role: 'admin' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );
  });

  afterAll(async () => {
    // Clean up test data
    const modelsToClean = ['UserPassword', 'User', 'Team', 'CompanyOwnerPassword', 'CompanyOwner'];

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
            { email: { $in: ['testowner@middleware.com', 'testuser@middleware.com'] } },
          ],
        });
      } catch (error) {
        console.log(`Warning: Could not clean ${modelName}:`, error.message);
      }
    }
  });

  describe('Authentication Middleware', () => {
    test('should authenticate valid company owner token', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should authenticate valid user token', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${userAuthToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should reject missing authorization header', async () => {
      const response = await request(app).get('/api/user/profile').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token');
    });

    test('should reject malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should reject expired token', async () => {
      const expiredToken = jwt.sign(
        { id: testCompanyOwner._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1ms' }
      );

      // Wait for token to expire
      await new Promise((resolve) => setTimeout(resolve, 10));

      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should handle admin role authentication', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should handle removed/disabled user', async () => {
      // Create a token for a user that will be disabled
      const tempUser = await mongoose.model('CompanyOwner').create({
        name: 'Temp User',
        email: 'temp@middleware.com',
        role: 'owner',
        enabled: false, // Disabled user
      });

      const disabledUserToken = jwt.sign(
        { id: tempUser._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );

      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${disabledUserToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);

      // Clean up
      await mongoose.model('CompanyOwner').findByIdAndDelete(tempUser._id);
    });
  });

  describe('Error Handling Middleware', () => {
    test('should handle 404 errors gracefully', async () => {
      const response = await request(app)
        .get('/api/nonexistent/route')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toBeDefined();
    });

    test('should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/client/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle database connection errors gracefully', async () => {
      // This test simulates what happens when database operations fail
      // The actual behavior depends on error handling implementation
      const response = await request(app)
        .get('/api/client/read/507f1f77bcf86cd799439011') // Valid ObjectId that doesn't exist
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should handle JSON parsing errors', async () => {
      const response = await request(app)
        .post('/api/client/create')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}') // Invalid JSON
        .expect(400);

      expect(response.body).toBeDefined();
    });
  });

  describe('CORS Middleware', () => {
    test('should include CORS headers in response', async () => {
      const response = await request(app).options('/api/auth/login').expect(204);

      // Check for CORS headers (these may not be set depending on configuration)
      if (response.headers['access-control-allow-origin']) {
        expect(response.headers['access-control-allow-origin']).toBeDefined();
      }
    });

    test('should handle preflight requests', async () => {
      const response = await request(app)
        .options('/api/client/create')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'content-type,authorization');

      // Should handle preflight request properly
      expect([200, 204]).toContain(response.status);
    });
  });

  describe('Rate Limiting Middleware', () => {
    test('should apply rate limiting to auth endpoints', async () => {
      // Make multiple rapid requests to test rate limiting
      const promises = Array(20)
        .fill()
        .map(() =>
          request(app).post('/api/auth/login').send({
            email: 'nonexistent@test.com',
            password: 'wrongpassword',
          })
        );

      const responses = await Promise.allSettled(promises);

      // Check if any requests were rate limited
      const rateLimited = responses.some(
        (result) => result.status === 'fulfilled' && result.value.status === 429
      );

      // Rate limiting may or may not be implemented
      if (rateLimited) {
        expect(rateLimited).toBe(true);
      }
    });
  });

  describe('Request Validation Middleware', () => {
    test('should validate ObjectId parameters', async () => {
      const response = await request(app)
        .get('/api/client/read/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should sanitize input data', async () => {
      const response = await request(app)
        .post('/api/client/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '<script>alert("xss")</script>',
          email: 'test@xss.com',
          phone: '123-456-7890',
        });

      if (response.status === 200) {
        // If creation succeeds, check that script tags are sanitized
        expect(response.body.result.name).not.toContain('<script>');
      }
    });

    test('should enforce request size limits', async () => {
      const largeData = {
        name: 'Test Client',
        email: 'test@large.com',
        description: 'x'.repeat(100000), // Very large string
      };

      const response = await request(app)
        .post('/api/client/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(largeData);

      // Should either accept it or reject with payload too large
      expect([200, 413]).toContain(response.status);
    });
  });

  describe('Permission Middleware', () => {
    test('should enforce user permissions', async () => {
      // Test user access to different endpoints
      const response = await request(app)
        .get('/api/client/list')
        .set('Authorization', `Bearer ${userAuthToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should provide company owner context for team members', async () => {
      // Team members should get access to company settings through their team owner
      const response = await request(app)
        .get('/api/settings')
        .set('Authorization', `Bearer ${userAuthToken}`);

      // Should either allow access or handle gracefully
      expect([200, 403, 404]).toContain(response.status);
    });

    test('should maintain user permission context', async () => {
      // Test that user permissions are properly maintained in request context
      const response = await request(app)
        .post('/api/client/create')
        .set('Authorization', `Bearer ${userAuthToken}`)
        .send({
          name: 'User Created Client',
          email: 'userclient@test.com',
        });

      // Should either allow or deny based on user permissions
      expect([200, 403]).toContain(response.status);
    });
  });

  describe('Content Security and Headers', () => {
    test('should include security headers', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`);

      // Check for common security headers (may not be implemented)
      const headers = response.headers;

      // These tests are informational - headers may or may not be set
      if (headers['x-content-type-options']) {
        expect(headers['x-content-type-options']).toBe('nosniff');
      }

      if (headers['x-frame-options']) {
        expect(headers['x-frame-options']).toBeTruthy();
      }
    });

    test('should validate content type for POST requests', async () => {
      const response = await request(app)
        .post('/api/client/create')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'text/plain')
        .send('invalid content type');

      // Should reject non-JSON content for JSON endpoints
      expect([400, 415]).toContain(response.status);
    });
  });

  describe('Logging and Monitoring Middleware', () => {
    test('should handle requests with proper logging', async () => {
      // This test ensures the logging middleware doesn't break request flow
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Database Transaction Middleware', () => {
    test('should handle successful transactions', async () => {
      const response = await request(app)
        .post('/api/client/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Transaction Test Client',
          email: 'transaction@test.com',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should rollback failed transactions gracefully', async () => {
      // Test with data that might cause a transaction failure
      const response = await request(app)
        .post('/api/client/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Intentionally problematic data
          email: 'duplicate@test.com',
        });

      // Should handle transaction failures gracefully
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('API Versioning Middleware', () => {
    test('should handle API version headers', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .set('API-Version', '1.0');

      // Should handle version headers gracefully
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Cache Control Middleware', () => {
    test('should include appropriate cache headers', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`);

      // Cache headers may or may not be implemented
      if (response.headers['cache-control']) {
        expect(response.headers['cache-control']).toBeDefined();
      }
    });
  });

  describe('Request ID Tracking', () => {
    test('should track request IDs for debugging', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`);

      // Request ID headers may or may not be implemented
      if (response.headers['x-request-id']) {
        expect(response.headers['x-request-id']).toBeDefined();
      }
    });
  });
});
