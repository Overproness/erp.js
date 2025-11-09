const request = require('supertest');
const app = require('../../src/app');
const { Document, PaymentMode, Tax, Workflow } = require('../../src/models');

// Jest globals are available in the test environment
/* global describe, beforeAll, beforeEach, it, expect, jest */

describe('Statistics Controller API Integration', () => {
  // Mock authentication middleware
  beforeAll(() => {
    // Mock user authentication for tests
    app.use((req, res, next) => {
      req.admin = { _id: 'test-user-id' };
      next();
    });
  });

  describe('GET /api/statistics/documents', () => {
    beforeEach(async () => {
      // Clean up test data
      await Document.deleteMany({});
    });

    it('should return document statistics successfully', async () => {
      // Create test documents
      const testDocuments = [
        {
          title: 'Test PDF',
          documentType: 'PDF',
          fileSize: 1024000, // 1MB
          created: new Date(),
        },
        {
          title: 'Test Word',
          documentType: 'Word',
          fileSize: 2048000, // 2MB
          created: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        },
        {
          title: 'Test Excel',
          documentType: 'Excel',
          fileSize: 512000, // 0.5MB
          created: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        },
      ];

      await Document.insertMany(testDocuments);

      const response = await request(app)
        .get('/api/statistics/documents')
        .query({ timeframe: '30' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result).toHaveProperty('totalDocuments', 3);
      expect(response.body.result).toHaveProperty('newThisMonth');
      expect(response.body.result).toHaveProperty('totalSize', 3584000); // Sum of all file sizes
      expect(response.body.result).toHaveProperty('byType');
      expect(response.body.result.byType).toHaveLength(3);

      // Check document types
      const typeNames = response.body.result.byType.map((t) => t.type);
      expect(typeNames).toContain('PDF');
      expect(typeNames).toContain('Word');
      expect(typeNames).toContain('Excel');
    });

    it('should return empty statistics when no documents exist', async () => {
      const response = await request(app)
        .get('/api/statistics/documents')
        .query({ timeframe: '30' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.totalDocuments).toBe(0);
      expect(response.body.result.newThisMonth).toBe(0);
      expect(response.body.result.totalSize).toBe(0);
      expect(response.body.result.byType).toHaveLength(0);
    });

    it('should filter documents by timeframe correctly', async () => {
      const oldDocument = {
        title: 'Old Document',
        documentType: 'PDF',
        fileSize: 1024000,
        created: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days ago
      };

      const recentDocument = {
        title: 'Recent Document',
        documentType: 'PDF',
        fileSize: 1024000,
        created: new Date(), // Today
      };

      await Document.insertMany([oldDocument, recentDocument]);

      const response = await request(app)
        .get('/api/statistics/documents')
        .query({ timeframe: '30' })
        .expect(200);

      expect(response.body.result.totalDocuments).toBe(2);
      expect(response.body.result.newThisMonth).toBe(1); // Only recent document
    });
  });

  describe('GET /api/statistics/payment-modes', () => {
    beforeEach(async () => {
      await PaymentMode.deleteMany({});
    });

    it('should return payment mode statistics successfully', async () => {
      const testPaymentModes = [
        { name: 'Credit Card', enabled: true, isDefault: false, created: new Date() },
        { name: 'Cash', enabled: true, isDefault: true, created: new Date() },
        { name: 'Bank Transfer', enabled: false, isDefault: false, created: new Date() },
        {
          name: 'PayPal',
          enabled: true,
          isDefault: false,
          created: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
      ];

      await PaymentMode.insertMany(testPaymentModes);

      const response = await request(app)
        .get('/api/statistics/payment-modes')
        .query({ timeframe: '30' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.totalPaymentModes).toBe(4);
      expect(response.body.result.activePaymentModes).toBe(3); // enabled: true
      expect(response.body.result.defaultPaymentModes).toBe(1); // isDefault: true
      expect(response.body.result).toHaveProperty('newThisMonth');
    });

    it('should handle no payment modes gracefully', async () => {
      const response = await request(app)
        .get('/api/statistics/payment-modes')
        .query({ timeframe: '30' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.totalPaymentModes).toBe(0);
      expect(response.body.result.activePaymentModes).toBe(0);
      expect(response.body.result.defaultPaymentModes).toBe(0);
      expect(response.body.result.newThisMonth).toBe(0);
    });
  });

  describe('GET /api/statistics/taxes', () => {
    beforeEach(async () => {
      await Tax.deleteMany({});
    });

    it('should return tax statistics successfully', async () => {
      const testTaxes = [
        { name: 'VAT', taxRate: 20, enabled: true, isDefault: false, created: new Date() },
        { name: 'Sales Tax', taxRate: 8.5, enabled: true, isDefault: true, created: new Date() },
        { name: 'GST', taxRate: 15, enabled: false, isDefault: false, created: new Date() },
        { name: 'Service Tax', taxRate: 12, enabled: true, isDefault: false, created: new Date() },
      ];

      await Tax.insertMany(testTaxes);

      const response = await request(app)
        .get('/api/statistics/taxes')
        .query({ timeframe: '30' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.totalTaxes).toBe(4);
      expect(response.body.result.activeTaxes).toBe(3); // enabled: true
      expect(response.body.result.defaultTaxes).toBe(1); // isDefault: true
      expect(response.body.result.averageRate).toBeCloseTo(13.875); // Average of all tax rates
    });

    it('should calculate average rate correctly for enabled taxes only', async () => {
      const testTaxes = [
        { name: 'VAT', taxRate: 10, enabled: true, isDefault: false, created: new Date() },
        { name: 'Sales Tax', taxRate: 20, enabled: true, isDefault: false, created: new Date() },
        {
          name: 'Disabled Tax',
          taxRate: 100,
          enabled: false,
          isDefault: false,
          created: new Date(),
        },
      ];

      await Tax.insertMany(testTaxes);

      const response = await request(app)
        .get('/api/statistics/taxes')
        .query({ timeframe: '30' })
        .expect(200);

      expect(response.body.result.averageRate).toBe(15); // (10 + 20) / 2
    });
  });

  describe('GET /api/statistics/workflows', () => {
    beforeEach(async () => {
      await Workflow.deleteMany({});
    });

    it('should return workflow statistics successfully', async () => {
      const testWorkflows = [
        {
          name: 'Invoice Approval',
          status: 'active',
          completedTasks: 50,
          averageExecutionTime: 150000, // 2.5 minutes in ms
          created: new Date(),
        },
        {
          name: 'Document Review',
          status: 'active',
          completedTasks: 30,
          averageExecutionTime: 180000, // 3 minutes in ms
          created: new Date(),
        },
        {
          name: 'Archived Workflow',
          status: 'inactive',
          completedTasks: 20,
          averageExecutionTime: 120000, // 2 minutes in ms
          created: new Date(),
        },
      ];

      await Workflow.insertMany(testWorkflows);

      const response = await request(app)
        .get('/api/statistics/workflows')
        .query({ timeframe: '30' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.totalWorkflows).toBe(3);
      expect(response.body.result.activeWorkflows).toBe(2); // status: 'active'
      expect(response.body.result.completedTasks).toBe(100); // Sum of all completed tasks
      expect(response.body.result.averageExecutionTime).toBe('2.5m'); // Formatted average
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock a database error
      const originalFind = Document.find;
      Document.find = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/statistics/documents')
        .query({ timeframe: '30' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Error fetching document statistics');

      // Restore original method
      Document.find = originalFind;
    });

    it('should validate timeframe parameter', async () => {
      const response = await request(app)
        .get('/api/statistics/documents')
        .query({ timeframe: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid timeframe');
    });

    it('should require authentication', async () => {
      // Remove auth middleware mock temporarily
      const app_no_auth = require('../../src/app');

      const response = await request(app_no_auth)
        .get('/api/statistics/documents')
        .query({ timeframe: '30' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should return statistics within acceptable time', async () => {
      // Create a large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        title: `Document ${i}`,
        documentType: 'PDF',
        fileSize: 1024000,
        created: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      }));

      await Document.insertMany(largeDataset);

      const startTime = Date.now();

      const response = await request(app)
        .get('/api/statistics/documents')
        .query({ timeframe: '30' })
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
      expect(response.body.success).toBe(true);
    });
  });
});
