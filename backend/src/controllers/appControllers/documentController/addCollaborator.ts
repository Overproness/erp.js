// @ts-nocheck
const mongoose = require('mongoose');
const Document = mongoose.model('AppDocument');
const User = mongoose.model('User');

const addCollaborator = async (req, res) => {
  try {
    const { id } = req.params;
    const { collaborators, userId, permissions, role } = req.body;

    // Get current user ID
    const currentUserId = req.user?._id || req.companyOwner?._id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Support both formats: collaborators array or single userId
    const userIds = collaborators || [userId];

    // Determine permissions based on role or explicit permissions
    let finalPermissions = permissions || ['read'];
    if (role) {
      switch (role) {
        case 'editor':
          finalPermissions = ['read', 'write', 'edit'];
          break;
        case 'viewer':
          finalPermissions = ['read'];
          break;
        case 'admin':
          finalPermissions = ['read', 'write', 'edit', 'delete', 'share'];
          break;
        default:
          finalPermissions = [role]; // treat role as permission
      }
    }

    if (!userIds || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No collaborators specified',
      });
    }

    // Find the document
    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    // Check if user has permission to add collaborators
    // Either document creator or someone with edit permissions can add collaborators
    const userRole = req.user?.role || req.companyOwner?.role;
    const canModify =
      document.createdBy?.toString() === currentUserId.toString() ||
      document.collaborators?.some(
        (c) => c.user?.toString() === currentUserId.toString() && c.permissions?.includes('edit')
      ) ||
      userRole === 'admin' ||
      userRole === 'manager';

    if (!canModify) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to add collaborators',
      });
    }

    const results = [];

    for (const userId of userIds) {
      // Find the user
      const user = await User.findById(userId);
      if (!user) {
        continue; // Skip invalid users
      }

      // Initialize collaborators array if it doesn't exist
      if (!document.collaborators) {
        document.collaborators = [];
      }

      // Check if user is already a collaborator
      const existingCollaborator = document.collaborators.find(
        (collab) => collab.user && collab.user.toString() === userId
      );

      if (existingCollaborator) {
        continue; // Skip if already a collaborator
      }

      // Add collaborator
      document.collaborators.push({
        user: userId,
        permissions: Array.isArray(finalPermissions) ? finalPermissions : [finalPermissions],
        role: role || (Array.isArray(finalPermissions) ? finalPermissions[0] : finalPermissions), // Store role for compatibility
        addedAt: new Date(),
        addedBy: currentUserId,
      });

      results.push({
        userId,
        email: user.email,
        name: user.name,
        permissions: finalPermissions,
        role: role || (Array.isArray(finalPermissions) ? finalPermissions[0] : finalPermissions),
      });
    }

    await document.save();

    return res.status(200).json({
      success: true,
      result: document,
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
