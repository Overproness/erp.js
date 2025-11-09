const mongoose = require('mongoose');
const Model = mongoose.model('AppDocument');

const list = async (req, res) => {
  try {
    // Permission check for list
    if (req.user && !req.user.permissions?.canViewDocuments) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to view documents',
      });
    }

    // Get companyID for filtering
    const companyID = req.user?.companyID || req.companyOwner?.companyID;

    if (!companyID) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Company context not found - authentication required',
      });
    }

    // Extract pagination parameters from request query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Extract filter parameters - filter by companyID instead of owner
    const filter = { companyID: companyID, removed: false };

    // Add optional filters if provided in query
    if (req.query.category) {
      filter.documentType = req.query.category;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    // Execute queries
    const countPromise = Model.countDocuments(filter);
    const itemsPromise = Model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

    const [count, items] = await Promise.all([countPromise, itemsPromise]);

    const pages = Math.ceil(count / limit);

    // Return result with pagination data
    return res.status(200).json({
      success: true,
      result: {
        items,
        pagination: {
          page,
          limit,
          pages,
          total: count,
        },
      },
      message: 'Documents retrieved successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error,
    });
  }
};

module.exports = list;
