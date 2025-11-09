/**
 * Campaign Executor Service
 * 
 * Background service for scheduled campaign execution across channels
 */
const { Campaign, CustomerSegment, TriggerRule, CustomerBehavior } = require('../models');
const segmentMatcher = require('../utils/segmentMatcher');
const campaignScheduler = require('../utils/campaignScheduler');
const emailService = require('./emailService');
const smsService = require('./smsService');
const pushNotificationService = require('./pushNotificationService');
const socialMediaService = require('./socialMediaService');
const analyticsService = require('./analyticsService');

class CampaignExecutor {
  constructor() {
    this.channelExecutors = {
      email: this.executeEmailCampaign.bind(this),
      sms: this.executeSMSCampaign.bind(this),
      push: this.executePushNotificationCampaign.bind(this),
      social: this.executeSocialMediaCampaign.bind(this)
    };

    this.isRunning = false;
    this.processInterval = null;
  }

  /**
   * Start the campaign execution service
   * @param {Object} options Configuration options
   */
  async start(options = {}) {
    const { 
      interval = 1000 * 60 * 5, // Default: 5 minutes
      batchSize = 100
    } = options;

    if (this.isRunning) {
      console.warn('Campaign executor service is already running');
      return;
    }

    this.isRunning = true;
    this.batchSize = batchSize;
    
    console.log('Starting campaign executor service...');
    
    // Schedule recurring execution
    this.processInterval = setInterval(async () => {
      try {
        await this.processScheduledCampaigns();
      } catch (error) {
        console.error('Error in campaign executor process:', error);
      }
    }, interval);

    // Initial execution
    try {
      await this.processScheduledCampaigns();
    } catch (error) {
      console.error('Error in initial campaign execution:', error);
    }
  }

  /**
   * Stop the campaign execution service
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    clearInterval(this.processInterval);
    this.isRunning = false;
    console.log('Campaign executor service stopped');
  }

  /**
   * Process all scheduled campaigns
   */
  async processScheduledCampaigns() {
    try {
      const now = new Date();
      
      // Find campaigns that should be executed now
      const campaigns = await Campaign.find({
        status: 'active',
        removed: false,
        startDate: { $lte: now },
        endDate: { $gte: now },
        lastExecuted: { $lt: new Date(now - 1000 * 60 * 10) } // Last executed more than 10 minutes ago
      });

      if (campaigns.length === 0) {
        return;
      }

      console.log(`Processing ${campaigns.length} scheduled campaigns`);

      for (const campaign of campaigns) {
        try {
          await this.executeCampaign(campaign);
          
          // Update last executed timestamp
          campaign.lastExecuted = new Date();
          await campaign.save();
        } catch (error) {
          console.error(`Error executing campaign ${campaign._id}:`, error);
          
          // Log execution error
          campaign.executionErrors = campaign.executionErrors || [];
          campaign.executionErrors.push({
            timestamp: new Date(),
            error: error.message
          });
          await campaign.save();
        }
      }
    } catch (error) {
      console.error('Error processing scheduled campaigns:', error);
    }
  }

  /**
   * Execute a single campaign
   * @param {Object} campaign Campaign to execute
   */
  async executeCampaign(campaign) {
    console.log(`Executing campaign ${campaign._id}: ${campaign.name}`);

    // Get next batch of customers for this campaign
    const batch = await campaignScheduler.getNextCampaignBatch(campaign._id, {
      batchSize: this.batchSize,
      channel: campaign.channel,
      considerOptimalTime: campaign.useOptimalTiming
    });

    if (batch.length === 0) {
      console.log(`No eligible customers for campaign ${campaign._id}`);
      return;
    }

    // Execute campaign based on channel
    const channelExecutor = this.channelExecutors[campaign.channel];
    if (!channelExecutor) {
      throw new Error(`Unsupported channel: ${campaign.channel}`);
    }

    const result = await channelExecutor(campaign, batch);

    // Update campaign statistics
    campaign.metrics = campaign.metrics || {};
    campaign.metrics.totalSent = (campaign.metrics.totalSent || 0) + result.sent;
    campaign.metrics.totalFailed = (campaign.metrics.totalFailed || 0) + result.failed;
    campaign.sentTo = [...(campaign.sentTo || []), ...result.successful];

    await campaign.save();
    
    // Record analytics
    await analyticsService.trackCampaign(campaign._id, {
      batchSize: batch.length,
      sent: result.sent,
      failed: result.failed
    });
  }

  /**
   * Execute an email campaign
   * @param {Object} campaign Campaign data
   * @param {Array} recipients Customer IDs to send to
   */
  async executeEmailCampaign(campaign, recipients) {
    let sent = 0;
    let failed = 0;
    let successful = [];
    
    console.log(`Executing email campaign for ${recipients.length} recipients`);
    
    for (const recipient of recipients) {
      if (!recipient.email) {
        failed++;
        continue;
      }
      
      try {
        // Using simple email service without template
        const result = await emailService.sendTemplateEmail(
          recipient.email,
          campaign.subject || 'Campaign Update',
          'generic', // template name
          {
            title: campaign.title,
            message: campaign.message,
            recipientName: recipient.name || 'Valued Customer'
          }
        );
        
        sent++;
        successful.push({
          recipientId: recipient._id,
          email: recipient.email,
          status: 'sent',
          messageId: result.messageId,
          timestamp: new Date()
        });
      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error);
        failed++;
      }
    }
    
    return { sent, failed, successful };
  }

  /**
   * Execute an SMS campaign
   * @param {Object} campaign Campaign data
   * @param {Array} recipients Customer IDs to send to
   */
  async executeSMSCampaign(campaign, recipients) {
    let sent = 0;
    let failed = 0;
    let successful = [];
    
    console.log(`Executing SMS campaign for ${recipients.length} recipients`);
    
    for (const recipient of recipients) {
      if (!recipient.phone) {
        failed++;
        continue;
      }
      
      try {
        const result = await smsService.sendSms(recipient.phone, campaign.message);
        
        sent++;
        successful.push({
          recipientId: recipient._id,
          phone: recipient.phone,
          status: result.status || 'delivered',
          messageId: result.messageId,
          timestamp: new Date()
        });
      } catch (error) {
        console.error(`Failed to send SMS to ${recipient.phone}:`, error);
        failed++;
      }
    }
    
    return { sent, failed, successful };
  }

  /**
   * Execute a push notification campaign
   * @param {Object} campaign Campaign data
   * @param {Array} recipients Customer IDs to send to
   */
  async executePushNotificationCampaign(campaign, recipients) {
    let sent = 0;
    let failed = 0;
    let successful = [];
    
    console.log(`Executing push notification campaign for ${recipients.length} recipients`);
    
    for (const recipientId of recipients) {
      try {
        const result = await pushNotificationService.sendNotification(recipientId, {
          title: campaign.title,
          body: campaign.message,
          data: campaign.data || {},
          campaignId: campaign._id
        });
        
        sent++;
        successful.push({
          recipientId,
          status: 'delivered',
          timestamp: new Date()
        });
      } catch (error) {
        console.error(`Failed to send push notification to ${recipientId}:`, error);
        failed++;
      }
    }
    
    return { sent, failed, successful };
  }

  /**
   * Execute a social media campaign
   * @param {Object} campaign Campaign data
   * @param {Array} recipients Customer IDs to send to
   */
  async executeSocialMediaCampaign(campaign, recipients) {
    console.log(`Executing social media campaign ${campaign._id}`);
    
    // Social campaigns work differently - it creates posts for audience rather than sending to individual recipients
    try {
      // Create social media post
      const postData = {
        platforms: campaign.socialPlatforms || [],
        content: campaign.content,
        campaignId: campaign._id
      };
      
      // Schedule post if needed
      if (campaign.scheduledFor) {
        postData.scheduledFor = campaign.scheduledFor;
      }
      
      // Add media if available
      if (campaign.media && campaign.media.length > 0) {
        postData.media = campaign.media;
      }
      
      await socialMediaService.createPost(postData, campaign.owner);
      
      return {
        sent: recipients.length,
        failed: 0,
        successful: recipients
      };
    } catch (error) {
      console.error(`Failed to create social media post for campaign ${campaign._id}:`, error);
      return {
        sent: 0,
        failed: recipients.length,
        successful: []
      };
    }
  }

  /**
   * Personalize campaign content for recipient
   * @param {Object} campaign Campaign data
   * @param {string} recipientId Customer ID
   */
  async personalizeCampaign(campaign, recipientId) {
    try {
      // Get customer data
      const customer = await Customer.findById(recipientId);
      if (!customer) {
        throw new Error(`Customer ${recipientId} not found`);
      }

      // Basic personalization
      let subject = campaign.subject || '';
      let body = campaign.content || '';
      let clickAction = campaign.clickAction || '';

      // Replace personalization variables
      const personalizeField = (text) => {
        return text
          .replace(/{{firstName}}/g, customer.firstName || 'Customer')
          .replace(/{{lastName}}/g, customer.lastName || '')
          .replace(/{{email}}/g, customer.email || '')
          .replace(/{{company}}/g, customer.company || '')
          .replace(/{{phone}}/g, customer.phone || '');
      };

      subject = personalizeField(subject);
      body = personalizeField(body);
      clickAction = personalizeField(clickAction);

      // Apply advanced personalization if needed
      if (campaign.dynamicContent && campaign.dynamicContent.length > 0) {
        body = await this.applyDynamicContent(body, customer, campaign);
      }

      // Add tracking parameters to URLs
      body = this.addTrackingParameters(body, campaign._id, recipientId);
      if (clickAction) {
        clickAction = this.addTrackingParameters(clickAction, campaign._id, recipientId);
      }

      return { subject, body, clickAction };
    } catch (error) {
      console.error(`Error personalizing campaign for ${recipientId}:`, error);
      // Return default content as fallback
      return {
        subject: campaign.subject,
        body: campaign.content,
        clickAction: campaign.clickAction
      };
    }
  }

  /**
   * Apply dynamic content rules to campaign body
   * @param {string} body Campaign content body
   * @param {Object} customer Customer data
   * @param {Object} campaign Campaign data
   */
  async applyDynamicContent(body, customer, campaign) {
    try {
      let content = body;
      
      // Process each dynamic content rule
      for (const rule of campaign.dynamicContent) {
        if (rule.condition && rule.content) {
          const conditionMet = await this.evaluateCondition(rule.condition, customer);
          
          if (conditionMet) {
            // Replace placeholder with dynamic content
            const placeholder = `{{dynamicContent:${rule.id}}}`;
            content = content.replace(placeholder, rule.content);
          }
        }
      }
      
      // Remove any remaining dynamic content placeholders
      content = content.replace(/{{dynamicContent:[^}]+}}/g, '');
      
      return content;
    } catch (error) {
      console.error('Error applying dynamic content:', error);
      return body; // Return original content as fallback
    }
  }

  /**
   * Evaluate condition against customer data
   * @param {Object} condition Condition to evaluate
   * @param {Object} customer Customer data
   */
  async evaluateCondition(condition, customer) {
    try {
      // Simple property comparison
      if (condition.property && condition.value !== undefined) {
        const propertyValue = this.getNestedProperty(customer, condition.property);
        
        switch (condition.operator) {
          case 'equals':
            return propertyValue === condition.value;
          case 'notEquals':
            return propertyValue !== condition.value;
          case 'contains':
            return String(propertyValue).includes(condition.value);
          case 'notContains':
            return !String(propertyValue).includes(condition.value);
          case 'greaterThan':
            return propertyValue > condition.value;
          case 'lessThan':
            return propertyValue < condition.value;
          default:
            return false;
        }
      }
      
      // Segment membership check
      if (condition.segmentId) {
        return await segmentMatcher.isInSegment(customer._id, condition.segmentId);
      }
      
      // Behavior check
      if (condition.behaviorType) {
        const count = await CustomerBehavior.countDocuments({
          customerId: customer._id,
          eventType: condition.behaviorType,
          timestamp: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * (condition.days || 30)) }
        });
        
        return count >= (condition.count || 1);
      }
      
      return false;
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  }

  /**
   * Get nested property from object
   * @param {Object} obj Source object
   * @param {string} path Property path (e.g., 'user.profile.firstName')
   */
  getNestedProperty(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  /**
   * Add tracking parameters to URLs
   * @param {string} content Content with URLs
   * @param {string} campaignId Campaign ID
   * @param {string} recipientId Customer ID
   */
  addTrackingParameters(content, campaignId, recipientId) {
    try {
      // Find all URLs in content
      const urlRegex = /(https?:\/\/[^\s'"]+)/g;
      
      return content.replace(urlRegex, (url) => {
        const separator = url.includes('?') ? '&' : '?';
        
        // Add tracking parameters
        return `${url}${separator}utm_source=marketing&utm_medium=campaign&utm_campaign=${campaignId}&recipient=${recipientId}`;
      });
    } catch (error) {
      console.error('Error adding tracking parameters:', error);
      return content; // Return original content as fallback
    }
  }
}

module.exports = new CampaignExecutor();
