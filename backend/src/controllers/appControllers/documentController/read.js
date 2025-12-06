const mongoose = require('mongoose');
const Model = mongoose.model('AppDocument');

const read = async (req, res) => {
  try {
    // Permission check for read
    if (req.user && !req.user.permissions?.canViewDocuments) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to view documents',
      });
    }

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

    const { id } = req.params;

    // Build query - use companyID if available, otherwise check owner
    let query = {
      _id: id,
      removed: false,
    };

    if (companyID) {
      query.companyID = companyID;
    } else {
      query.owner = userId;
    }

    const result = await Model.findOne(query).exec();
    // console.log('🚀 ~ read ~ result:', result);

    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Document not found or you do not have permission to access it',
      });
    }

    return res.status(200).json({
      success: true,
      result,
      message: 'Document retrieved successfully',
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

module.exports = read;
