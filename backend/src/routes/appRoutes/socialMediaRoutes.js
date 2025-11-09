const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');

// Import controllers
const accountController = require('@/controllers/appControllers/socialMediaController/accountController.stub');
const postController = require('@/controllers/appControllers/socialMediaController/postController.stub');
const analyticsController = require('@/controllers/appControllers/socialMediaController/analyticsController.stub');
const mentionController = require('@/controllers/appControllers/socialMediaController/mentionController.stub');
const campaignController = require('@/controllers/appControllers/socialMediaController/campaignController.stub');

// Account Management Routes
router
  .route('/accounts')
  .get(catchErrors(accountController.getAccounts)) // Get all connected accounts
  .post(catchErrors(accountController.connectAccount)); // Connect new account

router
  .route('/accounts/:id')
  .get(catchErrors(accountController.read)) // Get account details
  .patch(catchErrors(accountController.update)) // Update account settings
  .delete(catchErrors(accountController.disconnect)); // Disconnect account

router.route('/accounts/:id/refresh').post(catchErrors(accountController.refreshToken)); // Refresh account token

router.route('/accounts/:id/test').post(catchErrors(accountController.testConnection)); // Test account connection

// Post Management Routes
router
  .route('/posts')
  .get(catchErrors(postController.getPosts)) // Get all posts
  .post(catchErrors(postController.createPost)); // Create new post

router.route('/posts/bulk').post(catchErrors(postController.createBulk)); // Create multiple posts

router.route('/posts/scheduled').get(catchErrors(postController.getScheduled)); // Get scheduled posts

router
  .route('/posts/:id')
  .get(catchErrors(postController.read)) // Get post details
  .patch(catchErrors(postController.update)) // Update post
  .delete(catchErrors(postController.delete)); // Delete post

router.route('/posts/:id/publish').post(catchErrors(postController.publish)); // Publish post immediately

router.route('/posts/:id/schedule').post(catchErrors(postController.schedule)); // Schedule post

router.route('/posts/:id/duplicate').post(catchErrors(postController.duplicate)); // Duplicate post

router.route('/posts/:id/analytics').get(catchErrors(postController.getPostAnalytics)); // Get post analytics

// Campaign Management Routes
router
  .route('/campaigns')
  .get(catchErrors(campaignController.list)) // Get all campaigns
  .post(catchErrors(campaignController.create)); // Create new campaign

router
  .route('/campaigns/:id')
  .get(catchErrors(campaignController.read)) // Get campaign details
  .patch(catchErrors(campaignController.update)) // Update campaign
  .delete(catchErrors(campaignController.delete)); // Delete campaign

router.route('/campaigns/:id/posts').get(catchErrors(campaignController.getPosts)); // Get campaign posts

router.route('/campaigns/:id/analytics').get(catchErrors(campaignController.getAnalytics)); // Get campaign analytics

router.route('/campaigns/:id/start').post(catchErrors(campaignController.start)); // Start campaign

router.route('/campaigns/:id/pause').post(catchErrors(campaignController.pause)); // Pause campaign

router.route('/campaigns/:id/complete').post(catchErrors(campaignController.complete)); // Complete campaign

// Analytics Routes
router.route('/analytics/overview').get(catchErrors(analyticsController.getAnalyticsDashboard)); // Get analytics overview

router
  .route('/analytics/accounts/:accountId')
  .get(catchErrors(analyticsController.getAccountAnalytics)); // Get account analytics

router.route('/analytics/posts/:postId').get(catchErrors(analyticsController.getPostAnalytics)); // Get post analytics

router
  .route('/analytics/campaigns/:campaignId')
  .get(catchErrors(analyticsController.getCampaignAnalytics)); // Get campaign analytics

router.route('/analytics/comparison').post(catchErrors(analyticsController.comparePerformance)); // Compare performance

router.route('/analytics/export').post(catchErrors(analyticsController.exportAnalytics)); // Export analytics data

router.route('/analytics/insights').get(catchErrors(analyticsController.getInsights)); // Get AI insights

// Social Listening & Mentions Routes
router
  .route('/mentions')
  .get(catchErrors(mentionController.list)) // Get all mentions
  .post(catchErrors(mentionController.trackKeywords)); // Start tracking keywords

router
  .route('/mentions/:id')
  .get(catchErrors(mentionController.read)) // Get mention details
  .patch(catchErrors(mentionController.update)) // Update mention status
  .delete(catchErrors(mentionController.delete)); // Delete mention

router.route('/mentions/:id/respond').post(catchErrors(mentionController.respond)); // Respond to mention

router.route('/mentions/:id/notes').post(catchErrors(mentionController.addNote)); // Add note to mention

router
  .route('/mentions/keywords')
  .get(catchErrors(mentionController.getTrackedKeywords)) // Get tracked keywords
  .post(catchErrors(mentionController.addKeyword)) // Add keyword to track
  .delete(catchErrors(mentionController.removeKeyword)); // Remove keyword

router.route('/mentions/sentiment').get(catchErrors(mentionController.getSentimentAnalysis)); // Get sentiment analysis

router.route('/mentions/trending').get(catchErrors(mentionController.getTrendingTopics)); // Get trending topics

// Content Generation & AI Routes
router.route('/ai/content-suggestions').post(catchErrors(postController.getContentSuggestions)); // Get AI content suggestions

router.route('/ai/hashtag-suggestions').post(catchErrors(postController.getHashtagSuggestions)); // Get hashtag suggestions

router.route('/ai/optimal-times').get(catchErrors(analyticsController.getOptimalPostingTimes)); // Get optimal posting times

router.route('/ai/competitor-analysis').get(catchErrors(analyticsController.getCompetitorAnalysis)); // Get competitor analysis

// Media & File Upload Routes
router.route('/media/upload').post(catchErrors(postController.uploadMedia)); // Upload media files

router
  .route('/media/:id')
  .get(catchErrors(postController.getMedia)) // Get media details
  .delete(catchErrors(postController.deleteMedia)); // Delete media

router.route('/media/:id/optimize').post(catchErrors(postController.optimizeMedia)); // Optimize media for platforms

// URL Shortening & Tracking Routes
router.route('/urls/shorten').post(catchErrors(postController.shortenUrl)); // Shorten URL for tracking

router.route('/urls/:shortCode').get(catchErrors(postController.getUrlAnalytics)); // Get URL click analytics

router.route('/urls/:shortCode/clicks').get(catchErrors(postController.getUrlClicks)); // Get detailed click data

// Scheduling & Automation Routes
router.route('/scheduler/queue').get(catchErrors(postController.getScheduleQueue)); // Get scheduled post queue

router.route('/scheduler/process').post(catchErrors(postController.processScheduledPosts)); // Process scheduled posts

router
  .route('/automation/rules')
  .get(catchErrors(postController.getAutomationRules)) // Get automation rules
  .post(catchErrors(postController.createAutomationRule)); // Create automation rule

router
  .route('/automation/rules/:id')
  .patch(catchErrors(postController.updateAutomationRule)) // Update automation rule
  .delete(catchErrors(postController.deleteAutomationRule)); // Delete automation rule

// Integration & Webhook Routes
router.route('/webhooks/facebook').post(catchErrors(postController.handleFacebookWebhook)); // Handle Facebook webhooks

router.route('/webhooks/instagram').post(catchErrors(postController.handleInstagramWebhook)); // Handle Instagram webhooks

router.route('/webhooks/twitter').post(catchErrors(postController.handleTwitterWebhook)); // Handle Twitter webhooks

// Platform-specific Routes
router.route('/platforms/facebook/pages').get(catchErrors(accountController.getFacebookPages)); // Get Facebook pages

router
  .route('/platforms/instagram/business-accounts')
  .get(catchErrors(accountController.getInstagramBusinessAccounts)); // Get Instagram business accounts

router.route('/platforms/twitter/profile').get(catchErrors(accountController.getTwitterProfile)); // Get Twitter profile

// Collaboration Routes
router.route('/collaboration/approve/:postId').post(catchErrors(postController.approvePost)); // Approve post

router.route('/collaboration/reject/:postId').post(catchErrors(postController.rejectPost)); // Reject post

router
  .route('/collaboration/assignments')
  .get(catchErrors(postController.getAssignments)) // Get team assignments
  .post(catchErrors(postController.assignPost)); // Assign post to team member

// Reporting Routes
router.route('/reports/performance').get(catchErrors(analyticsController.getPerformanceReport)); // Get performance report

router.route('/reports/engagement').get(catchErrors(analyticsController.getEngagementReport)); // Get engagement report

router.route('/reports/growth').get(catchErrors(analyticsController.getGrowthReport)); // Get growth report

router.route('/reports/roi').get(catchErrors(analyticsController.getROIReport)); // Get ROI report

router.route('/reports/custom').post(catchErrors(analyticsController.generateCustomReport)); // Generate custom report

// Settings & Configuration Routes
router
  .route('/settings')
  .get(catchErrors(accountController.getSettings)) // Get social media settings
  .patch(catchErrors(accountController.updateSettings)); // Update settings

router
  .route('/settings/notifications')
  .get(catchErrors(accountController.getNotificationSettings)) // Get notification settings
  .patch(catchErrors(accountController.updateNotificationSettings)); // Update notification settings

router
  .route('/settings/approval-workflow')
  .get(catchErrors(accountController.getApprovalWorkflow)) // Get approval workflow
  .patch(catchErrors(accountController.updateApprovalWorkflow)); // Update approval workflow

module.exports = router;
