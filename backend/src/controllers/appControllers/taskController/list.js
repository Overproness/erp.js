const mongoose = require('mongoose');
const Model = mongoose.model('Task');

const list = async (req, res) => {
  try {
    // Permission check for list
    if (req.user && !req.user.permissions?.canViewTasks) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to view tasks',
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

    const result = await Model.find({
      removed: false,
      companyID: companyID,
    })
      .populate('assignedTo', 'name email') // Add this line to populate assignedTo
      .sort({ created: -1 });

    return res.status(200).json({
      success: true,
      result,
      message: 'Successfully found all tasks',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = list;
