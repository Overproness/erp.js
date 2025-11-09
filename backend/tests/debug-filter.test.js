const request = require('supertest');
const app = require('../src/app');

describe('Client Filter Debug', () => {
  test('should debug filter endpoint response', async () => {
    console.log('Starting debug test...');

    // Create a test token (you'd need to implement this)
    const TestDataFactory = require('./utils/testDataFactory');
    const owner = await global.testUtils.createTestCompanyOwner();
    const token = await TestDataFactory.generateValidToken(owner, true);

    console.log('Test token created');

    const response = await request(app)
      .get('/api/client/filter?customerType=company')
      .set('Authorization', `Bearer ${token}`);

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    console.log('Response body:', response.body);
    console.log('Response text:', response.text);
    console.log('Response error:', response.error);

    // Let's see what we get
    expect(response.status).toBeDefined();
  });
});
