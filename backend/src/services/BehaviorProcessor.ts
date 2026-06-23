// @ts-nocheck
/**
 * Behavior Processor Service
 *
 * Real-time processing of customer behavior events and trigger evaluation
 */
import { Campaign, Customer, CustomerBehavior, TriggerExecution, TriggerRule } from '../models';
import triggerEvaluator from '../utils/triggerEvaluator';
import segmentMatcher from '../utils/segmentMatcher';
import analyticsService from './analyticsService';
import { createRequire } from 'module';

const load = createRequire(__filename);
const getCampaignExecutor = () => load('./CampaignExecutor');

class BehaviorProcessor {
  constructor() {
    this.isRunning = false;
    this.eventQueue = [];
    this.processingInterval = null;
    this.processQueueDebounce = null;
    this.triggerCache = new Map();
    this.triggerCacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Start the behavior processor service
   * @param {Object} options Service configuration
   */
  start(options = {}) {
    const {
      processInterval = 1000, // Process queue every second
      batchSize = 50,
    } = options;

    if (this.isRunning) {
      console.warn('Behavior processor service is already running');
      return;
    }

    this.isRunning = true;
    this.batchSize = batchSize;

    console.log('Starting behavior processor service...');

    // Set up interval for processing queued events
    this.processingInterval = setInterval(() => {
      this.processEventQueue().catch((error) => {
        console.error('Error in behavior processor queue:', error);
      });
    }, processInterval);

    // Refresh trigger cache periodically
    this.refreshTriggerCacheInterval = setInterval(() => {
      this.refreshTriggerCache().catch((error) => {
        console.error('Error refreshing trigger cache:', error);
      });
    }, this.triggerCacheExpiry / 2);

    // Initial trigger cache load
    this.refreshTriggerCache().catch((error) => {
      console.error('Error in initial trigger cache load:', error);
    });
  }

  /**
   * Stop the behavior processor service
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    clearInterval(this.processingInterval);
    clearInterval(this.refreshTriggerCacheInterval);

    if (this.processQueueDebounce) {
      clearTimeout(this.processQueueDebounce);
    }

    this.isRunning = false;
    console.log('Behavior processor service stopped');
  }

  /**
   * Track customer behavior event
   * @param {Object} event Customer behavior event data
   * @returns {Promise<Object>} The created behavior record
   */
  async trackEvent(event) {
    try {
      // Validate required fields
      if (!event.owner) {
        throw new Error('Owner ID is required');
      }

      if (!event.eventType) {
        throw new Error('Event type is required');
      }

      if (!event.eventName) {
        throw new Error('Event name is required');
      }

      // Must have either customer or anonymousId
      if (!event.customer && !event.anonymousId) {
        throw new Error('Either customer ID or anonymous ID is required');
      }

      // Create behavior record with correct field names
      const behaviorData = {
        customer: event.customer,
        anonymousId: event.anonymousId,
        eventType: event.eventType,
        eventName: event.eventName,
        timestamp: event.timestamp || new Date(),
        properties: event.properties || {},
        source: event.source || 'website',
        url: event.url,
        urlPath: event.urlPath,
        referrer: event.referrer,
        campaign: event.campaign,
        medium: event.medium,
        context: event.context || {},
        sessionId: event.sessionId,
        owner: event.owner,
      };

      const behavior = await CustomerBehavior.create(behaviorData);

      // Queue for trigger evaluation
      this.queueEvent({
        ...behaviorData,
        _id: behavior._id,
      });

      // Track analytics asynchronously (if needed)
      if (analyticsService && analyticsService.trackBehavior) {
        analyticsService.trackBehavior(behaviorData).catch((error) => {
          console.error('Error tracking behavior analytics:', error);
        });
      }

      return behavior;
    } catch (error) {
      console.error('Error tracking customer behavior:', error);
      throw error;
    }
  }

  /**
   * Queue an event for processing
   * @param {Object} event Event data
   */
  queueEvent(event) {
    this.eventQueue.push(event);

    // Debounce processing for efficiency with many events
    if (this.processQueueDebounce) {
      clearTimeout(this.processQueueDebounce);
    }

    this.processQueueDebounce = setTimeout(() => {
      this.processEventQueue().catch((error) => {
        console.error('Error in debounced queue processing:', error);
      });
    }, 200);
  }

  /**
   * Process the event queue
   */
  async processEventQueue() {
    if (this.eventQueue.length === 0) {
      return;
    }

    // Process events in batches
    const batch = this.eventQueue.splice(0, this.batchSize);

    try {
      // Group events by customer for efficiency
      const eventsByCustomer = this.groupEventsByCustomer(batch);

      // Process each customer's events
      for (const [customerId, events] of Object.entries(eventsByCustomer)) {
        await this.processCustomerEvents(customerId, events);
      }
    } catch (error) {
      console.error('Error processing behavior events:', error);

      // Put failed events back in queue for retry
      this.eventQueue.unshift(...batch);
    }
  }

  /**
   * Group events by customer ID
   * @param {Array} events List of events
   * @returns {Object} Events grouped by customer ID
   */
  groupEventsByCustomer(events) {
    return events.reduce((groups, event) => {
      const customerId = event.customerId.toString();
      if (!groups[customerId]) {
        groups[customerId] = [];
      }
      groups[customerId].push(event);
      return groups;
    }, {});
  }

  /**
   * Process events for a specific customer
   * @param {string} customerId Customer ID
   * @param {Array} events List of events
   */
  async processCustomerEvents(customerId, events) {
    try {
      // Get customer data
      const customer = await Customer.findById(customerId);
      if (!customer) {
        console.warn(`Customer not found: ${customerId}`);
        return;
      }

      // Get active triggers
      const activeTriggers = await this.getActiveTriggers();

      if (activeTriggers.length === 0) {
        return;
      }

      // Evaluate triggers against events
      const triggeredRules = [];

      for (const trigger of activeTriggers) {
        // Skip if this trigger is currently in cooldown for this customer
        if (await this.isInCooldown(customerId, trigger._id)) {
          continue;
        }

        const isTriggered = await triggerEvaluator.evaluateTrigger(trigger, events, customer);

        if (isTriggered) {
          triggeredRules.push(trigger);
        }
      }

      // Execute actions for triggered rules
      for (const trigger of triggeredRules) {
        await this.executeTriggerActions(trigger, customer, events);

        // Set cooldown for this trigger and customer
        await this.setCooldown(customerId, trigger._id, trigger.cooldownPeriod);
      }
    } catch (error) {
      console.error(`Error processing events for customer ${customerId}:`, error);
      throw error;
    }
  }

  /**
   * Execute actions defined in a trigger rule
   * @param {Object} trigger Trigger rule
   * @param {Object} customer Customer data
   * @param {Array} events Events that triggered the rule
   */
  async executeTriggerActions(trigger, customer, events) {
    try {
      console.log(
        `Executing trigger ${trigger._id} (${trigger.name}) for customer ${customer._id}`
      );

      // Record trigger execution
      await this.recordTriggerExecution(trigger, customer, events);

      // Execute each action
      for (const action of trigger.actions) {
        try {
          await this.executeAction(action, customer, trigger, events);
        } catch (actionError) {
          console.error(`Error executing action ${action.type}:`, actionError);
        }
      }
    } catch (error) {
      console.error(`Error executing trigger actions for ${trigger._id}:`, error);
    }
  }

  /**
   * Execute a single action
   * @param {Object} action Action configuration
   * @param {Object} customer Customer data
   * @param {Object} trigger Trigger that initiated the action
   * @param {Array} events Events that triggered the rule
   */
  async executeAction(action, customer, trigger, events) {
    switch (action.type) {
      case 'sendEmail':
        await this.executeSendEmailAction(action, customer, trigger);
        break;

      case 'sendSMS':
        await this.executeSendSMSAction(action, customer, trigger);
        break;

      case 'addToSegment':
        await this.executeAddToSegmentAction(action, customer);
        break;

      case 'removeFromSegment':
        await this.executeRemoveFromSegmentAction(action, customer);
        break;

      case 'setCustomerProperty':
        await this.executeSetCustomerPropertyAction(action, customer);
        break;

      case 'startCampaign':
        await this.executeStartCampaignAction(action, customer);
        break;

      case 'notifyTeam':
        await this.executeNotifyTeamAction(action, customer, trigger, events);
        break;

      case 'webhook':
        await this.executeWebhookAction(action, customer, trigger, events);
        break;

      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Execute send email action
   * @param {Object} action Action configuration
   * @param {Object} customer Customer data
   * @param {Object} trigger Trigger that initiated the action
   */
  async executeSendEmailAction(action, customer, trigger) {
    try {
      const emailService = load('./emailService');

      const emailData = {
        to: customer.email,
        subject: action.subject,
        template: action.template,
        templateData: {
          customer,
          trigger: {
            id: trigger._id,
            name: trigger.name,
          },
        },
      };

      await emailService.sendEmail(emailData);

      console.log(`Sent trigger email to ${customer.email} for trigger ${trigger._id}`);
    } catch (error) {
      console.error('Error sending trigger email:', error);
      throw error;
    }
  }

  /**
   * Execute send SMS action
   * @param {Object} action Action configuration
   * @param {Object} customer Customer data
   */
  async executeSendSMSAction(action, customer) {
    try {
      const smsService = load('./smsService');

      if (!customer.phone) {
        throw new Error('Customer has no phone number');
      }

      await smsService.sendSMS({
        to: customer.phone,
        message: action.message,
      });

      console.log(`Sent trigger SMS to ${customer.phone}`);
    } catch (error) {
      console.error('Error sending trigger SMS:', error);
      throw error;
    }
  }

  /**
   * Execute add to segment action
   * @param {Object} action Action configuration
   * @param {Object} customer Customer data
   */
  async executeAddToSegmentAction(action, customer) {
    try {
      const segmentId = action.segmentId;

      if (!segmentId) {
        throw new Error('Segment ID is required');
      }

      await segmentMatcher.addToSegment(customer._id, segmentId);
      console.log(`Added customer ${customer._id} to segment ${segmentId}`);
    } catch (error) {
      console.error('Error adding customer to segment:', error);
      throw error;
    }
  }

  /**
   * Execute remove from segment action
   * @param {Object} action Action configuration
   * @param {Object} customer Customer data
   */
  async executeRemoveFromSegmentAction(action, customer) {
    try {
      const segmentId = action.segmentId;

      if (!segmentId) {
        throw new Error('Segment ID is required');
      }

      await segmentMatcher.removeFromSegment(customer._id, segmentId);
      console.log(`Removed customer ${customer._id} from segment ${segmentId}`);
    } catch (error) {
      console.error('Error removing customer from segment:', error);
      throw error;
    }
  }

  /**
   * Execute set customer property action
   * @param {Object} action Action configuration
   * @param {Object} customer Customer data
   */
  async executeSetCustomerPropertyAction(action, customer) {
    try {
      if (!action.property) {
        throw new Error('Property name is required');
      }

      // Update customer property
      customer[action.property] = action.value;

      if (action.property === 'tags' && Array.isArray(customer.tags)) {
        // Special handling for tags
        const newTag = action.value;
        if (!customer.tags.includes(newTag)) {
          customer.tags.push(newTag);
        }
      }

      await customer.save();
      console.log(`Updated property ${action.property} for customer ${customer._id}`);
    } catch (error) {
      console.error('Error updating customer property:', error);
      throw error;
    }
  }

  /**
   * Execute start campaign action
   * @param {Object} action Action configuration
   * @param {Object} customer Customer data
   */
  async executeStartCampaignAction(action, customer) {
    try {
      const campaignId = action.campaignId;
      if (!campaignId) {
        throw new Error('Campaign ID is required');
      }

      // Check if campaign exists
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        throw new Error(`Campaign ${campaignId} not found`);
      }

      // Create a targeted campaign just for this customer
      const targetedCampaign = new Campaign({
        name: `Triggered: ${campaign.name}`,
        description: `Triggered from ${campaign.name} by behavioral rule`,
        channel: campaign.channel,
        content: campaign.content,
        subject: campaign.subject,
        owner: campaign.owner,
        templateId: campaign.templateId,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours from now
        specificCustomers: [customer._id],
        triggerSource: {
          triggerId: action.triggerId,
          timestamp: new Date(),
        },
      });

      await targetedCampaign.save();

      // Immediately execute the campaign
      const campaignExecutor = getCampaignExecutor();
      await campaignExecutor.executeCampaign(targetedCampaign);

      console.log(
        `Started triggered campaign ${targetedCampaign._id} for customer ${customer._id}`
      );
    } catch (error) {
      console.error('Error starting triggered campaign:', error);
      throw error;
    }
  }

  /**
   * Execute notify team action
   * @param {Object} action Action configuration
   * @param {Object} customer Customer data
   * @param {Object} trigger Trigger that initiated the action
   * @param {Array} events Events that triggered the rule
   */
  async executeNotifyTeamAction(action, customer, trigger, events) {
    try {
      // Implementation depends on notification system
      console.log(`Team notification sent for customer ${customer._id} and trigger ${trigger._id}`);

      // Example implementation for sending to Slack
      if (action.slackWebhook) {
        await this.sendSlackNotification(
          action.slackWebhook,
          customer,
          trigger,
          events,
          action.message || 'Customer behavior trigger activated'
        );
      }

      // Email to team members
      if (action.teamEmails && action.teamEmails.length > 0) {
        const emailService = load('./emailService');

        for (const email of action.teamEmails) {
          await emailService.sendEmail({
            to: email,
            subject: `Behavior Trigger Alert: ${trigger.name}`,
            template: 'triggerAlert',
            templateData: {
              customer,
              trigger,
              events: events.map((e) => ({
                type: e.eventType,
                time: new Date(e.timestamp).toLocaleString(),
                properties: e.properties,
              })),
            },
          });
        }
      }
    } catch (error) {
      console.error('Error notifying team:', error);
      throw error;
    }
  }

  /**
   * Send Slack notification
   * @param {string} webhookUrl Slack webhook URL
   * @param {Object} customer Customer data
   * @param {Object} trigger Trigger data
   * @param {Array} events Events data
   * @param {string} message Notification message
   */
  async sendSlackNotification(webhookUrl, customer, trigger, events, message) {
    try {
      const axios = load('axios');

      // Create Slack message
      const payload = {
        text: message,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `Behavior Trigger: ${trigger.name}`,
              emoji: true,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Customer:*\n${customer.firstName} ${customer.lastName}`,
              },
              {
                type: 'mrkdwn',
                text: `*Email:*\n${customer.email}`,
              },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Triggered by:*',
            },
          },
        ],
      };

      // Add events to message
      events.forEach((event) => {
        payload.blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `• ${event.eventType} - ${new Date(event.timestamp).toLocaleString()}`,
          },
        });
      });

      // Send to Slack
      await axios.post(webhookUrl, payload);
    } catch (error) {
      console.error('Error sending Slack notification:', error);
      throw error;
    }
  }

  /**
   * Execute webhook action
   * @param {Object} action Action configuration
   * @param {Object} customer Customer data
   * @param {Object} trigger Trigger that initiated the action
   * @param {Array} events Events that triggered the rule
   */
  async executeWebhookAction(action, customer, trigger, events) {
    try {
      const axios = load('axios');

      if (!action.url) {
        throw new Error('Webhook URL is required');
      }

      // Prepare webhook payload
      const payload = {
        customer: {
          id: customer._id,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
        },
        trigger: {
          id: trigger._id,
          name: trigger.name,
        },
        events: events.map((event) => ({
          type: event.eventType,
          timestamp: event.timestamp,
          properties: event.properties,
        })),
        timestamp: new Date(),
      };

      // Add custom data if provided
      if (action.data) {
        payload.data = action.data;
      }

      // Send webhook
      const response = await axios({
        method: action.method || 'POST',
        url: action.url,
        data: payload,
        headers: action.headers || {
          'Content-Type': 'application/json',
        },
      });

      console.log(`Webhook sent to ${action.url}, status: ${response.status}`);
    } catch (error) {
      console.error('Error sending webhook:', error);
      throw error;
    }
  }

  /**
   * Record a trigger execution
   * @param {Object} trigger Trigger that was executed
   * @param {Object} customer Customer involved
   * @param {Array} events Events that triggered the rule
   */
  async recordTriggerExecution(trigger, customer, events) {
    try {
      await TriggerExecution.create({
        triggerId: trigger._id,
        triggerName: trigger.name,
        customerId: customer._id,
        customerEmail: customer.email,
        events: events.map((e) => ({
          eventId: e._id,
          eventType: e.eventType,
          timestamp: e.timestamp,
        })),
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error recording trigger execution:', error);
    }
  }

  /**
   * Get all active triggers from cache or DB
   * @returns {Promise<Array>} List of active trigger rules
   * @returns {Promise<Array>} List of active trigger rules
   */
  async getActiveTriggers() {
    // Use cache if available and not expired
    const cacheKey = 'activeTriggers';

    if (this.triggerCache.has(cacheKey)) {
      const cached = this.triggerCache.get(cacheKey);
      if (cached.timestamp > Date.now() - this.triggerCacheExpiry) {
        return cached.data;
      }
    }

    // Fetch active triggers from DB
    const triggers = await TriggerRule.find({
      isActive: true,
      removed: false,
    });

    // Update cache
    this.triggerCache.set(cacheKey, {
      data: triggers,
      timestamp: Date.now(),
    });

    return triggers;
  }

  /**
   * Refresh the trigger rule cache
   */
  async refreshTriggerCache() {
    console.log('Refreshing trigger cache...');

    try {
      const activeTriggers = await TriggerRule.find({
        isActive: true,
        removed: false,
      });

      // Update cache
      this.triggerCache.set('activeTriggers', {
        data: activeTriggers,
        timestamp: Date.now(),
      });

      console.log(`Trigger cache refreshed with ${activeTriggers.length} active triggers`);
    } catch (error) {
      console.error('Error refreshing trigger cache:', error);
    }
  }

  /**
   * Check if a trigger is in cooldown for a customer
   * @param {string} customerId Customer ID
   * @param {string} triggerId Trigger ID
   * @returns {Promise<boolean>} Whether the trigger is in cooldown
   */
  async isInCooldown(customerId, triggerId) {
    try {
      // Check for recent executions
      const recentExecution = await TriggerExecution.findOne({
        triggerId,
        customerId,
        timestamp: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24) }, // Last 24 hours
      }).sort({ timestamp: -1 });

      if (!recentExecution) {
        return false;
      }

      // Get trigger to check cooldown period
      const trigger = await TriggerRule.findById(triggerId);
      if (!trigger || !trigger.cooldownPeriod) {
        return false;
      }

      // Calculate if cooldown has expired
      const cooldownMs = trigger.cooldownPeriod * 60 * 1000; // Convert minutes to ms
      const timeSinceExecution = Date.now() - new Date(recentExecution.timestamp).getTime();

      return timeSinceExecution < cooldownMs;
    } catch (error) {
      console.error('Error checking trigger cooldown:', error);
      return false; // Default to not in cooldown on error
    }
  }

  /**
   * Set cooldown for a trigger and customer
   * @param {string} customerId Customer ID
   * @param {string} triggerId Trigger ID
   * @param {number} cooldownMinutes Cooldown period in minutes
   */
  async setCooldown(customerId, triggerId, cooldownMinutes) {
    // Implementation depends on system design
    // This could be a simple in-memory cache or database record

    // For this example, we're not implementing explicit cooldown setting
    // since we're already checking execution history in isInCooldown
    console.log(
      `Set cooldown for trigger ${triggerId} and customer ${customerId}: ${cooldownMinutes} minutes`
    );
  }
}

export = new BehaviorProcessor();
