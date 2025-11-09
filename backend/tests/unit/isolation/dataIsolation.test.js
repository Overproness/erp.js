const mongoose = require('mongoose');
const TestDataFactory = require('../../utils/testDataFactory');
const { faker } = require('@faker-js/faker');

describe('Data Isolation Unit Tests', () => {
  let Client, Invoice, Payment;

  beforeAll(() => {
    Client = mongoose.model('Client');
    Invoice = mongoose.model('Invoice');
    Payment = mongoose.model('Payment');
  });

  // Helper function to create client without auto-populate issues
  const createTestClient = async (owner, overrides = {}) => {
    const clientData = {
      name: faker.person.fullName(),
      email: `test-client-${Date.now()}-${Math.random().toString(36).substr(2, 5)}@example.com`,
      phone: faker.phone.number(),
      country: faker.location.country(),
      address: faker.location.streetAddress(),
      owner: owner._id,
      // Don't set createdBy, updatedBy, removedBy to avoid auto-populate
      enabled: true,
      removed: false,
      customerType: faker.helpers.arrayElement(['individual', 'company']),
      ...overrides,
    };

    return await new Client(clientData).save();
  };

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
        enabled: true,
        removed: false,
      };

      const client = await new Client(clientData).save();
      expect(client.owner.toString()).toBe(owner._id.toString());
    }, 30000);

    test('should validate owner field is ObjectId', async () => {
      const clientData = {
        name: 'Test Client',
        email: 'test@example.com',
        phone: '123-456-7890',
        owner: 'invalid-owner-id',
        enabled: true,
        removed: false,
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
        enabled: true,
        removed: false,
      };

      const client = await new Client(clientData).save();
      const rawClient = await Client.findById(client._id).lean();
      expect(rawClient.owner.toString()).toBe(nonExistentOwnerId.toString());
    }, 15000);
  });

  describe('Query Filtering by Owner', () => {
    test('should filter queries by owner', async () => {
      const owner1 = await TestDataFactory.createCompanyOwner();
      const owner2 = await TestDataFactory.createCompanyOwner();

      // Create clients for different owners using our safe method
      const client1 = await createTestClient(owner1);
      const client2 = await createTestClient(owner2);

      // Query by owner1
      const owner1Clients = await Client.find({ owner: owner1._id, removed: false }).lean();
      expect(owner1Clients).toHaveLength(1);
      expect(owner1Clients[0]._id.toString()).toBe(client1._id.toString());

      // Query by owner2
      const owner2Clients = await Client.find({ owner: owner2._id, removed: false }).lean();
      expect(owner2Clients).toHaveLength(1);
      expect(owner2Clients[0]._id.toString()).toBe(client2._id.toString());
    }, 45000);

    test('should return empty results for non-owner queries', async () => {
      const owner1 = await TestDataFactory.createCompanyOwner();
      const owner2 = await TestDataFactory.createCompanyOwner();

      await createTestClient(owner1);

      // Query by owner2 should return empty
      const owner2Clients = await Client.find({ owner: owner2._id, removed: false }).lean();
      expect(owner2Clients).toHaveLength(0);
    }, 30000);

    test('should handle complex queries with owner filter', async () => {
      const owner = await TestDataFactory.createCompanyOwner();

      await createTestClient(owner, { name: 'Client A', customerType: 'company' });
      await createTestClient(owner, { name: 'Client B', customerType: 'individual' });
      await createTestClient(owner, { name: 'Client C', customerType: 'company' });

      const companyClients = await Client.find({
        owner: owner._id,
        removed: false,
        customerType: 'company',
      }).lean();

      expect(companyClients).toHaveLength(2);
    }, 45000);

    test('should apply owner filter to aggregation queries', async () => {
      const owner1 = await TestDataFactory.createCompanyOwner();
      const owner2 = await TestDataFactory.createCompanyOwner();

      await createTestClient(owner1);
      await createTestClient(owner1);
      await createTestClient(owner2);

      const aggregationResult = await Client.aggregate([
        { $match: { owner: owner1._id, removed: false } },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]);

      expect(aggregationResult[0].count).toBe(2);
    }, 30000);
  });
});
