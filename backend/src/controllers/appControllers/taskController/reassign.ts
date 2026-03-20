// @ts-nocheck
const Task = require('../../../models/appModels/Task');
const User = require('../../../models/appModels/User');
const Team = require('../../../models/appModels/Team');
const { notificationService } = require('../../../services/notificationService');

const reassign = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;
    const newAssigneeId = assignedTo;

    // Find the task
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Validate that task has a team assigned
    if (!task.assignedTeam) {
      return res.status(400).json({
        success: false,
        message: 'Task must be assigned to a team before reassigning to a user',
      });
    }

    // Fetch the team and validate new assignee is a member
    const team = await Team.findById(task.assignedTeam).populate('members.user');
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    const isMember = team.members.some((member) => {
      const memberId = member.user._id || member.user;
      return memberId.toString() === newAssigneeId.toString();
    });

    if (!isMember) {
      return res.status(400).json({
        success: false,
        message: 'The new assignee is not a member of the task team',
      });
    }

    // Find the new assignee
    const newAssignee = await User.findById(newAssigneeId);
    if (!newAssignee) {
      return res.status(404).json({
        success: false,
        message: 'New assignee not found',
      });
    }

    // Store previous assignee
    const previousAssignee = task.assignedTo;

    // Update task assignment
    task.assignedTo = newAssigneeId;
    task.reassignedBy = req.admin?._id || req.user?._id;
    task.reassignedAt = new Date();

    // Add reassignment history
    if (!task.reassignmentHistory) {
      task.reassignmentHistory = [];
    }

    task.reassignmentHistory.push({
      from: previousAssignee,
      to: newAssigneeId,
      reassignedBy: req.admin?._id || req.user?._id,
      reassignedAt: new Date(),
    });

    await task.save();

    // Send notification to new assignee
    // const newAssignee = await User.findById(newAssigneeId);
    const reassigner = await User.findById(req.admin?._id || req.user?._id);

    await notificationService.sendTaskAssignmentNotification(task, newAssignee, reassigner);

    return res.status(200).json({
      success: true,
      result: task,
      message: 'Task reassigned successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while reassigning task',
      error: error.message,
    });
  }
};

module.exports = reassign;
