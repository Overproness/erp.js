// @ts-nocheck
const mongoose = require('mongoose');
const Model = mongoose.model('Task');
const Team = mongoose.model('Team');
const User = mongoose.model('User');

const create = async (req, res) => {
  try {
    // Permission check for create
    if (req.user && !req.user.permissions?.canCreateTasks) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to create tasks',
      });
    }

    // Set owner and companyID
    const owner = req.user ? req.user._id : req.companyOwner._id;
    const companyID = req.user ? req.user.companyID : req.companyOwner.companyID;

    // Prepare task data with proper date handling
    const taskData = {
      ...req.body,
      deadline: req.body.deadline ? new Date(req.body.deadline) : null,
      owner: owner,
      createdBy: owner,
      companyID: companyID,
      created: new Date(),
      updated: new Date(),
    };

    // Validate team assignment if provided
    let team = null;
    if (taskData.assignedTeam) {
      // Fetch the team to validate members
      team = await Team.findById(taskData.assignedTeam).populate('members.user');
      if (!team) {
        return res.status(404).json({
          success: false,
          result: null,
          message: 'Team not found',
        });
      }

      // If assignedTo is provided, validate they are a member of the team
      if (taskData.assignedTo) {
        const isMember = team.members.some((member) => {
          const memberId = member.user._id || member.user;
          return memberId.toString() === taskData.assignedTo.toString();
        });

        if (!isMember) {
          return res.status(400).json({
            success: false,
            result: null,
            message: 'The assigned user is not a member of the selected team',
          });
        }
      } else if (team.settings?.autoAssignTasks && team.members.length > 0) {
        // Auto-assign to a random team member if enabled
        const randomIndex = Math.floor(Math.random() * team.members.length);
        const selectedMember = team.members[randomIndex];
        taskData.assignedTo = selectedMember.user._id || selectedMember.user;
        console.log('Auto-assigned to:', taskData.assignedTo);
      }

      // Check if task requires approval
      if (team.settings?.requireApprovalForTasks) {
        taskData.status = 'pending_approval';
        taskData.requiresApproval = true;
      }
    }

    const result = await new Model(taskData).save();

    // Send notification to assigned user
    if (taskData.assignedTo) {
      const { notificationService } = require('../../../services/notificationService');
      const assignedUser = await User.findById(taskData.assignedTo);

      console.log('=== TASK ASSIGNMENT NOTIFICATION DEBUG ===');
      console.log('Task ID:', result._id);
      console.log('Assigned To ID:', taskData.assignedTo);
      console.log('Assigned User Found:', assignedUser ? 'YES' : 'NO');
      if (assignedUser) {
        console.log('User details:', {
          _id: assignedUser._id,
          name: assignedUser.name,
          email: assignedUser.email,
          enabled: assignedUser.enabled,
          removed: assignedUser.removed,
        });
      }

      if (assignedUser) {
        try {
          const notificationResult = await notificationService.sendNotification({
            recipientId: assignedUser._id,
            recipientModel: 'User',
            title: 'New Task Assigned',
            message: `You have been assigned a new task: "${result.title}"`,
            type: 'task_assigned',
            data: {
              taskId: result._id,
              taskTitle: result.title,
              deadline: result.deadline,
              priority: result.priority,
              teamId: team._id,
              teamName: team.name,
            },
            priority: result.priority === 'high' ? 'high' : 'normal',
          });
          console.log('Notification sent successfully:', notificationResult ? 'YES' : 'NO');
        } catch (notifError) {
          console.error('Error sending notification:', notifError);
        }
      }
      console.log('========================================');
    }

    // Handle team mentions and send notifications
    if (taskData.mentions && Array.isArray(taskData.mentions)) {
      const { notificationService } = require('../../../services/notificationService');

      for (const mention of taskData.mentions) {
        if (mention.type === 'team' && mention.id) {
          const mentionedTeam = await Team.findById(mention.id).populate('members.user');
          if (mentionedTeam && mentionedTeam.members) {
            const CompanyOwner = mongoose.model('CompanyOwner');
            const mentionedBy = await CompanyOwner.findById(owner);
            await notificationService.sendTeamMentionNotification(mentionedTeam, mentionedBy, {
              taskId: result._id,
              taskTitle: result.title,
            });
          }
        }
      }
    }

    // For API response, we can return the simple result without population
    // The test expects ObjectIds, not populated objects
    const responseResult = result.toObject();

    return res.status(201).json({
      success: true,
      result: responseResult,
      message: 'Task created successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = create;
