// @ts-nocheck
/**
 * Campaign Executor Service
 * Background service for scheduled campaign execution across channels
 */
const { Campaign, TriggerRule, CustomerBehavior } = require('../models');
const campaignScheduler = require('../utils/campaignScheduler');
const segmentMatcher = require('../utils/segmentMatcher');
const marketingURLHelper = require('../utils/marketingURLHelper');
const emailService = require('./emailService');
const analyticsService = require('./analyticsService');

const getPushNotificationService = () => require('./pushNotificationService');

class CampaignExecutorService {
  /**
   * Execute scheduled campaigns
   * @returns {Promise<Array>} Results of campaign execution
   */
  async executeScheduledCampaigns() {
    try {
      // Find campaigns due for execution
      const now = new Date();
      const scheduledCampaigns = await Campaign.find({
        status: 'active',
        scheduledStartTime: { $lte: now },
        $or: [
          { completedAt: null },
          { scheduledEndTime: { $gt: now } }
        ]
      });

      console.log(`Found ${scheduledCampaigns.length} campaigns to execute`);
      
      const results = [];
      
      for (const campaign of scheduledCampaigns) {
        try {
          // Execute campaign for each channel
          for (const channel of campaign.channels) {
            const channelResult = await this.executeCampaignChannel(campaign._id, channel);
            results.push({
              campaignId: campaign._id,
              channel,
              sent: channelResult.sent,
              failed: channelResult.failed,
              skipped: channelResult.skipped
            });
          }

          // Update campaign metrics
          await this.updateCampaignMetrics(campaign._id);
        } catch (error) {
          console.error(`Error executing campaign ${campaign._id}:`, error);
          results.push({
            campaignId: campaign._id,
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error executing scheduled campaigns:', error);
      throw error;
    }
  }

  /**
   * Execute a campaign for a specific channel
   * @param {string} campaignId Campaign ID
   * @param {string} channel Channel name
   * @returns {Promise<Object>} Execution results
   */
  async executeCampaignChannel(campaignId, channel) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    // Check if this channel is already complete
    if (campaign.channelProgress && 
        campaign.channelProgress[channel] && 
        campaign.channelProgress[channel].completed) {
      return {
        sent: 0,
        failed: 0,
        skipped: campaign.totalCustomers || 0,
        completed: true
      };
    }

    // Get next batch of customers
    const batchOptions = {
      batchSize: campaign.batchSize || 100,
      channel,
      considerOptimalTime: campaign.useOptimalSendTime || false
    };

    const customerBatch = await campaignScheduler.getNextCampaignBatch(
      campaignId, 
      batchOptions
    );

    if (!customerBatch || customerBatch.length === 0) {
      // Mark channel as completed if no more customers
      await this.markChannelComplete(campaignId, channel);
      return {
        sent: 0,
        failed: 0,
        skipped: 0,
        completed: true
      };
    }

    // Execute for each customer in batch
    const results = {
      sent: 0,
      failed: 0,
      skipped: 0
    };

    for (const customerId of customerBatch) {
      try {
        const sent = await this.sendCampaignToCustomer(
          campaign,
          customerId,
          channel
        );

        if (sent) {
          results.sent++;
          
          // Track that this customer received the campaign
          campaign.sentTo = campaign.sentTo || [];
          campaign.sentTo.push(customerId);
          
          // Update campaign metrics
          campaign.metrics = campaign.metrics || {};
          campaign.metrics.sent = (campaign.metrics.sent || 0) + 1;
        } else {
          results.skipped++;
        }
      } catch (error) {
        console.error(`Failed to send campaign ${campaignId} to customer ${customerId}:`, error);
        results.failed++;
        
        // Update campaign metrics
        campaign.metrics = campaign.metrics || {};
        campaign.metrics.failed = (campaign.metrics.failed || 0) + 1;
      }
    }

    // Update campaign status
    await campaign.save();

    // Check if campaign is complete
    const campaignComplete = await this.checkCampaignCompletion(campaignId);
    if (campaignComplete) {
      await Campaign.findByIdAndUpdate(campaignId, {
        status: 'completed',
        completedAt: new Date()
      });
    }

    return results;
  }

  /**
   * Send campaign to a specific customer
   * @param {Object} campaign Campaign object
   * @param {string} customerId Customer ID
   * @param {string} channel Channel name
   * @returns {Promise<boolean>} Whether message was sent
   */
  async sendCampaignToCustomer(campaign, customerId, channel) {
    // Get customer data
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return false;
    }

    // Check if customer is in target segment
    if (campaign.segments && campaign.segments.length > 0) {
      let inSegment = false;
      for (const segmentId of campaign.segments) {
        if (await segmentMatcher.matchCustomerToSegment(customerId, segmentId)) {
          inSegment = true;
          break;
        }
      }
      
      if (!inSegment) {
        return false;
      }
    }

    // Generate tracking URL if needed
    let trackingUrl = null;
    if (campaign.trackingUrl) {
      trackingUrl = await marketingURLHelper.generateCampaignURL({
        baseUrl: campaign.trackingUrl,
        campaignId: campaign._id,
        source: 'campaign',
        medium: channel,
        content: customerId,
        shorten: true,
        ownerId: campaign.owner,
        title: `${campaign.name} - ${customer.fullName}`
      });
    }

    // Prepare message content with customer personalization
    const content = this.personalizeCampaignContent(
      campaign.content[channel], 
      customer,
      trackingUrl?.shortUrl
    );

    // Send message via appropriate channel
    let sent = false;
    switch (channel) {
      case 'email':
        sent = await this.sendEmail(customer, content, campaign);
        break;
      case 'sms':
        sent = await this.sendSMS(customer, content, campaign);
        break;
      case 'push':
        sent = await this.sendPushNotification(customer, content, campaign);
        break;
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }

    if (sent) {
      // Record customer behavior
      await CustomerBehavior.create({
        customerId,
        eventType: `campaign_${channel}_sent`,
        campaignId: campaign._id,
        timestamp: new Date(),
        data: {
          campaignName: campaign.name,
          trackingUrl: trackingUrl?.shortUrl
        },
        owner: campaign.owner
      });
    }

    return sent;
  }

  /**
   * Personalize campaign content for a customer
   * @param {string} content Raw content template
   * @param {Object} customer Customer data
   * @param {string} trackingUrl Optional tracking URL
   * @returns {string} Personalized content
   */
  personalizeCampaignContent(content, customer, trackingUrl) {
    if (!content) return '';

    // Replace customer variables
    let personalized = content
      .replace(/\{\{firstName\}\}/g, customer.firstName || '')
      .replace(/\{\{lastName\}\}/g, customer.lastName || '')
      .replace(/\{\{fullName\}\}/g, customer.fullName || '')
      .replace(/\{\{email\}\}/g, customer.email || '')
      .replace(/\{\{phone\}\}/g, customer.phone || '')
      .replace(/\{\{company\}\}/g, customer.company || '');

    // Add tracking URL if provided
    if (trackingUrl) {
      personalized = personalized.replace(/\{\{trackingUrl\}\}/g, trackingUrl);
    }

    // Replace date variables
    const now = new Date();
    personalized = personalized
      .replace(/\{\{date\}\}/g, now.toLocaleDateString())
      .replace(/\{\{time\}\}/g, now.toLocaleTimeString());

    return personalized;
  }

  /**
   * Send email for campaign
   * @param {Object} customer Customer data
   * @param {string} content Personalized content
   * @param {Object} campaign Campaign data
   * @returns {Promise<boolean>} Whether email was sent
   */
  async sendEmail(customer, content, campaign) {
    if (!customer.email) {
      return false;
    }

    try {
      await emailService.sendEmail({
        to: customer.email,
        subject: campaign.subject || campaign.name,
        html: content,
        from: campaign.senderEmail || 'marketing@example.com',
        replyTo: campaign.replyToEmail,
        metadata: {
          campaignId: campaign._id,
          customerId: customer._id
        }
      });
      return true;
    } catch (error) {
      console.error(`Error sending campaign email to ${customer.email}:`, error);
      return false;
    }
  }

  /**
   * Send SMS for campaign
   * @param {Object} customer Customer data
   * @param {string} content Personalized content
   * @param {Object} campaign Campaign data
   * @returns {Promise<boolean>} Whether SMS was sent
   */
  async sendSMS(customer, content, campaign) {
    if (!customer.phone) {
      return false;
    }

    if (process.env.SMS_ENABLED !== 'true') {
      return false;
    }

    try {
      const smsService = require('./smsService');
      await smsService.sendSMS({
        to: customer.phone,
        body: content,
        metadata: {
          campaignId: campaign._id,
          customerId: customer._id
        }
      });
      return true;
    } catch (error) {
      console.error(`Error sending campaign SMS to ${customer.phone}:`, error);
      return false;
    }
  }

  /**
   * Send push notification for campaign
   * @param {Object} customer Customer data
   * @param {string} content Personalized content
   * @param {Object} campaign Campaign data
   * @returns {Promise<boolean>} Whether notification was sent
   */
  async sendPushNotification(customer, content, campaign) {
    if (!customer.pushTokens || customer.pushTokens.length === 0) {
      return false;
    }

    try {
      const pushNotificationService = getPushNotificationService();
      await pushNotificationService.sendNotification({
        tokens: customer.pushTokens,
        title: campaign.subject || campaign.name,
        body: content,
        data: {
          campaignId: campaign._id.toString(),
          customerId: customer._id.toString()
        }
      });
      return true;
    } catch (error) {
      console.error(`Error sending campaign push to ${customer._id}:`, error);
      return false;
    }
  }

  /**
   * Mark a channel as complete for a campaign
   * @param {string} campaignId Campaign ID
   * @param {string} channel Channel name
   */
  async markChannelComplete(campaignId, channel) {
    await Campaign.findByIdAndUpdate(campaignId, {
      [`channelProgress.${channel}`]: {
        completed: true,
        completedAt: new Date()
      }
    });
  }

  /**
   * Check if a campaign is completely finished
   * @param {string} campaignId Campaign ID
   * @returns {Promise<boolean>} Whether campaign is complete
   */
  async checkCampaignCompletion(campaignId) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    // If end date has passed, campaign is complete
    if (campaign.scheduledEndTime && new Date() > campaign.scheduledEndTime) {
      return true;
    }

    // Check if all channels are complete
    if (!campaign.channelProgress) {
      return false;
    }

    for (const channel of campaign.channels) {
      if (!campaign.channelProgress[channel] || !campaign.channelProgress[channel].completed) {
        return false;
      }
    }

    return true;
  }

  /**
   * Update campaign metrics with analytics data
   * @param {string} campaignId Campaign ID
   */
  async updateCampaignMetrics(campaignId) {
    // Get analytics data
    const analytics = await analyticsService.getCampaignAnalytics(campaignId);
    
    // Update campaign metrics
    await Campaign.findByIdAndUpdate(campaignId, {
      metrics: {
        ...analytics,
        lastUpdated: new Date()
      }
    });
  }
}

module.exports = new CampaignExecutorService();
