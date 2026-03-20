// @ts-nocheck
const mongoose = require('mongoose');

const Model = mongoose.model('Setting');

const readBySettingKey = async (req, res) => {
  // Find document by id
  const settingKey = req.params.settingKey || undefined;

  if (!settingKey) {
    return res.status(202).json({
      success: false,
      result: null,
      message: 'No settingKey provided ',
    });
  }
  // Get the current user's ID from the authenticated request
  const currentUserId = req.companyOwner?._id || req.user?._id || req.admin?._id;

  const query = {
    settingKey,
    removed: false,
  };

  // If user is authenticated, filter by owner or return global settings
  if (currentUserId) {
    query.$or = [{ owner: currentUserId }, { owner: { $exists: false } }, { owner: null }];
  }

  const result = await Model.findOne(query);

  // If no results found, return document not found
  if (!result) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'No document found by this settingKey: ' + settingKey,
    });
  } else {
    // Return success resposne
    return res.status(200).json({
      success: true,
      result,
      message: 'we found this document by this settingKey: ' + settingKey,
    });
  }
};

module.exports = readBySettingKey;
