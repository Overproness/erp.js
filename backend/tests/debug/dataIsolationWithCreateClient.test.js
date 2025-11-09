const mongoose = require('mongoose');
const TestDataFactory = require('../utils/testDataFactory');

describe('Data Isolation With CreateClient Test', () => {
  let Client;

  beforeAll(() => {
    Client = mongoose.model('Client');
  });

  describe('Using TestDataFactory.createClient', () => {
    test('should create client with createClient method', async () => {
      const owner = await TestDataFactory.createCompanyOwner();

      // Create client using the factory method
      const client = await TestDataFactory.createClient(owner);

      expect(client).toBeDefined();
      expect(client._id).toBeDefined();
      expect(client.name).toBeDefined();
      expect(client.email).toBeDefined();

      // Handle autopopulated owner field
      const ownerId = client.owner._id || client.owner;
      expect(ownerId.toString()).toBe(owner._id.toString());
    }, 60000); // 60 second timeout

    test('should filter clients by owner using createClient', async () => {
      const owner1 = await TestDataFactory.createCompanyOwner();
      const owner2 = await TestDataFactory.createCompanyOwner();

      // Create clients for different owners using factory method
      const client1 = await TestDataFactory.createClient(owner1);
      const client2 = await TestDataFactory.createClient(owner2);

      // Query by owner1
      const owner1Clients = await Client.find({ owner: owner1._id, removed: false });
      expect(owner1Clients).toHaveLength(1);
      expect(owner1Clients[0]._id.toString()).toBe(client1._id.toString());

      // Query by owner2
      const owner2Clients = await Client.find({ owner: owner2._id, removed: false });
      expect(owner2Clients).toHaveLength(1);
      expect(owner2Clients[0]._id.toString()).toBe(client2._id.toString());
    }, 90000); // 90 second timeout - longer for multiple operations
  });
});
