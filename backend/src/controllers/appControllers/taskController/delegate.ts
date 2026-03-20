// @ts-nocheck
const Task = require('../../../models/appModels/Task');
const User = require('../../../models/appModels/User');
const Team = require('../../../models/appModels/Team');
const { notificationService } = require('../../../services/notificationService');

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

    // Validate that task has a team assigned
    if (!task.assignedTeam) {
      return res.status(400).json({
        success: false,
        message: 'Task must be assigned to a team before delegating to a user',
      });
    }

    // Fetch the team and validate delegate is a member
    const team = await Team.findById(task.assignedTeam).populate('members.user');
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    const isMember = team.members.some((member) => {
      const memberId = member.user._id || member.user;
      return memberId.toString() === userId.toString();
    });

    if (!isMember) {
      return res.status(400).json({
        success: false,
        message: 'You can only delegate to members of the task team',
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

    // Send notification to delegated user
    try {
      await notificationService.sendNotification({
        recipientId: userId,
        recipientModel: 'User',
        title: 'Task Delegated to You',
        message: `Task "${task.title}" has been delegated to you${
          delegationNote ? ': ' + delegationNote : ''
        }`,
        type: 'task_delegation',
        data: {
          taskId: task._id,
          taskTitle: task.title,
          deadline: task.deadline,
          priority: task.priority,
          delegationNote: delegationNote,
          teamId: team._id,
          teamName: team.name,
        },
        priority: task.priority === 'high' ? 'high' : 'normal',
      });
    } catch (notifError) {
      console.error('Error sending notification:', notifError);
    }

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
