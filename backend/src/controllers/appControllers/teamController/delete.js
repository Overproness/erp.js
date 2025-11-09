const Team = require('@/models/appModels/Team');

const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Team.findOne({
      _id: id,
      removed: false,
      owner: req.companyOwner._id,
    });
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }
    // CompanyID enforcement
    const requesterCompanyID = req.companyOwner?.companyID || req.user?.companyID;
    if (team.companyID !== requesterCompanyID) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: company mismatch',
      });
    }
    // Permission check: Only company owner or team admin can delete
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
          message: 'Only team admin or company owner can delete the team',
        });
      }
    }
    // Soft delete the team
    team.removed = true;
    await team.save();

    return res.status(200).json({
      success: true,
      result: team,
      message: 'Team deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting team',
      error: error.message,
    });
  }
};

module.exports = deleteTeam;
