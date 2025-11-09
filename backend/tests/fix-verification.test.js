const mongoose = require('mongoose');

describe('Fix Verification Tests', () => {
  test('should load all models without errors', () => {
    expect(() => {
      // Core models
      require('../src/models/coreModels/CompanyOwner');
      require('../src/models/coreModels/CompanyOwnerPassword');
      require('../src/models/coreModels/Setting');
      require('../src/models/coreModels/Counter');

      // App models
      require('../src/models/appModels/User');
      require('../src/models/appModels/Team');
      require('../src/models/appModels/Document'); // Fixed: use Document not documentModel
      require('../src/models/appModels/Client');
      require('../src/models/appModels/Invoice');
      require('../src/models/appModels/Quote');
      require('../src/models/appModels/Payment');
    }).not.toThrow();
  });

  test('should verify TestDataFactory can be loaded', () => {
    expect(() => {
      const TestDataFactory = require('./utils/testDataFactory');
      expect(TestDataFactory).toBeDefined();
      expect(TestDataFactory.createCompanyOwner).toBeDefined();
    }).not.toThrow();
  });

  test('should connect to test database', async () => {
    // This test will be run by the global setup
    expect(mongoose.connection.readyState).toBeGreaterThan(0);
  }, 10000);
});
