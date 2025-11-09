const express = require('express');
const router = express.Router();
const { catchErrors } = require('../../handlers/errorHandlers');
const campaignController = require('../../controllers/appControllers/campaignController');

/**
 * Campaign management routes
 */

// Campaign CRUD operations
router.post('/', catchErrors(campaignController.create));
router.get('/', catchErrors(campaignController.getAll));
router.get('/:id', catchErrors(campaignController.getOne));
router.patch('/:id', catchErrors(campaignController.update));
router.delete('/:id', catchErrors(campaignController.delete));

// Campaign execution control
router.post('/:id/start', catchErrors(campaignController.start));
router.post('/:id/pause', catchErrors(campaignController.pause));
router.post('/:id/schedule', catchErrors(campaignController.schedule));

// Campaign optimization
router.post('/:id/optimize', catchErrors(campaignController.optimize));
router.post('/:id/duplicate', catchErrors(campaignController.duplicate));

module.exports = router;
