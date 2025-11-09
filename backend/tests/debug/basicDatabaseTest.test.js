const mongoose = require('mongoose');

describe('Basic Database Test', () => {
  test('should connect to database', async () => {
    expect(mongoose.connection.readyState).toBe(1);
  });

  test('should create company owner', async () => {
    const owner = await global.testUtils.createTestCompanyOwner();
    expect(owner).toBeDefined();
    expect(owner._id).toBeDefined();
    expect(owner.email).toBeDefined();
    expect(owner.role).toBe('owner');
  }, 10000);

  test('should create client', async () => {
    const owner = await global.testUtils.createTestCompanyOwner();
    const client = await global.testUtils.createTestClient(owner._id);

    expect(client).toBeDefined();
    expect(client._id).toBeDefined();
    expect(client.name).toBe('Test Client');
    expect(client.owner.toString()).toBe(owner._id.toString());
  }, 15000);
});
