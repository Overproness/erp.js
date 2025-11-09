const mongoose = require('mongoose');
const SharedResource = mongoose.model('SharedResource');
const Team = mongoose.model('Team');

const sharedResourceController = {
  // Read a shared resource with permission checking
  read: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.admin?._id || req.user?._id;

      const resource = await SharedResource.findById(id)
        .populate('sharedWith.team')
        .populate('sharedWith.user');

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Shared resource not found',
        });
      }

      // Check if user has access to this resource
      let userPermissions = [];
      let hasAccess = false;

      // Check if user is the owner or admin
      if (
        resource.owner.toString() === req.admin?._id?.toString() ||
        (req.admin && req.admin.role === 'admin')
      ) {
        hasAccess = true;
        userPermissions = ['read', 'write', 'delete', 'share', 'admin'];
      } else {
        // Check team-based permissions
        for (const share of resource.sharedWith || []) {
          if (share.team) {
            try {
              // Check if user is a member of this team
              const team = await Team.findById(share.team._id || share.team).populate(
                'members.user'
              );
              if (team && team.members) {
                const isMember = team.members.some(
                  (member) => member.user && member.user._id.toString() === userId.toString()
                );

                if (isMember) {
                  hasAccess = true;

                  // Handle both array and object formats for permissions
                  let sharePermissions = [];
                  if (Array.isArray(share.permissions)) {
                    sharePermissions = share.permissions;
                  } else if (typeof share.permissions === 'object' && share.permissions !== null) {
                    // Convert object format to array format
                    sharePermissions = [];
                    if (share.permissions.view) sharePermissions.push('read');
                    if (share.permissions.edit) sharePermissions.push('write');
                    if (share.permissions.delete) sharePermissions.push('delete');
                    if (share.permissions.share) sharePermissions.push('share');
                  } else {
                    sharePermissions = ['read']; // Default permission
                  }

                  userPermissions = [...new Set([...userPermissions, ...sharePermissions])];
                }
              }
            } catch (teamError) {
              console.error('Error checking team permissions:', teamError);
              // Continue with next share instead of failing completely
            }
          }

          // Check direct user permissions
          if (share.user && share.user._id.toString() === userId.toString()) {
            hasAccess = true;

            // Handle both array and object formats for permissions
            let sharePermissions = [];
            if (Array.isArray(share.permissions)) {
              sharePermissions = share.permissions;
            } else if (typeof share.permissions === 'object' && share.permissions !== null) {
              // Convert object format to array format
              sharePermissions = [];
              if (share.permissions.view) sharePermissions.push('read');
              if (share.permissions.edit) sharePermissions.push('write');
              if (share.permissions.delete) sharePermissions.push('delete');
              if (share.permissions.share) sharePermissions.push('share');
            } else {
              sharePermissions = ['read']; // Default permission
            }

            userPermissions = [...new Set([...userPermissions, ...sharePermissions])];
          }
        }
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this resource',
        });
      }

      // Update access count and last accessed
      resource.accessCount += 1;
      resource.lastAccessed = new Date();
      await resource.save();

      return res.status(200).json({
        success: true,
        result: {
          ...resource.toObject(),
          permissions: userPermissions,
        },
        message: 'Resource retrieved successfully',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Server error while retrieving resource',
        error: error.message,
      });
    }
  },

  // Create a shared resource
  create: async (req, res) => {
    try {
      const resourceData = {
        ...req.body,
        owner: req.admin?._id,
        createdBy: req.admin?._id,
      };

      const resource = await new SharedResource(resourceData).save();

      return res.status(201).json({
        success: true,
        result: resource,
        message: 'Shared resource created successfully',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Error creating shared resource',
        error: error.message,
      });
    }
  },

  // List shared resources accessible to user
  list: async (req, res) => {
    try {
      const userId = req.admin?._id || req.user?._id;

      // Find resources where user has access through teams or direct sharing
      const resources = await SharedResource.find({
        removed: false,
        $or: [{ owner: req.admin?._id }, { 'sharedWith.user': userId }],
      })
        .populate('sharedWith.team')
        .populate('sharedWith.user');

      return res.status(200).json({
        success: true,
        result: resources,
        message: 'Resources retrieved successfully',
      });
    } catch (error) {
      console.error('sharedResourceController read error:', error);
      console.error('sharedResourceController read error stack:', error.stack);
      return res.status(500).json({
        success: false,
        message: 'Server error while listing resources',
        error: error.message,
      });
    }
  },
};

module.exports = sharedResourceController;
