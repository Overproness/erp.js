const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { describe, it, beforeAll, beforeEach, expect, jest } = require('@jest/globals');

describe('Invoice Controller', () => {
  let app, testOwner, testClient, testInvoice, authToken;

  beforeAll(async () => {
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
    testClient = await global.testUtils.createTestClient(testOwner._id);
    authToken = global.testUtils.createTestToken({ _id: testOwner._id, role: 'owner' });

    const invoiceRoutes = require('../../../src/routes/appRoutes/appApi');
    app.use('/api', invoiceRoutes);
  });

  describe('POST /api/invoice/create', () => {
    it('should create an invoice with valid data', async () => {
      const invoiceData = {
        client: testClient._id,
        date: new Date().toISOString(),
        expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          {
            itemName: 'Web Development',
            quantity: 1,
            price: 1000,
            total: 1000,
          },
        ],
        subTotal: 1000,
        taxRate: 10,
        taxTotal: 100,
        total: 1100,
        currency: 'USD',
      };

      const response = await request(app)
        .post('/api/invoice/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invoiceData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.client).toBe(testClient._id.toString());
      expect(response.body.result.total).toBe(1100);
      expect(response.body.result.currency).toBe('USD');
    });

    it('should calculate totals correctly', async () => {
      const invoiceData = {
        client: testClient._id,
        items: [
          {
            itemName: 'Service 1',
            quantity: 2,
            price: 100,
            total: 200,
          },
          {
            itemName: 'Service 2',
            quantity: 1,
            price: 300,
            total: 300,
          },
        ],
        subTotal: 500,
        taxRate: 20,
        taxTotal: 100,
        total: 600,
        currency: 'USD',
      };

      const response = await request(app)
        .post('/api/invoice/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invoiceData)
        .expect(200);

      expect(response.body.result.subTotal).toBe(500);
      expect(response.body.result.taxTotal).toBe(100);
      expect(response.body.result.total).toBe(600);
    });

    it('should reject invoice without client', async () => {
      const invoiceData = {
        items: [
          {
            itemName: 'Service',
            quantity: 1,
            price: 100,
            total: 100,
          },
        ],
        total: 100,
      };

      const response = await request(app)
        .post('/api/invoice/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invoiceData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/invoice/list', () => {
    beforeEach(async () => {
      testInvoice = await global.testUtils.createTestInvoice(testOwner._id, testClient._id);
    });

    it('should return list of invoices', async () => {
      const response = await request(app)
        .get('/api/invoice/list')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.result)).toBe(true);
      expect(response.body.result.length).toBeGreaterThan(0);
    });

    it('should filter invoices by status', async () => {
      const response = await request(app)
        .get('/api/invoice/list?paymentStatus=unpaid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.result.forEach((invoice) => {
        expect(invoice.paymentStatus).toBe('unpaid');
      });
    });
  });

  describe('PATCH /api/invoice/update/:id', () => {
    beforeEach(async () => {
      testInvoice = await global.testUtils.createTestInvoice(testOwner._id, testClient._id);
    });

    it('should update invoice payment status', async () => {
      const updateData = {
        paymentStatus: 'paid',
      };

      const response = await request(app)
        .patch(`/api/invoice/update/${testInvoice._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.paymentStatus).toBe('paid');
    });

    it('should update invoice items', async () => {
      const updateData = {
        items: [
          {
            itemName: 'Updated Service',
            quantity: 2,
            price: 200,
            total: 400,
          },
        ],
        subTotal: 400,
        total: 400,
      };

      const response = await request(app)
        .patch(`/api/invoice/update/${testInvoice._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.items[0].itemName).toBe('Updated Service');
      expect(response.body.result.total).toBe(400);
    });
  });

  describe('GET /api/invoice/read/:id', () => {
    beforeEach(async () => {
      testInvoice = await global.testUtils.createTestInvoice(testOwner._id, testClient._id);
    });

    it('should return invoice details', async () => {
      const response = await request(app)
        .get(`/api/invoice/read/${testInvoice._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result._id).toBe(testInvoice._id.toString());
      expect(response.body.result.client).toBeDefined();
    });

    it('should return 404 for non-existent invoice', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/invoice/read/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/invoice/delete/:id', () => {
    beforeEach(async () => {
      testInvoice = await global.testUtils.createTestInvoice(testOwner._id, testClient._id);
    });

    it('should delete invoice', async () => {
      const response = await request(app)
        .delete(`/api/invoice/delete/${testInvoice._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify invoice is deleted
      const Invoice = mongoose.model('Invoice');
      const deletedInvoice = await Invoice.findById(testInvoice._id);
      expect(deletedInvoice).toBeNull();
    });
  });

  describe('GET /api/invoice/summary', () => {
    beforeEach(async () => {
      await global.testUtils.createTestInvoice(testOwner._id, testClient._id);
      await global.testUtils.createTestInvoice(testOwner._id, testClient._id);
    });

    it('should return invoice summary statistics', async () => {
      const response = await request(app)
        .get('/api/invoice/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result).toBeDefined();
      expect(typeof response.body.result.total).toBe('number');
    });
  });
});
