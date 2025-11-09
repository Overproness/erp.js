const mongoose = require('mongoose');

/**
 * Ensure all models are registered for testing
 */
function registerModels() {
  // Core models
  require('../../src/models/coreModels/CompanyOwner');
  require('../../src/models/coreModels/CompanyOwnerPassword');
  require('../../src/models/coreModels/Setting');

  // App models
  require('../../src/models/appModels/User');
  require('../../src/models/appModels/Team');
  require('../../src/models/appModels/Document');
  require('../../src/models/appModels/Client');
  require('../../src/models/appModels/Invoice');
  require('../../src/models/appModels/Quote');
  require('../../src/models/appModels/Payment');
  require('../../src/models/appModels/PaymentMode');
  require('../../src/models/appModels/Taxes');
  require('../../src/models/appModels/auditTrailModel');
  require('../../src/models/appModels/Task');
  require('../../src/models/appModels/Workflow');
  require('../../src/models/WorkflowExecution');
  require('../../src/models/appModels/SavedSearch');
}

/**
 * Setup test database and models
 */
async function setupTestDatabase() {
  // Register all models first
  registerModels();

  // Clear all collections before running tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
}

/**
 * Cleanup test database
 */
async function cleanupTestDatabase() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
}

module.exports = {
  registerModels,
  setupTestDatabase,
  cleanupTestDatabase,
};
