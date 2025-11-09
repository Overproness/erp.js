const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');

// Simple test endpoints to check if routing works
router.route('/accounts').get(
  catchErrors(async (req, res) => {
    res.json({
      success: true,
      result: [],
      message: 'Test social media accounts endpoint working',
    });
  })
);

router.route('/posts').get(
  catchErrors(async (req, res) => {
    res.json({
      success: true,
      result: [],
      message: 'Test social media posts endpoint working',
    });
  })
);

router.route('/analytics/overview').get(
  catchErrors(async (req, res) => {
    res.json({
      success: true,
      result: {
        totalPosts: 0,
        totalAccounts: 0,
        engagement: 0,
      },
      message: 'Test social media analytics endpoint working',
    });
  })
);

module.exports = router;
