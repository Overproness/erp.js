const express = require('express');
const router = express.Router();

// Import the settings controller
const settingController = require('../../controllers/coreControllers/settingController');

// Routes available without authentication - primarily for onboarding
router.get('/list', settingController.list);
router.get('/onboarding', async (req, res) => {
  // Provide default onboarding settings
  const onboardingDefaults = {
    company_settings: {
      company_name: '',
      company_email: '',
      company_phone: '',
      company_address: '',
      company_website: '',
      company_logo: '',
    },
    money_format_settings: {
      currency_code: 'USD',
      currency_symbol: '$',
      currency_position: 'before',
      thousand_separator: ',',
      decimal_separator: '.',
      cent_precision: 2
    }
  };
  
  return res.status(200).json({
    success: true,
    result: onboardingDefaults,
    message: 'Default onboarding settings'
  });
});

module.exports = router;
