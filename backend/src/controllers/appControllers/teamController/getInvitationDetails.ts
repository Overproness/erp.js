// @ts-nocheck
const User = require('@/models/appModels/User');

const getInvitationDetails = async (req, res) => {
  try {
    // Log some info to help debug requests
    console.log('Getting invitation details for token:', req.params.token);
    console.log('Public request:', req.headers['x-public-request'] === 'true');
    console.log('URL:', req.originalUrl);
    console.log('Auth header present:', !!req.headers['authorization']);
    
    // This is a public endpoint - we should never check for authentication
    // Force set a flag to indicate this is a public request
    req.isPublicRequest = true;
    
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'No invitation token provided',
      });
    }

    // Find team member by invitation token
    console.log('Searching for team member with token');
    const teamMember = await User.findOne({
      invitationToken: token,
      invitationExpires: { $gt: Date.now() },
      removed: false,
      isInvitationAccepted: false,
    })
      .populate('team', 'name description')
      .populate('invitedBy', 'name email')
      .select('-password');

    if (!teamMember) {
      console.log('No team member found with this token or invitation already accepted');
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired invitation token',
      });
    }

    console.log('Found team member:', teamMember.email);
    
    // Prepare the response with all necessary details
    const result = {
      name: teamMember.name,
      email: teamMember.email,
      role: teamMember.role,
      permissions: teamMember.permissions,
      team: teamMember.team,
      invitedBy: teamMember.invitedBy,
      invitedAt: teamMember.invitedAt,
      invitationExpires: teamMember.invitationExpires,
    };
    
    console.log('Sending invitation details response');
    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Error fetching invitation details:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching invitation details',
      error: error.message,
    });
  }
};

module.exports = getInvitationDetails;