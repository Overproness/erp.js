const mongoose = require('mongoose');

const search = async (req, res) => {
  try {
    // Get owner from either user or companyOwner context
    const owner =
      (req.user && (req.user.companyOwner || req.user._id)) ||
      (req.companyOwner && req.companyOwner._id);

    if (!owner) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Owner context not found - authentication required',
      });
    }

    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Search query is required',
      });
    }

    const AppDocument = mongoose.model('AppDocument');

    // Build search criteria
    const searchCriteria = {
      owner: owner,
      removed: false,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { fileName: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
      ],
    };

    const documents = await AppDocument.find(searchCriteria).sort({ created: -1 }).limit(50);

    return res.status(200).json({
      success: true,
      result: documents,
      message: 'Documents found successfully',
    });
  } catch (error) {
    console.error('Document search error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Error searching documents',
      error: error.message,
    });
  }
};

module.exports = search;
