const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  describe,
  test,
  beforeAll,
  afterAll,
  afterEach,
  expect,
  beforeEach,
  jest,
} = require('@jest/globals');

// Import application controllers
const clientController = require('../../../src/controllers/appControllers/clientController');
const invoiceController = require('../../../src/controllers/appControllers/invoiceController');
const taskController = require('../../../src/controllers/appControllers/taskController');
const teamController = require('../../../src/controllers/appControllers/teamController');
const paymentController = require('../../../src/controllers/appControllers/paymentController');
const quoteController = require('../../../src/controllers/appControllers/quoteController');

describe('Application Controllers', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Load required models
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

  describe('Client Controller', () => {
    let Client;
    let testCompanyOwner;

    beforeAll(() => {
      Client = mongoose.model('Client');
    });

    beforeEach(async () => {
      const CompanyOwner = mongoose.model('CompanyOwner');
      testCompanyOwner = await CompanyOwner.create({
        name: 'Test Owner',
        email: 'owner@example.com',
        role: 'owner',
        enabled: true,
      });
    });

    test('should have all required controller methods', () => {
      expect(clientController).toBeDefined();
      expect(typeof clientController.create).toBe('function');
      expect(typeof clientController.read).toBe('function');
      expect(typeof clientController.update).toBe('function');
      expect(typeof clientController.delete).toBe('function');
      expect(typeof clientController.list).toBe('function');
      expect(typeof clientController.search).toBe('function');
      expect(typeof clientController.summary).toBe('function');
    });

    test('create method should create new client', async () => {
      const req = {
        body: {
          name: 'Test Client',
          email: 'client@example.com',
          phone: '+1234567890',
        },
        companyOwner: testCompanyOwner,
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await clientController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            name: 'Test Client',
            email: 'client@example.com',
          }),
        })
      );
    });

    test('summary method should return client statistics', async () => {
      // Create test clients
      await Client.create({
        name: 'Active Client 1',
        email: 'active1@example.com',
        owner: testCompanyOwner._id,
        isActive: true,
      });
      await Client.create({
        name: 'Active Client 2',
        email: 'active2@example.com',
        owner: testCompanyOwner._id,
        isActive: true,
      });
      await Client.create({
        name: 'Inactive Client',
        email: 'inactive@example.com',
        owner: testCompanyOwner._id,
        isActive: false,
      });

      const req = {
        companyOwner: testCompanyOwner,
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await clientController.summary(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            totalClients: expect.any(Number),
            active: expect.any(Number),
          }),
        })
      );
    });

    test('list method should return paginated clients', async () => {
      // Create test clients
      for (let i = 0; i < 5; i++) {
        await Client.create({
          name: `Client ${i + 1}`,
          email: `client${i + 1}@example.com`,
          owner: testCompanyOwner._id,
        });
      }

      const req = {
        query: { page: 1, items: 3 },
        companyOwner: testCompanyOwner,
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await clientController.list(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.any(Array),
          pagination: expect.objectContaining({
            page: 1,
            count: expect.any(Number),
          }),
        })
      );
    });

    test('search method should find clients by query', async () => {
      await Client.create({
        name: 'ACME Corporation',
        email: 'contact@acme.com',
        owner: testCompanyOwner._id,
      });
      await Client.create({
        name: 'Tech Solutions',
        email: 'info@tech.com',
        owner: testCompanyOwner._id,
      });

      const req = {
        query: { q: 'ACME' },
        companyOwner: testCompanyOwner,
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await clientController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.arrayContaining([expect.objectContaining({ name: 'ACME Corporation' })]),
        })
      );
    });
  });

  describe('Invoice Controller', () => {
    let Invoice;
    let Client;
    let testClient;
    let testCompanyOwner;

    beforeAll(() => {
      Invoice = mongoose.model('Invoice');
      Client = mongoose.model('Client');
    });

    beforeEach(async () => {
      const CompanyOwner = mongoose.model('CompanyOwner');
      testCompanyOwner = await CompanyOwner.create({
        name: 'Test Owner',
        email: 'owner@example.com',
        role: 'owner',
        enabled: true,
      });

      testClient = await Client.create({
        name: 'Test Client',
        email: 'client@example.com',
        owner: testCompanyOwner._id,
      });
    });

    test('should have all required controller methods', () => {
      expect(invoiceController).toBeDefined();
      expect(typeof invoiceController.create).toBe('function');
      expect(typeof invoiceController.read).toBe('function');
      expect(typeof invoiceController.update).toBe('function');
      expect(typeof invoiceController.delete).toBe('function');
      expect(typeof invoiceController.list).toBe('function');
      expect(typeof invoiceController.summary).toBe('function');
    });

    test('create method should create new invoice', async () => {
      const req = {
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
          total: 5000,
        },
        companyOwner: testCompanyOwner,
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await invoiceController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            number: 'INV-2024-001',
            subtotal: 5000,
            total: 5000,
          }),
        })
      );
    });

    test('summary method should return invoice statistics', async () => {
      // Create test invoices
      await Invoice.create({
        number: 'INV-001',
        client: testClient._id,
        owner: testCompanyOwner._id,
        items: [{ name: 'Service', quantity: 1, price: 1000, total: 1000 }],
        subtotal: 1000,
        total: 1000,
        status: 'paid',
      });
      await Invoice.create({
        number: 'INV-002',
        client: testClient._id,
        owner: testCompanyOwner._id,
        items: [{ name: 'Service', quantity: 1, price: 2000, total: 2000 }],
        subtotal: 2000,
        total: 2000,
        status: 'unpaid',
      });

      const req = {
        companyOwner: testCompanyOwner,
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await invoiceController.summary(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            total: expect.any(Number),
            totalPaid: expect.any(Number),
            totalUnpaid: expect.any(Number),
          }),
        })
      );
    });
  });

  describe('Team Controller', () => {
    let Team;
    let testCompanyOwner;

    beforeAll(() => {
      Team = mongoose.model('Team');
    });

    beforeEach(async () => {
      const CompanyOwner = mongoose.model('CompanyOwner');
      testCompanyOwner = await CompanyOwner.create({
        name: 'Test Owner',
        email: 'owner@example.com',
        role: 'owner',
        enabled: true,
      });
    });

    test('should have all required controller methods', () => {
      expect(teamController).toBeDefined();
      expect(typeof teamController.create).toBe('function');
      expect(typeof teamController.read).toBe('function');
      expect(typeof teamController.update).toBe('function');
      expect(typeof teamController.delete).toBe('function');
      expect(typeof teamController.list).toBe('function');
      expect(typeof teamController.inviteMember).toBe('function');
      expect(typeof teamController.acceptInvitation).toBe('function');
      expect(typeof teamController.listMembers).toBe('function');
    });

    test('create method should create new team', async () => {
      const req = {
        body: {
          name: 'Development Team',
          description: 'Main development team',
          type: 'development',
        },
        companyOwner: testCompanyOwner,
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await teamController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            name: 'Development Team',
            description: 'Main development team',
            type: 'development',
          }),
        })
      );
    });

    test('inviteMember method should send invitation', async () => {
      const team = await Team.create({
        name: 'Test Team',
        description: 'A test team',
        owner: testCompanyOwner._id,
      });

      const req = {
        params: { id: team._id.toString() },
        body: {
          email: 'newmember@example.com',
          role: 'member',
        },
        companyOwner: testCompanyOwner,
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await teamController.inviteMember(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('invitation'),
        })
      );
    });

    test('listMembers method should return team members', async () => {
      const team = await Team.create({
        name: 'Test Team',
        description: 'A test team',
        owner: testCompanyOwner._id,
      });

      // Create team members
      const User = mongoose.model('User');
      await User.create({
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com',
        team: team._id,
      });

      const req = {
        params: { id: team._id.toString() },
        companyOwner: testCompanyOwner,
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await teamController.listMembers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.any(Array),
        })
      );
    });
  });

  describe('Task Controller', () => {
    let Task;
    let User;
    let Team;
    let testUser;
    let testTeam;
    let testCompanyOwner;

    beforeAll(() => {
      Task = mongoose.model('Task');
      User = mongoose.model('User');
      Team = mongoose.model('Team');
    });

    beforeEach(async () => {
      const CompanyOwner = mongoose.model('CompanyOwner');
      testCompanyOwner = await CompanyOwner.create({
        name: 'Test Owner',
        email: 'owner@example.com',
        role: 'owner',
        enabled: true,
      });

      testTeam = await Team.create({
        name: 'Test Team',
        description: 'A test team',
        owner: testCompanyOwner._id,
      });

      testUser = await User.create({
        name: 'Test',
        surname: 'User',
        email: 'testuser@example.com',
        team: testTeam._id,
      });
    });

    test('should have all required controller methods', () => {
      expect(taskController).toBeDefined();
      expect(typeof taskController.create).toBe('function');
      expect(typeof taskController.read).toBe('function');
      expect(typeof taskController.update).toBe('function');
      expect(typeof taskController.delete).toBe('function');
      expect(typeof taskController.list).toBe('function');
      expect(typeof taskController.summary).toBe('function');
    });

    test('create method should create new task', async () => {
      const req = {
        body: {
          title: 'Complete project documentation',
          description: 'Write comprehensive documentation',
          assignedTo: testUser._id,
          priority: 'high',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        companyOwner: testCompanyOwner,
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await taskController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            title: 'Complete project documentation',
            priority: 'high',
          }),
        })
      );
    });

    test('summary method should return task statistics', async () => {
      // Create test tasks
      await Task.create({
        title: 'Task 1',
        assignedTo: testUser._id,
        status: 'todo',
        owner: testCompanyOwner._id,
      });
      await Task.create({
        title: 'Task 2',
        assignedTo: testUser._id,
        status: 'in-progress',
        owner: testCompanyOwner._id,
      });
      await Task.create({
        title: 'Task 3',
        assignedTo: testUser._id,
        status: 'completed',
        owner: testCompanyOwner._id,
      });

      const req = {
        companyOwner: testCompanyOwner,
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await taskController.summary(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            total: expect.any(Number),
            todo: expect.any(Number),
            inProgress: expect.any(Number),
            completed: expect.any(Number),
          }),
        })
      );
    });
  });

  describe('Payment Controller', () => {
    let Payment;
    let Invoice;
    let Client;
    let testInvoice;
    let testCompanyOwner;

    beforeAll(() => {
      Payment = mongoose.model('Payment');
      Invoice = mongoose.model('Invoice');
      Client = mongoose.model('Client');
    });

    beforeEach(async () => {
      const CompanyOwner = mongoose.model('CompanyOwner');
      testCompanyOwner = await CompanyOwner.create({
        name: 'Test Owner',
        email: 'owner@example.com',
        role: 'owner',
        enabled: true,
      });

      const testClient = await Client.create({
        name: 'Test Client',
        email: 'client@example.com',
        owner: testCompanyOwner._id,
      });

      testInvoice = await Invoice.create({
        number: 'INV-001',
        client: testClient._id,
        owner: testCompanyOwner._id,
        items: [{ name: 'Service', quantity: 1, price: 1000, total: 1000 }],
        subtotal: 1000,
        total: 1000,
      });
    });

    test('should have all required controller methods', () => {
      expect(paymentController).toBeDefined();
      expect(typeof paymentController.create).toBe('function');
      expect(typeof paymentController.read).toBe('function');
      expect(typeof paymentController.update).toBe('function');
      expect(typeof paymentController.delete).toBe('function');
      expect(typeof paymentController.list).toBe('function');
      expect(typeof paymentController.summary).toBe('function');
    });

    test('create method should create new payment', async () => {
      const req = {
        body: {
          invoice: testInvoice._id,
          amount: 1000,
          paymentDate: new Date(),
          paymentMethod: 'credit_card',
          reference: 'PAY-001',
        },
        companyOwner: testCompanyOwner,
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await paymentController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            amount: 1000,
            paymentMethod: 'credit_card',
            reference: 'PAY-001',
          }),
        })
      );
    });

    test('summary method should return payment statistics', async () => {
      // Create test payments
      await Payment.create({
        invoice: testInvoice._id,
        amount: 500,
        paymentMethod: 'credit_card',
        owner: testCompanyOwner._id,
      });
      await Payment.create({
        invoice: testInvoice._id,
        amount: 300,
        paymentMethod: 'bank_transfer',
        owner: testCompanyOwner._id,
      });

      const req = {
        companyOwner: testCompanyOwner,
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await paymentController.summary(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            total: expect.any(Number),
            totalAmount: expect.any(Number),
          }),
        })
      );
    });
  });

  describe('Quote Controller', () => {
    let Quote;
    let Client;
    let testClient;
    let testCompanyOwner;

    beforeAll(() => {
      Quote = mongoose.model('Quote');
      Client = mongoose.model('Client');
    });

    beforeEach(async () => {
      const CompanyOwner = mongoose.model('CompanyOwner');
      testCompanyOwner = await CompanyOwner.create({
        name: 'Test Owner',
        email: 'owner@example.com',
        role: 'owner',
        enabled: true,
      });

      testClient = await Client.create({
        name: 'Test Client',
        email: 'client@example.com',
        owner: testCompanyOwner._id,
      });
    });

    test('should have all required controller methods', () => {
      expect(quoteController).toBeDefined();
      expect(typeof quoteController.create).toBe('function');
      expect(typeof quoteController.read).toBe('function');
      expect(typeof quoteController.update).toBe('function');
      expect(typeof quoteController.delete).toBe('function');
      expect(typeof quoteController.list).toBe('function');
      expect(typeof quoteController.summary).toBe('function');
      expect(typeof quoteController.convert).toBe('function');
    });

    test('create method should create new quote', async () => {
      const req = {
        body: {
          number: 'QUO-2024-001',
          client: testClient._id,
          items: [
            {
              name: 'Consulting Services',
              description: 'Business consulting',
              quantity: 10,
              price: 150,
              total: 1500,
            },
          ],
          subtotal: 1500,
          total: 1500,
        },
        companyOwner: testCompanyOwner,
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await quoteController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            number: 'QUO-2024-001',
            subtotal: 1500,
            total: 1500,
          }),
        })
      );
    });

    test('convert method should convert quote to invoice', async () => {
      const quote = await Quote.create({
        number: 'QUO-001',
        client: testClient._id,
        owner: testCompanyOwner._id,
        items: [{ name: 'Service', quantity: 1, price: 1000, total: 1000 }],
        subtotal: 1000,
        total: 1000,
      });

      const req = {
        params: { id: quote._id.toString() },
        companyOwner: testCompanyOwner,
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await quoteController.convert(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('converted'),
          result: expect.objectContaining({
            invoiceId: expect.any(String),
          }),
        })
      );
    });

    test('summary method should return quote statistics', async () => {
      // Create test quotes
      await Quote.create({
        number: 'QUO-001',
        client: testClient._id,
        owner: testCompanyOwner._id,
        items: [{ name: 'Service', quantity: 1, price: 1000, total: 1000 }],
        subtotal: 1000,
        total: 1000,
        status: 'draft',
      });
      await Quote.create({
        number: 'QUO-002',
        client: testClient._id,
        owner: testCompanyOwner._id,
        items: [{ name: 'Service', quantity: 1, price: 2000, total: 2000 }],
        subtotal: 2000,
        total: 2000,
        status: 'sent',
      });

      const req = {
        companyOwner: testCompanyOwner,
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await quoteController.summary(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            total: expect.any(Number),
            draft: expect.any(Number),
            sent: expect.any(Number),
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    test('controllers should handle validation errors', async () => {
      const req = {
        body: {
          // Missing required fields
        },
        companyOwner: { _id: 'test-owner-id' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await clientController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });

    test('controllers should handle unauthorized access', async () => {
      const req = {
        body: {
          name: 'Test Client',
          email: 'test@example.com',
        },
        // Missing companyOwner
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await clientController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });

    test('controllers should handle database errors', async () => {
      const req = {
        params: { id: 'invalid-id' },
        companyOwner: { _id: 'test-owner-id' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await clientController.read(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });
  });
});
