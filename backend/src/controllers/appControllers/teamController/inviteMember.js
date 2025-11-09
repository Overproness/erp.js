const crypto = require('crypto');
const Team = require('@/models/appModels/Team');
const User = require('@/models/appModels/User');
const URL = require('@/models/appModels/URL');
const { inviteMemberSchema } = require('./schemaValidate');
const sendMail = require('@/helpers/sendMail');
const urlService = require('@/services/urlService');

const inviteMember = async (req, res) => {
  try {
    console.log('---[inviteMember]--- Start');
    const { teamId } = req.params;
    
    // Ensure permissions is an object
    console.log('Raw request body received:', JSON.stringify(req.body, null, 2));
    
    if (!req.body.permissions) {
      console.log('No permissions object found, creating default empty object');
      req.body.permissions = {};
    } else if (typeof req.body.permissions !== 'object') {
      console.log(`Invalid permissions type: ${typeof req.body.permissions}, converting to object`);
      req.body.permissions = {};
    } else {
      console.log('Permissions object exists:', JSON.stringify(req.body.permissions, null, 2));
    }
    
    // Validate request body with detailed errors
    console.log('Invite member request body after preprocessing:', JSON.stringify(req.body, null, 2));
    const { error, value } = inviteMemberSchema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });
    console.log('[inviteMember] After schema validation');
    if (error) {
      console.error('Validation error:', error.details);
      const errorMessages = error.details.map(err => err.message).join(', ');
      return res.status(400).json({
        success: false,
        message: errorMessages,
        errors: error.details
      });
    }

    // Check if team exists and belongs to the user
    console.log('[inviteMember] Checking team existence');
    const team = await Team.findOne({
      _id: teamId,
      removed: false,
      owner: req.companyOwner._id,
    });
    console.log('[inviteMember] Team found:', !!team);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }
    // CompanyID enforcement
    const companyOwner = req.companyOwner || req.user?.owner;
    const companyOwnerId = companyOwner?._id;
    const companyOwnerName = companyOwner?.name;
    const companyID = companyOwner?.companyID;
    const inviter = req.companyOwner || req.user;
    const inviterId = inviter?._id;
    const inviterName = inviter?.name;

    if (team.companyID !== companyID) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: company mismatch',
      });
    }

    // Permission check: Only company owner, team lead, or admin can invite
    const isCompanyOwner = !!req.companyOwner;
    if (!isCompanyOwner) {
      const requesterId = req.user?._id?.toString();
      const requesterMember = team.members.find(m =>
        (m.user?.toString?.() || m._id?.toString?.()) === requesterId
      );
      const requesterRole = requesterMember?.role || (team.teamLead?.toString() === requesterId ? 'team lead' : null);

      if (requesterRole !== 'admin' && requesterRole !== 'team lead') {
        return res.status(403).json({
          success: false,
          message: 'Only team lead or admin can invite members',
        });
      }
    }

    // Check if member already exists (including soft-deleted users)
    console.log('[inviteMember] Checking if member already exists (including soft-deleted)');
    const existingUser = await User.findOne({
      email: value.email,
    }); // Remove the team and removed filters to check all users with this email
    
    console.log('[inviteMember] Existing user found:', !!existingUser);
    console.log('[inviteMember] Existing user details:', existingUser ? {
      id: existingUser._id,
      email: existingUser.email,
      removed: existingUser.removed,
      team: existingUser.team,
      isInvitationAccepted: existingUser.isInvitationAccepted
    } : null);

    // If user exists and is active in this team AND has already accepted invitation, return error
    if (existingUser && !existingUser.removed && existingUser.team?.toString() === teamId && existingUser.isInvitationAccepted) {
      return res.status(400).json({
        success: false,
        message: 'Team member with this email has already accepted invitation and is active in this team',
      });
    }

    // If user exists and is active in another team (and accepted), return error
    if (existingUser && !existingUser.removed && existingUser.team && existingUser.team.toString() !== teamId && existingUser.isInvitationAccepted) {
      return res.status(400).json({
        success: false,
        message: 'User with this email has already accepted invitation and is active in another team',
      });
    }

    // If user exists in this team but hasn't accepted invitation yet, allow re-invitation
    if (existingUser && !existingUser.removed && existingUser.team?.toString() === teamId && !existingUser.isInvitationAccepted) {
      console.log('[inviteMember] User exists in this team but invitation not accepted yet, allowing re-invitation');
    }

    // Generate invitation token
    console.log('[inviteMember] Generating invitation token');
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create a well-structured team member object
    // Ensure permissions object has all required fields with proper boolean values
    console.log('Value after validation:', JSON.stringify(value, null, 2));
    console.log('Value permissions after validation:', JSON.stringify(value.permissions, null, 2));
    
    // Use all permissions from the validated data instead of manually creating a limited set
    const safePermissions = {};
    
    // Get all permission keys from the validated data
    if (value.permissions && typeof value.permissions === 'object') {
      Object.keys(value.permissions).forEach(key => {
        safePermissions[key] = Boolean(value.permissions[key]);
      });
    }
    
    console.log('Final safe permissions used for team member:', JSON.stringify(safePermissions, null, 2));
    
    let teamMember;

    if (existingUser) {
      // If user exists (could be soft-deleted or from another team), update them
      console.log('[inviteMember] Updating existing user');
      
      existingUser.name = value.name;
      existingUser.role = value.role || 'member';
      existingUser.permissions = safePermissions;
      existingUser.team = teamId;
      existingUser.invitedBy = inviterId;
      existingUser.companyOwner = companyOwnerId;
      existingUser.invitationToken = invitationToken;
      existingUser.invitationExpires = invitationExpires;
      existingUser.removed = false; // Restore if it was soft-deleted
      existingUser.enabled = true; // Ensure it's enabled
      existingUser.isInvitationAccepted = false; // Reset invitation status
      existingUser.invitedAt = new Date();
      existingUser.joinedAt = null; // Reset join date
      existingUser.companyID = companyID; // Set companyID on invitation
      
      teamMember = await existingUser.save();
      console.log('[inviteMember] Existing user updated:', teamMember._id);
    } else {
      // Create new user
      console.log('[inviteMember] Creating new User');
      teamMember = new User({
        name: value.name,
        email: value.email,
        role: value.role || 'member',
        permissions: safePermissions,
        team: teamId,
        invitedBy: inviterId,
        companyOwner: companyOwnerId,
        invitationToken,
        invitationExpires,
        removed: false,
        enabled: true,
        isInvitationAccepted: false,
        companyID: companyID, // Set companyID on invitation
      });

      console.log('[inviteMember] Saving new User');
      await teamMember.save();
      console.log('[inviteMember] User saved:', teamMember._id);
    }

    // Check if member is already in team's members array and remove if exists
    console.log('[inviteMember] Checking team members array for existing entry');
    const existingMemberIndex = team.members.findIndex(member => 
      member.user?.toString() === teamMember._id.toString()
    );
    
    if (existingMemberIndex !== -1) {
      console.log('[inviteMember] Removing existing member entry from team');
      team.members.splice(existingMemberIndex, 1);
    }

    // Add member to team's members array
    console.log('[inviteMember] Adding member to team.members');
    team.members.push({
      user: teamMember._id,
      role: teamMember.role,
      joinedAt: new Date(),
      updatedAt: new Date(),
    });
    
    console.log('[inviteMember] Saving team');
    await team.save();
    console.log('[inviteMember] Team saved');

    // Send invitation email    // Create a proper frontend URL without any duplicate paths
    // Make sure the frontend URL doesn't have trailing slashes
    const frontendBaseUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
    // Create the correct invitation link path to the frontend app (not the API)
    const invitationLink = `${frontendBaseUrl}/team/invitation/${invitationToken}`;

    // --- Shorten the invitation link before sending ---
    let shortInvitationUrl;
    try {
      // Create a shortened URL with expiry 7 days
      const shortCode = await urlService.generateShortCode();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const urlDoc = await new URL({
        originalUrl: invitationLink,
        shortCode,
        expiresAt,
        owner: inviterId,
        companyID: companyID,
        createdBy: inviterId, // FIX: add createdBy field
        status: 'active'
      }).save();
      const baseUrl = process.env.PUBLIC_FRONTEND_URL || 'http://localhost:3000';
      shortInvitationUrl = `${baseUrl.replace(/\/$/, '')}/s/${urlDoc.shortCode}`;
    } catch (shortUrlError) {
      console.error('[inviteMember] Failed to create short invitation URL:', shortUrlError);
      // Fallback to direct link if shortening fails
      shortInvitationUrl = invitationLink;
    }

    // Use inviterName and companyOwnerName in email
    const emailSubject = `Invitation to join team: ${team.name}`;
    const emailText = `
Hello ${value.name},

You have been invited to join the team "${team.name}" by ${inviterName}.

Please click the following link to accept the invitation and set up your account:
${shortInvitationUrl}

This invitation will expire in 7 days.

Best regards,
${companyOwnerName}
    `;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Team Invitation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; }
        .content { padding: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Team Invitation</h2>
        </div>
        <div class="content">
            <p>Hello <strong>${value.name}</strong>,</p>
            <p>You have been invited to join the team "<strong>${team.name}</strong>" by ${inviterName}.</p>
            <p>Click the button below to accept the invitation and set up your account:</p>
            <p style="text-align: center;">
                <a href="${shortInvitationUrl}" class="button">Accept Invitation</a>
            </p>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 3px;">
                ${shortInvitationUrl}
            </p>
            <p><strong>Note:</strong> This invitation will expire in 7 days.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>${companyOwnerName}</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
    </div>
</body>
</html>
    `;    try {
      console.log('[inviteMember] Sending invitation email');
      await sendMail({
        to: value.email,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
      });
      console.log('[inviteMember] Invitation email sent successfully to', value.email);
    } catch (emailError) {
      console.error('[inviteMember] Failed to send invitation email:', emailError);
    }

    // Populate the response data
    console.log('[inviteMember] Populating teamMember invitedBy and team');
    await teamMember.populate('invitedBy', 'name email');
    await teamMember.populate('team', 'name description');

    // Log successful invitation
    console.log('[inviteMember] Successfully invited', teamMember.email, 'to team', team.name);

    return res.status(201).json({
      success: true,
      result: teamMember,
      message: 'Team member invited successfully',
    });
  } catch (error) {
    console.error('[inviteMember] ERROR:', error);
    
    // Handle duplicate key error specifically
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists. Please use a different email address.',
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error while inviting team member',
      error: error.message,
    });
  }
};

module.exports = inviteMember;