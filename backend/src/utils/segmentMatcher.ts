// @ts-nocheck
/**
 * Segment Matcher
 * Customer segment qualification and audience matching algorithms
 */
const { Customer, CustomerBehavior, CustomerSegment, Invoice } = require('../models');

/**
 * Match a customer against a segment definition
 * @param {string} customerId Customer ID
 * @param {string} segmentId Segment ID
 * @returns {Promise<boolean>} Whether the customer matches the segment
 */
const matchCustomerToSegment = async (customerId, segmentId) => {
  try {
    // Load customer and segment data
    const [customer, segment] = await Promise.all([
      Customer.findById(customerId),
      CustomerSegment.findById(segmentId)
    ]);

    if (!customer || !segment) {
      return false;
    }

    // Match demographic criteria if present
    if (segment.demographicCriteria && !matchDemographics(customer, segment.demographicCriteria)) {
      return false;
    }

    // Match behavioral criteria if present
    if (segment.behavioralCriteria && segment.behavioralCriteria.length > 0) {
      const behaviorMatch = await matchBehaviors(customer._id, segment.behavioralCriteria);
      if (!behaviorMatch) {
        return false;
      }
    }

    // Match purchase criteria if present
    if (segment.purchaseCriteria && segment.purchaseCriteria.length > 0) {
      const purchaseMatch = await matchPurchases(customer._id, segment.purchaseCriteria);
      if (!purchaseMatch) {
        return false;
      }
    }

    // All criteria matched
    return true;
  } catch (error) {
    console.error(`Error matching customer ${customerId} to segment ${segmentId}:`, error);
    throw error;
  }
};

/**
 * Match customer to demographic criteria
 * @param {Object} customer Customer object
 * @param {Object} criteria Demographic criteria
 * @returns {boolean} Whether the customer matches criteria
 */
const matchDemographics = (customer, criteria) => {
  // Age range check
  if (criteria.ageRange && customer.dateOfBirth) {
    const age = calculateAge(customer.dateOfBirth);
    if (criteria.ageRange.min !== undefined && age < criteria.ageRange.min) return false;
    if (criteria.ageRange.max !== undefined && age > criteria.ageRange.max) return false;
  }

  // Gender check
  if (criteria.gender && customer.gender && criteria.gender !== 'all' && criteria.gender !== customer.gender) {
    return false;
  }

  // Location check
  if (criteria.location) {
    if (criteria.location.countries?.length && 
        !criteria.location.countries.includes(customer.address?.country)) {
      return false;
    }
    if (criteria.location.regions?.length && 
        !criteria.location.regions.includes(customer.address?.region)) {
      return false;
    }
    if (criteria.location.cities?.length && 
        !criteria.location.cities.includes(customer.address?.city)) {
      return false;
    }
  }

  // All demographic criteria matched
  return true;
};

/**
 * Match customer to behavioral criteria
 * @param {string} customerId Customer ID
 * @param {Array} criteria Behavioral criteria
 * @returns {Promise<boolean>} Whether the customer matches criteria
 */
const matchBehaviors = async (customerId, criteria) => {
  // Get customer behavior logs
  const behaviors = await CustomerBehavior.find({ customerId });
  
  // Check each criterion
  for (const criterion of criteria) {
    const { event, operator, value, timeframe } = criterion;
    
    // Filter behaviors by event type and timeframe if applicable
    let matchingBehaviors = behaviors.filter(b => b.eventType === event);
    
    if (timeframe) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - timeframe);
      matchingBehaviors = matchingBehaviors.filter(b => b.timestamp >= cutoff);
    }

    // Apply operator
    const count = matchingBehaviors.length;
    if (operator === 'equals' && count !== value) return false;
    if (operator === 'gt' && !(count > value)) return false;
    if (operator === 'gte' && !(count >= value)) return false;
    if (operator === 'lt' && !(count < value)) return false;
    if (operator === 'lte' && !(count <= value)) return false;
    if (operator === 'exists' && count === 0) return false;
    if (operator === 'notExists' && count > 0) return false;
  }
  
  // All criteria matched
  return true;
};

/**
 * Match customer to purchase criteria
 * @param {string} customerId Customer ID
 * @param {Array} criteria Purchase criteria
 * @returns {Promise<boolean>} Whether the customer matches criteria
 */
const matchPurchases = async (customerId, criteria) => {
  // Get customer purchases
  const purchases = await Invoice.find({ 
    customerId, 
    status: 'paid' 
  }).populate('items.product');

  // Check each criterion
  for (const criterion of criteria) {
    const { type, operator, value, timeframe, category } = criterion;
    
    // Filter purchases by timeframe if applicable
    let relevantPurchases = [...purchases];
    
    if (timeframe) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - timeframe);
      relevantPurchases = relevantPurchases.filter(p => p.paidAt >= cutoff);
    }

    // Filter by product category if specified
    if (category) {
      relevantPurchases = relevantPurchases.filter(p => 
        p.items.some(item => item.product?.category === category)
      );
    }

    // Calculate metric based on type
    let metric = 0;
    if (type === 'count') {
      metric = relevantPurchases.length;
    } else if (type === 'amount') {
      metric = relevantPurchases.reduce((sum, p) => sum + p.total, 0);
    }

    // Apply operator
    if (operator === 'equals' && metric !== value) return false;
    if (operator === 'gt' && !(metric > value)) return false;
    if (operator === 'gte' && !(metric >= value)) return false;
    if (operator === 'lt' && !(metric < value)) return false;
    if (operator === 'lte' && !(metric <= value)) return false;
    if (operator === 'exists' && relevantPurchases.length === 0) return false;
  }
  
  // All criteria matched
  return true;
};

/**
 * Calculate age from date of birth
 * @param {Date} dateOfBirth Date of birth
 * @returns {number} Age in years
 */
const calculateAge = (dateOfBirth) => {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Get all matching customers for a segment
 * @param {string} segmentId Segment ID
 * @returns {Promise<Array>} Array of customer IDs that match the segment
 */
const getSegmentMembers = async (segmentId) => {
  try {
    const segment = await CustomerSegment.findById(segmentId);
    if (!segment) {
      throw new Error(`Segment ${segmentId} not found`);
    }

    // Get all customers for this owner
    const customers = await Customer.find({ owner: segment.owner, removed: false });
    
    // Match each customer against segment criteria
    const matchingCustomers = [];
    for (const customer of customers) {
      const matches = await matchCustomerToSegment(customer._id, segmentId);
      if (matches) {
        matchingCustomers.push(customer._id);
      }
    }

    return matchingCustomers;
  } catch (error) {
    console.error(`Error getting segment members for ${segmentId}:`, error);
    throw error;
  }
};

module.exports = {
  matchCustomerToSegment,
  matchDemographics,
  matchBehaviors,
  matchPurchases,
  getSegmentMembers
};
