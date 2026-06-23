// @ts-nocheck

import { updateMemberSchema } from './schemaValidate';
import Team from '@/models/appModels/Team';
import User from '@/models/appModels/User';
const updateMember = async (req, res) => {
  try {
    const { teamId, memberId } = req.params;

    // Validate request body
    const { error, value } = updateMemberSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // Check if team exists and belongs to the user
    const team = await Team.findOne({
      _id: teamId,
      removed: false,
      owner: req.companyOwner._id,
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    // Find and update team member
    const member = await User.findOneAndUpdate(
      {
        _id: memberId,
        team: teamId,
        removed: false,
      },
      value,
      { new: true, runValidators: true }
    )
      .populate('invitedBy', 'name email')
      .select('-password -invitationToken');

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found',
      });
    }

    // CompanyID enforcement
    const requesterCompanyID = req.companyOwner?.companyID || req.user?.companyID;
    if (member.companyID !== requesterCompanyID) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: company mismatch',
      });
    }

    // Permission check: Only company owner or admin can update members
    const isCompanyOwner = !!req.companyOwner;
    if (!isCompanyOwner) {
      const requesterId = req.user?._id?.toString();
      const requesterMember = team.members.find(m =>
        (m.user?.toString?.() || m._id?.toString?.()) === requesterId
      );
      const requesterRole = requesterMember?.role;

      if (requesterRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admin can update team members',
        });
      }
    }

    return res.status(200).json({
      success: true,
      result: member,
      message: 'Team member updated successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while updating team member',
      error: error.message,
    });
  }
};

export = updateMember;
