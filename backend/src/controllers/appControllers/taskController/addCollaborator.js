const Task = require('../../../models/appModels/Task');
const User = require('../../../models/appModels/User');
const Team = require('../../../models/appModels/Team');

const addCollaborator = async (req, res) => {
  try {
    const { id } = req.params;
    const { collaborators, userId, role = 'collaborator' } = req.body;

    // Support both formats: collaborators array or single userId
    const userIds = collaborators || [userId];

    if (!userIds || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No collaborators specified',
      });
    }

    // Find the task and populate assigned team
    const task = await Task.findById(id).populate('assignedTeam');
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Get task team for cross-team collaboration checking
    let taskTeam = null;
    if (task.assignedTeam) {
      taskTeam =
        typeof task.assignedTeam === 'object'
          ? task.assignedTeam
          : await Team.findById(task.assignedTeam);
    }

    const results = [];

    for (const userId of userIds) {
      // Find the user and their team
      const user = await User.findById(userId).populate('team');
      if (!user) {
        continue; // Skip invalid users
      }

      // Check if this is cross-team collaboration
      if (taskTeam && user.team && user.team._id.toString() !== taskTeam._id.toString()) {
        // This is cross-team collaboration - check if allowed
        if (!taskTeam.settings?.allowCrossTeamCollaboration) {
          return res.status(403).json({
            success: false,
            message: 'cross-team collaboration is not allowed for this task',
          });
        }
      }

      // Check if user is already a collaborator
      const existingCollaborator = task.collaborators?.find(
        (collab) => collab.toString() === userId
      );

      if (existingCollaborator) {
        continue; // Skip if already a collaborator
      }

      // Initialize collaborators array if it doesn't exist
      if (!task.collaborators) {
        task.collaborators = [];
      }

      // Add collaborator (just the user ID, not an object)
      task.collaborators.push(userId);

      results.push({
        userId,
        email: user.email,
        name: user.name,
        role,
      });
    }

    await task.save();

    return res.status(200).json({
      success: true,
      result: task,
      collaboratorsAdded: results,
      message: `${results.length} collaborator(s) added successfully`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while adding collaborator',
      error: error.message,
    });
  }
};

module.exports = addCollaborator;
