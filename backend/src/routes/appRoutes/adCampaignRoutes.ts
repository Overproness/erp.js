// @ts-nocheck
const express = require('express');
const router = express.Router();
const adminAuth = require('@/controllers/coreControllers/adminAuth');
const adCampaignController = require('@/controllers/appControllers/adCampaignController');
const { catchErrors } = require('@/handlers/errorHandlers');

// All ad campaign endpoints require admin authentication
router.use(adminAuth.isValidAuthToken);

// GET /api/marketing/ad-campaigns — list all paid ad campaigns
router.get('/', catchErrors(adCampaignController.getCampaigns.bind(adCampaignController)));

// POST /api/marketing/ad-campaigns — create and deploy ad campaign
router.post('/', catchErrors(adCampaignController.createCampaign.bind(adCampaignController)));

// GET /api/marketing/ad-campaigns/:id — get campaign details
router.get('/:id', catchErrors(adCampaignController.getCampaignById.bind(adCampaignController)));

// PUT /api/marketing/ad-campaigns/:id — update campaign configuration or budget
router.put('/:id', catchErrors(adCampaignController.updateCampaign.bind(adCampaignController)));

// POST /api/marketing/ad-campaigns/:id/status — toggle campaign status (ACTIVE/PAUSED)
router.post('/:id/status', catchErrors(adCampaignController.toggleCampaignStatus.bind(adCampaignController)));

// POST /api/marketing/ad-campaigns/:id/telemetry/sync — sync live performance telemetry
router.post('/:id/telemetry/sync', catchErrors(adCampaignController.syncTelemetry.bind(adCampaignController)));

// DELETE /api/marketing/ad-campaigns/:id — delete campaign
router.delete('/:id', catchErrors(adCampaignController.deleteCampaign.bind(adCampaignController)));

module.exports = router;
