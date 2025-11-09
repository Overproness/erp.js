const mongoose = require('mongoose');
const TestDataFactory = require('../utils/testDataFactory');

describe('Data Isolation No AutoPopulate Test', () => {
  let Client;

  beforeAll(() => {
    Client = mongoose.model('Client');
  });

  describe('Manual Client Creation Without AutoPopulate', () => {
    test('should create client without autopopulate fields', async () => {
      const owner = await TestDataFactory.createCompanyOwner();

      // Create client without createdBy, updatedBy, removedBy fields that auto-populate
      const clientData = {
        name: 'Test Client',
        email: `test-${Date.now()}@example.com`,
        phone: '123-456-7890',
        country: 'USA',
        address: '123 Test St',
        owner: owner._id,
        // No createdBy, updatedBy, removedBy fields
        enabled: true,
        removed: false,
        customerType: 'company',
      };

      const client = await new Client(clientData).save();

      expect(client).toBeDefined();
      expect(client._id).toBeDefined();
      expect(client.name).toBe('Test Client');
      expect(client.owner.toString()).toBe(owner._id.toString());
    }, 30000);

    test('should filter clients by owner without autopopulate', async () => {
      const owner1 = await TestDataFactory.createCompanyOwner();
      const owner2 = await TestDataFactory.createCompanyOwner();

      // Create minimal clients for different owners
      const client1Data = {
        name: 'Client 1',
        email: `client1-${Date.now()}@example.com`,
        phone: '123-456-7890',
        owner: owner1._id,
        enabled: true,
        removed: false,
      };
      const client1 = await new Client(client1Data).save();

      const client2Data = {
        name: 'Client 2',
        email: `client2-${Date.now()}@example.com`,
        phone: '123-456-7891',
        owner: owner2._id,
        enabled: true,
        removed: false,
      };
      const client2 = await new Client(client2Data).save();

      // Query by owner1 without populating
      const owner1Clients = await Client.find({ owner: owner1._id, removed: false }).lean();
      expect(owner1Clients).toHaveLength(1);
      expect(owner1Clients[0]._id.toString()).toBe(client1._id.toString());

      // Query by owner2 without populating
      const owner2Clients = await Client.find({ owner: owner2._id, removed: false }).lean();
      expect(owner2Clients).toHaveLength(1);
      expect(owner2Clients[0]._id.toString()).toBe(client2._id.toString());
    }, 45000);
  });
});
