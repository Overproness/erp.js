// @ts-nocheck
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const CustomerJourney = require('@/models/appModels/CustomerJourney');
const Interaction = require('@/models/appModels/Interaction');

function modelController() {
  const Model = CustomerJourney;
  const methods = createCRUDController('CustomerJourney');

  /**
   * Get customer journey for a specific client
   */
  const getClientJourney = async (req, res) => {
    try {
      const { clientId } = req.params;

      const journey = await Model.findOne({
        client: clientId,
        removed: false,
      })
        .populate('client', 'name email phone')
        .populate('stages.touchpoints')
        .exec();

      // Return null/empty state instead of 404 - allows frontend to handle gracefully
      if (!journey) {
        return res.status(200).json({
          success: true,
          result: null,
          message: 'No journey found for this client - journey can be initialized',
        });
      }

      // Recalculate metrics including engagement score before returning
      await journey.calculateMetricsAsync();
      await journey.save();

      return res.status(200).json({
        success: true,
        result: journey,
        message: 'Customer journey retrieved successfully',
      });
    } catch (error) {
      console.error('❌ GET CLIENT JOURNEY ERROR:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
  methods.getClientJourney = getClientJourney;

  /**
   * Create or initialize journey for a client
   */
  const initializeJourney = async (req, res) => {
    try {
      const { clientId } = req.params;
      const { currentStage = 'awareness', notes } = req.body;

      // Check if journey already exists
      const existingJourney = await Model.findOne({
        client: clientId,
        removed: false,
      });

      if (existingJourney) {
        return res.status(400).json({
          success: false,
          message: 'Journey already exists for this client',
        });
      }

      // Get owner from authenticated user (req.admin is set by auth middleware)
      const owner = req.admin;
      if (!owner) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const journey = new Model({
        client: clientId,
        owner: owner._id,
        companyID: owner.companyID || owner._id.toString(),
        currentStage,
        stages: [
          {
            stage: currentStage,
            enteredAt: new Date(),
            notes,
          },
        ],
        journeyStartDate: new Date(),
        status: 'active',
      });

      await journey.save();

      return res.status(201).json({
        success: true,
        result: journey,
        message: 'Customer journey initialized successfully',
      });
    } catch (error) {
      console.error('❌ INITIALIZE JOURNEY ERROR:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
  methods.initializeJourney = initializeJourney;

  /**
   * Transition client to new journey stage
   */
  const transitionStage = async (req, res) => {
    try {
      const { clientId } = req.params;
      const { newStage, notes, milestone } = req.body;

      const journey = await Model.findOne({
        client: clientId,
        removed: false,
      });

      if (!journey) {
        return res.status(404).json({
          success: false,
          message: 'Journey not found for this client',
        });
      }

      journey.transitionStage(newStage, notes, milestone);
      await journey.calculateMetricsAsync();

      await journey.save();

      return res.status(200).json({
        success: true,
        result: journey,
        message: 'Journey stage transitioned successfully',
      });
    } catch (error) {
      console.error('❌ TRANSITION STAGE ERROR:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
  methods.transitionStage = transitionStage;

  /**
   * Add milestone to journey
   */
  const addMilestone = async (req, res) => {
    try {
      const { clientId } = req.params;
      const { name, description, relatedInteraction } = req.body;

      const journey = await Model.findOne({
        client: clientId,
        removed: false,
      });

      if (!journey) {
        return res.status(404).json({
          success: false,
          message: 'Journey not found for this client',
        });
      }

      journey.milestones.push({
        name,
        description,
        achievedAt: new Date(),
        relatedInteraction,
      });

      await journey.save();

      return res.status(200).json({
        success: true,
        result: journey,
        message: 'Milestone added successfully',
      });
    } catch (error) {
      console.error('❌ ADD MILESTONE ERROR:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
  methods.addMilestone = addMilestone;

  /**
   * Add recommendation to journey
   */
  const addRecommendation = async (req, res) => {
    try {
      const { clientId } = req.params;
      const { action, priority, reason } = req.body;

      const journey = await Model.findOne({
        client: clientId,
        removed: false,
      });

      if (!journey) {
        return res.status(404).json({
          success: false,
          message: 'Journey not found for this client',
        });
      }

      journey.recommendations.push({
        action,
        priority: priority || 'medium',
        reason,
        suggestedAt: new Date(),
      });

      await journey.save();

      return res.status(200).json({
        success: true,
        result: journey,
        message: 'Recommendation added successfully',
      });
    } catch (error) {
      console.error('❌ ADD RECOMMENDATION ERROR:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
  methods.addRecommendation = addRecommendation;

  /**
   * Get journey analytics
   */
  const getJourneyAnalytics = async (req, res) => {
    try {
      const { owner } = req;
      const companyID = owner.companyID || owner._id.toString();

      const analytics = await Model.aggregate([
        { $match: { companyID, removed: false } },
        {
          $group: {
            _id: '$currentStage',
            count: { $sum: 1 },
            avgDuration: { $avg: '$metrics.journeyDuration' },
            avgEngagement: { $avg: '$metrics.engagementScore' },
            avgRisk: { $avg: '$metrics.riskScore' },
          },
        },
        { $sort: { count: -1 } },
      ]);

      const statusBreakdown = await Model.aggregate([
        { $match: { companyID, removed: false } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      return res.status(200).json({
        success: true,
        result: {
          stageDistribution: analytics,
          statusBreakdown,
        },
        message: 'Journey analytics retrieved successfully',
      });
    } catch (error) {
      console.error('❌ GET JOURNEY ANALYTICS ERROR:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
  methods.getJourneyAnalytics = getJourneyAnalytics;

  // Aliases for GraphQL resolvers
  methods.getJourney = getClientJourney;
  methods.getAnalytics = getJourneyAnalytics;
  methods.initialize = initializeJourney;
  methods.transition = transitionStage;

  return methods;
}

module.exports = modelController();
