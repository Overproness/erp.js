const request = require('supertest');
const app = require('../src/app');

describe('Export Endpoint Debug', () => {
  let authToken;
  let testOwner;

  beforeEach(async () => {
    // Create company owner using global test utils
    testOwner = await global.testUtils.createTestCompanyOwner();

    // Generate token using TestDataFactory directly like other tests
    const TestDataFactory = require('./utils/testDataFactory');
    authToken = await TestDataFactory.generateValidToken(testOwner, true);
  });

  test('debug export endpoint response', async () => {
    console.log('=== EXPORT DEBUG TEST ===');

    // Create some test clients first
    const client1 = await global.testUtils.createTestClient(testOwner);
    const client2 = await global.testUtils.createTestClient(testOwner);
    console.log(`Created ${2} test clients for owner: ${testOwner._id}`);

    const response = await request(app)
      .get('/api/client/export?format=json')
      .set('Authorization', `Bearer ${authToken}`);

    console.log('Export response status:', response.status);
    console.log('Export response headers:', JSON.stringify(response.headers, null, 2));
    console.log('Export response body:', JSON.stringify(response.body, null, 2));
    console.log('Export response text:', response.text);

    // Ensure we can see the error
    expect(response.status).toBeGreaterThan(0);
  });
});
