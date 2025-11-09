const campaignController = require('../../../src/controllers/appControllers/campaignController');
const { Campaign } = require('../../../src/models');

// Mock all dependencies
jest.mock('../../../src/models');
jest.mock('../../../src/services/campaignExecutorService');
jest.mock('../../../src/services/analyticsService');
jest.mock('../../../src/utils/authUtils', () => ({
  getCurrentUserId: jest.fn().mockReturnValue('user123'),
}));

describe('Campaign Controller Advanced Features Unit Tests', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { _id: 'user123' },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe('A/B Testing Methods', () => {
    describe('createABTest()', () => {
      test('should create A/B test with valid data', async () => {
        const abTestData = {
          testType: 'subject',
          variations: [
            { name: 'Original', percentage: 50, content: { subject: 'Original Subject' } },
            { name: 'Variation A', percentage: 50, content: { subject: 'New Subject' } },
          ],
          testDuration: 72,
          autoSelectWinner: true,
        };

        const mockCampaign = {
          _id: 'campaign123',
          abTesting: {
            isEnabled: true,
            testType: 'subject',
            variations: abTestData.variations,
            testDuration: 72,
            autoSelectWinner: true,
            startTime: new Date(),
          },
        };

        Campaign.findOneAndUpdate = jest.fn().mockResolvedValue(mockCampaign);

        mockReq.params = { id: 'campaign123' };
        mockReq.body = abTestData;

        await campaignController.createABTest(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          result: mockCampaign,
          message: 'A/B test created successfully',
        });
      });

      test('should validate percentage sum to 100', async () => {
        const invalidData = {
          testType: 'subject',
          variations: [
            { name: 'Original', percentage: 60, content: { subject: 'Original' } },
            { name: 'Variation A', percentage: 50, content: { subject: 'New' } },
          ],
        };

        mockReq.params = { id: 'campaign123' };
        mockReq.body = invalidData;

        await campaignController.createABTest(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: 'Variation percentages must sum to 100%',
        });
      });

      test('should require at least 2 variations', async () => {
        const invalidData = {
          testType: 'subject',
          variations: [{ name: 'Original', percentage: 100, content: { subject: 'Original' } }],
        };

        mockReq.params = { id: 'campaign123' };
        mockReq.body = invalidData;

        await campaignController.createABTest(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: 'A/B test requires at least 2 variations',
        });
      });
    });

    describe('getABTestResults()', () => {
      test('should return A/B test results with statistical analysis', async () => {
        const mockCampaign = {
          _id: 'campaign123',
          abTesting: {
            isEnabled: true,
            testType: 'subject',
            variations: [
              {
                name: 'Original',
                percentage: 50,
                metrics: { sent: 500, opened: 125, clicked: 60, converted: 15 },
              },
              {
                name: 'Variation A',
                percentage: 50,
                metrics: { sent: 500, opened: 150, clicked: 80, converted: 25 },
              },
            ],
          },
        };

        Campaign.findOne = jest.fn().mockResolvedValue(mockCampaign);

        mockReq.params = { id: 'campaign123' };

        await campaignController.getABTestResults(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          result: expect.objectContaining({
            variations: expect.any(Array),
            winner: expect.any(String),
            confidence: expect.any(Number),
            recommendations: expect.any(Array),
          }),
        });
      });

      test('should handle campaign without A/B test', async () => {
        const mockCampaign = {
          _id: 'campaign123',
          abTesting: { isEnabled: false },
        };

        Campaign.findOne = jest.fn().mockResolvedValue(mockCampaign);

        mockReq.params = { id: 'campaign123' };

        await campaignController.getABTestResults(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: 'No A/B test found for this campaign',
        });
      });
    });

    describe('updateABTestMetrics()', () => {
      test('should update A/B test metrics successfully', async () => {
        const metricsData = {
          variationName: 'Variation A',
          metrics: {
            sent: 100,
            opened: 25,
            clicked: 12,
            converted: 3,
          },
        };

        const mockCampaign = {
          _id: 'campaign123',
          abTesting: {
            isEnabled: true,
            variations: [
              { name: 'Original', metrics: { sent: 100, opened: 20 } },
              { name: 'Variation A', metrics: { sent: 100, opened: 25 } },
            ],
          },
        };

        Campaign.findOneAndUpdate = jest.fn().mockResolvedValue(mockCampaign);

        mockReq.params = { id: 'campaign123' };
        mockReq.body = metricsData;

        await campaignController.updateABTestMetrics(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          result: mockCampaign,
          message: 'A/B test metrics updated successfully',
        });
      });
    });
  });

  describe('Email Template Methods', () => {
    describe('getEmailTemplates()', () => {
      test('should return all email templates', async () => {
        const mockTemplates = [
          {
            _id: 'template1',
            name: 'Welcome Email',
            subject: 'Welcome {{customerName}}!',
            category: 'transactional',
          },
          {
            _id: 'template2',
            name: 'Promotional Email',
            subject: 'Special Offer!',
            category: 'promotional',
          },
        ];

        // Mock the templates response
        mockReq.mockTemplates = mockTemplates;

        await campaignController.getEmailTemplates(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          result: expect.any(Array),
        });
      });

      test('should filter templates by category', async () => {
        mockReq.query = { category: 'promotional' };

        await campaignController.getEmailTemplates(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
      });
    });

    describe('createEmailTemplate()', () => {
      test('should create email template successfully', async () => {
        const templateData = {
          name: 'New Template',
          subject: 'Hello {{customerName}}',
          htmlContent: '<h1>Hello {{customerName}}</h1>',
          textContent: 'Hello {{customerName}}',
          category: 'promotional',
          variables: ['customerName'],
        };

        mockReq.body = templateData;

        await campaignController.createEmailTemplate(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          result: expect.objectContaining({
            name: templateData.name,
            subject: templateData.subject,
          }),
          message: 'Email template created successfully',
        });
      });

      test('should validate required fields', async () => {
        const invalidData = {
          name: 'Template',
          // Missing subject
          htmlContent: '<h1>Hello</h1>',
        };

        mockReq.body = invalidData;

        await campaignController.createEmailTemplate(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: 'Name, subject, and content are required',
        });
      });
    });
  });

  describe('Lead Scoring Methods', () => {
    describe('calculateLeadScore()', () => {
      test('should calculate comprehensive lead score', async () => {
        const customerId = 'customer123';

        // Mock behavior data
        const mockBehaviorData = {
          emailOpens: 15,
          emailClicks: 8,
          websiteVisits: 12,
          formsSubmitted: 3,
          documentsDownloaded: 2,
        };

        const mockDemographicData = {
          industryMatch: true,
          companySizeMatch: true,
          locationMatch: false,
        };

        mockReq.params = { customerId };
        mockReq.mockBehaviorData = mockBehaviorData;
        mockReq.mockDemographicData = mockDemographicData;

        await campaignController.calculateLeadScore(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          result: expect.objectContaining({
            customerId,
            totalScore: expect.any(Number),
            grade: expect.any(String),
            status: expect.any(String),
            scoring: expect.objectContaining({
              behavioral: expect.any(Number),
              demographic: expect.any(Number),
              engagement: expect.any(Number),
            }),
            recommendations: expect.any(Array),
          }),
        });
      });
    });

    describe('getLeadScoringRules()', () => {
      test('should return lead scoring rules', async () => {
        await campaignController.getLeadScoringRules(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          result: expect.objectContaining({
            rules: expect.any(Object),
            thresholds: expect.any(Object),
          }),
        });
      });
    });

    describe('getLeadLeaderboard()', () => {
      test('should return top scoring leads', async () => {
        mockReq.query = { limit: '10' };

        await campaignController.getLeadLeaderboard(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          result: expect.any(Array),
        });
      });
    });
  });

  describe('Behavior Tracking Methods', () => {
    describe('trackBehaviorEvent()', () => {
      test('should track behavior event successfully', async () => {
        const eventData = {
          customerId: 'customer123',
          eventType: 'email_open',
          eventData: {
            campaignId: 'campaign123',
            timestamp: new Date(),
            metadata: { device: 'mobile' },
          },
        };

        mockReq.body = eventData;

        await campaignController.trackBehaviorEvent(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          result: expect.objectContaining({
            event: expect.any(Object),
            leadScoreImpact: expect.any(Number),
            triggeredActions: expect.any(Number),
          }),
        });
      });

      test('should validate required fields', async () => {
        const invalidData = {
          eventType: 'email_open',
          // Missing customerId
        };

        mockReq.body = invalidData;

        await campaignController.trackBehaviorEvent(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: false,
          message: 'Customer ID and event type are required',
        });
      });
    });

    describe('getBehaviorAnalytics()', () => {
      test('should return customer behavior analytics', async () => {
        const customerId = 'customer123';

        mockReq.params = { customerId };

        await campaignController.getBehaviorAnalytics(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          result: expect.objectContaining({
            summary: expect.any(Object),
            eventBreakdown: expect.any(Object),
            timeline: expect.any(Array),
          }),
        });
      });
    });

    describe('createBehaviorTrigger()', () => {
      test('should create behavior trigger successfully', async () => {
        const triggerData = {
          name: 'Email Open Follow-up',
          eventType: 'email_open',
          conditions: {
            campaignType: 'promotional',
            frequency: 'once',
          },
          actions: [
            {
              type: 'send_email',
              delay: 2,
              config: { templateId: 'template123' },
            },
          ],
          isActive: true,
        };

        mockReq.body = triggerData;

        await campaignController.createBehaviorTrigger(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          result: expect.objectContaining({
            name: triggerData.name,
            eventType: triggerData.eventType,
            isActive: true,
          }),
          message: 'Behavior trigger created successfully',
        });
      });
    });

    describe('getBehaviorTriggers()', () => {
      test('should return all behavior triggers', async () => {
        await campaignController.getBehaviorTriggers(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          result: expect.any(Array),
        });
      });
    });
  });

  describe('Helper Methods', () => {
    describe('calculateBehavioralScore()', () => {
      test('should calculate score based on behavior data', () => {
        const behaviorData = {
          emailOpens: 10,
          emailClicks: 5,
          websiteVisits: 8,
          formsSubmitted: 2,
          documentsDownloaded: 1,
        };

        const score = campaignController.calculateBehavioralScore(behaviorData);

        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
        expect(typeof score).toBe('number');
      });

      test('should cap score at 100', () => {
        const highActivityData = {
          emailOpens: 100,
          emailClicks: 50,
          websiteVisits: 80,
          formsSubmitted: 20,
          documentsDownloaded: 10,
        };

        const score = campaignController.calculateBehavioralScore(highActivityData);
        expect(score).toBe(100);
      });
    });

    describe('getLeadGrade()', () => {
      test('should return correct grades for score ranges', () => {
        expect(campaignController.getLeadGrade(95)).toBe('A+');
        expect(campaignController.getLeadGrade(87)).toBe('A');
        expect(campaignController.getLeadGrade(78)).toBe('B+');
        expect(campaignController.getLeadGrade(69)).toBe('B');
        expect(campaignController.getLeadGrade(58)).toBe('C+');
        expect(campaignController.getLeadGrade(48)).toBe('C');
        expect(campaignController.getLeadGrade(38)).toBe('D');
        expect(campaignController.getLeadGrade(28)).toBe('F');
      });
    });

    describe('getLeadStatus()', () => {
      test('should return correct status for score ranges', () => {
        expect(campaignController.getLeadStatus(85)).toBe('hot');
        expect(campaignController.getLeadStatus(65)).toBe('warm');
        expect(campaignController.getLeadStatus(45)).toBe('cold');
        expect(campaignController.getLeadStatus(25)).toBe('unqualified');
      });
    });

    describe('getConfidenceLevel()', () => {
      test('should return correct confidence levels', () => {
        expect(campaignController.getConfidenceLevel(2.576)).toBe(99);
        expect(campaignController.getConfidenceLevel(1.96)).toBe(95);
        expect(campaignController.getConfidenceLevel(1.645)).toBe(90);
        expect(campaignController.getConfidenceLevel(1.282)).toBe(80);
      });

      test('should handle low Z-scores', () => {
        expect(campaignController.getConfidenceLevel(1.0)).toBeGreaterThan(0);
        expect(campaignController.getConfidenceLevel(1.0)).toBeLessThan(80);
      });
    });

    describe('stripHtml()', () => {
      test('should remove HTML tags from text', () => {
        const htmlText = '<h1>Hello</h1><p>World <strong>!</strong></p>';
        const plainText = campaignController.stripHtml(htmlText);

        expect(plainText).toBe('HelloWorld !');
        expect(plainText).not.toContain('<');
        expect(plainText).not.toContain('>');
      });

      test('should handle text without HTML tags', () => {
        const plainText = 'Hello World!';
        const result = campaignController.stripHtml(plainText);

        expect(result).toBe(plainText);
      });
    });

    describe('getLeadScoreImpact()', () => {
      test('should return correct impact scores for different event types', () => {
        expect(campaignController.getLeadScoreImpact('email_open')).toBe(2);
        expect(campaignController.getLeadScoreImpact('email_click')).toBe(5);
        expect(campaignController.getLeadScoreImpact('website_visit')).toBe(3);
        expect(campaignController.getLeadScoreImpact('form_submit')).toBe(15);
        expect(campaignController.getLeadScoreImpact('document_download')).toBe(10);
        expect(campaignController.getLeadScoreImpact('unknown_event')).toBe(1);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      const error = new Error('Database connection failed');
      Campaign.findOne = jest.fn().mockRejectedValue(error);

      mockReq.params = { id: 'campaign123' };

      await campaignController.getOne(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    });

    test('should handle validation errors in A/B test creation', async () => {
      const invalidData = {
        testType: 'invalid_type',
        variations: [],
      };

      mockReq.params = { id: 'campaign123' };
      mockReq.body = invalidData;

      await campaignController.createABTest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should handle missing customer ID in behavior tracking', async () => {
      const eventData = {
        eventType: 'email_open',
        eventData: { timestamp: new Date() },
        // Missing customerId
      };

      mockReq.body = eventData;

      await campaignController.trackBehaviorEvent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Customer ID and event type are required',
      });
    });
  });
});
