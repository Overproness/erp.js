// @ts-nocheck
const express = require('express');
const router = express.Router();
const adminAuth = require('@/controllers/coreControllers/adminAuth');
const reputationController = require('@/controllers/appControllers/reputationManagementController');
const { catchErrors } = require('@/handlers/errorHandlers');

// All reputation endpoints require admin authentication
router.use(adminAuth.isValidAuthToken);

// GET /api/marketing/reputation/reviews — list reviews with filtering
router.get('/reviews', catchErrors(reputationController.getReviews.bind(reputationController)));

// GET /api/marketing/reputation/stats — calculate reputation statistics
router.get('/stats', catchErrors(reputationController.getStats.bind(reputationController)));

// POST /api/marketing/reputation/reviews/:id/reply — reply to a review
router.post('/reviews/:id/reply', catchErrors(reputationController.replyToReview.bind(reputationController)));

// POST /api/marketing/reputation/reviews/:id/generate-ai-reply — generate AI-suggested draft
router.post('/reviews/:id/generate-ai-reply', catchErrors(reputationController.generateAIReply.bind(reputationController)));

// POST /api/marketing/reputation/sync — sync reviews from platforms
router.post('/sync', catchErrors(reputationController.syncPlatformReviews.bind(reputationController)));

// GET /api/marketing/reputation/platforms — get platform status and counts
router.get('/platforms', catchErrors(reputationController.getConnectedPlatforms.bind(reputationController)));

module.exports = router;
