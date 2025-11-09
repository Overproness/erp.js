const request = require('supertest');
const app = require('../../src/app');
const { Campaign } = require('../../src/models');
const authHelper = require('../utils/authHelper');
const testDataFactory = require('../utils/testDataFactory');

describe('Campaign Controller - Enhanced Features', () => {
  let authToken;
  let testUser;
  let testCampaign;

  beforeAll(async () => {
    // Setup test user and auth token
    const authSetup = await authHelper.createTestUser();
    authToken = authSetup.token;
    testUser = authSetup.user;
  });

  beforeEach(async () => {
    // Create a test campaign
    testCampaign = await testDataFactory.createCampaign({
      owner: testUser._id,
      name: 'Test Campaign',
      type: 'email',
      status: 'active',
      metrics: {
        sent: 1000,
        delivered: 980,
        opened: 350,
        clicked: 85,
        converted: 12,
        bounced: 20,
        revenue: 1200,
      },
    });
  });

  afterEach(async () => {
    // Clean up test data
    await Campaign.deleteMany({ owner: testUser._id });
  });

  describe('GET /marketing/campaigns/:id/analytics', () => {
    it('should return comprehensive campaign analytics', async () => {
      const response = await request(app)
        .get(`/marketing/campaigns/${testCampaign._id}/analytics`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('overview');
      expect(response.body.data).toHaveProperty('metrics');
      expect(response.body.data).toHaveProperty('rates');
      expect(response.body.data).toHaveProperty('performance');
      expect(response.body.data).toHaveProperty('channelBreakdown');

      // Verify metrics calculations
      expect(response.body.data.metrics.totalSent).toBe(1000);
      expect(response.body.data.metrics.totalOpened).toBe(350);
      expect(parseFloat(response.body.data.rates.openRate)).toBe(35.0);
      expect(parseFloat(response.body.data.rates.conversionRate)).toBe(1.2);
    });

    it('should return 404 for non-existent campaign', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/marketing/campaigns/${fakeId}/analytics`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Campaign not found');
    });

    it('should handle campaigns with zero metrics gracefully', async () => {
      const zeroCampaign = await testDataFactory.createCampaign({
        owner: testUser._id,
        name: 'Zero Metrics Campaign',
        type: 'email',
        status: 'draft',
        metrics: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          converted: 0,
        },
      });

      const response = await request(app)
        .get(`/marketing/campaigns/${zeroCampaign._id}/analytics`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.rates.openRate).toBe('0');
      expect(response.body.data.rates.conversionRate).toBe('0');
    });
  });

  describe('POST /marketing/campaigns/:id/report', () => {
    it('should generate comprehensive campaign report', async () => {
      const response = await request(app)
        .post(`/marketing/campaigns/${testCampaign._id}/report`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'json',
          includeCharts: false,
          sections: 'all',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('reportMetadata');
      expect(response.body.data).toHaveProperty('executiveSummary');
      expect(response.body.data).toHaveProperty('detailedAnalytics');
      expect(response.body.data).toHaveProperty('recommendations');

      // Verify report structure
      expect(response.body.data.reportMetadata.campaignName).toBe('Test Campaign');
      expect(response.body.data.executiveSummary.keyMetrics).toHaveProperty('totalReach');
      expect(response.body.data.executiveSummary.keyMetrics).toHaveProperty('conversionRate');
    });

    it('should return 404 for non-existent campaign report', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .post(`/marketing/campaigns/${fakeId}/report`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ format: 'json' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Campaign not found');
    });
  });

  describe('POST /marketing/campaigns/bulk', () => {
    let campaign1, campaign2, campaign3;

    beforeEach(async () => {
      campaign1 = await testDataFactory.createCampaign({
        owner: testUser._id,
        name: 'Campaign 1',
        type: 'email',
        status: 'draft',
      });

      campaign2 = await testDataFactory.createCampaign({
        owner: testUser._id,
        name: 'Campaign 2',
        type: 'sms',
        status: 'active',
      });

      campaign3 = await testDataFactory.createCampaign({
        owner: testUser._id,
        name: 'Campaign 3',
        type: 'email',
        status: 'paused',
      });
    });

    it('should start multiple draft campaigns', async () => {
      const response = await request(app)
        .post('/marketing/campaigns/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          operation: 'start',
          campaignIds: [campaign1._id, campaign3._id],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.successful).toHaveLength(2);
      expect(response.body.data.failed).toHaveLength(0);

      // Verify campaigns were actually started
      const updatedCampaign1 = await Campaign.findById(campaign1._id);
      const updatedCampaign3 = await Campaign.findById(campaign3._id);
      expect(updatedCampaign1.status).toBe('active');
      expect(updatedCampaign3.status).toBe('active');
    });

    it('should pause active campaigns', async () => {
      const response = await request(app)
        .post('/marketing/campaigns/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          operation: 'pause',
          campaignIds: [campaign2._id],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.successful).toHaveLength(1);
      expect(response.body.data.successful[0].action).toBe('Paused');

      // Verify campaign was paused
      const updatedCampaign = await Campaign.findById(campaign2._id);
      expect(updatedCampaign.status).toBe('paused');
    });

    it('should archive campaigns', async () => {
      const response = await request(app)
        .post('/marketing/campaigns/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          operation: 'archive',
          campaignIds: [campaign1._id, campaign2._id],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.successful).toHaveLength(2);

      // Verify campaigns were archived
      const campaigns = await Campaign.find({
        _id: { $in: [campaign1._id, campaign2._id] },
      });
      campaigns.forEach((campaign) => {
        expect(campaign.status).toBe('archived');
      });
    });

    it('should soft delete campaigns', async () => {
      const response = await request(app)
        .post('/marketing/campaigns/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          operation: 'delete',
          campaignIds: [campaign1._id],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.successful).toHaveLength(1);

      // Verify campaign was soft deleted
      const deletedCampaign = await Campaign.findById(campaign1._id);
      expect(deletedCampaign.removed).toBe(true);
    });

    it('should update campaign status in bulk', async () => {
      const response = await request(app)
        .post('/marketing/campaigns/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          operation: 'update_status',
          campaignIds: [campaign1._id, campaign2._id],
          data: { status: 'completed' },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.successful).toHaveLength(2);

      // Verify status updates
      const campaigns = await Campaign.find({
        _id: { $in: [campaign1._id, campaign2._id] },
      });
      campaigns.forEach((campaign) => {
        expect(campaign.status).toBe('completed');
      });
    });

    it('should handle invalid operations', async () => {
      const response = await request(app)
        .post('/marketing/campaigns/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          operation: 'invalid_operation',
          campaignIds: [campaign1._id],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid operation');
    });

    it('should handle empty campaign IDs array', async () => {
      const response = await request(app)
        .post('/marketing/campaigns/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          operation: 'start',
          campaignIds: [],
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No campaigns found');
    });

    it('should handle mixed success and failure operations', async () => {
      // Try to pause a draft campaign (should fail) and an active campaign (should succeed)
      const response = await request(app)
        .post('/marketing/campaigns/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          operation: 'pause',
          campaignIds: [campaign1._id, campaign2._id], // draft and active campaigns
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.successful).toHaveLength(1); // Only active campaign
      expect(response.body.data.failed).toHaveLength(1); // Draft campaign failed
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Test with invalid ObjectId format
      const response = await request(app)
        .get('/marketing/campaigns/invalid-id/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/marketing/campaigns/${testCampaign._id}/analytics`)
        .expect(401);
    });
  });
});
