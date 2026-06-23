// @ts-nocheck

import { createTeamSchema } from './schemaValidate';
import Team from '../../../models/appModels/Team';
const create = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = createTeamSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // Create team with owner
    const companyID = req.companyOwner?.companyID || req.user?.companyID;
    const teamData = {
      ...value,
      owner: req.companyOwner?._id || req.user?._id,
      createdBy: req.companyOwner?._id || req.user?._id,
      companyID,
    };

    const team = new Team(teamData);
    await team.save();

    // Convert to plain object but keep owner as ObjectId for consistency with tests
    const teamResult = team.toObject();

    return res.status(201).json({
      success: true,
      result: teamResult,
      message: 'Team created successfully',
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Team with this name already exists',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error while creating team',
      error: error.message,
    });
  }
};

export = create;
