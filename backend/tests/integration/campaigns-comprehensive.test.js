const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const { Campaign } = require('../../src/models');

// Jest configuration for testing
jest.setTimeout(30000);

describe('Campaigns Comprehensive Integration Tests', () => {
  let authToken;
  let testCampaign;
  let testUser;

  beforeAll(async () => {
    // Setup test database connection
    await mongoose.connect(
      process.env.TEST_DATABASE_URL || 'mongodb://localhost:27017/test_campaigns',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    // Create test user and get auth token
    const userResponse = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@campaigns.com',
      password: 'testpass123',
      role: 'admin',
    });

    testUser = userResponse.body.user;
    authToken = userResponse.body.token;
  });

  afterAll(async () => {
    // Cleanup test data
    await Campaign.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Create a test campaign for each test
    const campaignData = {
      name: 'Test Campaign',
      type: 'email',
      status: 'draft',
      description: 'Integration test campaign',
      channels: ['email'],
      content: {
        subject: 'Test Subject',
        body: 'Test campaign content',
      },
      targeting: {
        segments: [],
        audience: 'all_customers',
      },
      schedule: {
        type: 'immediate',
        timezone: 'UTC',
      },
      budget: {
        total: 1000,
        currency: 'USD',
      },
    };

    const response = await request(app)
      .post('/api/marketing/campaigns')
      .set('Authorization', `Bearer ${authToken}`)
      .send(campaignData);

    testCampaign = response.body.result;
  });

  afterEach(async () => {
    // Clean up test campaigns
    if (testCampaign) {
      await Campaign.findByIdAndDelete(testCampaign._id);
    }
  });

  describe('Campaign CRUD Operations', () => {
    test('should create campaign with all required fields', async () => {
      const campaignData = {
        name: 'New Test Campaign',
        type: 'email',
        status: 'draft',
        description: 'New integration test campaign',
        channels: ['email', 'sms'],
        content: {
          subject: 'New Test Subject',
          body: 'New test campaign content',
        },
        targeting: {
          segments: [],
          audience: 'segment_based',
        },
        schedule: {
          type: 'scheduled',
          startDate: new Date(Date.now() + 86400000), // Tomorrow
          timezone: 'UTC',
        },
        budget: {
          total: 2000,
          currency: 'USD',
        },
      };

      const response = await request(app)
        .post('/api/marketing/campaigns')
        .set('Authorization', `Bearer ${authToken}`)
        .send(campaignData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.result.name).toBe(campaignData.name);
      expect(response.body.result.type).toBe(campaignData.type);
      expect(response.body.result.channels).toEqual(campaignData.channels);

      // Cleanup
      await Campaign.findByIdAndDelete(response.body.result._id);
    });

    test('should get all campaigns with pagination', async () => {
      const response = await request(app)
        .get('/api/marketing/campaigns/list?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.result.campaigns)).toBe(true);
      expect(response.body.result.pagination).toBeDefined();
    });

    test('should get single campaign by ID', async () => {
      const response = await request(app)
        .get(`/api/marketing/campaigns/${testCampaign._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result._id).toBe(testCampaign._id);
    });

    test('should update campaign', async () => {
      const updateData = {
        name: 'Updated Campaign Name',
        description: 'Updated description',
      };

      const response = await request(app)
        .patch(`/api/marketing/campaigns/${testCampaign._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result.name).toBe(updateData.name);
      expect(response.body.result.description).toBe(updateData.description);
    });

    test('should delete campaign', async () => {
      const response = await request(app)
        .delete(`/api/marketing/campaigns/${testCampaign._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify campaign is deleted
      const getResponse = await request(app)
        .get(`/api/marketing/campaigns/${testCampaign._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });
  });

  describe('Campaign Control Operations', () => {
    test('should start campaign', async () => {
      const response = await request(app)
        .post(`/api/marketing/campaigns/${testCampaign._id}/start`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result.status).toBe('active');
    });

    test('should pause active campaign', async () => {
      // First start the campaign
      await request(app)
        .post(`/api/marketing/campaigns/${testCampaign._id}/start`)
        .set('Authorization', `Bearer ${authToken}`);

      // Then pause it
      const response = await request(app)
        .post(`/api/marketing/campaigns/${testCampaign._id}/pause`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result.status).toBe('paused');
    });

    test('should schedule campaign', async () => {
      const scheduleData = {
        startDate: new Date(Date.now() + 86400000), // Tomorrow
        timezone: 'UTC',
      };

      const response = await request(app)
        .post(`/api/marketing/campaigns/${testCampaign._id}/schedule`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(scheduleData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result.status).toBe('scheduled');
    });
  });

  describe('A/B Testing', () => {
    test('should create A/B test', async () => {
      const abTestData = {
        testType: 'subject',
        variations: [
          {
            name: 'Original',
            percentage: 50,
            content: { subject: 'Original Subject' },
          },
          {
            name: 'Variation A',
            percentage: 50,
            content: { subject: 'New Subject A' },
          },
        ],
        testDuration: 72,
        autoSelectWinner: true,
      };

      const response = await request(app)
        .post(`/api/marketing/campaigns/${testCampaign._id}/ab-test`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(abTestData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result.abTesting.isEnabled).toBe(true);
      expect(response.body.result.abTesting.variations).toHaveLength(2);
    });

    test('should get A/B test results', async () => {
      // First create an A/B test
      const abTestData = {
        testType: 'subject',
        variations: [
          { name: 'Original', percentage: 50, content: { subject: 'Original' } },
          { name: 'Variation A', percentage: 50, content: { subject: 'New' } },
        ],
      };

      await request(app)
        .post(`/api/marketing/campaigns/${testCampaign._id}/ab-test`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(abTestData);

      // Get results
      const response = await request(app)
        .get(`/api/marketing/campaigns/${testCampaign._id}/ab-test/results`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result.variations).toBeDefined();
      expect(response.body.result.recommendations).toBeDefined();
    });
  });

  describe('Campaign Analytics', () => {
    test('should get campaign analytics', async () => {
      const response = await request(app)
        .get(`/api/marketing/campaigns/${testCampaign._id}/analytics`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result.metrics).toBeDefined();
      expect(response.body.result.performance).toBeDefined();
    });

    test('should generate campaign report', async () => {
      const reportData = {
        format: 'json',
        metrics: ['open-rate', 'click-rate', 'conversion-rate'],
        dateRange: 'last-30-days',
      };

      const response = await request(app)
        .post(`/api/marketing/campaigns/${testCampaign._id}/report`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(reportData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result.report).toBeDefined();
    });
  });

  describe('Email Templates', () => {
    test('should get email templates', async () => {
      const response = await request(app)
        .get('/api/marketing/emails/templates')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.result)).toBe(true);
    });

    test('should create email template', async () => {
      const templateData = {
        name: 'Test Template',
        subject: 'Test Subject {{customerName}}',
        htmlContent: '<h1>Hello {{customerName}}</h1>',
        textContent: 'Hello {{customerName}}',
        category: 'promotional',
        variables: ['customerName'],
      };

      const response = await request(app)
        .post('/api/marketing/emails/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(templateData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.result.name).toBe(templateData.name);
    });
  });

  describe('Lead Scoring', () => {
    test('should calculate lead score', async () => {
      const customerId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/marketing/lead-scoring/calculate/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result.totalScore).toBeDefined();
      expect(response.body.result.grade).toBeDefined();
    });

    test('should get lead scoring rules', async () => {
      const response = await request(app)
        .get('/api/marketing/lead-scoring/rules')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result.rules).toBeDefined();
    });

    test('should get lead leaderboard', async () => {
      const response = await request(app)
        .get('/api/marketing/lead-scoring/leaderboard?limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.result)).toBe(true);
    });
  });

  describe('Behavior Tracking', () => {
    test('should track behavior event', async () => {
      const eventData = {
        customerId: new mongoose.Types.ObjectId(),
        eventType: 'email_open',
        eventData: {
          campaignId: testCampaign._id,
          timestamp: new Date(),
          metadata: { device: 'mobile' },
        },
      };

      const response = await request(app)
        .post('/api/marketing/behavior/track')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result.event).toBeDefined();
    });

    test('should get behavior analytics', async () => {
      const customerId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/marketing/behavior/analytics/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result.summary).toBeDefined();
    });

    test('should create behavior trigger', async () => {
      const triggerData = {
        name: 'Email Open Trigger',
        eventType: 'email_open',
        conditions: {
          campaignType: 'email',
          frequency: 'once',
        },
        actions: [
          {
            type: 'send_email',
            config: { templateId: 'welcome-template' },
          },
        ],
      };

      const response = await request(app)
        .post('/api/marketing/behavior/triggers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(triggerData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.result.name).toBe(triggerData.name);
    });
  });

  describe('Bulk Operations', () => {
    test('should perform bulk status update', async () => {
      // Create additional test campaigns
      const campaign2 = await Campaign.create({
        name: 'Test Campaign 2',
        type: 'email',
        status: 'draft',
        owner: testUser._id,
        channels: ['email'],
        content: { subject: 'Test 2', body: 'Test content 2' },
      });

      const bulkData = {
        action: 'updateStatus',
        campaignIds: [testCampaign._id, campaign2._id],
        data: { status: 'paused' },
      };

      const response = await request(app)
        .post('/api/marketing/campaigns/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result.updated).toBe(2);

      // Cleanup
      await Campaign.findByIdAndDelete(campaign2._id);
    });
  });

  describe('Campaign Optimization', () => {
    test('should get optimization suggestions', async () => {
      const response = await request(app)
        .post(`/api/marketing/campaigns/${testCampaign._id}/optimize`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result.suggestions).toBeDefined();
      expect(Array.isArray(response.body.result.suggestions)).toBe(true);
    });
  });

  describe('Authentication and Authorization', () => {
    test('should require authentication for all endpoints', async () => {
      const response = await request(app).get('/api/marketing/campaigns/list');

      expect(response.status).toBe(401);
    });

    test('should handle invalid campaign ID', async () => {
      const invalidId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/marketing/campaigns/${invalidId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
