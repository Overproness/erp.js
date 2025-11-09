const mongoose = require('mongoose');
const Model = mongoose.model('Setting');

/**
 * Search settings by keyword
 */
const search = async (req, res) => {
  try {
    // Get the authenticated user ID from the request
    const userId = req.companyOwner?._id || req.user?.admin || req.admin?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Authentication required to access settings',
      });
    }

    // Get search query from request
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Search query is required',
      });
    }

    // Build search criteria
    const searchQuery = {
      removed: false,
      owner: userId,
      $or: [
        { settingKey: { $regex: query, $options: 'i' } },
        { settingCategory: { $regex: query, $options: 'i' } },
        { settingValue: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ],
    };

    // Execute search
    const result = await Model.find(searchQuery);

    // Return search results
    return res.status(200).json({
      success: true,
      result: result,
      message: `Found ${result.length} settings matching search query`,
    });
  } catch (error) {
    console.error('Error in settings search controller:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Error searching settings',
      error: error.message,
    });
  }
};

module.exports = search;
