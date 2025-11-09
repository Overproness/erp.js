const mongoose = require('mongoose');
const TestDataFactory = require('../utils/testDataFactory');

describe('Data Isolation Quick Test', () => {
  let Client;

  beforeAll(() => {
    Client = mongoose.model('Client');
  });

  describe('Basic Owner Field Tests', () => {
    test('should create owner successfully', async () => {
      const owner = await TestDataFactory.createCompanyOwner();
      expect(owner).toBeDefined();
      expect(owner._id).toBeDefined();
      expect(owner.email).toBeDefined();
      expect(owner.role).toBe('owner');
    }, 30000); // 30 second timeout

    test('should require owner field in models', async () => {
      // Test Client model
      const clientData = {
        name: 'Test Client',
        email: 'test@example.com',
        phone: '123-456-7890',
        // Missing owner field
      };

      await expect(new Client(clientData).save()).rejects.toThrow();
    }, 15000); // 15 second timeout

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
      expect(client).toBeDefined();

      // Handle autopopulated owner field
      const ownerId = client.owner._id || client.owner;
      expect(ownerId.toString()).toBe(owner._id.toString());
    }, 30000); // 30 second timeout
  });
});
