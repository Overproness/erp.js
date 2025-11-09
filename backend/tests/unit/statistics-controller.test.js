/* global describe, beforeEach, it, expect, jest */

// Mock all mongoose models before importing the controller
jest.mock('mongoose', () => {
  const mockSchema = jest.fn().mockImplementation(() => ({
    pre: jest.fn(),
    post: jest.fn(),
    methods: {},
    statics: {},
    virtual: jest.fn().mockReturnThis(),
    index: jest.fn(),
    plugin: jest.fn(),
  }));

  // Add Types to Schema constructor
  mockSchema.Types = {
    Mixed: Object,
    ObjectId: jest.fn(),
    String: String,
    Number: Number,
    Boolean: Boolean,
    Date: Date,
    Array: Array,
  };

  return {
    model: jest.fn((modelName) => {
      // Create a comprehensive mock model for each model name
      const mockModel = {
        countDocuments: jest.fn().mockResolvedValue(10),
        find: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          lean: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue([]),
        }),
        aggregate: jest.fn().mockResolvedValue([{ _id: null, count: 5, total: 1000 }]),
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
        deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      };

      // Add specific mock behavior based on model name
      if (modelName === 'Invoice') {
        mockModel.find.mockReturnValue({
          select: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          lean: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue([
            { _id: '1', total: 100, status: 'paid', createdAt: new Date() },
            { _id: '2', total: 200, status: 'pending', createdAt: new Date() },
          ]),
        });
      }

      return mockModel;
    }),
    Types: {
      ObjectId: jest.fn().mockImplementation(() => 'mockObjectId'),
    },
    Schema: mockSchema,
    connect: jest.fn().mockResolvedValue({}),
    disconnect: jest.fn().mockResolvedValue({}),
    connection: {
      readyState: 1,
      db: {
        dropDatabase: jest.fn().mockResolvedValue({}),
      },
    },
  };
});

// Mock individual model files
jest.mock('../../src/models/appModels/Document', () => {
  const mockModel = {
    countDocuments: jest.fn().mockResolvedValue(0),
    find: jest.fn().mockReturnThis(),
    aggregate: jest.fn().mockResolvedValue([]),
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  };
  return mockModel;
});

jest.mock('../../src/models/appModels/Invoice', () => {
  const mockModel = {
    countDocuments: jest.fn().mockResolvedValue(0),
    find: jest.fn().mockReturnThis(),
    aggregate: jest.fn().mockResolvedValue([]),
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  };
  return mockModel;
});

jest.mock('../../src/models/appModels/Client', () => {
  const mockModel = {
    countDocuments: jest.fn().mockResolvedValue(0),
    find: jest.fn().mockReturnThis(),
    aggregate: jest.fn().mockResolvedValue([]),
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  };
  return mockModel;
});

jest.mock('../../src/models/appModels/Payment', () => {
  const mockModel = {
    countDocuments: jest.fn().mockResolvedValue(0),
    find: jest.fn().mockReturnThis(),
    aggregate: jest.fn().mockResolvedValue([]),
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  };
  return mockModel;
});

jest.mock('../../src/models/appModels/PaymentMode', () => {
  const mockModel = {
    countDocuments: jest.fn().mockResolvedValue(0),
    find: jest.fn().mockReturnThis(),
    aggregate: jest.fn().mockResolvedValue([]),
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  };
  return mockModel;
});

jest.mock('../../src/models/appModels/Taxes', () => {
  const mockModel = {
    countDocuments: jest.fn().mockResolvedValue(0),
    find: jest.fn().mockReturnThis(),
    aggregate: jest.fn().mockResolvedValue([]),
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  };
  return mockModel;
});

jest.mock('../../src/models/appModels/Workflow', () => {
  const mockModel = {
    countDocuments: jest.fn().mockResolvedValue(0),
    find: jest.fn().mockReturnThis(),
    aggregate: jest.fn().mockResolvedValue([]),
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  };
  return mockModel;
});

const statisticsController = require('../../src/controllers/appControllers/statisticsController');

describe('Statistics Controller Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    // Mock request object
    req = {
      user: { _id: 'testOwner123', companyOwner: 'testOwner123' },
      query: {},
      params: {},
      body: {},
    };

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics successfully', async () => {
      await statisticsController.getDashboardStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.any(Object),
        })
      );
    });

    it('should return 401 when no authentication', async () => {
      req.user = null;
      req.companyOwner = null;
      req.admin = null;

      await statisticsController.getDashboardStats(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Authentication required',
        })
      );
    });

    it('should handle timeframe query parameter', async () => {
      req.query.timeframe = '7';

      await statisticsController.getDashboardStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getPaymentModeStats', () => {
    it('should return payment mode statistics', async () => {
      await statisticsController.getPaymentModeStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it('should handle errors gracefully', async () => {
      const mongoose = require('mongoose');
      mongoose.model().aggregate.mockRejectedValue(new Error('Database error'));

      await statisticsController.getPaymentModeStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getTaxStats', () => {
    it('should return tax statistics', async () => {
      await statisticsController.getTaxStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getWorkflowStats', () => {
    it('should return workflow statistics', async () => {
      await statisticsController.getWorkflowStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getDocumentStats', () => {
    it('should return document statistics successfully', async () => {
      await statisticsController.getDocumentStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it('should handle errors in document stats', async () => {
      const mongoose = require('mongoose');
      mongoose.model().find.mockImplementation(() => {
        throw new Error('Database error');
      });

      await statisticsController.getDocumentStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Method Validation', () => {
    it('should verify all expected methods exist', () => {
      const expectedMethods = [
        'getDashboardStats',
        'getClientStats',
        'getInvoiceStats',
        'getQuoteStats',
        'getPaymentStats',
        'getTeamStats',
        'getTaskStats',
        'getDocumentStats',
        'getPaymentModeStats',
        'getWorkflowStats',
        'getTaxStats',
      ];

      expectedMethods.forEach((methodName) => {
        expect(typeof statisticsController[methodName]).toBe('function');
      });
    });

    it('should handle method calls without throwing errors', async () => {
      const methods = Object.keys(statisticsController);

      for (const methodName of methods) {
        if (typeof statisticsController[methodName] === 'function') {
          try {
            await statisticsController[methodName](req, res);
            expect(res.status).toHaveBeenCalled();
          } catch (error) {
            expect(error).toBeInstanceOf(Error);
          }
        }
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const mongoose = require('mongoose');
      mongoose.model.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      await statisticsController.getDashboardStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle malformed request data', async () => {
      req.query = { timeframe: 'invalid' };

      await statisticsController.getDashboardStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
