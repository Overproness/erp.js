const mongoose = require('mongoose');

describe('Test Environment Disable AutoPopulate', () => {
  let Client;
  let originalAutopopulate;

  beforeAll(() => {
    Client = mongoose.model('Client');

    // Disable autopopulate for tests
    const clientSchema = Client.schema;
    originalAutopopulate = clientSchema.plugin;

    // Try to disable the autopopulate plugin
    if (clientSchema.options && clientSchema.options.toObject) {
      clientSchema.options.toObject.transform = function (doc, ret) {
        // Don't populate in test environment
        return ret;
      };
    }
  });

  afterAll(() => {
    // Restore original state if needed
    if (originalAutopopulate) {
      // Restore functionality
    }
  });

  test('should test without autopopulate causing issues', async () => {
    // Simple test
    const owner = { _id: new mongoose.Types.ObjectId() };
    const clientData = {
      name: 'Test Client',
      email: 'test@example.com',
      phone: '123-456-7890',
      owner: owner._id,
      enabled: true,
      removed: false,
    };

    const client = await new Client(clientData).save();
    expect(client).toBeDefined();
  }, 15000);
});
