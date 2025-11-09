const mongoose = require('mongoose');
const Model = mongoose.model('Setting');

/**
 * List settings for the current admin user or company owner
 * For regular users, return their company owner's settings
 */
const list = async (req, res) => {
  try {
    let settingsOwnerId = null;

    // Determine whose settings to fetch
    if (req.companyOwner) {
      // If it's a CompanyOwner, use their ID
      settingsOwnerId = req.companyOwner._id;
      console.log('Fetching settings for CompanyOwner:', settingsOwnerId);
    } else if (req.user) {
      // If it's a regular User, get their company owner's settings
      const User = mongoose.model('User');
      const Team = mongoose.model('Team');
      
      let companyOwnerId = null;
      
      // Try to get company owner from user.companyOwner field first
      if (req.user.companyOwner) {
        companyOwnerId = req.user.companyOwner;
        console.log('Using companyOwner from user record:', companyOwnerId);
      }
      // Otherwise, get it from the team
      else if (req.user.team) {
        const team = await Team.findById(req.user.team);
        if (team && team.owner) {
          companyOwnerId = team.owner;
          console.log('Using companyOwner from team record:', companyOwnerId);
        }
      }
      
      if (!companyOwnerId) {
        console.log('No company owner found for user:', req.user._id);
        return res.status(403).json({
          success: false,
          result: null,
          message: 'Unable to determine company owner for settings access'
        });
      }
      
      settingsOwnerId = companyOwnerId;
      console.log('Fetching settings for User, using CompanyOwner:', settingsOwnerId);
    }

    // Create default settings structure for client-side organization
    const settingsData = {
      crm_settings: {},
      finance_settings: {},
      company_settings: {},
      app_settings: {},
      money_format_settings: {},
    };

    // Check if settingsOwnerId is defined before proceeding with database query
    if (!settingsOwnerId) {
      console.log('No settings owner ID found, returning empty settings');

      // Format the result as an array for client-side compatibility
      const settingsArray = Object.keys(settingsData).map((category) => ({
        type: category,
        settings: settingsData[category],
      }));

      // Return empty settings structure for onboarding
      return res.status(200).json({
        success: true,
        result: settingsArray,
        message: 'Settings not found for the current user. Using defaults.',
      });
    }

    console.log('Fetching settings for owner ID:', settingsOwnerId);

    // Find settings based on owner ID
    const result = await Model.find({
      owner: settingsOwnerId,
      removed: false,
    });

    console.log(`Found ${result?.length || 0} settings for owner ID: ${settingsOwnerId}`);

    // Process settings if any were found
    if (result && result.length > 0) {
      // Map the settings by their category using the new structure
      result.forEach((item) => {
        if (item.category && item.data) {
          // Use the new structure: category and data fields
          if (!settingsData[item.category]) {
            settingsData[item.category] = {};
          }

          // Merge the data object into the category
          settingsData[item.category] = {
            ...settingsData[item.category],
            ...item.data,
          };
        }
      });
    }

    // Format the result as an array for client-side compatibility
    const settingsArray = Object.keys(settingsData).map((category) => ({
      type: category,
      settings: settingsData[category],
    }));

    return res.status(200).json({
      success: true,
      result: settingsArray,
      message: 'Successfully found all settings',
    });
  } catch (error) {
    console.error('Error in settings list controller:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Error loading settings',
      error: error.message,
    });
  }
};

module.exports = list;
