// @ts-nocheck
const mongoose = require('mongoose');

// Ensure the Setting model is loaded
let Model;
try {
  Model = mongoose.model('Setting');
} catch (error) {
  // If model isn't registered yet, require it
  require('../../models/coreModels/Setting');
  Model = mongoose.model('Setting');
}

const listBySettingKey = async ({ settingKeyArray = [] }) => {
  try {
    // Find document by id

    const settingsToShow = { $or: [] };

    if (settingKeyArray.length === 0) {
      return [];
    }

    for (const settingKey of settingKeyArray) {
      settingsToShow.$or.push({ settingKey });
    }
    const results = await Model.find({ ...settingsToShow }).where('removed', false);

    // If no results found, return document not found
    if (results.length >= 1) {
      return results;
    } else {
      return [];
    }
  } catch {
    return [];
  }
};

module.exports = listBySettingKey;
