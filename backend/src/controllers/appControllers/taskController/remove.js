const mongoose = require('mongoose');
const Model = mongoose.model('Task');

const remove = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the authenticated user (can be admin or companyOwner)
    const authenticatedUser = req.user || req.admin || req.companyOwner;

    if (!authenticatedUser) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Authentication required',
      });
    }

    // Permission check for delete
    if (req.user && !req.user.permissions?.canDeleteTasks) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to delete tasks',
      });
    }

    // Get companyID for filtering
    const companyID = authenticatedUser.companyID;

    if (!companyID) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Company context not found',
      });
    }

    const result = await Model.findOneAndUpdate(
      { _id: id, removed: false, companyID: companyID },
      {
        removed: true,
        removedBy: authenticatedUser._id,
        removedAt: new Date(),
      },
      {
        new: true,
      }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Task not found or already deleted',
      });
    }

    return res.status(200).json({
      success: true,
      result,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Task delete error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = remove;
