const express = require('express');
const router = express.Router();
const { catchErrors } = require('../../handlers/errorHandlers');

// Import existing controllers
const campaignController = require('../../controllers/appControllers/campaignController/index');
const segmentController = require('../../controllers/appControllers/segmentController');
const retargetingController = require('../../controllers/appControllers/RetargetingController');

/**
 * Marketing campaigns routes - redirect to campaign controller methods
 */
// Test route
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Marketing routes working!' });
});

// Debug route to test campaign controller
router.get('/campaigns/debug', (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Campaign debug route working!',
      controller: typeof campaignController,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Basic CRUD for campaigns
router.get('/campaigns/list', catchErrors(campaignController.getAll));
router.post('/campaigns', catchErrors(campaignController.create));
router.get('/campaigns/:id', catchErrors(campaignController.getOne));
router.patch('/campaigns/:id', catchErrors(campaignController.update));
router.delete('/campaigns/:id', catchErrors(campaignController.delete));

// Campaign execution control
router.post('/campaigns/:id/start', catchErrors(campaignController.start));
router.post('/campaigns/:id/pause', catchErrors(campaignController.pause));
router.post('/campaigns/:id/schedule', catchErrors(campaignController.schedule));

// Campaign optimization and duplication
router.post('/campaigns/:id/optimize', catchErrors(campaignController.optimize));
router.post('/campaigns/duplicate', catchErrors(campaignController.duplicate));

// Campaign status updates
router.patch(
  '/campaigns/status/:id',
  catchErrors(async (req, res) => {
    // Use the existing update method but specifically for status
    req.body = { status: req.body.status };
    return campaignController.update(req, res);
  })
);

// Bulk operations
router.post('/campaigns/bulk', catchErrors(campaignController.bulkOperations));

// Campaign analytics
router.get('/campaigns/:id/analytics', catchErrors(campaignController.getAnalytics));

// Campaign report generation
router.post('/campaigns/:id/report', catchErrors(campaignController.generateReport));

// A/B Testing routes
router.post('/campaigns/:id/ab-test', catchErrors(campaignController.createABTest));
router.get('/campaigns/:id/ab-test/results', catchErrors(campaignController.getABTestResults));
router.post('/campaigns/:id/ab-test/metrics', catchErrors(campaignController.updateABTestMetrics));

// Email Templates routes
router.get('/emails/templates', catchErrors(campaignController.getEmailTemplates));
router.post('/emails/templates', catchErrors(campaignController.createEmailTemplate));

// Lead Scoring routes
router.post(
  '/lead-scoring/calculate/:customerId',
  catchErrors(campaignController.calculateLeadScore)
);
router.get('/lead-scoring/rules', catchErrors(campaignController.getLeadScoringRules));
router.get('/lead-scoring/leaderboard', catchErrors(campaignController.getLeadLeaderboard));

// Behavior Tracking routes
router.post('/behavior/track', catchErrors(campaignController.trackBehaviorEvent));
router.get('/behavior/analytics/:customerId', catchErrors(campaignController.getBehaviorAnalytics));
router.get('/behavior/triggers', catchErrors(campaignController.getBehaviorTriggers));
router.post('/behavior/triggers', catchErrors(campaignController.createBehaviorTrigger));

/**
 * Marketing segments routes
 */
// Basic CRUD for segments
router.get('/segments/list', catchErrors(segmentController.getAll));
router.post('/segments', catchErrors(segmentController.create));
router.get('/segments/:id', catchErrors(segmentController.getOne));
router.patch('/segments/:id', catchErrors(segmentController.update));
router.delete('/segments/:id', catchErrors(segmentController.delete));

// Segment members management
router.get('/segments/:id/members', catchErrors(segmentController.getMembers));
router.patch('/segments/:id/members', catchErrors(segmentController.updateMembers));

/**
 * Behavior tracking routes
 */
// Note: Behavior tracking routes are now handled above in the campaigns section
// router.post('/behavior/track', catchErrors(campaignController.trackBehaviorEvent));
// router.get('/behavior/analytics/:customerId', catchErrors(campaignController.getBehaviorAnalytics));

router.get(
  '/behavior/events',
  catchErrors(async (req, res) => {
    res.status(501).json({
      success: false,
      message:
        'General behavior events listing not yet implemented - use /behavior/analytics/:customerId instead',
    });
  })
);

router.get(
  '/behavior/sessions',
  catchErrors(async (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Behavior sessions not yet implemented',
    });
  })
);

/**
 * Behavior triggers routes
 */
router.get(
  '/behavior/triggers/list',
  catchErrors(async (req, res) => {
    // Return empty array for now - this prevents the 404 error
    res.json({
      success: true,
      result: [],
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0,
      },
    });
  })
);

router.post(
  '/behavior/triggers',
  catchErrors(async (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Behavior triggers creation not yet implemented',
    });
  })
);

router.get(
  '/behavior/triggers/:id',
  catchErrors(async (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Behavior trigger details not yet implemented',
    });
  })
);

router.patch(
  '/behavior/triggers/:id',
  catchErrors(async (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Behavior trigger update not yet implemented',
    });
  })
);

router.delete(
  '/behavior/triggers/:id',
  catchErrors(async (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Behavior trigger deletion not yet implemented',
    });
  })
);

router.patch(
  '/behavior/triggers/:id/toggle',
  catchErrors(async (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Behavior trigger toggle not yet implemented',
    });
  })
);

/**
 * A/B Testing routes
 */
// Note: A/B testing routes are now handled in campaigns section above
// router.post('/campaigns/:id/ab-test', catchErrors(campaignController.createABTest));
// router.get('/campaigns/:id/ab-test/results', catchErrors(campaignController.getABTestResults));

router.get(
  '/ab-tests',
  catchErrors(async (req, res) => {
    res.status(501).json({
      success: false,
      message:
        'General A/B testing list not yet implemented - use campaign-specific A/B tests instead',
    });
  })
);

/**
 * Email marketing routes
 */
// Note: Email templates routes are now handled above in the campaigns section
// router.get('/emails/templates', catchErrors(campaignController.getEmailTemplates));
// router.post('/emails/templates', catchErrors(campaignController.createEmailTemplate));

router.post(
  '/emails/send',
  catchErrors(async (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Email sending not yet implemented - use campaign execution instead',
    });
  })
);

/**
 * Automation workflows routes
 */
router.get(
  '/automation/workflows',
  catchErrors(async (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Marketing automation workflows not yet implemented',
    });
  })
);

/**
 * Lead scoring routes
 */
// Note: Lead scoring routes are now handled above in the campaigns section
// router.get('/lead-scoring/rules', catchErrors(campaignController.getLeadScoringRules));
// router.post('/lead-scoring/calculate/:customerId', catchErrors(campaignController.calculateLeadScore));
// router.get('/lead-scoring/leaderboard', catchErrors(campaignController.getLeadLeaderboard));

/**
 * Retargeting routes
 */
// Test route for debugging
router.get(
  '/retargeting/test',
  catchErrors(async (req, res) => {
    res.json({
      success: true,
      message: 'Retargeting routes are working',
      timestamp: new Date().toISOString(),
    });
  })
);

// Lists/Audiences management (using the existing controller)
router.get('/retargeting/lists/list', catchErrors(retargetingController.getAudiences));
router.post('/retargeting/lists', catchErrors(retargetingController.createAudience));
router.patch('/retargeting/lists/:id', catchErrors(retargetingController.updateAudience));
router.delete(
  '/retargeting/lists/:id',
  catchErrors(async (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Retargeting list deletion not yet implemented',
    });
  })
);

// Campaign management
router.get(
  '/retargeting/campaigns/list',
  catchErrors(async (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Retargeting campaigns list not yet implemented',
    });
  })
);

router.post('/retargeting/campaigns', catchErrors(retargetingController.createCampaign));

router.patch(
  '/retargeting/campaigns/:id',
  catchErrors(async (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Retargeting campaign update not yet implemented',
    });
  })
);

router.delete(
  '/retargeting/campaigns/:id',
  catchErrors(async (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Retargeting campaign deletion not yet implemented',
    });
  })
);

// Campaign actions
router.post(
  '/retargeting/campaigns/:id/launch',
  catchErrors(async (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Retargeting campaign launch not yet implemented',
    });
  })
);

router.post(
  '/retargeting/campaigns/:id/pause',
  catchErrors(async (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Retargeting campaign pause not yet implemented',
    });
  })
);

router.get(
  '/retargeting/campaigns/:id/statistics',
  catchErrors(async (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Retargeting campaign statistics not yet implemented',
    });
  })
);

// Platform sync
router.post(
  '/retargeting/platforms/:platform/sync',
  catchErrors(async (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Retargeting platform sync not yet implemented',
    });
  })
);

module.exports = router;
