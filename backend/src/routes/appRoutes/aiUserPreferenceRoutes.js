const express = require('express');
const router = express.Router();

const { checkAuth } = require('../../middlewares/auth');
const aiUserPreferenceController = require('../../controllers/appControllers/aiUserPreferenceController');

router.use(checkAuth);

router.route('/')
  .get(aiUserPreferenceController.read)
  .post(aiUserPreferenceController.update);

router.route('/usage')
  .patch(aiUserPreferenceController.updateUsage);

module.exports = router;
