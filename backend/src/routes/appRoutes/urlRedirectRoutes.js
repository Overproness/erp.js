const express = require('express');
const { catchErrors } = require('@/handlers/errorHandlers');

const router = express.Router();
const urlRedirectController = require('@/controllers/appControllers/urlRedirectController');


// Public redirect routes (no authentication required)
router.route('/s/:shortCode')
  .get(catchErrors(urlRedirectController.getUrl));

router.route('/s/:shortCode/preview')
  .get(catchErrors(urlRedirectController.preview));

router.route('/s/:shortCode/qr')
  .get(catchErrors(urlRedirectController.generateQRCode));

router.route('/s/:shortCode/password')
  .post(catchErrors(urlRedirectController.checkPassword));
  
module.exports = router;