const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Optimized test setup with faster database connection
let mongoServer;

const setupTestDatabase = async () => {
  try {
    console.log('Setting up optimized test database...');

    // Create MongoDB Memory Server with minimal configuration for speed
    mongoServer = await MongoMemoryServer.create({
      instance: {
        port: 0, // Random available port
        ip: '127.0.0.1',
      },
      binary: {
        version: '4.4.18', // Use older, stable version for faster startup
        downloadDir: './tmp/mongodb-binaries',
      },
    });

    const mongoUri = mongoServer.getUri();
    console.log('MongoDB Memory Server started');

    // Close any existing connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Connect with optimized settings for tests
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000, // Reduced from 5000
      connectTimeoutMS: 3000, // Reduced from 5000
      maxPoolSize: 1, // Keep minimal for tests
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
    });

    console.log('Connected to optimized test database');

    // Load essential models only
    require('../../src/models/coreModels/CompanyOwner');
    require('../../src/models/coreModels/CompanyOwnerPassword');
    require('../../src/models/coreModels/Setting');
    require('../../src/models/appModels/Client');
    require('../../src/models/appModels/Invoice');
    require('../../src/models/appModels/Payment');
    require('../../src/models/appModels/Quote');

    console.log('Essential models loaded');
    return true;
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
};

const cleanupTestDatabase = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      const collections = mongoose.connection.collections;
      const cleanupPromises = [];

      for (const key in collections) {
        const collection = collections[key];
        cleanupPromises.push(collection.deleteMany({}));
      }

      await Promise.all(cleanupPromises);
    }
  } catch (error) {
    console.warn('Cleanup warning:', error.message);
  }
};

const teardownTestDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    if (mongoServer) {
      await mongoServer.stop();
    }

    console.log('Test database cleanup completed');
  } catch (error) {
    console.warn('Teardown warning:', error.message);
  }
};

module.exports = {
  setupTestDatabase,
  cleanupTestDatabase,
  teardownTestDatabase,
};
