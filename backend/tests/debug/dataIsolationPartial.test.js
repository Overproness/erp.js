const mongoose = require('mongoose');
const TestDataFactory = require('../utils/testDataFactory');

describe('Data Isolation Partial Test', () => {
  let Client;

  beforeAll(() => {
    Client = mongoose.model('Client');
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
        // Don't set createdBy to avoid auto-populate
        enabled: true,
        removed: false,
      };

      const client = await new Client(clientData).save();
      // Handle autopopulated owner field
      const ownerId = client.owner._id || client.owner;
      expect(ownerId.toString()).toBe(owner._id.toString());
    }, 30000);
  });
});
