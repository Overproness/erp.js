const mongoose = require('mongoose');

const Model = mongoose.model('Setting');

const readBySettingKey = async ({ settingKey, userId = null }) => {
  try {
    // Find document by id
    if (!settingKey) {
      return null;
    }

    let query = {
      settingKey,
      removed: false,
    };
    
    // If userId is provided, filter by owner or return global settings
    if (userId) {
      query.$or = [
        { owner: userId },
        { owner: { $exists: false } },
        { owner: null }
      ];
    }

    const result = await Model.findOne(query);
    // If no results found, return document not found
    if (!result) {
      return null;
    } else {
      // Return success resposne
      return result;
    }
  } catch {
    return null;
  }
};

module.exports = readBySettingKey;
