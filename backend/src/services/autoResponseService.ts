// @ts-nocheck
const mongoose = require('mongoose');

const ReviewTemplate = mongoose.model('ReviewTemplate');
const Review = mongoose.model('Review');
const ReviewResponse = mongoose.model('ReviewResponse');
const Business = mongoose.model('Business');
const sentimentAnalysisService = require('./sentimentAnalysisService');

const getNotificationService = () => {
  const serviceModule = require('./notificationService');
  return serviceModule.notificationService || serviceModule;
};
const getSocialMediaService = () => require('./socialMediaService');

class AutoResponseService {
  constructor() {
    this.responseDelay = 30 * 60 * 1000; // Default 30 minutes delay
    this.pendingResponses = {};
  }

  /**
   * Process a new review for potential auto-response
   * @param {Object} review - Review object
   * @param {String} businessId - Business ID
   * @returns {Object} Response status
   */
  async processReview(review, businessId) {
    try {
      // Load business and check auto-response settings
      const business = await Business.findById(businessId);
      if (!business) {
        throw new Error(`Business not found: ${businessId}`);
      }
      
      // Check if auto-response is enabled for this business
      if (!business.reviewSettings?.autoResponse?.enabled) {
        return {
          success: false,
          reason: 'Auto-response disabled for this business',
          reviewId: review._id
        };
      }
      
      // Check if review qualifies for auto-response based on rating
      const minRating = business.reviewSettings?.autoResponse?.minRating || 1;
      const maxRating = business.reviewSettings?.autoResponse?.maxRating || 5;
      
      if (review.rating < minRating || review.rating > maxRating) {
        return {
          success: false,
          reason: `Review rating (${review.rating}) outside auto-response range (${minRating}-${maxRating})`,
          reviewId: review._id
        };
      }
      
      // Determine response delay (if any)
      const delay = business.reviewSettings?.autoResponse?.delayMinutes || 30;
      
      // Handle immediate or delayed response
      if (delay <= 0) {
        return await this.generateAndSendResponse(review, business);
      } else {
        return await this.scheduleResponse(review, business, delay);
      }
      
    } catch (error) {
      console.error('Error processing review for auto-response:', error);
      return {
        success: false,
        error: error.message,
        reviewId: review._id
      };
    }
  }
  
  /**
   * Schedule a delayed response to a review
   * @param {Object} review - Review object
   * @param {Object} business - Business object
   * @param {Number} delayMinutes - Delay in minutes
   */
  async scheduleResponse(review, business, delayMinutes) {
    try {
      const responseKey = `${review._id}_${business._id}`;
      const delayMs = delayMinutes * 60 * 1000;
      
      // Clear any existing scheduled response
      if (this.pendingResponses[responseKey]) {
        clearTimeout(this.pendingResponses[responseKey]);
      }
      
      // Schedule new response
      this.pendingResponses[responseKey] = setTimeout(async () => {
        try {
          await this.generateAndSendResponse(review, business);
          delete this.pendingResponses[responseKey];
        } catch (error) {
          console.error(`Error sending scheduled response to review ${review._id}:`, error);
        }
      }, delayMs);
      
      return {
        success: true,
        scheduled: true,
        reviewId: review._id,
        businessId: business._id,
        scheduledTime: new Date(Date.now() + delayMs)
      };
    } catch (error) {
      console.error('Error scheduling response:', error);
      return {
        success: false,
        error: error.message,
        reviewId: review._id
      };
    }
  }
  
  /**
   * Generate and send response to a review
   * @param {Object} review - Review object
   * @param {Object} business - Business object
   */
  async generateAndSendResponse(review, business) {
    try {
      // Get appropriate template for review
      const template = await this.selectTemplate(review, business);
      
      if (!template) {
        return {
          success: false,
          reason: 'No suitable template found',
          reviewId: review._id
        };
      }
      
      // Prepare response data for variable replacement
      const responseData = {
        businessName: business.name,
        customerName: review.client?.name || 'Valued Customer',
        reviewRating: review.rating,
        responseDate: new Date().toLocaleDateString(),
        respondentName: business.contact?.name || 'Management',
        respondentTitle: business.contact?.title || 'Manager',
      };
      
      // Generate personalized response text
      const responseText = template.fillTemplate(responseData);
      
      // Check if approval is required
      const requiresApproval = business.reviewSettings?.autoResponse?.requireApproval || false;
      
      if (requiresApproval) {
        // Create response in pending state
        const response = new ReviewResponse({
          review: review._id,
          business: business._id,
          responseText: responseText,
          template: template._id,
          status: 'pending_approval',
          createdAt: new Date(),
          respondent: null, // Will be set when approved
          owner: business.owner,
          autoGenerated: true
        });
        
        await response.save();
        
        // Notify business owner about pending approval
        await this.notifyPendingApproval(review, business, response);
        
        return {
          success: true,
          status: 'pending_approval',
          reviewId: review._id,
          responseId: response._id
        };
      } else {
        // Send response immediately
        return await this.sendResponse(review, business, responseText, template._id);
      }
    } catch (error) {
      console.error('Error generating response:', error);
      return {
        success: false,
        error: error.message,
        reviewId: review._id
      };
    }
  }
  
  /**
   * Select appropriate template for a review
   * @param {Object} review - Review object
   * @param {Object} business - Business object
   */
  async selectTemplate(review, business) {
    try {
      // Get review sentiment if not already analyzed
      let sentiment = review.sentiment?.category;
      if (!sentiment) {
        const sentimentResult = await sentimentAnalysisService.analyzeSentiment(review.comment || '');
        sentiment = sentimentResult.category;
        
        // Update review with sentiment analysis
        await Review.findByIdAndUpdate(review._id, {
          sentiment: {
            score: sentimentResult.score,
            category: sentimentResult.category,
            keywords: sentimentResult.keywords || []
          }
        });
      }
      
      // Find template matching platform and sentiment
      const template = await ReviewTemplate.findOne({
        business: business._id,
        platform: review.platform,
        sentimentType: sentiment,
        isActive: true
      });
      
      // If no specific template found, try to find default template for sentiment
      if (!template) {
        return await ReviewTemplate.findOne({
          business: business._id,
          platform: 'default',
          sentimentType: sentiment,
          isActive: true
        });
      }
      
      return template;
    } catch (error) {
      console.error('Error selecting template:', error);
      return null;
    }
  }
  
  /**
   * Send response to a review via platform API
   * @param {Object} review - Review object
   * @param {Object} business - Business object
   * @param {String} responseText - Response text
   * @param {String} templateId - Template ID used
   */
  async sendResponse(review, business, responseText, templateId) {
    try {
      // Create response record
      const response = new ReviewResponse({
        review: review._id,
        business: business._id,
        responseText: responseText,
        template: templateId,
        status: 'sending',
        createdAt: new Date(),
        respondent: business.owner,
        owner: business.owner,
        autoGenerated: true
      });
      
      await response.save();
      
      // Send response through platform API
      const socialMediaService = getSocialMediaService();
      const result = await socialMediaService.respondToReview(
        review._id, 
        responseText, 
        business.owner
      );
      
      // Update response status
      response.status = 'sent';
      response.sentAt = new Date();
      response.platformConfirmation = result.platformConfirmation;
      await response.save();
      
      // Update review status
      review.status = 'responded';
      review.hasResponse = true;
      await review.save();
      
      // Notify business owner about sent response
      const notificationService = getNotificationService();
      await notificationService.sendNotification(
        'response_sent',
        {
          businessName: business.name,
          reviewId: review._id,
          customerName: review.client?.name || 'Customer',
          rating: review.rating,
          platform: review.platform,
          responseText: responseText,
          responseDate: new Date().toLocaleDateString()
        },
        { id: business.owner, email: business.contact?.email },
        ['email', 'app']
      );
      
      return {
        success: true,
        status: 'sent',
        reviewId: review._id,
        responseId: response._id
      };
    } catch (error) {
      console.error('Error sending response:', error);
      return {
        success: false,
        error: error.message,
        reviewId: review._id
      };
    }
  }
  
  /**
   * Notify business owner about pending response approval
   * @param {Object} review - Review object
   * @param {Object} business - Business object
   * @param {Object} response - Response object
   */
  async notifyPendingApproval(review, business, response) {
    try {
      const notificationService = getNotificationService();
      await notificationService.sendNotification(
        'review_approval',
        {
          businessName: business.name,
          reviewId: review._id,
          responseId: response._id,
          customerName: review.client?.name || 'Customer',
          rating: review.rating,
          platform: review.platform,
          comment: review.comment ? review.comment.substring(0, 100) : '(No comment)',
          responseText: response.responseText,
          approvalUrl: `/dashboard/reviews/approval/${response._id}`
        },
        { id: business.owner, email: business.contact?.email },
        ['email', 'app']
      );
      
      return true;
    } catch (error) {
      console.error('Error sending approval notification:', error);
      return false;
    }
  }
  
  /**
   * Approve a pending response
   * @param {String} responseId - Response ID
   * @param {String} userId - User ID approving the response
   * @param {Boolean} modifyResponse - Whether the response was modified
   */
  async approveResponse(responseId, userId, modifyResponse = false) {
    try {
      // Get response, review, and business
      const response = await ReviewResponse.findById(responseId);
      if (!response) {
        throw new Error('Response not found');
      }
      
      if (response.status !== 'pending_approval') {
        return {
          success: false,
          reason: `Response is in ${response.status} status, not pending approval`,
          responseId
        };
      }
      
      const review = await Review.findById(response.review);
      if (!review) {
        throw new Error('Associated review not found');
      }
      
      const business = await Business.findById(response.business);
      if (!business) {
        throw new Error('Business not found');
      }
      
      // Update response status
      response.status = 'sending';
      response.respondent = userId;
      response.approvedAt = new Date();
      response.modifiedBeforeApproval = modifyResponse;
      await response.save();
      
      // Send response through platform API
      const socialMediaService = getSocialMediaService();
      const result = await socialMediaService.respondToReview(
        review._id, 
        response.responseText, 
        business.owner
      );
      
      // Update response status after sending
      response.status = 'sent';
      response.sentAt = new Date();
      response.platformConfirmation = result.platformConfirmation;
      await response.save();
      
      // Update review status
      review.status = 'responded';
      review.hasResponse = true;
      await review.save();
      
      return {
        success: true,
        status: 'sent',
        reviewId: review._id,
        responseId: response._id
      };
    } catch (error) {
      console.error('Error approving response:', error);
      return {
        success: false,
        error: error.message,
        responseId
      };
    }
  }
  
  /**
   * Reject a pending response
   * @param {String} responseId - Response ID
   * @param {String} userId - User ID rejecting the response
   * @param {String} reason - Reason for rejection
   */
  async rejectResponse(responseId, userId, reason) {
    try {
      const response = await ReviewResponse.findById(responseId);
      if (!response) {
        throw new Error('Response not found');
      }
      
      if (response.status !== 'pending_approval') {
        return {
          success: false,
          reason: `Response is in ${response.status} status, not pending approval`,
          responseId
        };
      }
      
      // Update response status
      response.status = 'rejected';
      response.rejectedBy = userId;
      response.rejectedAt = new Date();
      response.rejectionReason = reason;
      await response.save();
      
      return {
        success: true,
        status: 'rejected',
        responseId: response._id
      };
    } catch (error) {
      console.error('Error rejecting response:', error);
      return {
        success: false,
        error: error.message,
        responseId
      };
    }
  }
}

module.exports = new AutoResponseService();
