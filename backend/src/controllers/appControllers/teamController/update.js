const Team = require('@/models/appModels/Team');
const { updateTeamSchema } = require('./schemaValidate');

const update = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[Team Update] Params id:', id);
    console.log('[Team Update] Request body:', req.body);

    // Determine owner from admin, companyOwner, or user
    const ownerId =
      (req.admin && req.admin._id) ||
      (req.companyOwner && req.companyOwner._id) ||
      (req.user && req.user._id);

    console.log('[Team Update] Owner id:', ownerId);

    // Validate request body
    const { error, value } = updateTeamSchema.validate(req.body);
    if (error) {
      console.log('[Team Update] Validation error:', error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // Permission check: Only company owner or team admin can update
    const isCompanyOwner = !!req.companyOwner;
    if (!isCompanyOwner) {
      // Find the team first to check admin role
      const teamForRole = await Team.findOne({ _id: id, removed: false });
      const requesterId = req.user?._id?.toString();
      const requesterMember = teamForRole?.members?.find(m =>
        (m.user?.toString?.() || m._id?.toString?.()) === requesterId
      );
      const requesterRole = requesterMember?.role;
      if (requesterRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only team admin or company owner can update the team',
        });
      }
    }

    // Find and update team
    console.log('[Team Update] Update value:', value);
    const team = await Team.findOneAndUpdate(
      {
        _id: id,
        removed: false,
        owner: ownerId,
      },
      value,
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email')
      .populate('teamLead', 'name email')
      .populate({
        path: 'members',
        select: 'name email role permissions isInvitationAccepted',
        match: { removed: false },
      });

    // CompanyID enforcement
    const requesterCompanyID = req.companyOwner?.companyID || req.user?.companyID;
    if (!team || team.companyID !== requesterCompanyID) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: company mismatch',
      });
    }

    console.log('[Team Update] Updated team:', team);

    if (!team) {
      console.log('[Team Update] Team not found');
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    console.log('[Team Update] Success response');
    return res.status(200).json({
      success: true,
      result: team,
      message: 'Team updated successfully',
    });
  } catch (error) {
    console.log('[Team Update] Error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Team with this name already exists',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error while updating team',
      error: error.message,
    });
  }
};

module.exports = update;
