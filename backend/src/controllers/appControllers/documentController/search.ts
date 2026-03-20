// @ts-nocheck
const mongoose = require('mongoose');

const search = async (req, res) => {
  try {
    // Get companyID for filtering
    const companyID = req.user?.companyID || req.companyOwner?.companyID;
    const userId = req.user?._id || req.companyOwner?._id;

    if (!companyID && !userId) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Authentication context not found',
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

    // Build base filter - use companyID if available, otherwise filter by owner
    const baseFilter = { removed: false };

    if (companyID) {
      baseFilter.companyID = companyID;
    } else {
      baseFilter.owner = userId;
    }

    // Build search criteria with text search
    const searchCriteria = {
      ...baseFilter,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { fileName: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
        { documentType: { $regex: q, $options: 'i' } },
        { extractedText: { $regex: q, $options: 'i' } },
      ],
    };

    const documents = await AppDocument.find(searchCriteria)
      .sort({ created: -1 })
      .limit(50)
      .populate('owner', 'name email')
      .lean();

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
