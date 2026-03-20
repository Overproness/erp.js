// @ts-nocheck
const mongoose = require('mongoose');
const Model = mongoose.model('Task');

const update = async (req, res) => {
  try {
    // Permission check for update
    if (req.user && !req.user.permissions?.canUpdateTasks) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to update tasks',
      });
    }

    const { id } = req.params;

    // Get owner and companyID
    const owner = req.user ? req.user._id : req.companyOwner._id;
    const companyID = req.user ? req.user.companyID : req.companyOwner.companyID;

    // Prepare update data with proper date handling
    const updateData = {
      ...req.body,
      deadline: req.body.deadline ? new Date(req.body.deadline) : null,
      updated: new Date(),
      updatedBy: owner,
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    // Find and update task with populated assignedTo
    const result = await Model.findOneAndUpdate(
      {
        _id: id,
        companyID: companyID,
        removed: false,
      },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate('assignedTo', 'name email');

    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Task not found or you do not have permission to update it',
      });
    }

    return res.status(200).json({
      success: true,
      result,
      message: 'Task updated successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = update;
