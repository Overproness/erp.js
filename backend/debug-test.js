const mongoose = require('mongoose');

console.log('Starting debug test...');

// Test 1: Check if basic mongoose connection works
async function testMongooseConnection() {
  console.log('Test 1: Testing mongoose connection...');
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    console.log('Creating mongo memory server...');

    const mongoServer = await MongoMemoryServer.create();
    console.log('MongoDB memory server created');

    const mongoUri = mongoServer.getUri();
    console.log('MongoDB URI obtained:', mongoUri);

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

    await mongoServer.stop();
    console.log('MongoDB server stopped');

    console.log('✅ Test 1: Mongoose connection works');
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
    process.exit(1);
  }
}

// Test 2: Check if model loading works
async function testModelLoading() {
  console.log('Test 2: Testing model loading...');
  try {
    require('./src/models/coreModels/CompanyOwner');
    console.log('CompanyOwner model loaded');

    require('./src/models/coreModels/CompanyOwnerPassword');
    console.log('CompanyOwnerPassword model loaded');

    require('./src/models/appModels/Client');
    console.log('Client model loaded');

    console.log('✅ Test 2: Model loading works');
  } catch (error) {
    console.error('❌ Test 2 failed:', error);
    process.exit(1);
  }
}

// Test 3: Check TestDataFactory
async function testDataFactory() {
  console.log('Test 3: Testing TestDataFactory...');
  try {
    const TestDataFactory = require('./utils/testDataFactory');
    console.log('TestDataFactory loaded');

    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    console.log('Creating company owner...');
    const owner = await TestDataFactory.createCompanyOwner();
    console.log('Company owner created:', owner._id);

    await mongoose.disconnect();
    await mongoServer.stop();

    console.log('✅ Test 3: TestDataFactory works');
  } catch (error) {
    console.error('❌ Test 3 failed:', error);
    process.exit(1);
  }
}

async function runDebugTests() {
  console.log('🔍 Running debug tests to identify the issue...');

  await testMongooseConnection();
  await testModelLoading();
  await testDataFactory();

  console.log('🎉 All debug tests passed! The issue might be elsewhere.');
}

// Add timeout to prevent hanging
const timeout = setTimeout(() => {
  console.error('❌ Debug tests timed out after 30 seconds');
  process.exit(1);
}, 30000);

runDebugTests()
  .then(() => {
    clearTimeout(timeout);
    console.log('Debug tests completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    clearTimeout(timeout);
    console.error('Debug tests failed:', error);
    process.exit(1);
  });
