// @ts-nocheck
const mongoose = require('mongoose');
const Schedule = mongoose.model('Schedule');
const Team = mongoose.model('Team');

const scheduleController = {
  // Get team availability for coordination
  getTeamAvailability: async (req, res) => {
    try {
      const { teams } = req.query;
      const teamIds = Array.isArray(teams) ? teams : [teams];

      const availability = {};

      for (const teamId of teamIds) {
        const team = await Team.findById(teamId).populate('members.user');
        if (!team) continue;

        // Get schedules for this team
        const schedules = await Schedule.find({
          $or: [{ 'attendees.id': teamId, 'attendees.type': 'team' }, { assignedTeam: teamId }],
          startTime: { $gte: new Date() },
        }).sort({ startTime: 1 });

        availability[teamId] = {
          teamName: team.name,
          memberCount: team.members.length,
          upcomingSchedules: schedules.length,
          nextAvailable: schedules.length > 0 ? schedules[0].endTime : new Date(),
          schedules: schedules.slice(0, 10), // Limit to 10 upcoming schedules
        };
      }

      return res.status(200).json({
        success: true,
        result: {
          availability,
          coordinated: Object.keys(availability).length > 1,
          conflicts: [], // Could be computed by comparing schedules
          suggestedTimes: [], // Could suggest optimal meeting times
        },
        message: 'Team availability retrieved successfully',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving team availability',
        error: error.message,
      });
    }
  },

  // Create a schedule
  create: async (req, res) => {
    try {
      const scheduleData = {
        ...req.body,
        owner: req.admin?._id,
        createdBy: req.admin?._id,
      };

      const schedule = await new Schedule(scheduleData).save();

      return res.status(201).json({
        success: true,
        result: schedule,
        message: 'Schedule created successfully',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Error creating schedule',
        error: error.message,
      });
    }
  },

  // List schedules
  list: async (req, res) => {
    try {
      const schedules = await Schedule.find({
        removed: false,
        owner: req.admin?._id,
      }).sort({ startTime: 1 });

      return res.status(200).json({
        success: true,
        result: schedules,
        message: 'Schedules retrieved successfully',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving schedules',
        error: error.message,
      });
    }
  },
};

module.exports = scheduleController;
