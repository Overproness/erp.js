const express = require('express');
const { catchErrors } = require('@/handlers/errorHandlers');
const router = express.Router();

const teamController = require('@/controllers/appControllers/teamController');

// Public invitation handling routes (no authentication required)
// Note: These routes are mounted at /api/public/team in app.js, so we use relative paths here
// Don't require authentication for these routes - anyone with invitation token can access
router.get('/:token', catchErrors(teamController.getInvitationDetails));
router.post('/:token/accept', catchErrors(teamController.acceptInvitation));

module.exports = router;
