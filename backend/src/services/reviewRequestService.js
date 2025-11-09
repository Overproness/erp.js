const ReviewLink = require('@/models/appModels/ReviewLink');
const Business = require('@/models/appModels/Business');
const emailService = require('./emailService');
const smsService = require('./smsService');
const urlGenerator = require('@/utils/urlGenerator');

class ReviewRequestService {
  /**
   * Create a new review request link
   * @param {Object} linkData - Review link data
   * @param {String} businessId - Business ID
   * @param {String} ownerId - Owner ID
   * @returns {Promise<Object>} Created review link
   */
  async createReviewLink(linkData, businessId, ownerId) {
    try {
      // Get business info
      const business = await Business.findOne({
        _id: businessId,
        owner: ownerId,
        removed: false
      });
      
      if (!business) {
        throw new Error('Business not found');
      }
      
      // Generate unique link code
      const linkCode = await urlGenerator.generateUniqueCode(8);
      
      // Create new review link
      const reviewLink = new ReviewLink({
        business: businessId,
        linkCode,
        name: linkData.name || 'Review Request',
        description: linkData.description || '',
        expiresAt: linkData.expiresAt ? new Date(linkData.expiresAt) : null,
        maxUses: linkData.maxUses || null,
        redirectUrl: linkData.redirectUrl || null,
        customBranding: {
          enabled: !!linkData.customBranding?.enabled,
          logoUrl: linkData.customBranding?.logoUrl || business.branding?.logoUrl || null,
          primaryColor: linkData.customBranding?.primaryColor || business.branding?.primaryColor || '#4CAF50',
          secondaryColor: linkData.customBranding?.secondaryColor || business.branding?.secondaryColor || '#2196F3',
          backgroundImage: linkData.customBranding?.backgroundImage || business.branding?.backgroundImage || null,
          customCss: linkData.customBranding?.customCss || null,
        },
        analytics: {
          visits: 0,
          conversions: 0,
          lastVisit: null,
        },
        active: true,
        owner: ownerId,
        createdAt: new Date()
      });
      
      await reviewLink.save();
      
      // Generate full URL
      const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3000';
      const fullUrl = `${baseUrl}/review/${linkCode}`;
      
      return {
        success: true,
        reviewLink,
        linkCode,
        url: fullUrl
      };
    } catch (error) {
      console.error('Error creating review link:', error);
      throw error;
    }
  }
  
  /**
   * Send review request to customer
   * @param {String} linkId - Review link ID
   * @param {Object} customer - Customer information
   * @param {Array} channels - Notification channels ['email', 'sms']
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Request results
   */
  async sendReviewRequest(linkId, customer, channels = ['email'], options = {}) {
    try {
      // Get review link with business data
      const reviewLink = await ReviewLink.findById(linkId).populate('business');
      
      if (!reviewLink) {
        throw new Error('Review link not found');
      }
      
      if (!reviewLink.active) {
        throw new Error('Review link is inactive');
      }
      
      if (reviewLink.expiresAt && new Date(reviewLink.expiresAt) < new Date()) {
        throw new Error('Review link has expired');
      }
      
      // Generate full URL
      const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3000';
      const fullUrl = `${baseUrl}/review/${reviewLink.linkCode}`;
      
      const results = {};
      
      // Send email if requested
      if (channels.includes('email') && customer.email) {
        try {
          const emailResult = await emailService.sendReviewRequest(
            customer,
            reviewLink.business,
            fullUrl,
            options.email || {}
          );
          results.email = { success: true, ...emailResult };
        } catch (error) {
          console.error('Error sending review request email:', error);
          results.email = { success: false, error: error.message };
        }
      }
      
      // Send SMS if requested
      if (channels.includes('sms') && customer.phone) {
        try {
          const smsResult = await smsService.sendReviewRequest(
            customer,
            reviewLink.business,
            fullUrl,
            options.sms || {}
          );
          results.sms = { success: true, ...smsResult };
        } catch (error) {
          console.error('Error sending review request SMS:', error);
          results.sms = { success: false, error: error.message };
        }
      }
      
      // Log request
      reviewLink.requestHistory = reviewLink.requestHistory || [];
      reviewLink.requestHistory.push({
        customer: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone
        },
        channels,
        results,
        sentAt: new Date()
      });
      
      await reviewLink.save();
      
      return {
        success: Object.values(results).some(r => r.success),
        results,
        reviewLink: reviewLink._id,
        url: fullUrl
      };
    } catch (error) {
      console.error('Error sending review request:', error);
      throw error;
    }
  }
  
  /**
   * Create and send batch review requests
   * @param {String} businessId - Business ID
   * @param {Array} customers - Array of customer objects
   * @param {Object} linkOptions - Options for review link
   * @param {Array} channels - Notification channels
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Batch results
   */
  async sendBatchRequests(businessId, customers, linkOptions = {}, channels = ['email'], options = {}) {
    try {
      // Create review link if none provided
      let reviewLinkId = linkOptions.existingLinkId;
      
      if (!reviewLinkId) {
        const linkResult = await this.createReviewLink(linkOptions, businessId, options.ownerId);
        reviewLinkId = linkResult.reviewLink._id;
      }
      
      // Send requests to each customer
      const results = [];
      let successCount = 0;
      
      for (const customer of customers) {
        try {
          const result = await this.sendReviewRequest(reviewLinkId, customer, channels, options);
          
          if (result.success) {
            successCount++;
          }
          
          results.push({
            customer: customer.name,
            success: result.success,
            channels: result.results
          });
        } catch (error) {
          results.push({
            customer: customer.name,
            success: false,
            error: error.message
          });
        }
      }
      
      return {
        success: successCount > 0,
        totalRequests: customers.length,
        successCount,
        failureCount: customers.length - successCount,
        results,
        reviewLinkId
      };
    } catch (error) {
      console.error('Error sending batch review requests:', error);
      throw error;
    }
  }
  
  /**
   * Schedule review request campaign
   * @param {Object} campaign - Campaign configuration
   * @param {String} ownerId - Owner ID
   * @returns {Promise<Object>} Scheduled campaign
   */
  async scheduleCampaign(campaign, ownerId) {
    try {
      // Implementation for scheduling review campaigns
      // This could integrate with a job scheduler like agenda/bull
      
      // For now, create a placeholder for the scheduled campaign
      const scheduledCampaign = {
        name: campaign.name,
        business: campaign.businessId,
        reviewLink: campaign.reviewLinkId,
        customers: campaign.customers,
        channels: campaign.channels || ['email'],
        scheduledFor: new Date(campaign.scheduledFor),
        status: 'scheduled',
        owner: ownerId,
        createdAt: new Date()
      };
      
      // In a full implementation, this would save to a ReviewCampaign model
      // and be picked up by a scheduler
      
      return {
        success: true,
        campaign: scheduledCampaign,
        scheduledFor: scheduledCampaign.scheduledFor
      };
    } catch (error) {
      console.error('Error scheduling review campaign:', error);
      throw error;
    }
  }
  
  /**
   * Track review link analytics
   * @param {String} linkCode - Review link code
   * @param {String} event - Event type ('visit', 'conversion')
   * @param {Object} data - Additional event data
   * @returns {Promise<Object>} Updated analytics
   */
  async trackLinkAnalytics(linkCode, event, data = {}) {
    try {
      const reviewLink = await ReviewLink.findOne({ linkCode });
      
      if (!reviewLink) {
        throw new Error('Review link not found');
      }
      
      // Initialize analytics if not exist
      reviewLink.analytics = reviewLink.analytics || {
        visits: 0,
        conversions: 0,
        lastVisit: null
      };
      
      // Update analytics based on event
      if (event === 'visit') {
        reviewLink.analytics.visits += 1;
        reviewLink.analytics.lastVisit = new Date();
        
        // Record visitor info
        reviewLink.analytics.visitorHistory = reviewLink.analytics.visitorHistory || [];
        reviewLink.analytics.visitorHistory.push({
          timestamp: new Date(),
          ip: data.ip || 'unknown',
          userAgent: data.userAgent || 'unknown',
          referrer: data.referrer || 'direct'
        });
      } else if (event === 'conversion') {
        reviewLink.analytics.conversions += 1;
        reviewLink.analytics.lastConversion = new Date();
        
        // Record conversion
        reviewLink.analytics.conversionHistory = reviewLink.analytics.conversionHistory || [];
        reviewLink.analytics.conversionHistory.push({
          timestamp: new Date(),
          rating: data.rating,
          reviewId: data.reviewId
        });
      }
      
      await reviewLink.save();
      
      return {
        success: true,
        linkCode,
        analytics: reviewLink.analytics
      };
    } catch (error) {
      console.error('Error tracking link analytics:', error);
      throw error;
    }
  }
}

module.exports = new ReviewRequestService();
