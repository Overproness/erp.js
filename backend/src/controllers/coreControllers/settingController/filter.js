const mongoose = require('mongoose');
const Model = mongoose.model('Setting');

/**
 * Filter settings based on query parameters
 */
const filter = async (req, res) => {
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

    // Build filter criteria
    const query = {
      removed: false,
      owner: userId,
    };

    // Allow filtering by specific categories
    if (req.query.category) {
      query.settingCategory = req.query.category;
    }

    // Allow filtering by specific key pattern
    if (req.query.keyPattern) {
      query.settingKey = { $regex: req.query.keyPattern, $options: 'i' };
    }

    // Execute query
    const result = await Model.find(query);

    // Return filtered settings
    return res.status(200).json({
      success: true,
      result: result,
      message: `Successfully found ${result.length} settings matching filter criteria`,
    });
  } catch (error) {
    console.error('Error in settings filter controller:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Error filtering settings',
      error: error.message,
    });
  }
};

module.exports = filter;
