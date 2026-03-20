// @ts-nocheck
const mongoose = require('mongoose');
const fs = require('fs');
const { globSync } = require('glob');

/**
 * Initialize default settings if the settings collection is empty
 */
const initDefaultSettings = async () => {
  const Setting = mongoose.model('Setting');

  // Check if settings exist
  const settingsCount = await Setting.countDocuments({ removed: false });

  if (settingsCount === 0) {
    console.log('No settings found, initializing default settings...');

    const settingData = [];
    try {
      // Load default settings from JSON files
      const settingsFiles = globSync('./src/setup/defaultSettings/**/*.json');

      for (const filePath of settingsFiles) {
        const file = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        settingData.push(...file);
      }

      if (settingData.length > 0) {
        await Setting.insertMany(settingData);
        console.log(`Successfully initialized ${settingData.length} default settings`);
      }
    } catch (error) {
      console.error('Error initializing default settings:', error);
    }
  }
};

module.exports = initDefaultSettings;
