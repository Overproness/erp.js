const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { describe, test, beforeAll, afterAll, afterEach, expect } = require('@jest/globals');

describe('Controllers Tests', () => {
  let mongoServer;
  let app;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Load all required models
    require('../../../src/models/coreModels/CompanyOwner');
    require('../../../src/models/coreModels/CompanyOwnerPassword');
    require('../../../src/models/coreModels/Setting');
    require('../../../src/models/appModels/Client');
    require('../../../src/models/appModels/Invoice');
    require('../../../src/models/appModels/Quote');
    require('../../../src/models/appModels/Payment');
    require('../../../src/models/appModels/PaymentMode');
    require('../../../src/models/appModels/Taxes');
    require('../../../src/models/appModels/User');
    require('../../../src/models/appModels/Team');
    require('../../../src/models/appModels/Task');
    require('../../../src/models/appModels/Document');

    // Setup express app for testing
    app = express();
    app.use(express.json());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('CRUD Controller Factory', () => {
    let createCRUDController;
    let Model;

    beforeAll(() => {
      createCRUDController = require('../../../src/controllers/middlewaresControllers/createCRUDController');
      Model = mongoose.model('Client');
    });

    test('should create CRUD controller with all methods', () => {
      const controller = createCRUDController('Client');

      expect(controller).toBeDefined();
      expect(typeof controller.create).toBe('function');
      expect(typeof controller.read).toBe('function');
      expect(typeof controller.update).toBe('function');
      expect(typeof controller.delete).toBe('function');
      expect(typeof controller.list).toBe('function');
      expect(typeof controller.listAll).toBe('function');
      expect(typeof controller.search).toBe('function');
      expect(typeof controller.filter).toBe('function');
      expect(typeof controller.summary).toBe('function');
    });

    test('should throw error for non-existent model', () => {
      expect(() => {
        createCRUDController('NonExistentModel');
      }).toThrow('Model NonExistentModel does not exist');
    });

    test('create method should create new document', async () => {
      const controller = createCRUDController('Client');
      const mockReq = {
        body: {
          name: 'Test Client',
          email: 'test@example.com',
          phone: '+1234567890',
        },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await controller.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            name: 'Test Client',
            email: 'test@example.com',
          }),
        })
      );
    });

    test('read method should fetch document by ID', async () => {
      // Create a test document first
      const client = await Model.create({
        name: 'Test Client',
        email: 'test@example.com',
      });

      const controller = createCRUDController('Client');
      const mockReq = {
        params: { id: client._id.toString() },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await controller.read(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            _id: client._id,
            name: 'Test Client',
          }),
        })
      );
    });

    test('read method should return 404 for non-existent document', async () => {
      const controller = createCRUDController('Client');
      const mockReq = {
        params: { id: new mongoose.Types.ObjectId().toString() },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await controller.read(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });

    test('update method should modify existing document', async () => {
      // Create a test document first
      const client = await Model.create({
        name: 'Test Client',
        email: 'test@example.com',
      });

      const controller = createCRUDController('Client');
      const mockReq = {
        params: { id: client._id.toString() },
        body: { name: 'Updated Client Name' },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await controller.update(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            name: 'Updated Client Name',
          }),
        })
      );
    });

    test('delete method should remove document', async () => {
      // Create a test document first
      const client = await Model.create({
        name: 'Test Client',
        email: 'test@example.com',
      });

      const controller = createCRUDController('Client');
      const mockReq = {
        params: { id: client._id.toString() },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await controller.delete(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );

      // Verify document is marked as removed
      const removedClient = await Model.findById(client._id);
      expect(removedClient.removed).toBe(true);
    });

    test('list method should return paginated results', async () => {
      // Create test documents
      await Model.create([
        { name: 'Client 1', email: 'client1@example.com' },
        { name: 'Client 2', email: 'client2@example.com' },
        { name: 'Client 3', email: 'client3@example.com' },
      ]);

      const controller = createCRUDController('Client');
      const mockReq = {
        query: { page: 1, items: 2 },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await controller.list(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.arrayContaining([expect.objectContaining({ name: expect.any(String) })]),
          pagination: expect.objectContaining({
            page: 1,
            pages: expect.any(Number),
            count: expect.any(Number),
          }),
        })
      );
    });

    test('search method should filter results by query', async () => {
      // Create test documents
      await Model.create([
        { name: 'ACME Corporation', email: 'contact@acme.com' },
        { name: 'Tech Solutions', email: 'info@techsolutions.com' },
        { name: 'ACME Industries', email: 'contact@acmeindustries.com' },
      ]);

      const controller = createCRUDController('Client');
      const mockReq = {
        query: { q: 'ACME' },
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await controller.search(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.arrayContaining([
            expect.objectContaining({ name: expect.stringContaining('ACME') }),
          ]),
        })
      );
    });
  });

  describe('Client Controller', () => {
    let clientController;

    beforeAll(() => {
      clientController = require('../../../src/controllers/appControllers/clientController');
    });

    test('should have all required methods', () => {
      expect(clientController).toBeDefined();
      expect(typeof clientController.create).toBe('function');
      expect(typeof clientController.read).toBe('function');
      expect(typeof clientController.update).toBe('function');
      expect(typeof clientController.delete).toBe('function');
      expect(typeof clientController.list).toBe('function');
      expect(typeof clientController.search).toBe('function');
      expect(typeof clientController.summary).toBe('function');
    });

    test('summary method should return client statistics', async () => {
      // Create test clients
      const Client = mongoose.model('Client');
      await Client.create([
        { name: 'Active Client 1', email: 'active1@example.com', isActive: true },
        { name: 'Active Client 2', email: 'active2@example.com', isActive: true },
        { name: 'Inactive Client', email: 'inactive@example.com', isActive: false },
      ]);

      const mockReq = { query: {} };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await clientController.summary(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            totalClients: expect.any(Number),
            active: expect.any(Number),
            new: expect.any(Number),
          }),
        })
      );
    });
  });

  describe('Invoice Controller', () => {
    let invoiceController;
    let testClient;

    beforeAll(() => {
      invoiceController = require('../../../src/controllers/appControllers/invoiceController');
    });

    beforeEach(async () => {
      const Client = mongoose.model('Client');
      testClient = await Client.create({
        name: 'Test Client',
        email: 'client@example.com',
      });
    });

    test('should have all required methods', () => {
      expect(invoiceController).toBeDefined();
      expect(typeof invoiceController.create).toBe('function');
      expect(typeof invoiceController.read).toBe('function');
      expect(typeof invoiceController.update).toBe('function');
      expect(typeof invoiceController.delete).toBe('function');
      expect(typeof invoiceController.summary).toBe('function');
      expect(typeof invoiceController.mail).toBe('function');
    });

    test('create method should create invoice with proper validation', async () => {
      const mockReq = {
        body: {
          number: 'INV-2024-001',
          client: testClient._id,
          items: [
            {
              name: 'Web Development',
              description: 'Frontend development',
              quantity: 1,
              price: 5000,
              total: 5000,
            },
          ],
          subtotal: 5000,
          taxRate: 0.1,
          taxAmount: 500,
          total: 5500,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await invoiceController.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            number: 'INV-2024-001',
            total: 5500,
          }),
        })
      );
    });

    test('summary method should return invoice statistics', async () => {
      const Invoice = mongoose.model('Invoice');

      // Create test invoices
      await Invoice.create([
        {
          number: 'INV-001',
          client: testClient._id,
          items: [{ name: 'Service', quantity: 1, price: 1000, total: 1000 }],
          subtotal: 1000,
          total: 1000,
          status: 'paid',
        },
        {
          number: 'INV-002',
          client: testClient._id,
          items: [{ name: 'Service', quantity: 1, price: 2000, total: 2000 }],
          subtotal: 2000,
          total: 2000,
          status: 'pending',
        },
      ]);

      const mockReq = { query: {} };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await invoiceController.summary(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            totalInvoices: expect.any(Number),
            totalAmount: expect.any(Number),
            paidAmount: expect.any(Number),
            pendingAmount: expect.any(Number),
          }),
        })
      );
    });
  });

  describe('Team Controller', () => {
    let teamController;

    beforeAll(() => {
      teamController = require('../../../src/controllers/appControllers/teamController');
    });

    test('should have all required methods', () => {
      expect(teamController).toBeDefined();
      expect(typeof teamController.create).toBe('function');
      expect(typeof teamController.read).toBe('function');
      expect(typeof teamController.update).toBe('function');
      expect(typeof teamController.delete).toBe('function');
      expect(typeof teamController.list).toBe('function');
      expect(typeof teamController.inviteMember).toBe('function');
      expect(typeof teamController.acceptInvitation).toBe('function');
      expect(typeof teamController.listMembers).toBe('function');
      expect(typeof teamController.removeMember).toBe('function');
    });

    test('create method should create team with validation', async () => {
      const mockReq = {
        body: {
          name: 'Development Team',
          description: 'Main development team',
          type: 'development',
        },
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await teamController.create(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            name: 'Development Team',
            type: 'development',
          }),
        })
      );
    });

    test('inviteMember method should create invitation', async () => {
      const Team = mongoose.model('Team');
      const team = await Team.create({
        name: 'Test Team',
        description: 'A test team',
      });

      const mockReq = {
        params: { id: team._id.toString() },
        body: {
          email: 'newmember@example.com',
          role: 'member',
        },
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await teamController.inviteMember(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('invitation'),
        })
      );
    });
  });

  describe('Settings Controller', () => {
    let settingController;

    beforeAll(() => {
      settingController = require('../../../src/controllers/coreControllers/settingController');
    });

    test('should have all required methods', () => {
      expect(settingController).toBeDefined();
      expect(typeof settingController.create).toBe('function');
      expect(typeof settingController.read).toBe('function');
      expect(typeof settingController.update).toBe('function');
      expect(typeof settingController.list).toBe('function');
      expect(typeof settingController.readBySettingKey).toBe('function');
      expect(typeof settingController.updateBySettingKey).toBe('function');
    });

    test('readBySettingKey should fetch setting by key', async () => {
      const Setting = mongoose.model('Setting');
      await Setting.create({
        settingCategory: 'general',
        settingKey: 'app_name',
        settingValue: 'My Application',
      });

      const mockReq = {
        params: { settingKey: 'app_name' },
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await settingController.readBySettingKey(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            settingKey: 'app_name',
            settingValue: 'My Application',
          }),
        })
      );
    });

    test('updateBySettingKey should update setting by key', async () => {
      const Setting = mongoose.model('Setting');
      await Setting.create({
        settingCategory: 'general',
        settingKey: 'app_name',
        settingValue: 'My Application',
      });

      const mockReq = {
        params: { settingKey: 'app_name' },
        body: { settingValue: 'Updated Application Name' },
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await settingController.updateBySettingKey(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            settingValue: 'Updated Application Name',
          }),
        })
      );
    });
  });

  describe('Auth Controller', () => {
    let adminAuth;

    beforeAll(() => {
      adminAuth = require('../../../src/controllers/coreControllers/adminAuth');
    });

    test('should have all required auth methods', () => {
      expect(adminAuth).toBeDefined();
      expect(typeof adminAuth.login).toBe('function');
      expect(typeof adminAuth.register).toBe('function');
      expect(typeof adminAuth.logout).toBe('function');
      expect(typeof adminAuth.forgetPassword).toBe('function');
      expect(typeof adminAuth.resetPassword).toBe('function');
      expect(typeof adminAuth.isValidAuthToken).toBe('function');
    });

    test('register method should create new admin', async () => {
      const mockReq = {
        body: {
          name: 'Test Admin',
          email: 'admin@example.com',
          password: 'TestPassword123!',
        },
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        cookie: jest.fn(),
      };

      await adminAuth.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            name: 'Test Admin',
            email: 'admin@example.com',
          }),
        })
      );
    });

    test('login method should authenticate user', async () => {
      // First create a user
      const bcrypt = require('bcryptjs');
      const CompanyOwner = mongoose.model('CompanyOwner');
      const CompanyOwnerPassword = mongoose.model('CompanyOwnerPassword');

      const user = await CompanyOwner.create({
        name: 'Test User',
        email: 'user@example.com',
        enabled: true,
      });

      const salt = bcrypt.genSaltSync(10);
      const password = 'TestPassword123!';

      await CompanyOwnerPassword.create({
        user: user._id,
        salt: salt,
        password: bcrypt.hashSync(salt + password),
        emailVerified: true,
      });

      const mockReq = {
        body: {
          email: 'user@example.com',
          password: 'TestPassword123!',
        },
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        cookie: jest.fn(),
      };

      await adminAuth.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            _id: user._id,
            name: 'Test User',
            email: 'user@example.com',
          }),
        })
      );
    });
  });
});
