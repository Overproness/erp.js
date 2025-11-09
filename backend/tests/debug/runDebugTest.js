const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const testCreateCompanyOwner = require('./testCreateCompanyOwner');

// Load models
require('../../src/models/coreModels/CompanyOwner');
require('../../src/models/coreModels/CompanyOwnerPassword');

async function runDebugTest() {
  let mongoServer;

  try {
    console.log('🚀 Starting debug test for createCompanyOwner hang...');

    // Start MongoDB Memory Server with timeout
    console.log('Starting MongoDB Memory Server...');
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    console.log('✅ MongoDB Memory Server started');

    // Connect to database
    console.log('Connecting to database...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 10000,
      maxPoolSize: 1,
    });
    console.log('✅ Connected to database');

    // Run the test
    await testCreateCompanyOwner();

    console.log('🎉 Debug test completed successfully!');
  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
    process.exit(1);
  } finally {
    // Cleanup
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('✅ Cleanup completed');
    process.exit(0);
  }
}

runDebugTest();
