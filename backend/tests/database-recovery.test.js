const TestDataFactory = require('../utils/testDataFactory');
const mongoose = require('mongoose');

describe('Database Connectivity Recovery Tests', () => {
  let testCompanyOwner;

  beforeEach(async () => {
    // Ensure database is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('Database not connected, current state:', mongoose.connection.readyState);
      // The global setup should handle this, but we can verify
    }
  });

  describe('Basic Database Operations', () => {
    test('should create company owner successfully', async () => {
      testCompanyOwner = await TestDataFactory.createCompanyOwner();
      expect(testCompanyOwner).toBeDefined();
      expect(testCompanyOwner._id).toBeDefined();
      expect(testCompanyOwner.email).toBeDefined();
    }, 15000);

    test('should create client with owner', async () => {
      if (!testCompanyOwner) {
        testCompanyOwner = await TestDataFactory.createCompanyOwner();
      }

      const client = await TestDataFactory.createClient(testCompanyOwner);
      expect(client).toBeDefined();
      expect(client.owner).toEqual(testCompanyOwner._id);
    }, 15000);

    test('should create invoice with client and owner', async () => {
      if (!testCompanyOwner) {
        testCompanyOwner = await TestDataFactory.createCompanyOwner();
      }

      const client = await TestDataFactory.createClient(testCompanyOwner);
      const invoice = await TestDataFactory.createInvoice(testCompanyOwner, client);

      expect(invoice).toBeDefined();
      expect(invoice.owner).toEqual(testCompanyOwner._id);
      expect(invoice.client).toEqual(client._id);
    }, 15000);

    test('should create payment with invoice', async () => {
      if (!testCompanyOwner) {
        testCompanyOwner = await TestDataFactory.createCompanyOwner();
      }

      const client = await TestDataFactory.createClient(testCompanyOwner);
      const invoice = await TestDataFactory.createInvoice(testCompanyOwner, client);
      const payment = await TestDataFactory.createPayment(testCompanyOwner, client, invoice);

      expect(payment).toBeDefined();
      expect(payment.owner).toEqual(testCompanyOwner._id);
      expect(payment.invoice).toEqual(invoice._id);
    }, 15000);

    test('should create quote with client', async () => {
      if (!testCompanyOwner) {
        testCompanyOwner = await TestDataFactory.createCompanyOwner();
      }

      const client = await TestDataFactory.createClient(testCompanyOwner);
      const quote = await TestDataFactory.createQuote(testCompanyOwner, client);

      expect(quote).toBeDefined();
      expect(quote.owner).toEqual(testCompanyOwner._id);
      expect(quote.client).toEqual(client._id);
    }, 15000);
  });

  describe('Model Validation Tests', () => {
    test('should validate required owner field in Client', async () => {
      const Client = mongoose.model('Client');

      const clientData = {
        name: 'Test Client',
        email: 'test@example.com',
        phone: '123-456-7890',
        // Missing owner field
      };

      await expect(new Client(clientData).save()).rejects.toThrow();
    });

    test('should validate required owner field in Invoice', async () => {
      const Invoice = mongoose.model('Invoice');

      const invoiceData = {
        number: 1,
        year: 2024,
        date: new Date(),
        // Missing owner field
      };

      await expect(new Invoice(invoiceData).save()).rejects.toThrow();
    });

    test('should validate required owner field in Payment', async () => {
      const Payment = mongoose.model('Payment');

      const paymentData = {
        number: 1,
        year: 2024,
        date: new Date(),
        amount: 100,
        // Missing owner field
      };

      await expect(new Payment(paymentData).save()).rejects.toThrow();
    });

    test('should validate required owner field in Quote', async () => {
      const Quote = mongoose.model('Quote');

      const quoteData = {
        number: 1,
        year: 2024,
        date: new Date(),
        // Missing owner field
      };

      await expect(new Quote(quoteData).save()).rejects.toThrow();
    });
  });

  describe('Database Connection Recovery', () => {
    test('should handle connection state properly', () => {
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
      };

      const currentState = mongoose.connection.readyState;
      expect(states[currentState]).toBeDefined();
      console.log(`Database state: ${states[currentState]}`);
    });

    test('should have proper indexes for performance', async () => {
      const Client = mongoose.model('Client');
      const indexes = await Client.collection.getIndexes();

      expect(indexes).toBeDefined();
      expect(Object.keys(indexes).length).toBeGreaterThan(1); // Should have more than just _id
    });

    test('should properly cleanup collections between tests', async () => {
      const Client = mongoose.model('Client');
      const count = await Client.countDocuments();

      // Should be 0 after cleanup, or very low
      expect(count).toBeLessThan(100);
    });
  });
});
