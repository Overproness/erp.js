const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const adminAuth = require('@/controllers/coreControllers/adminAuth');
const { loginRateLimit } = require('@/middlewares/rateLimitMiddleware');

router.route('/login').post(loginRateLimit, catchErrors(adminAuth.login));
router.route('/register').post(catchErrors(adminAuth.register));
router.route('/forgetpassword').post(catchErrors(adminAuth.forgetPassword));
router.route('/resetpassword').post(catchErrors(adminAuth.resetPassword));
router.route('/logout').post(catchErrors(adminAuth.logout));
router.route('/verify-token').get(adminAuth.isValidAuthToken, catchErrors(adminAuth.verifyToken));

module.exports = router;
