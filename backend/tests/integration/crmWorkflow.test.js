const request = require('supertest');
const mongoose = require('mongoose');
const { describe, it, beforeAll, beforeEach, afterAll, expect } = require('@jest/globals');

describe('Integration Tests - CRM Workflow', () => {
  let app, testOwner, authToken;

  beforeAll(async () => {
    // Setup the app
    app = require('../../../src/app');
  });

  beforeEach(async () => {
    testOwner = await global.testUtils.createTestCompanyOwner();
    authToken = global.testUtils.createTestToken({ _id: testOwner._id, role: 'owner' });
  });

  describe('Complete CRM Workflow', () => {
    it('should handle complete client-to-payment workflow', async () => {
      // Step 1: Create a client
      const clientData = {
        name: 'Integration Test Company',
        email: 'integration@test.com',
        phone: '+1234567890',
        customerType: 'company',
      };

      const clientResponse = await request(app)
        .post('/api/client/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(clientData)
        .expect(200);

      expect(clientResponse.body.success).toBe(true);
      const clientId = clientResponse.body.result._id;

      // Step 2: Create a quote for the client
      const quoteData = {
        client: clientId,
        items: [
          {
            itemName: 'Web Development Package',
            quantity: 1,
            price: 5000,
            total: 5000,
          },
        ],
        subTotal: 5000,
        taxRate: 10,
        taxTotal: 500,
        total: 5500,
        currency: 'USD',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      const quoteResponse = await request(app)
        .post('/api/quote/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(quoteData)
        .expect(200);

      expect(quoteResponse.body.success).toBe(true);
      const quoteId = quoteResponse.body.result._id;

      // Step 3: Convert quote to invoice
      const invoiceData = {
        client: clientId,
        quoteId: quoteId,
        items: quoteData.items,
        subTotal: quoteData.subTotal,
        taxRate: quoteData.taxRate,
        taxTotal: quoteData.taxTotal,
        total: quoteData.total,
        currency: quoteData.currency,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      const invoiceResponse = await request(app)
        .post('/api/invoice/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invoiceData)
        .expect(200);

      expect(invoiceResponse.body.success).toBe(true);
      const invoiceId = invoiceResponse.body.result._id;

      // Step 4: Create a payment for the invoice
      const paymentData = {
        client: clientId,
        invoice: invoiceId,
        amount: 5500,
        currency: 'USD',
        paymentMethod: 'bank_transfer',
        description: 'Payment for Web Development Package',
      };

      const paymentResponse = await request(app)
        .post('/api/payment/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(200);

      expect(paymentResponse.body.success).toBe(true);

      // Step 5: Verify the invoice is marked as paid
      const updatedInvoiceResponse = await request(app)
        .get(`/api/invoice/read/${invoiceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(updatedInvoiceResponse.body.result.paymentStatus).toBe('paid');

      // Step 6: Verify client summary shows the transaction
      const clientSummaryResponse = await request(app)
        .get(`/api/client/read/${clientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(clientSummaryResponse.body.success).toBe(true);
      expect(clientSummaryResponse.body.result.name).toBe(clientData.name);
    });

    it('should handle project and task management workflow', async () => {
      // Step 1: Create a project
      const projectData = {
        name: 'Website Redesign Project',
        description: 'Complete website redesign for client',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        budget: 10000,
      };

      const projectResponse = await request(app)
        .post('/api/project/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(200);

      expect(projectResponse.body.success).toBe(true);
      const projectId = projectResponse.body.result._id;

      // Step 2: Create tasks for the project
      const task1Data = {
        title: 'Design Mockups',
        description: 'Create initial design mockups',
        project: projectId,
        status: 'pending',
        priority: 'high',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      const task1Response = await request(app)
        .post('/api/task/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(task1Data)
        .expect(200);

      expect(task1Response.body.success).toBe(true);

      const task2Data = {
        title: 'Frontend Development',
        description: 'Implement the frontend',
        project: projectId,
        status: 'pending',
        priority: 'medium',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      };

      const task2Response = await request(app)
        .post('/api/task/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(task2Data)
        .expect(200);

      expect(task2Response.body.success).toBe(true);

      // Step 3: Update task status
      const updateTaskResponse = await request(app)
        .patch(`/api/task/update/${task1Response.body.result._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'in_progress' })
        .expect(200);

      expect(updateTaskResponse.body.result.status).toBe('in_progress');

      // Step 4: Get project with tasks
      const projectWithTasksResponse = await request(app)
        .get(`/api/project/read/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(projectWithTasksResponse.body.success).toBe(true);
      expect(projectWithTasksResponse.body.result.name).toBe(projectData.name);
    });

    it('should handle document management workflow', async () => {
      // Step 1: Create a document
      const documentData = {
        title: 'Service Agreement',
        content: 'This is a service agreement document...',
        type: 'contract',
        status: 'draft',
      };

      const documentResponse = await request(app)
        .post('/api/document/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(documentData)
        .expect(200);

      expect(documentResponse.body.success).toBe(true);
      const documentId = documentResponse.body.result._id;

      // Step 2: Update document status
      const updateDocumentResponse = await request(app)
        .patch(`/api/document/update/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'review' })
        .expect(200);

      expect(updateDocumentResponse.body.result.status).toBe('review');

      // Step 3: Create document version
      const versionData = {
        document: documentId,
        content: 'Updated service agreement document...',
        version: '1.1',
        changes: 'Updated terms and conditions',
      };

      const versionResponse = await request(app)
        .post('/api/document-version/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(versionData)
        .expect(200);

      expect(versionResponse.body.success).toBe(true);

      // Step 4: Approve document
      const approveDocumentResponse = await request(app)
        .patch(`/api/document/update/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'approved' })
        .expect(200);

      expect(approveDocumentResponse.body.result.status).toBe('approved');
    });
  });

  describe('Data Consistency Tests', () => {
    it('should maintain data integrity across related models', async () => {
      // Create client
      const client = await global.testUtils.createTestClient(testOwner._id);

      // Create invoice
      const invoice = await global.testUtils.createTestInvoice(testOwner._id, client._id);

      // Create payment
      const payment = await global.testUtils.createTestPayment(
        testOwner._id,
        client._id,
        invoice._id
      );

      // Verify relationships
      expect(invoice.client.toString()).toBe(client._id.toString());
      expect(payment.client.toString()).toBe(client._id.toString());
      expect(payment.invoice.toString()).toBe(invoice._id.toString());
    });

    it('should handle cascade operations correctly', async () => {
      // Create a client with associated data
      const client = await global.testUtils.createTestClient(testOwner._id);
      const invoice = await global.testUtils.createTestInvoice(testOwner._id, client._id);

      // Delete client
      const deleteResponse = await request(app)
        .delete(`/api/client/delete/${client._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // Verify client is deleted
      const Client = mongoose.model('Client');
      const deletedClient = await Client.findById(client._id);
      expect(deletedClient).toBeNull();

      // Note: In a real application, you might want to handle related data differently
      // (soft delete, archive, prevent deletion if has dependencies, etc.)
    });
  });

  describe('Search Integration Tests', () => {
    beforeEach(async () => {
      // Create test data for search
      await global.testUtils.createTestClient(testOwner._id);
      const client = await global.testUtils.createTestClient(testOwner._id);
      await global.testUtils.createTestInvoice(testOwner._id, client._id);
    });

    it('should search across multiple models', async () => {
      const searchResponse = await request(app)
        .get('/api/search?q=test&models=Client,Invoice')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(searchResponse.body.success).toBe(true);
      expect(Array.isArray(searchResponse.body.result)).toBe(true);
    });
  });
});
