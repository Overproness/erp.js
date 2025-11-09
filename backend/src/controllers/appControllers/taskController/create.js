const mongoose = require('mongoose');
const Model = mongoose.model('Task');
const Team = mongoose.model('Team');

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

    // Check if team has auto-assignment enabled
    if (taskData.assignedTeam && !taskData.assignedTo) {
      const team = await Team.findById(taskData.assignedTeam).populate('members.user');
      console.log('Auto-assignment check:', {
        teamId: taskData.assignedTeam,
        teamFound: !!team,
        autoAssignTasks: team?.settings?.autoAssignTasks,
        membersCount: team?.members?.length || 0,
        members: team?.members?.map((m) => ({ user: m.user?._id || m.user, role: m.role })) || [],
      });

      if (team && team.settings?.autoAssignTasks && team.members.length > 0) {
        // Auto-assign to a random team member
        const randomIndex = Math.floor(Math.random() * team.members.length);
        const selectedMember = team.members[randomIndex];
        // Handle both populated and unpopulated references
        taskData.assignedTo = selectedMember.user._id || selectedMember.user;
        console.log('Auto-assigned to:', taskData.assignedTo);
      }
    }

    // Check if task requires approval
    if (taskData.assignedTeam) {
      const team = await Team.findById(taskData.assignedTeam);
      if (team && team.settings?.requireApprovalForTasks) {
        taskData.status = 'pending_approval';
        taskData.requiresApproval = true;
      }
    }

    const result = await new Model(taskData).save();

    // Handle team mentions and send notifications
    if (taskData.mentions && Array.isArray(taskData.mentions)) {
      const notificationService = require('../../../services/notificationService');

      for (const mention of taskData.mentions) {
        if (mention.type === 'team' && mention.id) {
          const team = await Team.findById(mention.id).populate('members.user');
          if (team && team.members) {
            // Send notification to all team members
            for (const member of team.members) {
              if (member.user && member.user._id) {
                await notificationService.sendNotification(member.user._id, {
                  type: 'team_mention',
                  title: `Team mentioned in task: ${result.title}`,
                  message: `Your team was mentioned in a new task: ${result.title}`,
                  entityType: 'task',
                  entityId: result._id,
                  data: {
                    taskId: result._id,
                    taskTitle: result.title,
                    mentionedBy: owner,
                  },
                });
              }
            }
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
