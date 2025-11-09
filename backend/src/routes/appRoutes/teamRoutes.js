const express = require('express');
const { catchErrors } = require('@/handlers/errorHandlers');
const router = express.Router();

const teamController = require('@/controllers/appControllers/teamController');

// Standard CRUD routes for teams
router.route('/').get(catchErrors(teamController.list));
router.route('/list').get(catchErrors(teamController.list)); // Add explicit /list route to match frontend expectations
router.route('/').post(catchErrors(teamController.create));
router.route('/:id').get(catchErrors(teamController.read));
router.route('/update/:id').patch(catchErrors(teamController.update));
router.route('/:id').delete(catchErrors(teamController.remove));

// Team member specific routes
router.route('/:teamId/invite').post(catchErrors(teamController.inviteMember));
router.route('/:teamId/members').get(catchErrors(teamController.listMembers));
router.route('/:teamId/members/:memberId').patch(catchErrors(teamController.updateMember));
router.route('/:teamId/members/:memberId').delete(catchErrors(teamController.removeMember));

// Note: Public invitation routes have been moved to teamPublicRoutes.js

module.exports = router;
