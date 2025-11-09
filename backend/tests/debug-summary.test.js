const request = require('supertest');
const app = require('../src/app');

describe('Summary Endpoint Debug', () => {
  let authToken;
  let testOwner;
  let invoice1, invoice2, payment1, payment2;

  beforeEach(async () => {
    // Create company owner using global test utils
    testOwner = await global.testUtils.createTestCompanyOwner();

    // Generate token using TestDataFactory directly like other tests
    const TestDataFactory = require('./utils/testDataFactory');
    authToken = await TestDataFactory.generateValidToken(testOwner, true);

    // Create test client
    const client = await global.testUtils.createTestClient(testOwner);

    // Create test invoices
    invoice1 = await global.testUtils.createTestInvoice(testOwner, client, {
      total: 1000,
      status: 'pending',
    });

    invoice2 = await global.testUtils.createTestInvoice(testOwner, client, {
      total: 1250,
      status: 'paid',
    });

    // Create test payments
    payment1 = await global.testUtils.createTestPayment(testOwner, client, invoice1, {
      amount: 400,
    });

    payment2 = await global.testUtils.createTestPayment(testOwner, client, invoice2, {
      amount: 400,
    });
  });

  test('debug invoice summary endpoint response', async () => {
    console.log('=== INVOICE SUMMARY DEBUG TEST ===');

    console.log(`Created test data:
      - Owner: ${testOwner._id}
      - Invoice1: ${invoice1._id} (${invoice1.total})
      - Invoice2: ${invoice2._id} (${invoice2.total})
      - Payment1: ${payment1._id} (${payment1.amount})
      - Payment2: ${payment2._id} (${payment2.amount})`);

    const response = await request(app)
      .get('/api/invoice/summary')
      .set('Authorization', `Bearer ${authToken}`);

    console.log('Invoice summary response status:', response.status);
    console.log('Invoice summary response body:', JSON.stringify(response.body, null, 2));

    expect(response.status).toBe(200);
  });

  test('debug payment summary endpoint response', async () => {
    console.log('=== PAYMENT SUMMARY DEBUG TEST ===');

    const response = await request(app)
      .get('/api/payment/summary')
      .set('Authorization', `Bearer ${authToken}`);

    console.log('Payment summary response status:', response.status);
    console.log('Payment summary response body:', JSON.stringify(response.body, null, 2));

    expect(response.status).toBe(200);
  });
});
