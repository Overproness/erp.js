const mongoose = require('mongoose');
const Model = mongoose.model('Setting');

const listAll = async (req, res) => {
  const sort = parseInt(req.query.sort) || 'desc';

  // Find the settings owner ID
  let settingsOwnerId = null;

  if (req.companyOwner && req.companyOwner._id) {
    // If the user is a company owner
    settingsOwnerId = req.companyOwner._id;
    console.log('Settings accessed by company owner ID:', settingsOwnerId);
  } else if (req.user) {
    // If the user is a regular user, get their company owner's settings
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

    if (companyOwnerId) {
      settingsOwnerId = companyOwnerId;
      console.log('Settings accessed by user, using company owner ID:', settingsOwnerId);
    }
  } else if (req.admin && req.admin._id) {
    // Legacy admin support
    settingsOwnerId = req.admin._id;
    console.log('Settings accessed by admin ID:', settingsOwnerId);
  }

  let query = {
    removed: false,
  };

  // If we have a settingsOwnerId, filter settings for this specific owner ONLY
  if (settingsOwnerId) {
    query.owner = settingsOwnerId;
  }

  console.log('Settings query:', query);

  // Query the database for a list of all results
  const result = await Model.find(query).sort({ created: sort });

  // Return the new structure directly - let frontend handle the transformation
  const transformedResult = result.map((setting) => ({
    _id: setting._id,
    removed: setting.removed,
    enabled: setting.enabled,
    category: setting.category,
    data: setting.data,
    owner: setting.owner,
    created: setting.created,
    updated: setting.updated,
  }));

  console.log('🚀 ~ listAll ~ transformed result:', transformedResult);
  console.log(`Found ${transformedResult.length} setting categories`);

  // Always return status 200, even if the collection is empty
  return res.status(200).json({
    success: true,
    result: transformedResult || [],
    message:
      transformedResult.length > 0 ? 'Successfully found all documents' : 'Collection is Empty',
  });
};

module.exports = listAll;
