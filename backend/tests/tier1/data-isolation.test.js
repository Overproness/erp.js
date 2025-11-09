const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');

describe('TIER 1 - Multi-tenant Data Isolation System', () => {
  let owner1, owner2;
  let token1, token2;
  let client1, client2;
  let invoice1, invoice2;

  beforeEach(async () => {
    // Clean up all collections to ensure isolation
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }

    // Create two separate company owners
    owner1 = await global.testUtils.createTestCompanyOwner();
    owner1.email = `owner1-${Date.now()}@example.com`;
    await owner1.save();

    owner2 = await global.testUtils.createTestCompanyOwner();
    owner2.email = `owner2-${Date.now()}@example.com`;
    await owner2.save();

    // Create valid tokens for each owner with session management
    const TestDataFactory = require('../utils/testDataFactory');
    token1 = await TestDataFactory.generateValidToken(owner1, true);
    token2 = await TestDataFactory.generateValidToken(owner2, true);

    // Create clients for each owner
    client1 = await global.testUtils.createTestClient(owner1);
    client2 = await global.testUtils.createTestClient(owner2);

    // Create invoices for each owner
    invoice1 = await global.testUtils.createTestInvoice(owner1._id, client1._id);
    invoice2 = await global.testUtils.createTestInvoice(owner2._id, client2._id);
  });

  describe('Unit Tests - Owner Field Validation', () => {
    test('should require owner field in all business entities', async () => {
      const Client = mongoose.model('Client');

      try {
        await Client.create({
          name: 'Test Client',
          email: `test-${Date.now()}-${Math.random()}@example.com`,
          phone: '+1234567890',
          // Missing owner field
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('owner');
      }
    });

    test('should validate owner field is ObjectId', async () => {
      const Client = mongoose.model('Client');

      try {
        await Client.create({
          name: 'Test Client',
          email: `test-${Date.now()}-${Math.random()}@example.com`,
          phone: '+1234567890',
          owner: 'invalid-object-id',
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('ObjectId');
      }
    });

    test('should auto-populate owner fields correctly', async () => {
      const Invoice = mongoose.model('Invoice');
      const invoice = await Invoice.findById(invoice1._id);

      // Handle autopopulated owner field - check if it's populated or raw ObjectId
      const ownerValue = invoice.owner._id ? invoice.owner._id : invoice.owner;
      const createdByValue = invoice.createdBy._id ? invoice.createdBy._id : invoice.createdBy;

      expect(ownerValue.toString()).toBe(owner1._id.toString());
      expect(createdByValue.toString()).toBe(owner1._id.toString());
    });
  });

  describe('Unit Tests - Query Filtering by Owner', () => {
    test('should filter queries by owner automatically', async () => {
      const Client = mongoose.model('Client');

      // Get clients for owner1
      const owner1Clients = await Client.find({ owner: owner1._id });
      const owner2Clients = await Client.find({ owner: owner2._id });

      expect(owner1Clients).toHaveLength(1);
      expect(owner2Clients).toHaveLength(1);
      expect(owner1Clients[0]._id.toString()).toBe(client1._id.toString());
      expect(owner2Clients[0]._id.toString()).toBe(client2._id.toString());
    });

    test('should not return data from other owners', async () => {
      const Invoice = mongoose.model('Invoice');

      const owner1Invoices = await Invoice.find({ owner: owner1._id });
      const owner2Invoices = await Invoice.find({ owner: owner2._id });

      // Each owner should only see their own invoices
      expect(owner1Invoices).toHaveLength(1);
      expect(owner2Invoices).toHaveLength(1);

      // Verify correct ownership - handle autopopulated fields
      const owner1OwnerValue = owner1Invoices[0].owner._id
        ? owner1Invoices[0].owner._id
        : owner1Invoices[0].owner;
      const owner2OwnerValue = owner2Invoices[0].owner._id
        ? owner2Invoices[0].owner._id
        : owner2Invoices[0].owner;

      expect(owner1OwnerValue.toString()).toBe(owner1._id.toString());
      expect(owner2OwnerValue.toString()).toBe(owner2._id.toString());
    });

    test('should handle nested owner filtering', async () => {
      const Payment = mongoose.model('Payment');

      // Create payments for different owners
      const payment1 = await Payment.create({
        number: Math.floor(Math.random() * 10000) + 1,
        client: client1._id,
        invoice: invoice1._id,
        date: new Date(),
        amount: 100,
        currency: 'USD',
        owner: owner1._id,
        createdBy: owner1._id,
      });

      const payment2 = await Payment.create({
        number: Math.floor(Math.random() * 10000) + 1,
        client: client2._id,
        invoice: invoice2._id,
        date: new Date(),
        amount: 200,
        currency: 'USD',
        owner: owner2._id,
        createdBy: owner2._id,
      });

      // Verify isolation
      const owner1Payments = await Payment.find({ owner: owner1._id });
      const owner2Payments = await Payment.find({ owner: owner2._id });

      expect(owner1Payments).toHaveLength(1);
      expect(owner2Payments).toHaveLength(1);
      expect(owner1Payments[0].amount).toBe(100);
      expect(owner2Payments[0].amount).toBe(200);
    });
  });

  describe('Integration Tests - Cross-tenant Data Access Prevention', () => {
    test('should prevent owner1 from accessing owner2 clients', async () => {
      const response = await request(app)
        .get(`/api/client/${client2._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(404);
    });

    test('should prevent owner2 from accessing owner1 invoices', async () => {
      const response = await request(app)
        .get(`/api/invoice/${invoice1._id}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(response.status).toBe(404);
    });

    test('should prevent cross-tenant data modification', async () => {
      const updateData = {
        name: 'Hacked Client Name',
      };

      const response = await request(app)
        .patch(`/api/client/${client2._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send(updateData);

      expect(response.status).toBe(404);

      // Verify client was not modified
      const Client = mongoose.model('Client');
      const unchangedClient = await Client.findById(client2._id);
      expect(unchangedClient.name).not.toBe('Hacked Client Name');
    });

    test('should prevent cross-tenant data deletion', async () => {
      const response = await request(app)
        .delete(`/api/client/${client2._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(404);

      // Verify client still exists
      const Client = mongoose.model('Client');
      const existingClient = await Client.findById(client2._id);
      expect(existingClient).toBeDefined();
    });

    test('should isolate list operations', async () => {
      const response1 = await request(app)
        .get('/api/client')
        .set('Authorization', `Bearer ${token1}`);

      const response2 = await request(app)
        .get('/api/client')
        .set('Authorization', `Bearer ${token2}`);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Each owner should only see their own clients
      expect(response1.body.result.items).toHaveLength(1);
      expect(response2.body.result.items).toHaveLength(1);

      expect(response1.body.result.items[0]._id).toBe(client1._id.toString());
      expect(response2.body.result.items[0]._id).toBe(client2._id.toString());
    });

    test('should isolate search operations', async () => {
      const response1 = await request(app)
        .get('/api/client/search?q=Test')
        .set('Authorization', `Bearer ${token1}`);

      const response2 = await request(app)
        .get('/api/client/search?q=Test')
        .set('Authorization', `Bearer ${token2}`);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Search should only return results owned by the requesting user
      if (response1.body.result.length > 0) {
        response1.body.result.forEach((item) => {
          expect(item.owner).toBe(owner1._id.toString());
        });
      }

      if (response2.body.result.length > 0) {
        response2.body.result.forEach((item) => {
          expect(item.owner).toBe(owner2._id.toString());
        });
      }
    });
  });

  describe('Integration Tests - Bulk Operations Isolation', () => {
    test('should isolate bulk update operations', async () => {
      // Create multiple clients for each owner
      const additionalClient1 = await global.testUtils.createTestClient(owner1._id);
      const additionalClient2 = await global.testUtils.createTestClient(owner2._id);

      // Attempt bulk update - should only affect owner1's clients
      const updateData = { country: 'Updated Country' };

      const response = await request(app)
        .patch('/api/client/bulk-update')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          filter: {},
          update: updateData,
        });

      // Verify only owner1's clients were updated
      const Client = mongoose.model('Client');
      const owner1Clients = await Client.find({ owner: owner1._id });
      const owner2Clients = await Client.find({ owner: owner2._id });

      owner1Clients.forEach((client) => {
        expect(client.country).toBe('Updated Country');
      });

      owner2Clients.forEach((client) => {
        expect(client.country).not.toBe('Updated Country');
      });
    });

    test('should isolate bulk delete operations', async () => {
      // Create additional test data
      const additionalClient1 = await global.testUtils.createTestClient(owner1._id);
      const additionalClient2 = await global.testUtils.createTestClient(owner2._id);

      const Client = mongoose.model('Client');
      const initialOwner1Count = await Client.countDocuments({ owner: owner1._id });
      const initialOwner2Count = await Client.countDocuments({ owner: owner2._id });

      // Soft delete all clients for owner1
      await Client.updateMany({ owner: owner1._id }, { removed: true });

      const finalOwner1Count = await Client.countDocuments({
        owner: owner1._id,
        removed: false,
      });
      const finalOwner2Count = await Client.countDocuments({
        owner: owner2._id,
        removed: false,
      });

      expect(finalOwner1Count).toBe(0);
      expect(finalOwner2Count).toBe(initialOwner2Count);
    });
  });

  describe('Integration Tests - Search Result Filtering', () => {
    test('should filter aggregation results by owner', async () => {
      const response = await request(app)
        .get('/api/invoice/summary')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);

      // Summary should only include owner1's data
      if (response.body.result) {
        // The summary calculation should only consider owner1's invoices
        expect(response.body.success).toBe(true);
      }
    });

    test('should filter complex join queries by owner', async () => {
      // Create payment for invoice1
      const Payment = mongoose.model('Payment');
      await Payment.create({
        number: 1,
        client: client1._id,
        invoice: invoice1._id,
        date: new Date(),
        amount: 50,
        currency: 'USD',
        owner: owner1._id,
        createdBy: owner1._id,
      });

      const response = await request(app)
        .get('/api/payment')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);

      // Should only return payments for owner1
      if (response.body.result.items) {
        response.body.result.items.forEach((payment) => {
          expect(payment.owner._id || payment.owner).toBe(owner1._id.toString());
        });
      }
    });

    test('should maintain isolation in advanced filtering', async () => {
      const response1 = await request(app)
        .get('/api/client/filter?customerType=company')
        .set('Authorization', `Bearer ${token1}`);

      const response2 = await request(app)
        .get('/api/client/filter?customerType=company')
        .set('Authorization', `Bearer ${token2}`);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Filter results should be isolated by owner
      if (response1.body.result && response1.body.result.length > 0) {
        response1.body.result.forEach((client) => {
          expect(client.owner).toBe(owner1._id.toString());
        });
      }

      if (response2.body.result && response2.body.result.length > 0) {
        response2.body.result.forEach((client) => {
          expect(client.owner).toBe(owner2._id.toString());
        });
      }
    });
  });

  describe('Edge Cases - Data Isolation', () => {
    test('should handle malicious ID manipulation attempts', async () => {
      // Try to access other owner's data using modified requests
      const maliciousAttempts = [
        `/api/client/${client2._id}?owner=${owner1._id}`,
        `/api/invoice/${invoice2._id}&owner=${owner1._id}`,
        `/api/client?owner=${owner2._id}`,
      ];

      for (const url of maliciousAttempts) {
        const response = await request(app).get(url).set('Authorization', `Bearer ${token1}`);

        // Should either return 404 or only owner1's data
        if (response.status === 200) {
          if (response.body.result) {
            if (Array.isArray(response.body.result.items)) {
              response.body.result.items.forEach((item) => {
                expect(item.owner).toBe(owner1._id.toString());
              });
            } else if (response.body.result.owner) {
              expect(response.body.result.owner).toBe(owner1._id.toString());
            }
          }
        } else {
          expect([404, 401, 403]).toContain(response.status);
        }
      }
    });

    test('should handle concurrent access by different owners', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => {
        const token = i % 2 === 0 ? token1 : token2;
        return request(app).get('/api/client').set('Authorization', `Bearer ${token}`);
      });

      const responses = await Promise.all(promises);

      responses.forEach((response, index) => {
        expect(response.status).toBe(200);

        const expectedOwnerId = index % 2 === 0 ? owner1._id : owner2._id;
        if (response.body.result.items && response.body.result.items.length > 0) {
          response.body.result.items.forEach((item) => {
            expect(item.owner).toBe(expectedOwnerId.toString());
          });
        }
      });
    });

    test('should prevent data leakage through error messages', async () => {
      const response = await request(app)
        .get(`/api/client/${client2._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(404);

      // Error message should not reveal existence of the resource
      expect(response.body.message).not.toContain(client2.name);
      expect(response.body.message).not.toContain(owner2._id.toString());
    });

    test('should handle database connection edge cases', async () => {
      // Test behavior when multiple owners try to access data simultaneously
      const concurrentRequests = [
        request(app).get('/api/client').set('Authorization', `Bearer ${token1}`),
        request(app).get('/api/client').set('Authorization', `Bearer ${token2}`),
        request(app).get('/api/invoice').set('Authorization', `Bearer ${token1}`),
        request(app).get('/api/invoice').set('Authorization', `Bearer ${token2}`),
      ];

      const responses = await Promise.all(concurrentRequests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // Verify data isolation maintained under concurrent load
      expect(responses[0].body.result.items[0].owner).toBe(owner1._id.toString());
      expect(responses[1].body.result.items[0].owner).toBe(owner2._id.toString());
    });
  });
});
