const express = require('express');
const router = express.Router();
const { catchErrors } = require('../../handlers/errorHandlers');
const retargetingController = require('../../controllers/appControllers/RetargetingController');

/**
 * Retargeting routes
 */

// Audience management
router.post('/audiences', catchErrors(retargetingController.createAudience));
router.get('/audiences', catchErrors(retargetingController.getAudiences));
router.patch('/audiences/:id', catchErrors(retargetingController.updateAudience));

// Campaign management
router.post('/campaign', catchErrors(retargetingController.createCampaign));
router.get('/opportunities', catchErrors(retargetingController.getOpportunities));
router.post('/automated-campaign', catchErrors(retargetingController.createAutomatedCampaign));

// Performance analytics
router.get('/performance', catchErrors(retargetingController.getPerformance));

module.exports = router;
