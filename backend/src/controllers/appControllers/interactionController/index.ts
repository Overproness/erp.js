// @ts-nocheck

import createCRUDController from '@/controllers/middlewaresControllers/createCRUDController';
import mongoose from 'mongoose';
import Interaction from '@/models/appModels/Interaction';
import CustomerJourney from '@/models/appModels/CustomerJourney';
import Client from '@/models/appModels/Client';
function modelController() {
  const Model = Interaction;
  const methods = createCRUDController('Interaction');

  /**
   * Create interaction and update customer journey
   */
  const createWithJourney = async (req, res) => {
    try {
      console.log('=== CREATE INTERACTION WITH JOURNEY DEBUG ===');
      console.log('req.body:', JSON.stringify(req.body, null, 2));
      console.log('req.admin:', !!req.admin);
      console.log('req.companyOwner:', !!req.companyOwner);
      console.log('req.user:', !!req.user);
      console.log('=============================================');

      const {
        client,
        type,
        channel,
        direction,
        subject,
        description,
        notes,
        outcome,
        sentiment,
        duration,
        interactionDate,
        journeyStage,
        relatedQuote,
        relatedInvoice,
        relatedCampaign,
        tags,
        followUpRequired,
        followUpDate,
      } = req.body;

      // Validate client field
      if (!client) {
        console.error('❌ Client ID is missing from request body');
        return res.status(400).json({
          success: false,
          message: 'Client ID is required',
        });
      }

      // Get owner from authenticated user (req.admin is set by auth middleware)
      const owner = req.admin || req.companyOwner || req.user;
      if (!owner) {
        console.error('❌ No authenticated user found in request');
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      console.log('✅ Owner found:', owner._id);
      console.log('✅ Client ID:', client);
      const companyID = owner.companyID || owner._id.toString();

      // Create interaction
      const interaction = new Model({
        client,
        owner: owner._id,
        companyID,
        type,
        channel,
        direction,
        subject,
        description,
        notes,
        outcome,
        sentiment,
        duration,
        interactionDate: interactionDate || new Date(),
        journeyStage,
        relatedQuote,
        relatedInvoice,
        relatedCampaign,
        tags: tags || [],
        followUpRequired: followUpRequired || false,
        followUpDate,
        status: 'completed',
      });

      await interaction.save();

      // Update customer journey
      let journey = await CustomerJourney.findOne({
        client,
        removed: false,
      });

      // If no journey exists, create one
      if (!journey) {
        journey = new CustomerJourney({
          client,
          owner: owner._id,
          companyID,
          currentStage: journeyStage || 'awareness',
          stages: [
            {
              stage: journeyStage || 'awareness',
              enteredAt: new Date(),
              touchpoints: [interaction._id],
            },
          ],
          journeyStartDate: new Date(),
          status: 'active',
        });
      } else {
        // Add interaction to current stage
        journey.addTouchpoint(interaction._id);
        journey.metrics.totalInteractions += 1;
      }

      // Calculate metrics including engagement score
      await journey.calculateMetricsAsync();

      // Update journey path
      if (req.body.source) {
        journey.journeyPath.push({
          source: req.body.source.utm_source,
          medium: req.body.source.utm_medium,
          campaign: req.body.source.utm_campaign,
          timestamp: new Date(),
          interaction: interaction._id,
        });
      }

      await journey.save();

      // Link interaction to journey
      interaction.customerJourney = journey._id;
      await interaction.save();

      // Update client's last interaction
      await Client.findByIdAndUpdate(client, {
        'interaction.channel': channel,
        'interaction.type': type,
        'interaction.notes': notes,
        'interaction.outcome': outcome,
      });

      return res.status(201).json({
        success: true,
        result: interaction,
        journey,
        message: 'Interaction created successfully',
      });
    } catch (error) {
      console.error('❌ CREATE INTERACTION ERROR:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
  methods.createWithJourney = createWithJourney;

  /**
   * Get all interactions for a client
   */
  const getClientInteractions = async (req, res) => {
    try {
      const { clientId } = req.params;
      const { page = 1, limit = 50, type, channel, startDate, endDate } = req.query;

      const query = {
        client: clientId,
        removed: false,
      };

      if (type) query.type = type;
      if (channel) query.channel = channel;
      if (startDate || endDate) {
        query.interactionDate = {};
        if (startDate) query.interactionDate.$gte = new Date(startDate);
        if (endDate) query.interactionDate.$lte = new Date(endDate);
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const interactions = await Model.find(query)
        .sort({ interactionDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('assignedTo', 'name email')
        .populate('relatedQuote', 'number total')
        .populate('relatedInvoice', 'number total')
        .exec();

      const count = await Model.countDocuments(query);

      return res.status(200).json({
        success: true,
        result: interactions,
        pagination: {
          page: parseInt(page),
          pages: Math.ceil(count / limit),
          count,
        },
        message: 'Client interactions retrieved successfully',
      });
    } catch (error) {
      console.error('❌ GET CLIENT INTERACTIONS ERROR:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
  methods.getClientInteractions = getClientInteractions;

  /**
   * Get interaction analytics for a client
   */
  const getClientAnalytics = async (req, res) => {
    try {
      const { clientId } = req.params;

      const analytics = await Model.aggregate([
        { $match: { client: mongoose.Types.ObjectId(clientId), removed: false } },
        {
          $facet: {
            byType: [{ $group: { _id: '$type', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
            byChannel: [
              { $group: { _id: '$channel', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
            ],
            byOutcome: [
              { $group: { _id: '$outcome', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
            ],
            sentimentStats: [
              {
                $group: {
                  _id: null,
                  avgSentiment: { $avg: '$sentimentScore' },
                  positiveCount: {
                    $sum: { $cond: [{ $gte: ['$sentimentScore', 0.3] }, 1, 0] },
                  },
                  neutralCount: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $gt: ['$sentimentScore', -0.3] },
                            { $lt: ['$sentimentScore', 0.3] },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  negativeCount: {
                    $sum: { $cond: [{ $lte: ['$sentimentScore', -0.3] }, 1, 0] },
                  },
                },
              },
            ],
            recentInteractions: [
              { $sort: { interactionDate: -1 } },
              { $limit: 10 },
              {
                $project: {
                  type: 1,
                  channel: 1,
                  interactionDate: 1,
                  outcome: 1,
                  subject: 1,
                },
              },
            ],
          },
        },
      ]);

      return res.status(200).json({
        success: true,
        result: analytics[0],
        message: 'Client interaction analytics retrieved successfully',
      });
    } catch (error) {
      console.error('❌ GET CLIENT ANALYTICS ERROR:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
  methods.getClientAnalytics = getClientAnalytics;

  /**
   * Get pending follow-ups
   */
  const getPendingFollowUps = async (req, res) => {
    try {
      const { owner } = req;
      const companyID = owner.companyID || owner._id.toString();

      const followUps = await Model.find({
        companyID,
        followUpRequired: true,
        followUpCompleted: false,
        removed: false,
        followUpDate: { $lte: new Date() },
      })
        .sort({ followUpDate: 1 })
        .populate('client', 'name email phone')
        .populate('assignedTo', 'name email')
        .limit(100)
        .exec();

      return res.status(200).json({
        success: true,
        result: followUps,
        count: followUps.length,
        message: 'Pending follow-ups retrieved successfully',
      });
    } catch (error) {
      console.error('❌ GET PENDING FOLLOW-UPS ERROR:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
  methods.getPendingFollowUps = getPendingFollowUps;

  /**
   * Mark follow-up as completed
   */
  const completeFollowUp = async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const interaction = await Model.findById(id);
      if (!interaction) {
        return res.status(404).json({
          success: false,
          message: 'Interaction not found',
        });
      }

      interaction.completeFollowUp();
      if (notes) {
        interaction.notes = (interaction.notes || '') + '\n\nFollow-up: ' + notes;
      }

      await interaction.save();

      return res.status(200).json({
        success: true,
        result: interaction,
        message: 'Follow-up marked as completed',
      });
    } catch (error) {
      console.error('❌ COMPLETE FOLLOW-UP ERROR:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
  methods.completeFollowUp = completeFollowUp;

  return methods;
}

export = modelController();
