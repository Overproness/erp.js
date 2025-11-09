const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { describe, it, beforeAll, beforeEach, expect, jest } = require('@jest/globals');

// Mock the app setup
jest.mock('../../../src/middlewares/permission', () => ({
  hasPermission: () => (req, res, next) => next(),
}));

describe('Client Controller', () => {
  let app, testOwner, testClient, authToken;

  beforeAll(async () => {
    // Setup express app with basic middleware
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Mock authentication middleware
    app.use((req, res, next) => {
      req.companyOwner = testOwner;
      next();
    });
  });

  beforeEach(async () => {
    testOwner = await global.testUtils.createTestCompanyOwner();
    authToken = global.testUtils.createTestToken({ _id: testOwner._id, role: 'owner' });

    // Load the client routes
    const clientRoutes = require('../../../src/routes/appRoutes/appApi');
    app.use('/api', clientRoutes);
  });

  describe('GET /api/client/list', () => {
    beforeEach(async () => {
      // Create test clients
      testClient = await global.testUtils.createTestClient(testOwner._id);
    });

    it('should return list of clients', async () => {
      const response = await request(app)
        .get('/api/client/list')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.result)).toBe(true);
      expect(response.body.result.length).toBeGreaterThan(0);
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/client/list?page=1&items=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
    });
  });

  describe('POST /api/client/create', () => {
    it('should create a new client with valid data', async () => {
      const clientData = {
        name: 'Test Company',
        email: 'test@company.com',
        phone: '+1234567890',
        customerType: 'company',
      };

      const response = await request(app)
        .post('/api/client/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(clientData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.name).toBe(clientData.name);
      expect(response.body.result.email).toBe(clientData.email);
    });

    it('should reject invalid email format', async () => {
      const clientData = {
        name: 'Test Company',
        email: 'invalid-email',
        customerType: 'company',
      };

      const response = await request(app)
        .post('/api/client/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(clientData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should sanitize HTML content', async () => {
      const clientData = {
        name: 'Test <script>alert("xss")</script> Company',
        email: 'test@company.com',
        customerType: 'company',
      };

      const response = await request(app)
        .post('/api/client/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(clientData)
        .expect(200);

      expect(response.body.result.name).not.toContain('<script>');
      expect(response.body.result.name).toContain('Test');
    });
  });

  describe('GET /api/client/read/:id', () => {
    beforeEach(async () => {
      testClient = await global.testUtils.createTestClient(testOwner._id);
    });

    it('should return client details', async () => {
      const response = await request(app)
        .get(`/api/client/read/${testClient._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result._id).toBe(testClient._id.toString());
      expect(response.body.result.name).toBe(testClient.name);
    });

    it('should return 404 for non-existent client', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/client/read/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/client/update/:id', () => {
    beforeEach(async () => {
      testClient = await global.testUtils.createTestClient(testOwner._id);
    });

    it('should update client with valid data', async () => {
      const updateData = {
        name: 'Updated Company Name',
        phone: '+9876543210',
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

    it('should reject invalid update data', async () => {
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

  describe('DELETE /api/client/delete/:id', () => {
    beforeEach(async () => {
      testClient = await global.testUtils.createTestClient(testOwner._id);
    });

    it('should delete client', async () => {
      const response = await request(app)
        .delete(`/api/client/delete/${testClient._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify client is deleted
      const Client = mongoose.model('Client');
      const deletedClient = await Client.findById(testClient._id);
      expect(deletedClient).toBeNull();
    });
  });

  describe('GET /api/client/summary', () => {
    beforeEach(async () => {
      // Create multiple clients for summary testing
      await global.testUtils.createTestClient(testOwner._id);
      await global.testUtils.createTestClient(testOwner._id);
    });

    it('should return client summary statistics', async () => {
      const response = await request(app)
        .get('/api/client/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result).toBeDefined();
      expect(typeof response.body.result.total).toBe('number');
    });
  });
});
