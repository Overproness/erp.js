const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Simple test to verify basic functionality
describe('Database Connection Test', () => {
  let mongoServer;

  beforeAll(async () => {
    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '5.0.0',
      },
    });
    const mongoUri = mongoServer.getUri();

    // Connect to the in-memory database
    await mongoose.connect(mongoUri);

    // Load models
    require('../../src/models/coreModels/CompanyOwner');
    require('../../src/models/coreModels/CompanyOwnerPassword');
    require('../../src/models/appModels/Client');
  }, 60000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  test('should connect to database', () => {
    expect(mongoose.connection.readyState).toBe(1);
  });

  test('should create and save a company owner', async () => {
    const CompanyOwner = mongoose.model('CompanyOwner');

    const owner = new CompanyOwner({
      name: 'Test Owner',
      email: 'test@example.com',
      role: 'owner',
      enabled: true,
      onboardingComplete: true,
    });

    const savedOwner = await owner.save();

    expect(savedOwner).toBeDefined();
    expect(savedOwner._id).toBeDefined();
    expect(savedOwner.email).toBe('test@example.com');
  });

  test('should create and save a client', async () => {
    const CompanyOwner = mongoose.model('CompanyOwner');
    const Client = mongoose.model('Client');

    // Create owner first
    const owner = new CompanyOwner({
      name: 'Test Owner',
      email: 'owner@example.com',
      role: 'owner',
      enabled: true,
      onboardingComplete: true,
    });
    const savedOwner = await owner.save();

    // Create client
    const client = new Client({
      name: 'Test Client',
      email: 'client@example.com',
      phone: '+1234567890',
      owner: savedOwner._id,
      customerType: 'company',
      enabled: true,
      removed: false,
    });

    const savedClient = await client.save();

    expect(savedClient).toBeDefined();
    expect(savedClient._id).toBeDefined();
    expect(savedClient.name).toBe('Test Client');
    expect(savedClient.owner.toString()).toBe(savedOwner._id.toString());
  });
});
