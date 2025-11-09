const mongoose = require('mongoose');

const Model = mongoose.model('Setting');

const updateManySetting = async (req, res) => {
  try {
    // Get settings owner ID - for users, use their company owner's ID
    let settingsOwnerId = null;

    if (req.companyOwner) {
      // If it's a CompanyOwner, use their ID
      settingsOwnerId = req.companyOwner._id;
    } else if (req.user) {
      // If it's a regular User, get their company owner's ID for settings
      const User = mongoose.model('User');
      const Team = mongoose.model('Team');
      
      let companyOwnerId = null;
      
      // Try to get company owner from user.companyOwner field first
      if (req.user.companyOwner) {
        companyOwnerId = req.user.companyOwner;
      }
      // Otherwise, get it from the team
      else if (req.user.team) {
        const team = await Team.findById(req.user.team);
        if (team && team.owner) {
          companyOwnerId = team.owner;
        }
      }
      
      if (!companyOwnerId) {
        return res.status(403).json({
          success: false,
          result: null,
          message: 'Unable to determine company owner for settings update.',
        });
      }
      
      settingsOwnerId = companyOwnerId;
    } else if (req.admin) {
      // Legacy admin support
      settingsOwnerId = req.admin._id;
    }

    if (!settingsOwnerId) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Authentication required to update settings.',
      });
    }

    const { settings } = req.body;

    if (!Array.isArray(settings) || settings.length === 0) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Please provide a valid array of settings to update.',
      });
    }

    console.log(`Updating ${settings.length} settings for user ${settingsOwnerId}`);

    // Group settings by category
    const settingsByCategory = {};

    for (const setting of settings) {
      // Support both old format (settingKey, settingValue) and new format (category, data)
      let category, key, value;

      if (setting.category && setting.data) {
        // New format: { category: 'finance', data: { counter: 1, ... } }
        category = setting.category;
        if (!settingsByCategory[category]) {
          settingsByCategory[category] = {};
        }
        settingsByCategory[category] = { ...settingsByCategory[category], ...setting.data };
      } else if (setting.settingKey !== undefined && setting.settingValue !== undefined) {
        // Old format: { settingKey: 'currency_code', settingValue: 'USD', settingCategory: 'money_format_settings' }
        category = setting.settingCategory || 'general';
        key = setting.settingKey;
        value = setting.settingValue;

        if (!settingsByCategory[category]) {
          settingsByCategory[category] = {};
        }

        // Special handling for currency settings to ensure consistency
        if (category === 'money_format_settings') {
          // If updating currency_code, ensure consistency
          if (key === 'currency_code') {
            settingsByCategory[category]['currency_code'] = value;
            // Remove conflicting default_currency_code if it exists
            delete settingsByCategory[category]['default_currency_code'];
          }
          // If updating default_currency_code, map it to currency_code
          else if (key === 'default_currency_code') {
            settingsByCategory[category]['currency_code'] = value;
            delete settingsByCategory[category]['default_currency_code'];
          } else {
            settingsByCategory[category][key] = value;
          }
        } else {
          settingsByCategory[category][key] = value;
        }
      } else {
        console.warn('Skipping invalid setting:', setting);
        continue;
      }
    }

    const results = [];

    // Process each category
    for (const [category, data] of Object.entries(settingsByCategory)) {
      try {
        console.log(`Processing category: ${category} with data:`, data);

        // Find existing setting document for this category
        let existingSetting = await Model.findOne({
          category,
          owner: settingsOwnerId,
        });

        if (existingSetting) {
          // Clean up any inconsistent currency data before merging
          let cleanedExistingData = { ...existingSetting.data };
          if (category === 'money_format_settings') {
            // If we're updating currency settings, clean up conflicts
            if (data.currency_code && cleanedExistingData.default_currency_code) {
              delete cleanedExistingData.default_currency_code;
            }
          }

          // Update existing setting using atomic operators
          await Model.findOneAndUpdate(
            { category, owner: settingsOwnerId },
            {
              $set: {
                data: { ...cleanedExistingData, ...data },
                updated: new Date(),
                updatedBy: req.user?._id || req.companyOwner?._id || req.admin?._id,
              },
            },
            { new: true }
          );

          results.push({
            success: true,
            category,
            message: 'Settings updated successfully.',
          });
        } else {
          // Create new setting document for this category
          const newSetting = new Model({
            category,
            data,
            owner: settingsOwnerId,
            created: new Date(),
            createdBy: req.user?._id || req.companyOwner?._id || req.admin?._id,
          });

          await newSetting.save();
          results.push({
            success: true,
            category,
            setting: newSetting,
            message: 'Settings created successfully.',
          });
        }
      } catch (error) {
        console.error(`Error processing category ${category}:`, error);
        results.push({
          success: false,
          category,
          error: error.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      result: results,
      message: `Settings update completed for ${
        Object.keys(settingsByCategory).length
      } categories.`,
    });
  } catch (error) {
    console.error('Update many settings error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Error processing settings update.',
      error: error.message,
    });
  }
};

module.exports = updateManySetting;
