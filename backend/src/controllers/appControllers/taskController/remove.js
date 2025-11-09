const mongoose = require('mongoose');
const Model = mongoose.model('Task');

const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Model.findOneAndUpdate(
      { _id: id, owner: req.admin._id },
      {
        removed: true,
        removedBy: req.admin._id,
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
        message: 'Task not found',
      });
    }

    return res.status(200).json({
      success: true,
      result,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = remove;