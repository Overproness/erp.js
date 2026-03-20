// @ts-nocheck
/**
 * Trigger Evaluator
 * Evaluate behavioral triggers against customer actions
 */
const { TriggerRule, CustomerBehavior, Campaign } = require('../models');
const segmentMatcher = require('./segmentMatcher');

/**
 * Evaluate a new customer behavior against all active triggers
 * @param {Object} behavior The customer behavior to evaluate
 * @returns {Promise<Array>} Array of triggered actions to execute
 */
const evaluateBehaviorAgainstTriggers = async (behavior) => {
  try {
    // Find all active trigger rules that match this event type
    const triggers = await TriggerRule.find({
      eventType: behavior.eventType,
      status: 'active',
      owner: behavior.owner
    }).populate('actions');

    if (!triggers || triggers.length === 0) {
      return [];
    }

    const triggeredActions = [];

    for (const trigger of triggers) {
      // Skip if trigger is for a specific campaign and doesn't match
      if (trigger.campaignId && behavior.campaignId && 
          trigger.campaignId.toString() !== behavior.campaignId.toString()) {
        continue;
      }

      // Check if the trigger conditions are met
      const conditionsMet = await evaluateConditions(trigger, behavior);
      
      if (conditionsMet) {
        // Check if customer is in target segment
        const inSegment = trigger.segmentId ? 
          await segmentMatcher.matchCustomerToSegment(behavior.customerId, trigger.segmentId) : 
          true;

        if (inSegment) {
          // Check if trigger has cooldown period
          const canTrigger = await checkTriggerCooldown(trigger, behavior.customerId);
          
          if (canTrigger) {
            // Add actions to execute
            trigger.actions.forEach(action => {
              triggeredActions.push({
                ...action.toObject(),
                trigger: trigger._id,
                behavior: behavior._id,
                customerId: behavior.customerId,
                owner: behavior.owner
              });
            });

            // Update trigger last fired timestamp
            trigger.lastFired = new Date();
            trigger.fireCount = (trigger.fireCount || 0) + 1;
            await trigger.save();
          }
        }
      }
    }

    return triggeredActions;
  } catch (error) {
    console.error('Error evaluating behavior against triggers:', error);
    throw error;
  }
};

/**
 * Evaluate if trigger conditions are met
 * @param {Object} trigger The trigger rule
 * @param {Object} behavior The customer behavior
 * @returns {Promise<boolean>} Whether conditions are met
 */
const evaluateConditions = async (trigger, behavior) => {
  try {
    if (!trigger.conditions || trigger.conditions.length === 0) {
      return true; // No conditions to match
    }

    // Check each condition
    for (const condition of trigger.conditions) {
      const { field, operator, value } = condition;

      // Get actual value from behavior
      let actualValue;
      if (field.includes('.')) {
        // Handle nested fields like 'data.productId'
        const [parent, child] = field.split('.');
        actualValue = behavior[parent]?.[child];
      } else {
        actualValue = behavior[field];
      }

      // Apply operator
      if (operator === 'equals' && actualValue != value) return false;
      if (operator === 'notEquals' && actualValue == value) return false;
      if (operator === 'contains' && (!actualValue || !actualValue.includes(value))) return false;
      if (operator === 'notContains' && (actualValue && actualValue.includes(value))) return false;
      if (operator === 'greaterThan' && !(actualValue > value)) return false;
      if (operator === 'lessThan' && !(actualValue < value)) return false;
      if (operator === 'exists' && !actualValue) return false;
      if (operator === 'notExists' && actualValue) return false;
    }

    return true; // All conditions met
  } catch (error) {
    console.error('Error evaluating trigger conditions:', error);
    return false;
  }
};

/**
 * Check if a trigger can be fired based on cooldown period
 * @param {Object} trigger The trigger rule
 * @param {string} customerId The customer ID
 * @returns {Promise<boolean>} Whether trigger can be fired
 */
const checkTriggerCooldown = async (trigger, customerId) => {
  try {
    // If no cooldown is set, trigger can fire
    if (!trigger.cooldownPeriod) return true;

    // Check when this trigger last fired for this customer
    const lastBehavior = await CustomerBehavior.findOne({
      customerId,
      'metadata.triggerId': trigger._id,
      'metadata.triggered': true
    }).sort({ timestamp: -1 });

    // If never fired before, can fire
    if (!lastBehavior) return true;

    // Check if cooldown period has passed
    const cooldownMs = trigger.cooldownPeriod * 60 * 60 * 1000; // hours to ms
    const timeSinceLastFire = Date.now() - lastBehavior.timestamp.getTime();
    
    return timeSinceLastFire >= cooldownMs;
  } catch (error) {
    console.error('Error checking trigger cooldown:', error);
    return false;
  }
};

/**
 * Get all triggers that should be evaluated for a campaign
 * @param {string} campaignId Campaign ID
 * @returns {Promise<Array>} Array of trigger rules for the campaign
 */
const getCampaignTriggers = async (campaignId) => {
  try {
    const triggers = await TriggerRule.find({
      campaignId,
      status: 'active'
    }).populate('actions');
    
    return triggers;
  } catch (error) {
    console.error(`Error getting triggers for campaign ${campaignId}:`, error);
    throw error;
  }
};

module.exports = {
  evaluateBehaviorAgainstTriggers,
  evaluateConditions,
  checkTriggerCooldown,
  getCampaignTriggers
};