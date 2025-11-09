const Task = require('../../../models/appModels/Task');
const User = require('../../../models/appModels/User');

const delegate = async (req, res) => {
  try {
    const { id } = req.params;
    const { delegateTo, delegationNote } = req.body;
    const userId = delegateTo;

    // Find the task
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Find the user to delegate to
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Store previous assignee
    const previousAssignee = task.assignedTo;

    // Update task assignment
    task.assignedTo = userId;
    task.delegatedBy = req.admin?._id || req.user?._id;
    task.delegatedAt = new Date();
    task.status = 'delegated';

    // Add delegation history
    if (!task.delegationHistory) {
      task.delegationHistory = [];
    }

    task.delegationHistory.push({
      from: previousAssignee,
      to: userId,
      delegatedBy: req.admin?._id || req.user?._id,
      delegatedAt: new Date(),
      note: delegationNote,
    });

    await task.save();

    return res.status(200).json({
      success: true,
      result: task,
      message: 'Task delegated successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while delegating task',
      error: error.message,
    });
  }
};

module.exports = delegate;
