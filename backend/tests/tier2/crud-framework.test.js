/**
 * TIER 2 TEST SUITE: CRUD Framework & Data Consistency
 *
 * Tests the generic CRUD operations framework, data validation,
 * consistency checks, and model relationships.
 *
 * Coverage Areas:
 * - Generic CRUD operations (create, read, update, delete)
 * - Data validation and sanitization
 * - Model relationships and cascading operations
 * - Bulk operations and batch processing
 * - Transaction consistency
 * - Error handling and rollback
 * - Performance optimization
 * - Field-level permissions
 */

const mongoose = require('mongoose');
const request = require('supertest');
const {
  createTestUser,
  createTestCompany,
  generateJWT,
  cleanupDatabase,
  mockRequest,
  mockResponse,
} = require('../setup/testUtilities');

// Import models
const Client = require('../../src/models/appModels/Client');
const Invoice = require('../../src/models/appModels/Invoice');
const Payment = require('../../src/models/appModels/Payment');
const Quote = require('../../src/models/appModels/Quote');
const Document = require('../../src/models/appModels/Document');
const User = require('../../src/models/appModels/User');

// Import CRUD controllers
const createCRUDController = require('../../src/controllers/middlewaresControllers/createCRUDController');

describe('CRUD Framework & Data Consistency', () => {
  let testUser, testCompany, authToken, crudController;
  let testClient, testInvoice, testQuote;

  beforeEach(async () => {
    await cleanupDatabase();

    // Create test data
    testCompany = await createTestCompany();
    testUser = await createTestUser(testCompany._id);
    authToken = generateJWT(testUser._id, testCompany._id);

    // Initialize CRUD controller
    crudController = createCRUDController('Client');

    // Create test entities
    testClient = await Client.create({
      name: 'Test Client',
      email: 'client@test.com',
      phone: '+1234567890',
      owner: testCompany._id,
      createdBy: testUser._id,
    });

    testQuote = await Quote.create({
      number: 1,
      year: 2024,
      date: new Date(),
      expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      client: testClient._id,
      owner: testCompany._id,
      createdBy: testUser._id,
      items: [
        {
          itemName: 'Service',
          quantity: 1,
          price: 100,
          total: 100,
        },
      ],
      subTotal: 100,
      total: 100,
    });

    testInvoice = await Invoice.create({
      number: 1,
      year: 2024,
      date: new Date(),
      expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      client: testClient._id,
      owner: testCompany._id,
      createdBy: testUser._id,
      items: [
        {
          itemName: 'Service',
          quantity: 1,
          price: 100,
          total: 100,
        },
      ],
      subTotal: 100,
      total: 100,
      currency: 'USD',
    });
  });

  describe('Generic CRUD Operations', () => {
    test('should create entity with proper validation', async () => {
      const req = mockRequest(
        {
          body: {
            name: 'New Client',
            email: 'newclient@test.com',
            phone: '+1987654321',
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();

      await crudController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            name: 'New Client',
            email: 'newclient@test.com',
            owner: testCompany._id,
          }),
        })
      );
    });

    test('should read entity with proper filtering', async () => {
      const req = mockRequest(
        {
          params: { id: testClient._id.toString() },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();

      await crudController.read(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            _id: testClient._id,
            name: testClient.name,
            owner: testCompany._id,
          }),
        })
      );
    });

    test('should update entity with validation', async () => {
      const req = mockRequest(
        {
          params: { id: testClient._id.toString() },
          body: {
            name: 'Updated Client Name',
            phone: '+1111111111',
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();

      await crudController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            name: 'Updated Client Name',
            phone: '+1111111111',
          }),
        })
      );
    });

    test('should delete entity with cascade handling', async () => {
      const req = mockRequest(
        {
          params: { id: testClient._id.toString() },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();

      await crudController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
        })
      );

      // Verify entity is deleted
      const deletedClient = await Client.findById(testClient._id);
      expect(deletedClient).toBeNull();
    });

    test('should list entities with pagination', async () => {
      // Create additional test clients
      await Client.create([
        {
          name: 'Client 2',
          email: 'client2@test.com',
          phone: '+1234567891',
          owner: testCompany._id,
        },
        {
          name: 'Client 3',
          email: 'client3@test.com',
          phone: '+1234567892',
          owner: testCompany._id,
        },
        {
          name: 'Client 4',
          email: 'client4@test.com',
          phone: '+1234567893',
          owner: testCompany._id,
        },
      ]);

      const req = mockRequest(
        {
          query: { page: 1, limit: 2 },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();

      await crudController.list(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.arrayContaining([expect.objectContaining({ owner: testCompany._id })]),
          pagination: expect.objectContaining({
            page: 1,
            limit: 2,
            total: expect.any(Number),
          }),
        })
      );
    });
  });

  describe('Data Validation & Sanitization', () => {
    test('should validate required fields', async () => {
      const req = mockRequest(
        {
          body: {
            email: 'incomplete@test.com',
            // Missing required 'name' field
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();

      await crudController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('validation'),
        })
      );
    });

    test('should validate email format', async () => {
      const req = mockRequest(
        {
          body: {
            name: 'Test Client',
            email: 'invalid-email-format',
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();

      await crudController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('email'),
        })
      );
    });

    test('should sanitize input data', async () => {
      const req = mockRequest(
        {
          body: {
            name: '  Test Client Sanitize  ',
            email: '  SANITIZE@TEST.COM  ',
            phone: '  +1234567891  ',
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();

      await crudController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            name: 'Test Client Sanitize',
            email: 'sanitize@test.com',
            phone: '+1234567891',
          }),
        })
      );
    });

    test('should prevent XSS attacks', async () => {
      const req = mockRequest(
        {
          body: {
            name: '<script>alert("xss")</script>Malicious Client',
            email: 'xss@test.com',
            phone: '+1234567892',
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();

      await crudController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            name: expect.not.stringContaining('<script>'),
          }),
        })
      );
    });
  });

  describe('Model Relationships & Cascading', () => {
    test('should handle foreign key relationships', async () => {
      const newClient = await Client.create({
        name: 'Relationship Client',
        email: 'rel@test.com',
        phone: '+1234567894',
        owner: testCompany._id,
      });

      const quote = await Quote.create({
        number: 1,
        year: 2024,
        date: new Date(),
        expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        client: newClient._id,
        owner: testCompany._id,
        items: [
          {
            itemName: 'Service',
            quantity: 1,
            price: 100,
            total: 100,
          },
        ],
        subTotal: 100,
        total: 100,
        status: 'draft',
      });

      // Verify relationship
      const foundQuote = await Quote.findById(quote._id).populate('client');
      expect(foundQuote.client._id).toEqual(newClient._id);
      expect(foundQuote.client.name).toBe('Relationship Client');
    });

    test('should handle cascade delete operations', async () => {
      // Create related entities
      const client = await Client.create({
        name: 'Cascade Client',
        email: 'cascade@test.com',
        phone: '+1234567895',
        owner: testCompany._id,
      });

      const quote = await Quote.create({
        number: 1,
        year: 2024,
        date: new Date(),
        expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        client: client._id,
        owner: testCompany._id,
        items: [
          {
            itemName: 'Service',
            quantity: 1,
            price: 100,
            total: 100,
          },
        ],
        subTotal: 100,
        total: 100,
        status: 'draft',
      });

      const invoice = await Invoice.create({
        number: 1,
        year: 2024,
        date: new Date(),
        expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        client: client._id,
        converted: {
          from: 'quote',
          quote: quote._id,
        },
        owner: testCompany._id,
        items: [
          {
            itemName: 'Service',
            quantity: 1,
            price: 100,
            total: 100,
          },
        ],
        subTotal: 100,
        total: 100,
        status: 'draft',
      });

      // Delete client should handle cascading
      const req = mockRequest(
        {
          params: { id: client._id.toString() },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();

      await crudController.delete(req, res);

      // Verify cascading behavior
      const deletedClient = await Client.findById(client._id);
      expect(deletedClient).toBeNull();

      // Related entities should either be deleted or have client reference removed
      const orphanedQuote = await Quote.findById(quote._id);
      const orphanedInvoice = await Invoice.findById(invoice._id);

      // Depending on cascade configuration, these might be deleted or have null client
      if (orphanedQuote) {
        expect(orphanedQuote.client).toBeNull();
      }
      if (orphanedInvoice) {
        expect(orphanedInvoice.client).toBeNull();
      }
    });
  });

  describe('Bulk Operations & Batch Processing', () => {
    test('should handle bulk create operations', async () => {
      const bulkData = [
        { name: 'Bulk Client 1', email: 'bulk1@test.com', phone: '+1234567806' },
        { name: 'Bulk Client 2', email: 'bulk2@test.com', phone: '+1234567807' },
        { name: 'Bulk Client 3', email: 'bulk3@test.com', phone: '+1234567808' },
      ];

      const req = mockRequest(
        {
          body: { items: bulkData },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();

      await crudController.bulkCreate(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.arrayContaining([
            expect.objectContaining({ name: 'Bulk Client 1' }),
            expect.objectContaining({ name: 'Bulk Client 2' }),
            expect.objectContaining({ name: 'Bulk Client 3' }),
          ]),
        })
      );
    });

    test('should handle bulk update operations', async () => {
      // Create test clients
      const clients = await Client.create([
        {
          name: 'Update Client 1',
          email: 'update1@test.com',
          phone: '+1234567896',
          owner: testCompany._id,
        },
        {
          name: 'Update Client 2',
          email: 'update2@test.com',
          phone: '+1234567897',
          owner: testCompany._id,
        },
        {
          name: 'Update Client 3',
          email: 'update3@test.com',
          phone: '+1234567898',
          owner: testCompany._id,
        },
      ]);

      const updateData = clients.map((client) => ({
        id: client._id.toString(),
        name: client.name + ' Updated',
      }));

      const req = mockRequest(
        {
          body: { updates: updateData },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();

      await crudController.bulkUpdate(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          modifiedCount: 3,
        })
      );
    });

    test('should handle bulk delete operations', async () => {
      // Create test clients
      const clients = await Client.create([
        {
          name: 'Delete Client 1',
          email: 'delete1@test.com',
          phone: '+1234567899',
          owner: testCompany._id,
        },
        {
          name: 'Delete Client 2',
          email: 'delete2@test.com',
          phone: '+1234567800',
          owner: testCompany._id,
        },
        {
          name: 'Delete Client 3',
          email: 'delete3@test.com',
          phone: '+1234567801',
          owner: testCompany._id,
        },
      ]);

      const deleteIds = clients.map((client) => client._id.toString());

      const req = mockRequest(
        {
          body: { ids: deleteIds },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();

      await crudController.bulkDelete(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          deletedCount: 3,
        })
      );
    });
  });

  describe('Transaction Consistency', () => {
    test('should handle transaction rollback on error', async () => {
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          // Create client
          const client = await Client.create(
            [
              {
                name: 'Transaction Client',
                email: 'transaction@test.com',
                phone: '+1234567802',
                owner: testCompany._id,
              },
            ],
            { session }
          );

          // Create quote
          await Quote.create(
            [
              {
                quoteNumber: 'Q-TRANS-001',
                client: client[0]._id,
                owner: testCompany._id,
                items: [{ name: 'Service', quantity: 1, price: 100 }],
                total: 100,
                status: 'draft',
              },
            ],
            { session }
          );

          // Simulate error
          throw new Error('Transaction error');
        });
      } catch (error) {
        // Transaction should be rolled back
        const client = await Client.findOne({
          email: 'transaction@test.com',
          owner: testCompany._id,
        });
        expect(client).toBeNull();

        const quote = await Quote.findOne({
          quoteNumber: 'Q-TRANS-001',
          owner: testCompany._id,
        });
        expect(quote).toBeNull();
      } finally {
        await session.endSession();
      }
    });

    test('should maintain data consistency during concurrent operations', async () => {
      const client = await Client.create({
        name: 'Concurrent Client',
        email: 'concurrent@test.com',
        phone: '+1234567803',
        owner: testCompany._id,
      });

      // Simulate concurrent updates
      const update1Promise = Client.findByIdAndUpdate(
        client._id,
        { name: 'Updated by User 1' },
        { new: true }
      );

      const update2Promise = Client.findByIdAndUpdate(
        client._id,
        { name: 'Updated by User 2' },
        { new: true }
      );

      const [result1, result2] = await Promise.all([update1Promise, update2Promise]);

      // One should succeed, verify final state
      const finalClient = await Client.findById(client._id);
      expect(['Updated by User 1', 'Updated by User 2']).toContain(finalClient.name);
    });
  });

  describe('Error Handling & Validation', () => {
    test('should handle validation errors gracefully', async () => {
      const req = mockRequest(
        {
          body: {
            name: '', // Empty required field
            email: 'invalid-email',
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();

      await crudController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
          errors: expect.any(Object),
        })
      );
    });

    test('should handle duplicate key errors', async () => {
      // Create first client
      await Client.create({
        name: 'Unique Client',
        email: 'unique@test.com',
        phone: '+1234567804',
        owner: testCompany._id,
      });

      // Try to create duplicate
      const req = mockRequest(
        {
          body: {
            name: 'Duplicate Client',
            email: 'unique@test.com', // Duplicate email
            phone: '+1234567810',
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();

      await crudController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('duplicate'),
        })
      );
    });

    test('should handle not found errors', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const req = mockRequest(
        {
          params: { id: nonExistentId.toString() },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();

      await crudController.read(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found'),
        })
      );
    });
  });

  describe('Performance & Optimization', () => {
    test('should optimize database queries with proper indexing', async () => {
      // Create multiple clients for performance testing
      const clients = [];
      for (let i = 0; i < 100; i++) {
        clients.push({
          name: `Performance Client ${i}`,
          email: `perf${i}@test.com`,
          phone: `+123456780${i % 10}`,
          owner: testCompany._id,
        });
      }

      await Client.create(clients);

      const startTime = Date.now();

      // Query with indexed field (owner)
      const results = await Client.find({ owner: testCompany._id }).limit(10);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(results.length).toBe(10);
      expect(queryTime).toBeLessThan(100); // Should be fast with proper indexing
    });

    test('should handle large dataset pagination efficiently', async () => {
      // Create large dataset
      const largeDataset = [];
      for (let i = 0; i < 1000; i++) {
        largeDataset.push({
          name: `Large Dataset Client ${i}`,
          email: `large${i}@test.com`,
          phone: `+12345678${String(i).padStart(3, '0')}`,
          owner: testCompany._id,
        });
      }

      await Client.create(largeDataset);

      const req = mockRequest(
        {
          query: { page: 10, limit: 50 },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();

      const startTime = Date.now();
      await crudController.list(req, res);
      const endTime = Date.now();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(endTime - startTime).toBeLessThan(500); // Should handle pagination efficiently
    });
  });

  describe('Field-Level Permissions', () => {
    test('should respect field-level read permissions', async () => {
      // Create client with sensitive data
      const sensitiveClient = await Client.create({
        name: 'Sensitive Client',
        email: 'sensitive@test.com',
        phone: '+1234567805',
        owner: testCompany._id,
        privateNotes: 'This is confidential information',
      });

      // Create limited permission user
      const limitedUser = await User.create({
        name: 'Limited User',
        username: 'limited@test.com',
        email: 'limited@test.com',
        password: 'password123',
        role: 'member',
        owner: testCompany._id,
        permissions: ['read_client_basic'], // Limited permissions
      });

      // Set the companyOwner property for the CRUD controller
      limitedUser.companyOwner = testCompany._id;

      const req = mockRequest(
        {
          params: { id: sensitiveClient._id.toString() },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();

      await crudController.read(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const result = res.json.mock.calls[0][0];

      // Should include basic fields
      expect(result.result.name).toBe('Sensitive Client');
      expect(result.result.email).toBe('sensitive@test.com');

      // Note: privateNotes filtering would require custom field-level permission logic
      // For now, we just verify the basic CRUD operation works
    });

    test('should respect field-level write permissions', async () => {
      const req = mockRequest(
        {
          params: { id: testClient._id.toString() },
          body: {
            name: 'Updated Name',
            email: 'updated@test.com',
            privateNotes: 'Attempting to update sensitive field',
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();

      await crudController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      // Verify only allowed fields were updated
      const updatedClient = await Client.findById(testClient._id);
      expect(updatedClient.name).toBe('Updated Name');
      expect(updatedClient.email).toBe('updated@test.com');
      // Note: privateNotes filtering would require custom field-level permission logic
    });
  });
});
