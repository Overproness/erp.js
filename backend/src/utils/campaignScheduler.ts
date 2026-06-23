// @ts-nocheck
import { Campaign, CustomerBehavior, Customer } from '../models';
import segmentMatcher from './segmentMatcher';
/**
 * Campaign Scheduler
 * Utilities for campaign timing and scheduling optimization
 */

/**
 * Get optimal send time for a customer
 * @param {string} customerId Customer ID
 * @param {string} channel Communication channel (email, sms, etc.)
 * @returns {Promise<Object>} Optimal day and time information
 */
const getOptimalSendTime = async (customerId, channel = 'email') => {
  try {
    // Get customer behavior data for channel interactions
    const interactions = await CustomerBehavior.find({
      customerId,
      eventType: `${channel}_opened`,
    }).sort({ timestamp: -1 }).limit(20);
    
    if (interactions.length < 3) {
      // Not enough data, return default times
      return getDefaultSendTime(channel);
    }
    
    // Calculate optimal day and hour based on past interactions
    const dayCount = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const hourCount = {};
    for (let i = 0; i < 24; i++) {
      hourCount[i] = 0;
    }
    
    // Count interactions by day and hour
    interactions.forEach(interaction => {
      const date = new Date(interaction.timestamp);
      const day = date.getDay();
      const hour = date.getHours();
      
      dayCount[day]++;
      hourCount[hour]++;
    });
    
    // Find most common day and hour
    let optimalDay = 0;
    let maxDayCount = 0;
    
    for (let day = 0; day < 7; day++) {
      if (dayCount[day] > maxDayCount) {
        maxDayCount = dayCount[day];
        optimalDay = day;
      }
    }
    
    let optimalHour = 10; // Default to 10am
    let maxHourCount = 0;
    
    for (let hour = 0; hour < 24; hour++) {
      if (hourCount[hour] > maxHourCount) {
        maxHourCount = hourCount[hour];
        optimalHour = hour;
      }
    }
    
    return {
      day: optimalDay,
      hour: optimalHour,
      confidence: Math.min(100, Math.floor((interactions.length / 20) * 100)),
      based_on: interactions.length,
      channel
    };
  } catch (error) {
    console.error(`Error determining optimal send time for customer ${customerId}:`, error);
    return getDefaultSendTime(channel);
  }
};

/**
 * Get default send time for a channel
 * @param {string} channel Communication channel
 * @returns {Object} Default day and hour for sending
 */
const getDefaultSendTime = (channel) => {
  const defaultTimes = {
    email: { day: 2, hour: 10 },  // Tuesday at 10 AM
    sms: { day: 3, hour: 13 },    // Wednesday at 1 PM
    push: { day: 4, hour: 18 },   // Thursday at 6 PM
    social: { day: 5, hour: 12 }  // Friday at noon
  };
  
  return {
    ...defaultTimes[channel] || defaultTimes.email,
    confidence: 0,
    based_on: 0,
    channel,
    is_default: true
  };
};

/**
 * Get optimal send times for a segment
 * @param {string} segmentId Segment ID
 * @param {string} channel Communication channel
 * @returns {Promise<Object>} Aggregated optimal times
 */
const getOptimalTimesForSegment = async (segmentId, channel = 'email') => {
  try {
    // Get customers in segment
    const customers = await segmentMatcher.getSegmentMembers(segmentId);
    
    if (!customers || customers.length === 0) {
      return {
        days: [2], // Tuesday
        hours: [10], // 10 AM
        confidence: 0,
        based_on: 0,
        is_default: true
      };
    }
    
    // Get optimal times for each customer
    const optimalTimes = await Promise.all(
      customers.map(customerId => getOptimalSendTime(customerId, channel))
    );
    
    // Aggregate days and hours
    const dayCount = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const hourCount = {};
    for (let i = 0; i < 24; i++) {
      hourCount[i] = 0;
    }
    
    optimalTimes.forEach(time => {
      dayCount[time.day]++;
      hourCount[time.hour]++;
    });
    
    // Find top 3 days
    const sortedDays = Object.entries(dayCount)
      .sort(([, a], [, b]) => b - a)
      .map(([day]) => parseInt(day))
      .slice(0, 3);
    
    // Find top 3 hours
    const sortedHours = Object.entries(hourCount)
      .sort(([, a], [, b]) => b - a)
      .map(([hour]) => parseInt(hour))
      .slice(0, 3);
    
    return {
      days: sortedDays,
      hours: sortedHours,
      confidence: Math.floor(optimalTimes.reduce((sum, time) => sum + time.confidence, 0) / optimalTimes.length),
      based_on: optimalTimes.filter(time => !time.is_default).length
    };
  } catch (error) {
    console.error(`Error getting optimal times for segment ${segmentId}:`, error);
    return {
      days: [2], // Tuesday
      hours: [10], // 10 AM
      confidence: 0,
      based_on: 0,
      is_default: true
    };
  }
};

/**
 * Get next batch of customers to send campaign to
 * @param {string} campaignId Campaign ID
 * @param {Object} options Options for batch selection
 * @returns {Promise<Array>} Next batch of customer IDs
 */
const getNextCampaignBatch = async (campaignId, options = {}) => {
  try {
    const {
      batchSize = 100,
      channel = 'email',
      considerOptimalTime = true,
      maxBatches = 10
    } = options;
    
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }
    
    // Get all eligible customers who haven't received this campaign yet
    const sentTo = campaign.sentTo || [];
    const customerQuery = {
      _id: { $nin: sentTo },
      removed: false,
      owner: campaign.owner
    };
    
    // Apply segment filter if campaign has segments
    if (campaign.segments && campaign.segments.length > 0) {
      let segmentMembers = [];
      for (const segmentId of campaign.segments) {
        const members = await segmentMatcher.getSegmentMembers(segmentId);
        segmentMembers = [...segmentMembers, ...members];
      }
      customerQuery._id.$in = [...new Set(segmentMembers)];
    }
    
    // Get eligible customers
    const customers = await Customer.find(customerQuery)
      .limit(batchSize * maxBatches);
    
    if (customers.length === 0) {
      return [];
    }
    
    let batch = [];
    
    if (considerOptimalTime) {
      // Calculate current time window
      const now = new Date();
      const currentDay = now.getDay();
      const currentHour = now.getHours();
      
      // Filter customers by optimal send time window (current hour +/- 1)
      for (const customer of customers) {
        const optimalTime = await getOptimalSendTime(customer._id, channel);
        
        if (optimalTime.day === currentDay && 
            (optimalTime.hour === currentHour || 
             optimalTime.hour === currentHour - 1 || 
             optimalTime.hour === currentHour + 1)) {
          batch.push(customer._id);
          if (batch.length >= batchSize) break;
        }
      }
      
      // If not enough customers in optimal time, add more
      if (batch.length < batchSize) {
        for (const customer of customers) {
          if (!batch.includes(customer._id)) {
            batch.push(customer._id);
            if (batch.length >= batchSize) break;
          }
        }
      }
    } else {
      // Just take the first batch
      batch = customers.slice(0, batchSize).map(c => c._id);
    }
    
    return batch;
  } catch (error) {
    console.error(`Error getting next campaign batch for ${campaignId}:`, error);
    throw error;
  }
};

/**
 * Generate custom schedule from specified times
 * @param {Date} start Start date
 * @param {Date} end End date
 * @param {Array} customTimes Custom time specifications
 * @returns {Array} Scheduled execution times
 */
const generateCustomSchedule = (start, end, customTimes) => {
  const schedule = [];
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  // Map day names to numbers
  const dayMap = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
  };
  
  // Iterate through each day from start to end
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    
    // Check if this day has custom times
    customTimes.forEach(customTime => {
      if (dayMap[customTime.day.toLowerCase()] === dayOfWeek) {
        // Add each time on this day
        customTime.times.forEach(timeStr => {
          const [hours, minutes] = timeStr.split(':').map(Number);
          
          const scheduledTime = new Date(currentDate);
          scheduledTime.setHours(hours, minutes, 0, 0);
          
          // Only add if it's in the future or equal to start date
          if (scheduledTime >= startDate && scheduledTime <= endDate) {
            schedule.push({
              scheduledTime,
              optimized: false,
              custom: true
            });
          }
        });
      }
    });
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return schedule;
};

/**
 * Generate campaign schedule
 * @param {Object} campaignData Campaign configuration data
 * @returns {Promise<Array>} Scheduled execution times
 */
const generateCampaignSchedule = async (campaignData) => {
  try {
    const {
      startDate,
      endDate,
      frequency,
      customTimes,
      channel,
      segmentId,
      useOptimalTimes = true
    } = campaignData;
    
    const schedule = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // For custom schedule
    if (customTimes && customTimes.length > 0) {
      return generateCustomSchedule(start, end, customTimes);
    }
    
    // For frequency-based schedule
    const interval = getIntervalFromFrequency(frequency);
    let currentDate = new Date(start);
    
    if (useOptimalTimes && segmentId) {
      // Get optimal times for segment
      const optimalTimes = await getOptimalTimesForSegment(segmentId, channel);
      
      // Create schedule based on optimal days and times
      while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay();
        
        // Check if current day is an optimal day
        if (optimalTimes.days.includes(dayOfWeek)) {
          // Add each optimal hour on this day
          for (const hour of optimalTimes.hours) {
            const scheduledTime = new Date(currentDate);
            scheduledTime.setHours(hour, 0, 0, 0);
            
            // Only add if it's in the future or equal to start date
            if (scheduledTime >= start && scheduledTime <= end) {
              schedule.push({
                scheduledTime,
                optimized: true
              });
            }
          }
        }
        
        // Move to next date based on interval
        currentDate = addInterval(currentDate, interval);
      }
    } else {
      // Simple frequency-based schedule without optimization
      while (currentDate <= end) {
        schedule.push({
          scheduledTime: new Date(currentDate),
          optimized: false
        });
        
        // Advance to next date based on interval
        currentDate = addInterval(currentDate, interval);
      }
    }
    
    return schedule;
  } catch (error) {
    console.error('Error generating campaign schedule:', error);
    throw error;
  }
};

/**
 * Calculate campaign schedule with multiple delivery batches
 * @param {Object} campaignData Campaign configuration
 * @param {Object} options Schedule options
 * @returns {Promise<Object>} Campaign schedule with batches
 */
const calculateCampaignSchedule = async (campaignData, options = {}) => {
  try {
    const {
      batchSize = 100,
      maxBatchesPerDay = 5,
      minBatchInterval = 60 // minutes
    } = options;
    
    // Generate the base schedule
    const baseSchedule = await generateCampaignSchedule(campaignData);
    
    // For each scheduled time, create delivery batches
    const scheduledBatches = [];
    
    for (const slot of baseSchedule) {
      const { scheduledTime } = slot;
      
      // Calculate batches for this time slot
      for (let i = 0; i < maxBatchesPerDay; i++) {
        // Create scheduled time for this batch (add interval between batches)
        const batchTime = new Date(scheduledTime);
        batchTime.setMinutes(batchTime.getMinutes() + (i * minBatchInterval));
        
        // Only add if still within the campaign period
        if (batchTime <= new Date(campaignData.endDate)) {
          scheduledBatches.push({
            scheduledTime: batchTime,
            batchNumber: i + 1,
            batchSize,
            optimized: slot.optimized,
            custom: slot.custom || false
          });
        }
      }
    }
    
    // Sort by scheduled time
    scheduledBatches.sort((a, b) => a.scheduledTime - b.scheduledTime);
    
    return {
      campaignId: campaignData.id || null,
      totalBatches: scheduledBatches.length,
      estimatedRecipients: scheduledBatches.length * batchSize,
      batches: scheduledBatches
    };
  } catch (error) {
    console.error('Error calculating campaign schedule:', error);
    throw error;
  }
};

/**
 * Get interval in days from frequency setting
 * @param {string} frequency Frequency setting (daily, weekly, etc.)
 * @returns {number} Interval in days
 */
const getIntervalFromFrequency = (frequency) => {
  switch (frequency) {
    case 'hourly':
      return 1/24; // Fraction of a day (1 hour)
    case 'daily':
      return 1;
    case 'weekly':
      return 7;
    case 'bi-weekly':
      return 14;
    case 'monthly':
      return 30;
    case 'quarterly':
      return 90;
    default:
      return 1; // Default to daily
  }
};

/**
 * Add interval to date
 * @param {Date} date Base date
 * @param {number} interval Interval in days
 * @returns {Date} New date
 */
const addInterval = (date, interval) => {
  const newDate = new Date(date);
  
  // For hourly interval (less than 1 day)
  if (interval < 1) {
    const hours = Math.round(interval * 24);
    newDate.setHours(newDate.getHours() + hours);
    return newDate;
  }
  
  // For daily or longer intervals
  newDate.setDate(newDate.getDate() + interval);
  return newDate;
};

export = {
  getOptimalSendTime,
  getDefaultSendTime,
  getOptimalTimesForSegment,
  getNextCampaignBatch,
  generateCustomSchedule,
  generateCampaignSchedule,
  calculateCampaignSchedule,
  getIntervalFromFrequency,
  addInterval
};
