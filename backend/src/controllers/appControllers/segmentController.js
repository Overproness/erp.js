const mongoose = require('mongoose');
const { catchErrors } = require('../../handlers/errorHandlers');

// Import CustomerSegment model
const CustomerSegment = mongoose.model('CustomerSegment');

const segmentController = {
  /**
   * Create a new customer segment
   */
  create: async (req, res) => {
    try {
      const segment = new CustomerSegment(req.body);
      await segment.save();

      res.status(200).json({
        success: true,
        result: segment,
        message: 'Segment created successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error creating segment',
      });
    }
  },

  /**
   * Get all customer segments
   */
  getAll: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const segments = await CustomerSegment.find({})
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await CustomerSegment.countDocuments({});

      res.status(200).json({
        success: true,
        result: segments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        message: 'Segments retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error retrieving segments',
      });
    }
  },

  /**
   * Get a single segment by ID
   */
  getOne: async (req, res) => {
    try {
      const segment = await CustomerSegment.findById(req.params.id);

      if (!segment) {
        return res.status(404).json({
          success: false,
          message: 'Segment not found',
        });
      }

      res.status(200).json({
        success: true,
        result: segment,
        message: 'Segment retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error retrieving segment',
      });
    }
  },

  /**
   * Update a segment
   */
  update: async (req, res) => {
    try {
      const segment = await CustomerSegment.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!segment) {
        return res.status(404).json({
          success: false,
          message: 'Segment not found',
        });
      }

      res.status(200).json({
        success: true,
        result: segment,
        message: 'Segment updated successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error updating segment',
      });
    }
  },

  /**
   * Delete a segment
   */
  delete: async (req, res) => {
    try {
      const segment = await CustomerSegment.findByIdAndDelete(req.params.id);

      if (!segment) {
        return res.status(404).json({
          success: false,
          message: 'Segment not found',
        });
      }

      res.status(200).json({
        success: true,
        result: segment,
        message: 'Segment deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error deleting segment',
      });
    }
  },

  /**
   * Get segment members
   */
  getMembers: async (req, res) => {
    try {
      const segment = await CustomerSegment.findById(req.params.id).populate('members');

      if (!segment) {
        return res.status(404).json({
          success: false,
          message: 'Segment not found',
        });
      }

      res.status(200).json({
        success: true,
        result: segment.members || [],
        message: 'Segment members retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error retrieving segment members',
      });
    }
  },

  /**
   * Update segment members
   */
  updateMembers: async (req, res) => {
    try {
      const { memberIds } = req.body;

      const segment = await CustomerSegment.findByIdAndUpdate(
        req.params.id,
        { members: memberIds },
        { new: true }
      ).populate('members');

      if (!segment) {
        return res.status(404).json({
          success: false,
          message: 'Segment not found',
        });
      }

      res.status(200).json({
        success: true,
        result: segment,
        message: 'Segment members updated successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Error updating segment members',
      });
    }
  },
};

module.exports = segmentController;
