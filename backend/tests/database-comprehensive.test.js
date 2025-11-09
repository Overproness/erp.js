const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { describe, test, expect, beforeAll, afterAll, beforeEach } = require('@jest/globals');

describe('Database Connectivity and Model Tests', () => {
  let mongoServer;
  let testConnection;

  beforeAll(async () => {
    // Create a dedicated test database connection
    mongoServer = await MongoMemoryServer.create({
      instance: {
        port: 0,
        ip: '127.0.0.1',
      },
      binary: {
        version: '5.0.0',
        downloadDir: './tmp/mongodb-binaries',
      },
    });

    const mongoUri = mongoServer.getUri();

    // Create separate connection for these tests
    testConnection = await mongoose.createConnection(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      maxPoolSize: 1,
    });
  });

  afterAll(async () => {
    if (testConnection) {
      await testConnection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    // Clear all collections before each test
    const collections = testConnection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('Database Connection Tests', () => {
    test('should establish database connection', () => {
      expect(testConnection.readyState).toBe(1); // Connected
      expect(testConnection.db).toBeDefined();
    });

    test('should handle database operations', async () => {
      const testCollection = testConnection.collection('test');

      // Insert a document
      const insertResult = await testCollection.insertOne({ name: 'test', value: 123 });
      expect(insertResult.acknowledged).toBe(true);
      expect(insertResult.insertedId).toBeDefined();

      // Find the document
      const foundDoc = await testCollection.findOne({ name: 'test' });
      expect(foundDoc).toBeDefined();
      expect(foundDoc.value).toBe(123);

      // Update the document
      const updateResult = await testCollection.updateOne(
        { name: 'test' },
        { $set: { value: 456 } }
      );
      expect(updateResult.modifiedCount).toBe(1);

      // Delete the document
      const deleteResult = await testCollection.deleteOne({ name: 'test' });
      expect(deleteResult.deletedCount).toBe(1);
    });

    test('should handle connection errors gracefully', async () => {
      // Test with invalid connection string
      const invalidConnection = mongoose.createConnection();
      expect(invalidConnection.readyState).toBe(0); // Disconnected
      invalidConnection.close();
    });
  });

  describe('Model Loading Tests', () => {
    test('should load core models without errors', () => {
      expect(() => {
        require('../../src/models/coreModels/CompanyOwner');
        require('../../src/models/coreModels/CompanyOwnerPassword');
        require('../../src/models/coreModels/Setting');
      }).not.toThrow();
    });

    test('should load app models without errors', () => {
      expect(() => {
        require('../../src/models/appModels/User');
        require('../../src/models/appModels/Team');
        require('../../src/models/appModels/Document');
        require('../../src/models/appModels/Client');
        require('../../src/models/appModels/Invoice');
        require('../../src/models/appModels/Quote');
        require('../../src/models/appModels/Payment');
      }).not.toThrow();
    });

    test('should verify model schemas are properly defined', () => {
      const CompanyOwner = require('../../src/models/coreModels/CompanyOwner');
      const Client = require('../../src/models/appModels/Client');
      const Invoice = require('../../src/models/appModels/Invoice');

      // Check if models have schemas
      expect(CompanyOwner.schema).toBeDefined();
      expect(Client.schema).toBeDefined();
      expect(Invoice.schema).toBeDefined();

      // Check if schemas have required fields
      expect(CompanyOwner.schema.paths.email).toBeDefined();
      expect(Client.schema.paths.name).toBeDefined();
      expect(Invoice.schema.paths.number).toBeDefined();
    });
  });

  describe('Database Performance Tests', () => {
    test('should handle bulk operations efficiently', async () => {
      const testCollection = testConnection.collection('performance_test');
      const startTime = Date.now();

      // Insert multiple documents
      const docs = Array.from({ length: 100 }, (_, i) => ({
        name: `doc_${i}`,
        value: i,
        createdAt: new Date(),
      }));

      await testCollection.insertMany(docs);
      const endTime = Date.now();

      // Should complete within reasonable time (5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);

      // Verify all documents were inserted
      const count = await testCollection.countDocuments();
      expect(count).toBe(100);
    });

    test('should handle concurrent operations', async () => {
      const testCollection = testConnection.collection('concurrent_test');

      // Create multiple concurrent operations
      const operations = Array.from({ length: 10 }, async (_, i) => {
        return testCollection.insertOne({ id: i, data: `concurrent_${i}` });
      });

      const results = await Promise.all(operations);

      // All operations should succeed
      results.forEach((result) => {
        expect(result.acknowledged).toBe(true);
      });

      // Verify all documents were inserted
      const count = await testCollection.countDocuments();
      expect(count).toBe(10);
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle validation errors', async () => {
      const testSchema = new mongoose.Schema({
        email: {
          type: String,
          required: true,
          validate: {
            validator: function (v) {
              return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Invalid email format',
          },
        },
      });

      const TestModel = testConnection.model('ValidationTest', testSchema);

      // Test invalid email
      const invalidDoc = new TestModel({ email: 'invalid-email' });

      try {
        await invalidDoc.validate();
        expect(() => {}).toThrow(); // Should have thrown validation error
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.message).toContain('Invalid email format');
      }
    });

    test('should handle duplicate key errors', async () => {
      const testSchema = new mongoose.Schema({
        uniqueField: { type: String, unique: true, required: true },
      });

      const TestModel = testConnection.model('DuplicateTest', testSchema);

      // Create index for unique field
      await TestModel.collection.createIndex({ uniqueField: 1 }, { unique: true });

      // Insert first document
      const doc1 = new TestModel({ uniqueField: 'test-value' });
      await doc1.save();

      // Try to insert duplicate
      const doc2 = new TestModel({ uniqueField: 'test-value' });

      try {
        await doc2.save();
        expect(() => {}).toThrow(); // Should have thrown duplicate key error
      } catch (error) {
        expect(error.code).toBe(11000); // MongoDB duplicate key error code
      }
    });
  });

  describe('Memory and Resource Tests', () => {
    test('should not leak memory during operations', async () => {
      const testCollection = testConnection.collection('memory_test');
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform many operations
      for (let i = 0; i < 50; i++) {
        await testCollection.insertOne({ iteration: i, data: `test_${i}` });
        const docs = await testCollection.find({ iteration: { $lte: i } }).toArray();
        expect(docs).toHaveLength(i + 1);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    test('should properly close connections', async () => {
      const tempConnection = await mongoose.createConnection(mongoServer.getUri());
      expect(tempConnection.readyState).toBe(1);

      await tempConnection.close();
      expect(tempConnection.readyState).toBe(0);
    });
  });
});
