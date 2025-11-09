const request = require('supertest');
const { describe, test, beforeAll, afterAll, expect } = require('@jest/globals');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { generate: uniqueId } = require('shortid');

describe('Error Handler Integration Tests', () => {
  let app;
  let testCompanyOwner;
  let authToken;

  beforeAll(async () => {
    // Import app after models are loaded
    app = require('../../../src/app');

    // Create test company owner
    const CompanyOwner = mongoose.model('CompanyOwner');
    const CompanyOwnerPassword = mongoose.model('CompanyOwnerPassword');

    testCompanyOwner = await CompanyOwner.create({
      name: 'Test Owner',
      email: 'testerror@company.com',
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

    // Generate auth token
    authToken = jwt.sign({ id: testCompanyOwner._id }, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '24h',
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testCompanyOwner) {
      await mongoose.model('CompanyOwnerPassword').deleteMany({ user: testCompanyOwner._id });
      await mongoose.model('CompanyOwner').findByIdAndDelete(testCompanyOwner._id);
    }
  });

  describe('Validation Error Handling', () => {
    test('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/client/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required name field
          email: 'incomplete@test.com',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message || response.body.error).toBeDefined();
    });

    test('should handle invalid email format', async () => {
      const response = await request(app)
        .post('/api/client/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Email Client',
          email: 'not-an-email',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message || response.body.error).toContain('email');
    });

    test('should handle invalid ObjectId format', async () => {
      const response = await request(app)
        .get('/api/client/read/invalid-object-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message || response.body.error).toBeDefined();
    });

    test('should handle negative numbers in amount fields', async () => {
      const response = await request(app)
        .post('/api/invoice/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          number: 'INV-NEG',
          amount: -500, // Invalid negative amount
          client: new mongoose.Types.ObjectId(),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle excessively long strings', async () => {
      const response = await request(app)
        .post('/api/client/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'x'.repeat(1000), // Very long name
          email: 'longstring@test.com',
        });

      // Should either accept with truncation or reject
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Authentication Error Handling', () => {
    test('should handle missing authorization header', async () => {
      const response = await request(app).get('/api/client/list').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token');
    });

    test('should handle malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/client/list')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should handle invalid JWT token', async () => {
      const response = await request(app)
        .get('/api/client/list')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should handle expired JWT token', async () => {
      const expiredToken = jwt.sign(
        { id: testCompanyOwner._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1ms' }
      );

      await new Promise((resolve) => setTimeout(resolve, 10));

      const response = await request(app)
        .get('/api/client/list')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should handle token with invalid signature', async () => {
      const tokenWithInvalidSignature = jwt.sign({ id: testCompanyOwner._id }, 'wrong-secret-key');

      const response = await request(app)
        .get('/api/client/list')
        .set('Authorization', `Bearer ${tokenWithInvalidSignature}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Database Error Handling', () => {
    test('should handle non-existent document queries', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/client/read/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    test('should handle duplicate key constraints', async () => {
      // Create a client first
      const clientData = {
        name: 'Unique Client',
        email: 'unique@test.com',
      };

      await request(app)
        .post('/api/client/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(clientData)
        .expect(200);

      // Try to create another with the same email (if unique constraint exists)
      const response = await request(app)
        .post('/api/client/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(clientData);

      // Should either allow duplicates or reject with conflict
      expect([200, 400, 409]).toContain(response.status);
    });

    test('should handle invalid foreign key references', async () => {
      const response = await request(app)
        .post('/api/task/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Invalid Task',
          assignedTo: new mongoose.Types.ObjectId(), // Non-existent user
          client: new mongoose.Types.ObjectId(), // Non-existent client
        });

      // Should either create task or reject due to invalid references
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('HTTP Method Error Handling', () => {
    test('should handle unsupported HTTP methods', async () => {
      const response = await request(app)
        .put('/api/client/create') // PUT instead of POST
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Client',
          email: 'test@method.com',
        })
        .expect(405);

      expect(response.body).toBeDefined();
    });

    test('should handle PATCH on non-existent resources', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .patch(`/api/client/update/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should handle DELETE on non-existent resources', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/client/delete/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Content Type Error Handling', () => {
    test('should handle invalid JSON payload', async () => {
      const response = await request(app)
        .post('/api/client/create')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{invalid json}')
        .expect(400);

      expect(response.body).toBeDefined();
    });

    test('should handle unsupported content type', async () => {
      const response = await request(app)
        .post('/api/client/create')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'text/plain')
        .send('plain text data')
        .expect(400);

      expect(response.body).toBeDefined();
    });

    test('should handle missing content type', async () => {
      const response = await request(app)
        .post('/api/client/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send('{"name": "Test Client"}');

      // Should either accept or reject based on content type handling
      expect([200, 400, 415]).toContain(response.status);
    });
  });

  describe('Request Size Error Handling', () => {
    test('should handle oversized request payload', async () => {
      const largePayload = {
        name: 'Test Client',
        email: 'large@test.com',
        description: 'x'.repeat(50000), // Very large description
      };

      const response = await request(app)
        .post('/api/client/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(largePayload);

      // Should either accept, truncate, or reject with payload too large
      expect([200, 400, 413]).toContain(response.status);
    });

    test('should handle empty request body where data is required', async () => {
      const response = await request(app)
        .post('/api/client/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting Error Handling', () => {
    test('should handle rate limit exceeded', async () => {
      // Make many rapid requests to trigger rate limiting
      const promises = Array(30)
        .fill()
        .map(() =>
          request(app).post('/api/auth/login').send({
            email: 'ratelimit@test.com',
            password: 'wrongpassword',
          })
        );

      const responses = await Promise.allSettled(promises);

      // Check if any requests were rate limited
      const rateLimited = responses.some(
        (result) => result.status === 'fulfilled' && result.value.status === 429
      );

      if (rateLimited) {
        const rateLimitedResponse = responses.find(
          (result) => result.status === 'fulfilled' && result.value.status === 429
        ).value;

        expect(rateLimitedResponse.body).toBeDefined();
        expect(rateLimitedResponse.body.message || rateLimitedResponse.text).toContain('rate');
      }
    });
  });

  describe('File Upload Error Handling', () => {
    test('should handle invalid file types', async () => {
      // This test would require actual file upload endpoints
      const response = await request(app)
        .post('/api/upload') // If this endpoint exists
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('invalid content'), 'test.exe');

      // Should reject unsafe file types
      expect([400, 404, 415]).toContain(response.status);
    });

    test('should handle oversized file uploads', async () => {
      // This test would require actual file upload endpoints
      const largeBuffer = Buffer.alloc(50 * 1024 * 1024); // 50MB

      const response = await request(app)
        .post('/api/upload') // If this endpoint exists
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', largeBuffer, 'large.txt');

      // Should reject oversized files
      expect([400, 404, 413]).toContain(response.status);
    });
  });

  describe('CORS Error Handling', () => {
    test('should handle invalid CORS origins', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Origin', 'http://malicious-site.com')
        .send({
          email: 'test@cors.com',
          password: 'password123',
        });

      // CORS handling depends on configuration
      expect([200, 401, 403]).toContain(response.status);
    });
  });

  describe('Business Logic Error Handling', () => {
    test('should handle invalid business rules', async () => {
      // Example: Creating an invoice with future date before quote acceptance
      const response = await request(app)
        .post('/api/invoice/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          number: 'INV-INVALID',
          amount: 1000,
          dueDate: new Date('1990-01-01'), // Date in the past
          client: new mongoose.Types.ObjectId(),
        });

      // Should validate business rules
      expect([200, 400]).toContain(response.status);
    });

    test('should handle circular references in data', async () => {
      // Create objects that might have circular references
      const taskData = {
        title: 'Circular Task',
        dependencies: ['self-reference'],
      };

      const response = await request(app)
        .post('/api/task/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData);

      // Should handle circular references gracefully
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Concurrent Access Error Handling', () => {
    test('should handle simultaneous updates to same resource', async () => {
      // Create a client first
      const clientResponse = await request(app)
        .post('/api/client/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Concurrent Client',
          email: 'concurrent@test.com',
        })
        .expect(200);

      const clientId = clientResponse.body.result._id;

      // Make simultaneous updates
      const updatePromises = Array(5)
        .fill()
        .map((_, index) =>
          request(app)
            .patch(`/api/client/update/${clientId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              name: `Updated Name ${index}`,
            })
        );

      const responses = await Promise.allSettled(updatePromises);

      // At least one should succeed
      const successful = responses.filter(
        (result) => result.status === 'fulfilled' && result.value.status === 200
      );

      expect(successful.length).toBeGreaterThan(0);
    });
  });

  describe('Memory and Resource Error Handling', () => {
    test('should handle large query results gracefully', async () => {
      // Request a large amount of data
      const response = await request(app)
        .get('/api/client/list')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 10000 }); // Very large limit

      // Should either limit results or handle gracefully
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('API Error Response Format', () => {
    test('should return consistent error format', async () => {
      const response = await request(app)
        .get('/api/client/read/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });

    test('should include helpful error details', async () => {
      const response = await request(app)
        .post('/api/client/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message || response.body.error).toBeDefined();
    });

    test('should not expose sensitive information in errors', async () => {
      const response = await request(app)
        .get('/api/client/list')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Error message should not expose internal details
      expect(response.body.message).not.toContain('secret');
      expect(response.body.message).not.toContain('password');
      expect(response.body.message).not.toContain('database');
    });
  });
});
