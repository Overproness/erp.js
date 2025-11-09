const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const adminController = require('@/controllers/coreControllers/adminController');
const userPermissions = require('@/controllers/appControllers/userController');


// User profile routes
router.route('/profile').get(catchErrors(adminController.read));
router.route('/profile/update').patch(catchErrors(adminController.updateProfile));
router.route('/profile/password').patch(catchErrors(adminController.updateProfilePassword));
router.route('/permissions').get(catchErrors(userPermissions));

module.exports = router;
