// @ts-nocheck
const { CustomerBehavior, TriggerRule } = require('../../models');
const behaviorProcessor = require('../../services/BehaviorProcessor');
const triggerEvaluator = require('../../utils/triggerEvaluator');
const segmentMatcher = require('../../utils/segmentMatcher');
const analyticsService = require('../../services/analyticsService');

/**
 * Behavior Controller
 * Processes customer behavior events and executes trigger-based actions
 */
class BehaviorController {
  /**
   * Track a customer behavior event
   */
  async trackEvent(req, res) {
    try {
      const { customerId, eventType, properties, source, url, timestamp } = req.body;
      const ownerId = req.admin?._id;

      // Basic validation
      if (!eventType) {
        return res.status(400).json({
          success: false,
          message: 'Event type is required'
        });
      }

      // Validate event type
      const validEventTypes = [
        'page_view', 'product_view', 'add_to_cart', 'checkout_start',
        'purchase', 'form_submit', 'email_open', 'email_click',
        'search', 'login', 'signup', 'account_update', 'custom'
      ];

      if (!validEventTypes.includes(eventType) && !eventType.startsWith('custom_')) {
        return res.status(400).json({
          success: false,
          message: `Invalid event type. Use one of ${validEventTypes.join(', ')} or a custom_* prefix`
        });
      }

      // Create behavior event
      const event = await behaviorProcessor.trackEvent({
        customerId,
        eventType,
        properties: properties || {},
        source: source || 'api',
        url,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        owner: ownerId
      });

      return res.status(200).json({
        success: true,
        message: 'Event tracked successfully',
        data: {
          eventId: event._id,
          eventType: event.eventType,
          timestamp: event.timestamp
        }
      });
    } catch (error) {
      console.error('Error tracking customer behavior:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to track event',
        error: error.message
      });
    }
  }

  /**
   * Get customer behavior events for a specific customer
   */
  async getCustomerEvents(req, res) {
    try {
      const { customerId } = req.params;
      const { 
        page = 1, 
        limit = 50, 
        eventType,
        startDate,
        endDate,
        source
      } = req.query;
      const ownerId = req.admin._id;

      // Build query
      const query = { 
        customerId, 
        owner: ownerId 
      };

      if (eventType) {
        query.eventType = eventType;
      }

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) {
          query.timestamp.$gte = new Date(startDate);
        }
        if (endDate) {
          query.timestamp.$lte = new Date(endDate);
        }
      }

      if (source) {
        query.source = source;
      }

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get events
      const events = await CustomerBehavior.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Get total count
      const total = await CustomerBehavior.countDocuments(query);

      return res.status(200).json({
        success: true,
        data: {
          events,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error(`Error fetching behavior for customer ${req.params.customerId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch customer behavior',
        error: error.message
      });
    }
  }

  /**
   * Get customer behavior events for all customers
   */
  async getAllEvents(req, res) {
    try {
      const { 
        page = 1, 
        limit = 50,
        eventType,
        startDate,
        endDate,
        source,
        customerId
      } = req.query;
      const ownerId = req.admin._id;

      // Build query
      const query = { owner: ownerId };

      if (eventType) query.eventType = eventType;
      if (customerId) query.customerId = customerId;
      if (source) query.source = source;

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) {
          query.timestamp.$gte = new Date(startDate);
        }
        if (endDate) {
          query.timestamp.$lte = new Date(endDate);
        }
      }

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get events
      const events = await CustomerBehavior.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Get total count
      const total = await CustomerBehavior.countDocuments(query);

      return res.status(200).json({
        success: true,
        data: {
          events,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error fetching behavior events:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch behavior events',
        error: error.message
      });
    }
  }

  /**
   * Get behavior summary for a customer
   */
  async getCustomerSummary(req, res) {
    try {
      const { customerId } = req.params;
      const ownerId = req.admin._id;

      // Get event counts by type
      const eventCounts = await CustomerBehavior.aggregate([
        { $match: { customerId, owner: ownerId } },
        { $group: { _id: '$eventType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Get recent events
      const recentEvents = await CustomerBehavior.find({ customerId, owner: ownerId })
        .sort({ timestamp: -1 })
        .limit(10)
        .lean();

      // Get first and last activity timestamps
      const firstActivity = await CustomerBehavior.findOne({ customerId, owner: ownerId })
        .sort({ timestamp: 1 })
        .limit(1)
        .lean();

      const lastActivity = await CustomerBehavior.findOne({ customerId, owner: ownerId })
        .sort({ timestamp: -1 })
        .limit(1)
        .lean();

      return res.status(200).json({
        success: true,
        data: {
          eventCounts: eventCounts.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          recentEvents,
          firstActivity: firstActivity?.timestamp,
          lastActivity: lastActivity?.timestamp,
          totalEvents: eventCounts.reduce((sum, item) => sum + item.count, 0)
        }
      });
    } catch (error) {
      console.error(`Error fetching behavior summary for customer ${req.params.customerId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch customer behavior summary',
        error: error.message
      });
    }
  }

  /**
   * Manually evaluate triggers for a customer
   */
  async evaluateTriggers(req, res) {
    try {
      const { customerId } = req.params;
      const { triggerId } = req.body;
      const ownerId = req.admin._id;

      // Find customer behaviors
      const events = await CustomerBehavior.find({
        customerId,
        owner: ownerId
      })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

      if (events.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No behavior events found for customer'
        });
      }

      // Get triggers to evaluate
      let triggers;
      if (triggerId) {
        triggers = await TriggerRule.find({
          _id: triggerId,
          owner: ownerId,
          isActive: true,
          removed: false
        }).lean();
      } else {
        triggers = await TriggerRule.find({
          owner: ownerId,
          isActive: true,
          removed: false
        }).lean();
      }

      if (triggers.length === 0) {
        return res.status(404).json({
          success: false,
          message: triggerId ? 'Trigger not found' : 'No active triggers found'
        });
      }

      // Evaluate triggers
      const results = [];
      for (const trigger of triggers) {
        const isTriggered = await triggerEvaluator.evaluateTrigger(trigger, events);
        
        results.push({
          triggerId: trigger._id,
          triggerName: trigger.name,
          isTriggered,
          evaluatedAt: new Date()
        });
      }

      // Execute actions for triggered rules if requested
      if (req.body.executeActions) {
        const triggeredRules = results.filter(r => r.isTriggered).map(r => r.triggerId);
        
        if (triggeredRules.length > 0) {
          for (const triggerId of triggeredRules) {
            behaviorProcessor.executeTriggerActions(triggerId, customerId)
              .catch(error => console.error(`Error executing trigger ${triggerId}:`, error));
          }
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          customerId,
          results,
          triggeredCount: results.filter(r => r.isTriggered).length,
          totalEvaluated: results.length
        }
      });
    } catch (error) {
      console.error('Error evaluating triggers:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to evaluate triggers',
        error: error.message
      });
    }
  }

  /**
   * Get event trends over time
   */
  async getEventTrends(req, res) {
    try {
      const { 
        eventType, 
        startDate, 
        endDate,
        interval = 'day'
      } = req.query;
      const ownerId = req.admin._id;

      // Validate parameters
      if (!eventType) {
        return res.status(400).json({
          success: false,
          message: 'Event type is required'
        });
      }

      // Set up date range
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      // Define interval format
      let dateFormat;
      let groupBy;
      
      switch (interval) {
        case 'hour':
          dateFormat = '%Y-%m-%d-%H';
          groupBy = {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' },
            hour: { $hour: '$timestamp' }
          };
          break;
        case 'day':
          dateFormat = '%Y-%m-%d';
          groupBy = {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' }
          };
          break;
        case 'week':
          dateFormat = '%Y-%U';
          groupBy = {
            year: { $year: '$timestamp' },
            week: { $week: '$timestamp' }
          };
          break;
        case 'month':
          dateFormat = '%Y-%m';
          groupBy = {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' }
          };
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid interval. Use hour, day, week, or month.'
          });
      }

      // Get event counts by time interval
      const trends = await CustomerBehavior.aggregate([
        { 
          $match: { 
            eventType, 
            owner: ownerId,
            timestamp: { $gte: start, $lte: end }
          } 
        },
        { 
          $group: { 
            _id: groupBy,
            count: { $sum: 1 },
            dateStr: { $first: { $dateToString: { format: dateFormat, date: '$timestamp' } } }
          } 
        },
        { $sort: { dateStr: 1 } }
      ]);

      return res.status(200).json({
        success: true,
        data: {
          eventType,
          interval,
          startDate: start,
          endDate: end,
          trends: trends.map(item => ({
            date: item.dateStr,
            count: item.count
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching event trends:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch event trends',
        error: error.message
      });
    }
  }

  /**
   * Identify high-value behavior patterns
   */
  async identifyPatterns(req, res) {
    try {
      const { goalEventType, lookbackDays = 30 } = req.body;
      const ownerId = req.admin._id;

      // Validate required parameters
      if (!goalEventType) {
        return res.status(400).json({
          success: false,
          message: 'Goal event type is required'
        });
      }

      // Get conversion events (the goal events)
      const startDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
      const conversionEvents = await CustomerBehavior.find({
        eventType: goalEventType,
        owner: ownerId,
        timestamp: { $gte: startDate }
      }).lean();

      if (conversionEvents.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No goal events found in the specified time period'
        });
      }

      // Get customers who completed the goal event
      const converterIds = [...new Set(conversionEvents.map(e => e.customerId))];

      // Get previous events for these customers
      const previousEvents = await CustomerBehavior.find({
        customerId: { $in: converterIds },
        owner: ownerId,
        timestamp: { $gte: startDate },
        eventType: { $ne: goalEventType }
      }).sort({ customerId: 1, timestamp: 1 }).lean();

      // Identify common patterns (simple implementation)
      const eventTypeFrequency = {};
      const eventSequences = {};

      previousEvents.forEach(event => {
        // Count event types
        eventTypeFrequency[event.eventType] = (eventTypeFrequency[event.eventType] || 0) + 1;
        
        // Track sequences (simple pairs)
        const customerEvents = previousEvents.filter(e => e.customerId === event.customerId);
        for (let i = 0; i < customerEvents.length - 1; i++) {
          const pair = `${customerEvents[i].eventType} → ${customerEvents[i+1].eventType}`;
          eventSequences[pair] = (eventSequences[pair] || 0) + 1;
        }
      });

      // Sort by frequency
      const sortedEventTypes = Object.entries(eventTypeFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
        
      const sortedSequences = Object.entries(eventSequences)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      return res.status(200).json({
        success: true,
        data: {
          goalEventType,
          conversionCount: conversionEvents.length,
          uniqueConverters: converterIds.length,
          commonEventTypes: sortedEventTypes.map(([type, count]) => ({ type, count })),
          commonSequences: sortedSequences.map(([sequence, count]) => ({ sequence, count })),
          analysisTimeframe: {
            startDate,
            endDate: new Date(),
            lookbackDays
          }
        }
      });
    } catch (error) {
      console.error('Error identifying behavior patterns:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to identify behavior patterns',
        error: error.message
      });
    }
  }
}

module.exports = new BehaviorController();
