const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const { describe, it, beforeAll, beforeEach, expect, fail } = require('@jest/globals');

describe('App Models', () => {
  let User, Team, Client, Invoice, Quote, Payment, PaymentMode, Document, Task, Project;
  let testOwner;

  beforeAll(async () => {
    // Load models
    User = mongoose.model('User') || require('../../../src/models/appModels/User');
    Team = mongoose.model('Team') || require('../../../src/models/appModels/Team');
    Client = mongoose.model('Client') || require('../../../src/models/appModels/Client');
    Invoice = mongoose.model('Invoice') || require('../../../src/models/appModels/Invoice');
    Quote = mongoose.model('Quote') || require('../../../src/models/appModels/Quote');
    Payment = mongoose.model('Payment') || require('../../../src/models/appModels/Payment');
    PaymentMode =
      mongoose.model('PaymentMode') || require('../../../src/models/appModels/PaymentMode');
    Document = mongoose.model('Document') || require('../../../src/models/appModels/Document');
    Task = mongoose.model('Task') || require('../../../src/models/appModels/Task');
    Project = mongoose.model('Project') || require('../../../src/models/appModels/Project');
  });

  beforeEach(async () => {
    testOwner = await global.testUtils.createTestCompanyOwner();
  });

  describe('User Model', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        role: 'user',
        owner: testOwner._id,
        enabled: true,
      };

      const user = await User.create(userData);

      expect(user).toBeDefined();
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe('user');
      expect(user.owner).toEqual(testOwner._id);
      expect(user.enabled).toBe(true);
    });

    it('should require name, email, and owner fields', async () => {
      try {
        await User.create({});
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
      }
    });

    it('should validate email format', async () => {
      try {
        await User.create({
          name: faker.person.fullName(),
          email: 'invalid-email',
          owner: testOwner._id,
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
      }
    });
  });

  describe('Team Model', () => {
    it('should create a team with valid data', async () => {
      const teamData = {
        name: 'Development Team',
        description: 'Software development team',
        owner: testOwner._id,
        createdBy: testOwner._id,
      };

      const team = await Team.create(teamData);

      expect(team).toBeDefined();
      expect(team.name).toBe(teamData.name);
      expect(team.description).toBe(teamData.description);
      expect(team.owner).toEqual(testOwner._id);
    });

    it('should require name and owner fields', async () => {
      try {
        await Team.create({});
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
      }
    });
  });

  describe('Client Model', () => {
    it('should create a client with valid data', async () => {
      const clientData = {
        name: faker.company.name(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        owner: testOwner._id,
        createdBy: testOwner._id,
        customerType: 'company',
      };

      const client = await Client.create(clientData);

      expect(client).toBeDefined();
      expect(client.name).toBe(clientData.name);
      expect(client.email).toBe(clientData.email);
      expect(client.customerType).toBe('company');
    });

    it('should validate customer type', async () => {
      try {
        await Client.create({
          name: faker.company.name(),
          email: faker.internet.email(),
          owner: testOwner._id,
          customerType: 'invalid-type',
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
      }
    });
  });

  describe('Invoice Model', () => {
    let testClient;

    beforeEach(async () => {
      testClient = await global.testUtils.createTestClient(testOwner._id);
    });

    it('should create an invoice with valid data', async () => {
      const invoiceData = {
        number: 1,
        year: 2024,
        date: new Date(),
        expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        client: testClient._id,
        owner: testOwner._id,
        createdBy: testOwner._id,
        items: [
          {
            itemName: 'Test Service',
            quantity: 2,
            price: 50,
            total: 100,
          },
        ],
        subTotal: 100,
        taxRate: 10,
        taxTotal: 10,
        total: 110,
        currency: 'USD',
        paymentStatus: 'unpaid',
      };

      const invoice = await Invoice.create(invoiceData);

      expect(invoice).toBeDefined();
      expect(invoice.number).toBe(1);
      expect(invoice.year).toBe(2024);
      expect(invoice.total).toBe(110);
      expect(invoice.paymentStatus).toBe('unpaid');
    });

    it('should validate payment status', async () => {
      try {
        await Invoice.create({
          number: 1,
          year: 2024,
          client: testClient._id,
          owner: testOwner._id,
          paymentStatus: 'invalid-status',
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
      }
    });
  });

  describe('Quote Model', () => {
    let testClient;

    beforeEach(async () => {
      testClient = await global.testUtils.createTestClient(testOwner._id);
    });

    it('should create a quote with valid data', async () => {
      const quoteData = {
        number: 1,
        year: 2024,
        date: new Date(),
        expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        client: testClient._id,
        owner: testOwner._id,
        createdBy: testOwner._id,
        items: [
          {
            itemName: 'Consultation Service',
            quantity: 1,
            price: 500,
            total: 500,
          },
        ],
        subTotal: 500,
        taxRate: 0,
        taxTotal: 0,
        total: 500,
        currency: 'USD',
        status: 'draft',
      };

      const quote = await Quote.create(quoteData);

      expect(quote).toBeDefined();
      expect(quote.number).toBe(1);
      expect(quote.total).toBe(500);
      expect(quote.status).toBe('draft');
    });
  });

  describe('Payment Model', () => {
    let testClient, testInvoice;

    beforeEach(async () => {
      testClient = await global.testUtils.createTestClient(testOwner._id);
      testInvoice = await global.testUtils.createTestInvoice(testOwner._id, testClient._id);
    });

    it('should create a payment with valid data', async () => {
      const paymentData = {
        number: 1,
        year: 2024,
        date: new Date(),
        client: testClient._id,
        invoice: testInvoice._id,
        owner: testOwner._id,
        createdBy: testOwner._id,
        amount: 100,
        currency: 'USD',
        paymentMethod: 'bank_transfer',
        description: 'Payment for services',
      };

      const payment = await Payment.create(paymentData);

      expect(payment).toBeDefined();
      expect(payment.amount).toBe(100);
      expect(payment.currency).toBe('USD');
      expect(payment.paymentMethod).toBe('bank_transfer');
    });
  });

  describe('PaymentMode Model', () => {
    it('should create a payment mode with valid data', async () => {
      const paymentModeData = {
        name: 'Credit Card',
        enabled: true,
        owner: testOwner._id,
        createdBy: testOwner._id,
      };

      const paymentMode = await PaymentMode.create(paymentModeData);

      expect(paymentMode).toBeDefined();
      expect(paymentMode.name).toBe('Credit Card');
      expect(paymentMode.enabled).toBe(true);
    });
  });

  describe('Document Model', () => {
    it('should create a document with valid data', async () => {
      const documentData = {
        title: 'Test Document',
        content: 'This is test document content',
        type: 'contract',
        owner: testOwner._id,
        createdBy: testOwner._id,
        status: 'draft',
      };

      const document = await Document.create(documentData);

      expect(document).toBeDefined();
      expect(document.title).toBe('Test Document');
      expect(document.type).toBe('contract');
      expect(document.status).toBe('draft');
    });
  });

  describe('Task Model', () => {
    it('should create a task with valid data', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'This is a test task',
        status: 'pending',
        priority: 'medium',
        owner: testOwner._id,
        createdBy: testOwner._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      const task = await Task.create(taskData);

      expect(task).toBeDefined();
      expect(task.title).toBe('Test Task');
      expect(task.status).toBe('pending');
      expect(task.priority).toBe('medium');
    });
  });

  describe('Project Model', () => {
    it('should create a project with valid data', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'This is a test project',
        status: 'active',
        owner: testOwner._id,
        createdBy: testOwner._id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      const project = await Project.create(projectData);

      expect(project).toBeDefined();
      expect(project.name).toBe('Test Project');
      expect(project.status).toBe('active');
    });
  });
});
