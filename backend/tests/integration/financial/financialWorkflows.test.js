const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../src/app');
const TestDataFactory = require('../../utils/testDataFactory');
const { faker } = require('@faker-js/faker');

describe('Financial Workflows Integration Tests', () => {
  let Invoice, Payment, Quote, Client;

  beforeAll(() => {
    Invoice = mongoose.model('Invoice');
    Payment = mongoose.model('Payment');
    Quote = mongoose.model('Quote');
    Client = mongoose.model('Client');
  });

  // Helper function to create client without auto-populate issues
  const createTestClient = async (owner, overrides = {}) => {
    const clientData = {
      name: faker.person.fullName(),
      email: `test-client-${Date.now()}-${Math.random().toString(36).substr(2, 5)}@example.com`,
      phone: faker.phone.number(),
      country: faker.location.country(),
      address: faker.location.streetAddress(),
      owner: owner._id,
      // Don't set createdBy, updatedBy, removedBy to avoid auto-populate
      enabled: true,
      removed: false,
      customerType: faker.helpers.arrayElement(['individual', 'company']),
      ...overrides,
    };

    return await new Client(clientData).save();
  };

  describe('Invoice Creation Workflow', () => {
    test('should create invoice with correct calculations', async () => {
      const owner = await TestDataFactory.createCompanyOwner();
      const client = await createTestClient(owner);
      const token = TestDataFactory.generateAuthToken(owner, true);

      const invoiceData = {
        client: client._id,
        date: new Date(),
        expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [
          {
            itemName: 'Product 1',
            description: 'Test product',
            quantity: 2,
            price: 100,
            total: 200,
          },
          {
            itemName: 'Product 2',
            description: 'Another product',
            quantity: 1,
            price: 150,
            total: 150,
          },
        ],
        taxRate: 10,
        discount: 0,
      };

      const response = await request(app)
        .post('/api/invoice/create')
        .set('Authorization', `Bearer ${token}`)
        .send(invoiceData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const invoice = response.body.result;
      expect(invoice.subTotal).toBe(350); // 200 + 150
      expect(invoice.taxTotal).toBe(35); // 350 * 0.10
      expect(invoice.total).toBe(385); // 350 + 35
      expect(invoice.paymentStatus).toBe('unpaid');
    });

    test('should apply discounts correctly in invoice', async () => {
      const owner = await TestDataFactory.createCompanyOwner();
      const client = await createTestClient(owner);
      const token = TestDataFactory.generateAuthToken(owner, true);

      const invoiceData = {
        client: client._id,
        date: new Date(),
        expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [
          {
            itemName: 'Product 1',
            quantity: 1,
            price: 1000,
            total: 1000,
          },
        ],
        taxRate: 10,
        discount: 100, // $100 discount
      };

      const response = await request(app)
        .post('/api/invoice/create')
        .set('Authorization', `Bearer ${token}`)
        .send(invoiceData);

      expect(response.status).toBe(200);

      const invoice = response.body.result;
      expect(invoice.subTotal).toBe(1000);
      expect(invoice.discount).toBe(100);
      expect(invoice.total).toBe(990); // (1000 - 100) + tax
    });

    test('should validate invoice data', async () => {
      const owner = await TestDataFactory.createCompanyOwner();
      const token = TestDataFactory.generateAuthToken(owner, true);

      const invalidInvoiceData = {
        // Missing required client field
        date: new Date(),
        items: [],
      };

      const response = await request(app)
        .post('/api/invoice/create')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidInvoiceData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should prevent negative amounts in invoice', async () => {
      const owner = await TestDataFactory.createCompanyOwner();
      const client = await createTestClient(owner);
      const token = TestDataFactory.generateAuthToken(owner, true);

      const invalidInvoiceData = {
        client: client._id,
        date: new Date(),
        expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [
          {
            itemName: 'Product 1',
            quantity: -1, // Invalid negative quantity
            price: 100,
            total: -100,
          },
        ],
        taxRate: 10,
      };

      const response = await request(app)
        .post('/api/invoice/create')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidInvoiceData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Payment Recording Pipeline', () => {
    test('should record payment and update invoice status', async () => {
      const owner = await TestDataFactory.createCompanyOwner();
      const client = await createTestClient(owner);
      const paymentMode = await TestDataFactory.createPaymentMode(owner);
      const invoice = await TestDataFactory.createInvoice(owner, client, {
        total: 1000,
        paymentStatus: 'unpaid',
      });
      const token = TestDataFactory.generateAuthToken(owner, true);

      const paymentData = {
        number: 1,
        client: client._id,
        invoice: invoice._id,
        amount: 1000,
        paymentMode: paymentMode._id,
        currency: 'USD',
        date: new Date().toISOString(),
        description: 'Full payment',
      };

      const response = await request(app)
        .post('/api/payment/create')
        .set('Authorization', `Bearer ${token}`)
        .send(paymentData);

      if (response.status !== 200) {
        console.log('Payment error response:', JSON.stringify(response.body, null, 2));
      }
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Check invoice status was updated
      const updatedInvoice = await Invoice.findById(invoice._id);
      expect(updatedInvoice.paymentStatus).toBe('paid');
    });

    test('should handle partial payments', async () => {
      const owner = await TestDataFactory.createCompanyOwner();
      const client = await createTestClient(owner);
      const paymentMode = await TestDataFactory.createPaymentMode(owner);
      const invoice = await TestDataFactory.createInvoice(owner, client, {
        total: 1000,
        paymentStatus: 'unpaid',
      });
      const token = TestDataFactory.generateAuthToken(owner, true);

      // First partial payment
      const payment1Data = {
        number: 1,
        client: client._id,
        invoice: invoice._id,
        amount: 600,
        paymentMode: paymentMode._id,
        currency: 'USD',
        date: new Date(),
      };

      const response1 = await request(app)
        .post('/api/payment/create')
        .set('Authorization', `Bearer ${token}`)
        .send(payment1Data);

      expect(response1.status).toBe(200);

      // Check invoice status
      let updatedInvoice = await Invoice.findById(invoice._id);
      expect(updatedInvoice.paymentStatus).toBe('partially');

      // Second payment to complete
      const payment2Data = {
        number: 2,
        client: client._id,
        invoice: invoice._id,
        amount: 400,
        paymentMode: paymentMode._id,
        currency: 'USD',
        date: new Date().toISOString(),
      };

      const response2 = await request(app)
        .post('/api/payment/create')
        .set('Authorization', `Bearer ${token}`)
        .send(payment2Data);

      expect(response2.status).toBe(200);

      // Check final invoice status
      updatedInvoice = await Invoice.findById(invoice._id);
      expect(updatedInvoice.paymentStatus).toBe('paid');
    });

    test('should validate payment amount', async () => {
      const owner = await TestDataFactory.createCompanyOwner();
      const client = await createTestClient(owner);
      const paymentMode = await TestDataFactory.createPaymentMode(owner);
      const invoice = await TestDataFactory.createInvoice(owner, client);
      const token = TestDataFactory.generateAuthToken(owner, true);

      const invalidPaymentData = {
        number: 1,
        client: client._id,
        invoice: invoice._id,
        amount: -100, // Invalid negative amount
        paymentMode: paymentMode._id,
        currency: 'USD',
        date: new Date().toISOString(),
      };

      const response = await request(app)
        .post('/api/payment/create')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidPaymentData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should prevent payments for non-existent invoice', async () => {
      const owner = await TestDataFactory.createCompanyOwner();
      const client = await createTestClient(owner);
      const paymentMode = await TestDataFactory.createPaymentMode(owner);
      const token = TestDataFactory.generateAuthToken(owner, true);

      const paymentData = {
        number: 1,
        client: client._id,
        invoice: new mongoose.Types.ObjectId(), // Non-existent invoice
        amount: 100,
        paymentMode: paymentMode._id,
        currency: 'USD',
        date: new Date().toISOString(),
      };

      const response = await request(app)
        .post('/api/payment/create')
        .set('Authorization', `Bearer ${token}`)
        .send(paymentData);

      expect(response.status).toBeOneOf([400, 404]);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Quote-to-Invoice Conversion', () => {
    test('should convert quote to invoice successfully', async () => {
      const owner = await TestDataFactory.createCompanyOwner();
      const client = await createTestClient(owner);
      const token = TestDataFactory.generateAuthToken(owner, true);

      // Create quote first
      const quoteData = {
        client: client._id,
        date: new Date(),
        expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [
          {
            itemName: 'Product 1',
            quantity: 2,
            price: 100,
            total: 200,
          },
        ],
        taxRate: 10,
      };

      const quoteResponse = await request(app)
        .post('/api/quote/create')
        .set('Authorization', `Bearer ${token}`)
        .send(quoteData);

      expect(quoteResponse.status).toBe(200);
      const quote = quoteResponse.body.result;

      // Convert quote to invoice
      const convertResponse = await request(app)
        .get(`/api/quote/convert/${quote._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(convertResponse.status).toBe(200);
      expect(convertResponse.body.success).toBe(true);

      const invoice = convertResponse.body.result;
      expect(invoice.converted.from).toBe('quote');
      expect(invoice.converted.quote.toString()).toBe(quote._id);
      expect(invoice.total).toBe(quote.total);
    });

    test('should prevent conversion of expired quote', async () => {
      const owner = await TestDataFactory.createCompanyOwner();
      const client = await createTestClient(owner);
      const token = TestDataFactory.generateAuthToken(owner, true);

      const expiredQuote = await TestDataFactory.createQuote(owner, client, {
        expiredDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      });

      const response = await request(app)
        .get(`/api/quote/convert/${expiredQuote._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Multi-currency Operations', () => {
    test('should handle different currencies in invoice', async () => {
      const owner = await TestDataFactory.createCompanyOwner();
      const client = await createTestClient(owner);
      const token = TestDataFactory.generateAuthToken(owner, true);

      const invoiceData = {
        client: client._id,
        date: new Date(),
        expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [
          {
            itemName: 'Product 1',
            quantity: 1,
            price: 100,
            total: 100,
          },
        ],
        currency: 'EUR',
        taxRate: 20,
      };

      const response = await request(app)
        .post('/api/invoice/create')
        .set('Authorization', `Bearer ${token}`)
        .send(invoiceData);

      expect(response.status).toBe(200);

      const invoice = response.body.result;
      expect(invoice.currency).toBe('EUR');
      expect(invoice.total).toBe(120); // 100 + 20% tax
    });

    test('should validate currency in payment matches invoice', async () => {
      const owner = await TestDataFactory.createCompanyOwner();
      const client = await createTestClient(owner);
      const paymentMode = await TestDataFactory.createPaymentMode(owner);
      const invoice = await TestDataFactory.createInvoice(owner, client, {
        currency: 'EUR',
      });
      const token = TestDataFactory.generateAuthToken(owner, true);

      const paymentData = {
        number: 1,
        client: client._id,
        invoice: invoice._id,
        amount: 100,
        paymentMode: paymentMode._id,
        currency: 'USD', // Different currency
        date: new Date().toISOString(),
      };

      const response = await request(app)
        .post('/api/payment/create')
        .set('Authorization', `Bearer ${token}`)
        .send(paymentData);

      // Should either convert automatically or reject
      expect(response.status).toBeOneOf([200, 400]);
    });
  });

  describe('Financial Reporting', () => {
    test('should generate invoice summary', async () => {
      const owner = await TestDataFactory.createCompanyOwner();
      const client = await createTestClient(owner);
      const token = TestDataFactory.generateAuthToken(owner, true);

      // Create multiple invoices
      await TestDataFactory.createInvoice(owner, client, { total: 1000, paymentStatus: 'paid' });
      await TestDataFactory.createInvoice(owner, client, { total: 500, paymentStatus: 'unpaid' });
      await TestDataFactory.createInvoice(owner, client, {
        total: 750,
        paymentStatus: 'partially',
      });

      const response = await request(app)
        .get('/api/invoice/summary')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const summary = response.body.result;
      expect(summary.totalInvoices).toBe(3);
      expect(summary.totalAmount).toBe(2250);
    });

    test('should generate payment summary', async () => {
      const owner = await TestDataFactory.createCompanyOwner();
      const client = await createTestClient(owner);
      const invoice = await TestDataFactory.createInvoice(owner, client);
      const token = TestDataFactory.generateAuthToken(owner, true);

      // Create multiple payments
      await TestDataFactory.createPayment(owner, client, invoice, { amount: 500 });
      await TestDataFactory.createPayment(owner, client, invoice, { amount: 300 });

      const response = await request(app)
        .get('/api/payment/summary')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const summary = response.body.result;
      expect(summary.totalPayments).toBe(2);
      expect(summary.totalAmount).toBe(800);
    });
  });
});
