// @ts-nocheck
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const AiUserPreference = require('../../../models/appModels/AiUserPreference');
const { catchErrors } = require('../../../handlers/errorHandlers');

const methods = createCRUDController('AiUserPreference');

// Get user preferences
const read = catchErrors(async (req, res) => {
  let preferences = await AiUserPreference.findOne({
    owner: req.companyOwner._id,
  }).populate('preferences.defaultAssistant preferences.dataProcessing.defaultExtractionTemplate');

  // Create default preferences if none exist
  if (!preferences) {
    preferences = await createDefaultPreferences(req.companyOwner._id);
  }

  res.status(200).json({
    success: true,
    result: preferences,
    message: 'User preferences retrieved successfully',
  });
});

// Create or update user preferences
const update = catchErrors(async (req, res) => {
  const { preferences: newPreferences } = req.body;

  let preferences = await AiUserPreference.findOne({
    owner: req.companyOwner._id,
  });

  if (preferences) {
    // Merge new preferences with existing ones
    preferences.preferences = {
      ...preferences.preferences,
      ...newPreferences,
    };
    await preferences.save();
  } else {
    // Create new preferences
    preferences = new AiUserPreference({
      owner: req.companyOwner._id,
      preferences: newPreferences,
    });
    await preferences.save();
  }

  res.status(200).json({
    success: true,
    result: preferences,
    message: 'User preferences updated successfully',
  });
});

// Update usage statistics
const updateUsage = catchErrors(async (req, res) => {
  const { chats, tokens, cost } = req.body;

  let preferences = await AiUserPreference.findOne({
    owner: req.companyOwner._id,
  });

  if (!preferences) {
    preferences = await createDefaultPreferences(req.companyOwner._id);
  }

  // Update usage stats
  if (chats) preferences.usage.totalChats += chats;
  if (tokens) preferences.usage.totalTokensUsed += tokens;
  if (cost) preferences.usage.totalCost += cost;
  preferences.usage.lastActiveDate = new Date();

  await preferences.save();

  res.status(200).json({
    success: true,
    result: preferences.usage,
    message: 'Usage statistics updated successfully',
  });
});

// Create default preferences for a new user
async function createDefaultPreferences(ownerId) {
  const defaultPreferences = new AiUserPreference({
    owner: ownerId,
    preferences: {
      autoSuggestions: true,
      notificationSettings: {
        email: true,
        inApp: true,
        chatUpdates: true,
        workflowAlerts: true,
      },
      chatSettings: {
        messageHistory: 100,
        autoSave: true,
        suggestionsEnabled: true,
      },
      dataProcessing: {
        defaultOCRLanguage: 'en',
        autoProcessing: false,
      },
      analytics: {
        defaultTimeframe: '30_days',
        includeWeekends: true,
      },
      ui: {
        theme: 'auto',
        language: 'en',
        compactMode: false,
        sidebarCollapsed: false,
      },
    },
  });

  return await defaultPreferences.save();
}

module.exports = {
  ...methods,
  read,
  update,
  updateUsage,
  createDefaultPreferences,
};
