// @ts-nocheck

import { sentimentAnalysisService } from './sentimentAnalysisService';
import { facebookService } from './facebookService';
import { instagramService } from './instagramService';
import { twitterService } from './twitterService';
import { notificationService } from './notificationService';
import Business from '../models/appModels/Business';
import SocialAccount from '../models/appModels/SocialAccount';
import Review from '../models/appModels/Review';
import ReviewTemplate from '../models/appModels/ReviewTemplate';
import ReviewResponse from '../models/appModels/ReviewResponse';
class ReviewMonitoringService {
  constructor() {
    this.platforms = {
      facebook: facebookService,
      instagram: instagramService,
      twitter: twitterService,
      google: null, // Google reviews service would be implemented separately
      yelp: null,   // Yelp service would be implemented separately
    };
    
    this.monitoringIntervals = new Map();
    this.defaultIntervalMinutes = 60; // Default check every hour
  }

  getPlatformService(platform) {
    const service = this.platforms[platform.toLowerCase()];
    if (!service) {
      throw new Error(`Unsupported platform: ${platform}`);
    }
    return service;
  }

  async startMonitoring(businessId, ownerId, options = {}) {
    try {
      // Stop any existing monitoring for this business
      this.stopMonitoring(businessId);
      
      const business = await Business.findOne({
        _id: businessId,
        owner: ownerId,
        removed: false,
      });
      
      if (!business) {
        throw new Error('Business not found');
      }
      
      // Get monitoring interval from options or business settings
      const intervalMinutes = options.intervalMinutes || 
                             business.reviewSettings?.monitoringInterval || 
                             this.defaultIntervalMinutes;
      
      // Start monitoring for each connected platform
      const accounts = await SocialAccount.find({
        owner: ownerId,
        isActive: true,
        removed: false,
        'settings.importReviews': true
      });
      
      if (accounts.length === 0) {
        return { 
          success: false, 
          message: 'No connected accounts with review import enabled' 
        };
      }
      
      // Create monitoring interval
      const intervalId = setInterval(async () => {
        await this.checkForNewReviews(business, accounts, ownerId);
      }, intervalMinutes * 60 * 1000);
      
      // Store interval for future reference
      this.monitoringIntervals.set(businessId.toString(), intervalId);
      
      // Run an initial check immediately
      await this.checkForNewReviews(business, accounts, ownerId);
      
      return { 
        success: true,
        message: `Review monitoring started for business ${business.name}`,
        interval: intervalMinutes
      };
    } catch (error) {
      console.error('Error starting review monitoring:', error);
      throw error;
    }
  }
  
  stopMonitoring(businessId) {
    const intervalId = this.monitoringIntervals.get(businessId.toString());
    if (intervalId) {
      clearInterval(intervalId);
      this.monitoringIntervals.delete(businessId.toString());
      return { success: true, message: 'Monitoring stopped successfully' };
    }
    return { success: false, message: 'No active monitoring found' };
  }
  
  async checkForNewReviews(business, accounts, ownerId) {
    try {
      const newReviews = [];
      
      for (const account of accounts) {
        try {
          const platform = account.platform;
          const service = this.getPlatformService(platform);
          
          // Skip if service doesn't exist for this platform
          if (!service) continue;
          
          // Fetch latest reviews from platform
          const platformReviews = await service.fetchReviews(account);
          
          for (const platformReview of platformReviews) {
            // Check if review already exists
            const existingReview = await Review.findOne({
              platform: platform,
              platformReviewId: platformReview.id,
              business: business._id
            });
            
            if (!existingReview) {
              // Create new review
              const newReview = new Review({
                business: business._id,
                rating: platformReview.rating,
                title: platformReview.title || '',
                comment: platformReview.comment || '',
                client: {
                  name: platformReview.authorName,
                  avatarUrl: platformReview.authorAvatar || '',
                },
                platform: platform,
                platformReviewId: platformReview.id,
                publishedAt: platformReview.publishedAt || new Date(),
                owner: ownerId,
              });
              
              // Analyze sentiment if comment exists
              if (platformReview.comment) {
                const sentiment = await sentimentAnalysisService.analyzeSentiment(
                  platformReview.comment,
                  ownerId
                );
                
                newReview.sentiment = {
                  score: sentiment.score,
                  category: sentiment.category,
                  keywords: sentiment.keywords || [],
                };
              }
              
              // Save review
              await newReview.save();
              newReviews.push(newReview);
              
              // Send notification
              await this.sendReviewNotification(newReview, business);
              
              // Auto-response if enabled
              await this.handleAutoResponse(newReview, business);
            }
          }
        } catch (error) {
          console.error(`Error checking ${account.platform} reviews:`, error);
          // Continue with other accounts
        }
      }
      
      return newReviews;
    } catch (error) {
      console.error('Error checking for new reviews:', error);
      throw error;
    }
  }
  
  async sendReviewNotification(review, business) {
    try {
      // Check if notifications are enabled
      if (!business.reviewSettings?.notifyOnNewReview) {
        return;
      }
      
      // Check rating threshold for negative reviews
      const isLowRating = review.rating <= (business.reviewSettings?.lowRatingThreshold || 3);
      if (isLowRating && !business.reviewSettings?.notifyLowRatings) {
        return;
      }
      
      // Send notification
      const notificationData = {
        type: 'new_review',
        business: business._id,
        businessName: business.name,
        reviewId: review._id,
        rating: review.rating,
        platform: review.platform,
        clientName: review.client.name,
        sentimentCategory: review.sentiment?.category || 'neutral',
        isUrgent: isLowRating,
      };
      
      await notificationService.sendNotification(
        business.owner,
        'New Review Received',
        `${review.rating}★ review from ${review.client.name} on ${review.platform}`,
        notificationData
      );
      
    } catch (error) {
      console.error('Error sending review notification:', error);
      // Don't throw - this shouldn't break the process
    }
  }
  
  async handleAutoResponse(review, business) {
    try {
      // Check if auto-response is enabled
      const autoResponse = business.reviewSettings?.autoResponse;
      if (!autoResponse?.enabled) return;
      
      // Check if we should respond based on sentiment
      const sentiment = review.sentiment?.category || 'neutral';
      
      if (
        (sentiment === 'positive' && !autoResponse.positiveReviews) ||
        (sentiment === 'neutral' && !autoResponse.neutralReviews) ||
        (sentiment === 'negative' && !autoResponse.negativeReviews)
      ) {
        return;
      }
      
      // Get template for this sentiment
      const templateId = business.reviewSettings?.defaultReplyTemplate?.[sentiment];
      if (!templateId) return;
      
      // Schedule response with delay if configured
      const delayHours = autoResponse.delay || 0;
      
      if (delayHours > 0) {
        // Schedule for later
        setTimeout(async () => {
          await this.generateAndSendResponse(review, templateId, business);
        }, delayHours * 60 * 60 * 1000);
      } else {
        // Send immediately
        await this.generateAndSendResponse(review, templateId, business);
      }
    } catch (error) {
      console.error('Error handling auto response:', error);
      // Don't throw - this shouldn't break the process
    }
  }
  
  async generateAndSendResponse(review, templateId, business) {
    try {
      // Get the template
      const template = await ReviewTemplate.findById(templateId);
      
      if (!template) return;
      
      // Generate response text
      const responseData = {
        businessName: business.name,
        customerName: review.client.name,
        reviewRating: review.rating,
        responseDate: new Date().toLocaleDateString(),
        respondentName: business.contact?.name || '',
        respondentTitle: business.contact?.title || 'Manager',
      };
      
      const responseText = template.fillTemplate(responseData);
      
      // Create response
      const response = new ReviewResponse({
        review: review._id,
        business: business._id,
        template: template._id,
        responseText: responseText,
        status: 'pending',
        isAutoGenerated: true,
        respondentName: business.contact?.name || '',
        respondentTitle: business.contact?.title || 'Manager',
        approvalRequired: business.reviewSettings?.requireApproval || false,
        approvalStatus: business.reviewSettings?.requireApproval ? 'pending' : 'not_required',
        owner: business.owner,
      });
      
      await response.save();
      
      // If no approval required, send the response
      if (!business.reviewSettings?.requireApproval) {
        // Send the response if platform supports it
        if (['google', 'facebook', 'yelp'].includes(review.platform)) {
          try {
            // Implementation would depend on platform APIs
            // This is a placeholder for the actual implementation
            console.log(`Auto-response sent to ${review.platform} for review ${review._id}`);
            
            response.status = 'sent';
            response.sentAt = new Date();
            await response.save();
            
            // Update review status
            review.status = 'responded';
            review.hasResponse = true;
            await review.save();
          } catch (err) {
            console.error(`Error sending auto-response to ${review.platform}:`, err);
            response.status = 'failed';
            await response.save();
          }
        }
      } else {
        // Send notification that approval is needed
        await notificationService.sendNotification(
          business.owner,
          'Review Response Approval Required',
          `A response to ${review.client.name}'s review requires your approval`,
          {
            type: 'review_approval',
            business: business._id,
            reviewId: review._id,
            responseId: response._id
          }
        );
      }
      
    } catch (error) {
      console.error('Error generating and sending response:', error);
    }
  }
}

const reviewMonitoringService = new ReviewMonitoringService();
export = { reviewMonitoringService };
