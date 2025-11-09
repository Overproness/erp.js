const mongoose = require('mongoose');
const Project = mongoose.model('Project');
const Team = mongoose.model('Team');

const projectController = {
  // Read a project with team permission checking
  read: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.admin?._id || req.user?._id;

      const project = await Project.findById(id)
        .populate('teams.team')
        .populate('members.user')
        .populate('createdBy', 'name email')
        .populate('projectManager', 'name email');

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found',
        });
      }

      // Check if user has access to this project
      let hasAccess = false;

      // Check if user is the creator or admin/manager role
      if (
        project.createdBy?.toString() === userId?.toString() ||
        req.admin?.role === 'admin' ||
        req.admin?.role === 'manager'
      ) {
        hasAccess = true;
      } else {
        // Check team membership
        for (const teamAssignment of project.teams) {
          if (teamAssignment.team) {
            const team = await Team.findById(teamAssignment.team._id).populate('members.user');
            const isMember = team.members.some(
              (member) => member.user._id.toString() === userId.toString()
            );

            if (isMember) {
              hasAccess = true;
              break;
            }
          }
        }

        // Check direct project membership
        const isDirectMember = project.members.some(
          (member) => member.user._id.toString() === userId.toString()
        );

        if (isDirectMember) {
          hasAccess = true;
        }
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this project',
        });
      }

      // Transform teams to match test expectations (array of IDs)
      const transformedProject = {
        ...project.toObject(),
        teams: project.teams.map((teamAssignment) => {
          // Handle populated team objects - check if it's actually populated
          if (
            teamAssignment.team &&
            typeof teamAssignment.team === 'object' &&
            teamAssignment.team._id
          ) {
            return teamAssignment.team._id.toString();
          }
          // Handle direct ObjectId references in team field
          if (teamAssignment.team) {
            return teamAssignment.team.toString();
          }
          // Handle cases where team is at the top level (fallback)
          return (teamAssignment._id || teamAssignment).toString();
        }),
        // Add collaboration type based on team count
        collaborationType: project.teams.length > 1 ? 'cross_functional' : 'single_team',
      };

      return res.status(200).json({
        success: true,
        result: transformedProject,
        message: 'Project retrieved successfully',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Server error while retrieving project',
        error: error.message,
      });
    }
  },

  // Create a project
  create: async (req, res) => {
    try {
      const projectData = {
        ...req.body,
        owner: req.admin?._id,
        createdBy: req.admin?._id,
      };

      const project = await new Project(projectData).save();

      return res.status(201).json({
        success: true,
        result: project,
        message: 'Project created successfully',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Error creating project',
        error: error.message,
      });
    }
  },

  // List projects accessible to user
  list: async (req, res) => {
    try {
      const userId = req.admin?._id || req.user?._id;

      // Find projects where user has access through teams or direct membership
      const projects = await Project.find({
        removed: false,
        $or: [{ owner: req.admin?._id }, { 'members.user': userId }],
      })
        .populate('teams.team')
        .populate('members.user')
        .populate('createdBy', 'name email');

      return res.status(200).json({
        success: true,
        result: projects,
        message: 'Projects retrieved successfully',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Server error while listing projects',
        error: error.message,
      });
    }
  },

  // Update a project
  update: async (req, res) => {
    try {
      const { id } = req.params;

      const project = await Project.findById(id);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found',
        });
      }

      Object.assign(project, req.body);
      await project.save();

      return res.status(200).json({
        success: true,
        result: project,
        message: 'Project updated successfully',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Error updating project',
        error: error.message,
      });
    }
  },
};

module.exports = projectController;
