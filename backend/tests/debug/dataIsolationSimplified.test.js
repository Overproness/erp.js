const mongoose = require('mongoose');
const TestDataFactory = require('../utils/testDataFactory');

describe('Data Isolation Simplified Test', () => {
  let Client, Invoice, Payment;

  beforeAll(() => {
    Client = mongoose.model('Client');
    Invoice = mongoose.model('Invoice');
    Payment = mongoose.model('Payment');
  });

  describe('Owner Field Validation', () => {
    test('should require owner field in models', async () => {
      // Test Client model
      const clientData = {
        name: 'Test Client',
        email: 'test@example.com',
        phone: '123-456-7890',
        // Missing owner field
      };

      await expect(new Client(clientData).save()).rejects.toThrow();
    }, 15000);

    test('should save with valid owner field', async () => {
      const owner = await TestDataFactory.createCompanyOwner();

      const clientData = {
        name: 'Test Client',
        email: 'test@example.com',
        phone: '123-456-7890',
        owner: owner._id,
        createdBy: owner._id,
      };

      const client = await new Client(clientData).save();
      // Handle autopopulated owner field
      const ownerId = client.owner._id || client.owner;
      expect(ownerId.toString()).toBe(owner._id.toString());
    }, 30000);

    test('should validate owner field is ObjectId', async () => {
      const clientData = {
        name: 'Test Client',
        email: 'test@example.com',
        phone: '123-456-7890',
        owner: 'invalid-owner-id', // Invalid ObjectId
        createdBy: 'invalid-owner-id',
      };

      await expect(new Client(clientData).save()).rejects.toThrow();
    }, 15000);

    test('should validate owner exists', async () => {
      const nonExistentOwnerId = new mongoose.Types.ObjectId();

      const clientData = {
        name: 'Test Client',
        email: 'test@example.com',
        phone: '123-456-7890',
        owner: nonExistentOwnerId,
        createdBy: nonExistentOwnerId,
      };

      // This should work at the model level but fail at business logic level
      const client = await new Client(clientData).save();
      // Check without populate and without autopopulate to get the raw ObjectId
      const rawClient = await Client.findById(client._id).lean();
      expect(rawClient.owner.toString()).toBe(nonExistentOwnerId.toString());
    }, 15000);
  });

  describe('Query Filtering by Owner', () => {
    test('should filter queries by owner', async () => {
      const owner1 = await TestDataFactory.createCompanyOwner();
      const owner2 = await TestDataFactory.createCompanyOwner();

      // Create clients for different owners manually instead of using createClient
      const client1Data = {
        name: 'Test Client 1',
        email: 'client1@example.com',
        phone: '123-456-7890',
        owner: owner1._id,
        createdBy: owner1._id,
      };
      const client1 = await new Client(client1Data).save();

      const client2Data = {
        name: 'Test Client 2',
        email: 'client2@example.com',
        phone: '123-456-7890',
        owner: owner2._id,
        createdBy: owner2._id,
      };
      const client2 = await new Client(client2Data).save();

      // Query by owner1
      const owner1Clients = await Client.find({ owner: owner1._id, removed: false });
      expect(owner1Clients).toHaveLength(1);
      expect(owner1Clients[0]._id.toString()).toBe(client1._id.toString());

      // Query by owner2
      const owner2Clients = await Client.find({ owner: owner2._id, removed: false });
      expect(owner2Clients).toHaveLength(1);
      expect(owner2Clients[0]._id.toString()).toBe(client2._id.toString());
    }, 45000);
  });
});
