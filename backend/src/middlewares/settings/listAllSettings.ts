// @ts-nocheck
const mongoose = require('mongoose');

const Model = mongoose.model('Setting');

const listAllSettings = async (userId = null) => {
  try {
    const query = {
      removed: false,
    };

    // If userId is provided, prioritize user-specific settings
    if (userId) {
      // First try to get only the user-specific settings
      const userSettings = await Model.find({
        removed: false,
        owner: userId,
      }).exec();

      console.log(`Found ${userSettings.length} user-specific settings for owner:`, userId);

      // If we found user settings, use them
      if (userSettings.length > 0) {
        // Get global settings for categories not present in user settings
        const userSettingCategories = userSettings.map((s) => s.category);
        console.log('User has settings for categories:', userSettingCategories);

        // Get global settings for other categories only
        const globalSettings = await Model.find({
          removed: false,
          category: { $nin: userSettingCategories },
          $or: [{ owner: { $exists: false } }, { owner: null }],
        }).exec();

        console.log(`Found ${globalSettings.length} complementary global settings`);

        // Combine user settings (which take priority) with global settings
        return [...userSettings, ...globalSettings];
      }

      // If no user-specific settings, fall back to query with $or
      query.$or = [{ owner: userId }, { owner: { $exists: false } }, { owner: null }];
      console.log('No user-specific settings found, querying for user or global settings');
    } else {
      console.log('Query for all settings (no owner filter)');
    }

    // Query the database for a list of all results
    const result = await Model.find(query).exec();

    console.log(`Query result: Found ${result.length} settings`);

    // Debug log the specific currencies found in the new structure
    const currencySettings = result.filter(
      (s) => s.category === 'money_format_settings' || s.category === 'currency'
    );

    if (currencySettings.length > 0) {
      console.log('Currency settings found:');
      currencySettings.forEach((setting) => {
        console.log(
          `Category: ${setting.category}, Data:`,
          setting.data,
          `Owner: ${setting.owner ? 'company-specific' : 'global'}`
        );
      });
    }

    if (result.length > 0) {
      return result;
    } else {
      // If no settings found and we were looking for a specific user,
      // try to get just the global settings as fallback
      if (userId) {
        console.log('No settings found for user, trying global settings only');
        const globalSettings = await Model.find({
          removed: false,
          $or: [{ owner: { $exists: false } }, { owner: null }],
        }).exec();

        console.log(`Found ${globalSettings.length} global settings`);
        return globalSettings;
      }
      return [];
    }
  } catch (error) {
    console.error('Error listing settings:', error);
    return [];
  }
};

module.exports = listAllSettings;
