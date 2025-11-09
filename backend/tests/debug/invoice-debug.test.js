const request = require('supertest');
const app = require('@/app');
const mongoose = require('mongoose');
const AuthHelper = require('../utils/authHelper');
const TestDataFactory = require('../utils/testDataFactory');

describe('Invoice Debug Tests', () => {
  let validToken;
  let testClient;
  let owner;

  beforeAll(async () => {
    // Create test owner and get token
    const authResult = await AuthHelper.createAuthenticatedUser(true);
    owner = authResult.user;
    validToken = authResult.token;
    console.log('Test owner created and authenticated successfully');

    // Create a test client first
    const clientData = {
      name: 'Test Client Invoice Debug',
      email: 'testclientinvoicedebug@example.com',
      phone: '123-456-7890',
      address: 'Test Address',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345',
      country: 'Test Country',
    };

    const clientResponse = await request(app)
      .post('/api/client/create')
      .set('Authorization', `Bearer ${validToken}`)
      .send(clientData);

    if (clientResponse.status === 200) {
      testClient = clientResponse.body.result;
      console.log('Test client created successfully');
    } else {
      console.error('Failed to create test client:', clientResponse.body);
      throw new Error('Failed to create test client');
    }
  });

  test('should debug invoice creation error', async () => {
    const invoiceData = {
      year: 2024,
      date: new Date().toISOString(),
      expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      client: testClient._id,
      items: [
        {
          itemName: 'Test Item',
          quantity: 1,
          price: 100,
          total: 100,
        },
      ],
      taxRate: 0,
      currency: 'USD',
    };

    console.log('Invoice data being sent:', JSON.stringify(invoiceData, null, 2));

    const response = await request(app)
      .post('/api/invoice/create')
      .set('Authorization', `Bearer ${validToken}`)
      .send(invoiceData);

    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(response.body, null, 2));

    if (response.status !== 200) {
      console.error('Invoice creation failed!');
      console.error('Error message:', response.body.message);
    }

    expect(response.status).toBe(200);
  });

  afterAll(async () => {
    // Clean up
    if (testClient) {
      await mongoose.model('Client').findByIdAndDelete(testClient._id);
    }
  });
});
