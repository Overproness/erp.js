// @ts-nocheck
const mongoose = require('mongoose');
const listAllSettings = require('./listAllSettings');

const loadSettings = async (userId = null) => {
  // Initialize the allSettings object
  const allSettings = {};
  
  let companyOwnerId = null;

  // If userId is provided, check if it's a User and resolve companyOwner
  if (userId) {
    // Try to resolve as User first
    try {
      const User = mongoose.model('User');
      const user = await User.findById(userId);
      if (user && user.companyOwner) {
        companyOwnerId = user.companyOwner;
      }
    } catch (err) {
      // Not a User or no companyOwner reference
    }
    // If not resolved, treat as CompanyOwner
    if (!companyOwnerId) {
      companyOwnerId = userId;
    }
  }

  // If not set, try to get from global.req (legacy context)
  if (!companyOwnerId && global.req) {
    if (global.req.companyOwner && global.req.companyOwner._id) {
      companyOwnerId = global.req.companyOwner._id;
    } else if (global.req.user) {
      if (global.req.user.companyOwner) {
        console.log("Using companyOwner ID from team member's companyOwner reference");
        companyOwnerId = global.req.user.companyOwner;
      } else if (global.req.user.team) {
        try {
          console.log('Looking up companyOwner ID from team reference');
          const Team = mongoose.model('Team');
          const team = await Team.findById(global.req.user.team);
          if (team && team.owner) {
            console.log('Found team owner ID from team reference');
            companyOwnerId = team.owner;
          }
        } catch (error) {
          console.error('Error finding team owner:', error);
        }
      }
    }
  }

  console.log('Loading settings for companyOwner ID:', companyOwnerId);

  // Get settings for this specific companyOwner user if provided
  const datas = await listAllSettings(companyOwnerId);

  if (!datas || datas.length === 0) {
    console.log('No settings found, using defaults');
  }

  console.log(`Found ${datas.length} settings for companyOwner ID: ${companyOwnerId}`);

  // Convert new structure to flat structure for backward compatibility
  datas.forEach((setting) => {
    if (setting.category && setting.data) {
      // Store category-level data
      allSettings[setting.category] = setting.data;

      // Also flatten for backward compatibility
      if (typeof setting.data === 'object' && setting.data !== null) {
        Object.keys(setting.data).forEach((key) => {
          // Create flattened keys for backward compatibility
          allSettings[key] = setting.data[key];

          // Special handling for money format settings
          if (setting.category === 'money_format_settings' || setting.category === 'currency') {
            if (key === 'currency_code' || key === 'default') {
              allSettings.currency_code = setting.data[key];
            }
            if (key === 'currency_symbol' || key === 'symbol') {
              allSettings.currency_symbol = setting.data[key];
            }
            if (key === 'currency_position' || key === 'position') {
              allSettings.currency_position = setting.data[key];
            }
            if (key === 'decimal_sep' || key === 'decimal_separator') {
              allSettings.decimal_sep = setting.data[key];
            }
            if (key === 'thousand_sep' || key === 'thousand_separator') {
              allSettings.thousand_sep = setting.data[key];
            }
            if (key === 'cent_precision' || key === 'precision') {
              allSettings.cent_precision = setting.data[key];
            }
          }
        });
      }
    }
  });

  // Ensure money_format_settings object exists for backward compatibility
  if (!allSettings.money_format_settings) {
    allSettings.money_format_settings = {};
  }

  // Copy currency settings to money_format_settings for backward compatibility
  if (allSettings.currency) {
    Object.assign(allSettings.money_format_settings, allSettings.currency);
  }

  if (allSettings.currency_code) {
    allSettings.money_format_settings.currency_code = allSettings.currency_code;
  }
  if (allSettings.currency_symbol) {
    allSettings.money_format_settings.currency_symbol = allSettings.currency_symbol;
  }
  if (allSettings.currency_position) {
    allSettings.money_format_settings.currency_position = allSettings.currency_position;
  }

  console.log('Final settings loaded:', {
    currency_code: allSettings.currency_code,
    currency_symbol: allSettings.currency_symbol,
    currency_position: allSettings.currency_position,
    categories: Object.keys(allSettings).filter((key) => typeof allSettings[key] === 'object'),
  });

  return allSettings;
};

module.exports = loadSettings;