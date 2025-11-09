const mongoose = require('mongoose');

const Model = mongoose.model('Invoice');

const read = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No document found or you do not have permission to access it',
      });
    }

    // Get the owner ID from the appropriate auth property
    const ownerId = req.companyOwner?._id || req.user?._id;
    const companyID = req.companyOwner?.companyID || req.user?.companyID;

    if (!ownerId) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Authentication required',
      });
    }

    // Permission check for user
    if (req.user && !req.user.permissions?.canViewInvoices) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to view invoices',
      });
    }

    // Find document by id AND owner AND companyID
    const result = await Model.findOne({
      _id: req.params.id,
      owner: ownerId,
      companyID: companyID,
      removed: false,
    })
      .populate('createdBy', 'name')
      .exec();

    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No document found or you do not have permission to access it',
      });
    } else {
      return res.status(200).json({
        success: true,
        result,
        message: 'Document found successfully',
      });
    }
  } catch (error) {
    console.error('Invoice read error:', error);
    return res.status(404).json({
      success: false,
      result: null,
      message: 'No document found or you do not have permission to access it',
    });
  }
};

module.exports = read;
