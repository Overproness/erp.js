// @ts-nocheck
const express = require('express');
const router = express.Router();
const adminAuth = require('@/controllers/coreControllers/adminAuth');
const retargetingController = require('@/controllers/appControllers/RetargetingController');
const { catchErrors } = require('@/handlers/errorHandlers');

// All retargeting endpoints require admin authentication
router.use(adminAuth.isValidAuthToken);

// GET /api/marketing/retargeting/platforms — get connected platform statuses
router.get('/platforms', catchErrors(retargetingController.getPlatformConnections.bind(retargetingController)));

// POST /api/marketing/retargeting/platforms/:platform/sync — trigger audience sync
router.post('/platforms/:platform/sync', catchErrors(retargetingController.syncPlatform.bind(retargetingController)));

// GET /api/marketing/retargeting/performance — get analytics/performance
router.get('/performance', catchErrors(retargetingController.getPerformance.bind(retargetingController)));

// GET /api/marketing/retargeting — get audience list
router.get('/', catchErrors(retargetingController.getAudiences.bind(retargetingController)));

// POST /api/marketing/retargeting — create audience
router.post('/', catchErrors(retargetingController.createAudience.bind(retargetingController)));

// PUT /api/marketing/retargeting/:id — update audience
router.put('/:id', catchErrors(retargetingController.updateAudience.bind(retargetingController)));

// DELETE /api/marketing/retargeting/:id — delete audience
router.delete('/:id', catchErrors(retargetingController.deleteAudience.bind(retargetingController)));

module.exports = router;
