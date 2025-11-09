const SocialAccount = require('@/models/appModels/SocialAccount');
const SocialPost = require('@/models/appModels/SocialPost');
const SocialCampaign = require('@/models/appModels/SocialCampaign');
const SocialAnalytics = require('@/models/appModels/SocialAnalytics');
const SocialMention = require('@/models/appModels/SocialMention');
const Review = require('@/models/appModels/Review');
const ReviewResponse = require('@/models/appModels/ReviewResponse');
const Business = require('@/models/appModels/Business');
const ReviewTemplate = require('@/models/appModels/ReviewTemplate');

const facebookService = require('./facebookService');
const instagramService = require('./instagramService');
const socialAIService = require('./socialAIService');
const urlShortener = require('@/helpers/urlShortener');
const sentimentAnalysisService = require('@/services/sentimentAnalysisService');

class SocialMediaService {
  constructor() {
    this.platforms = {
      facebook: facebookService,
      instagram: instagramService,
    };
  }

  // Get service for specific platform
  getPlatformService(platform) {
    const service = this.platforms[platform.toLowerCase()];
    if (!service) {
      throw new Error(`Unsupported platform: ${platform}`);
    }
    return service;
  }

  // Account Management
  async connectAccount(platform, credentials, ownerId) {
    try {
      const service = this.getPlatformService(platform);
      
      // Validate credentials with platform
      const accountInfo = await service.validateCredentials(credentials);
      
      // Check if account already exists
      const existingAccount = await SocialAccount.findOne({
        platform,
        platformAccountId: accountInfo.id,
        owner: ownerId,
      });

      if (existingAccount) {
        // Update existing account
        existingAccount.credentials = credentials;
        existingAccount.accountInfo = accountInfo;
        existingAccount.isActive = true;
        existingAccount.lastConnected = new Date();
        return await existingAccount.save();
      }

      // Create new account
      const socialAccount = new SocialAccount({
        platform,
        platformAccountId: accountInfo.id,
        accountName: accountInfo.name,
        credentials,
        accountInfo,
        owner: ownerId,
        isActive: true,
        lastConnected: new Date(),
      });

      return await socialAccount.save();
    } catch (error) {
      console.error(`Error connecting ${platform} account:`, error);
      throw error;
    }
  }

  async disconnectAccount(accountId, ownerId) {
    try {
      const account = await SocialAccount.findOne({
        _id: accountId,
        owner: ownerId,
      });

      if (!account) {
        throw new Error('Account not found');
      }

      account.isActive = false;
      account.disconnectedAt = new Date();
      
      return await account.save();
    } catch (error) {
      console.error('Error disconnecting account:', error);
      throw error;
    }
  }

  async getConnectedAccounts(ownerId, platform = null) {
    try {
      const filter = { owner: ownerId, isActive: true };
      if (platform) {
        filter.platform = platform;
      }

      return await SocialAccount.find(filter).sort({ lastConnected: -1 });
    } catch (error) {
      console.error('Error getting connected accounts:', error);
      throw error;
    }
  }

  // Post Management
  async createPost(postData, ownerId) {
    try {
      const { platforms, content, scheduledFor, campaignId, urls } = postData;

      // Shorten URLs if provided
      let shortUrls = [];
      if (urls && urls.length > 0) {
        shortUrls = await Promise.all(
          urls.map(url => urlShortener.shortenUrl(url, ownerId))
        );
      }

      // Create post record
      const socialPost = new SocialPost({
        content,
        platforms,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : new Date(),
        status: scheduledFor ? 'scheduled' : 'draft',
        campaign: campaignId || null,
        urls: shortUrls,
        owner: ownerId,
        createdAt: new Date(),
      });

      const savedPost = await socialPost.save();

      // If immediate posting, publish now
      if (!scheduledFor || new Date(scheduledFor) <= new Date()) {
        await this.publishPost(savedPost._id, ownerId);
      }

      return savedPost;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  async publishPost(postId, ownerId) {
    try {
      const post = await SocialPost.findOne({
        _id: postId,
        owner: ownerId,
      }).populate('campaign');

      if (!post) {
        throw new Error('Post not found');
      }

      if (post.status === 'published') {
        throw new Error('Post already published');
      }

      const results = [];

      // Publish to each platform
      for (const platformId of post.platforms) {
        try {
          const account = await SocialAccount.findOne({
            _id: platformId,
            owner: ownerId,
            isActive: true,
          });

          if (!account) {
            results.push({
              platform: 'unknown',
              success: false,
              error: 'Account not found or inactive',
            });
            continue;
          }

          const service = this.getPlatformService(account.platform);
          const publishResult = await service.publishPost(account, {
            content: post.content,
            urls: post.urls,
            scheduledFor: post.scheduledFor,
          });

          results.push({
            platform: account.platform,
            success: true,
            platformPostId: publishResult.id,
            publishedUrl: publishResult.url,
          });

          // Store platform-specific post ID
          post.platformPosts.push({
            platform: account.platform,
            platformPostId: publishResult.id,
            accountId: account._id,
            publishedUrl: publishResult.url,
            publishedAt: new Date(),
          });

        } catch (platformError) {
          console.error(`Error publishing to platform:`, platformError);
          results.push({
            platform: account?.platform || 'unknown',
            success: false,
            error: platformError.message,
          });
        }
      }

      // Update post status
      post.status = results.some(r => r.success) ? 'published' : 'failed';
      post.publishedAt = new Date();
      post.publishResults = results;

      await post.save();

      return { post, results };
    } catch (error) {
      console.error('Error publishing post:', error);
      throw error;
    }
  }

  async schedulePost(postId, scheduledFor, ownerId) {
    try {
      const post = await SocialPost.findOne({
        _id: postId,
        owner: ownerId,
      });

      if (!post) {
        throw new Error('Post not found');
      }

      post.scheduledFor = new Date(scheduledFor);
      post.status = 'scheduled';

      return await post.save();
    } catch (error) {
      console.error('Error scheduling post:', error);
      throw error;
    }
  }

  // Analytics
  async getPostAnalytics(postId, ownerId) {
    try {
      const post = await SocialPost.findOne({
        _id: postId,
        owner: ownerId,
      });

      if (!post || post.status !== 'published') {
        throw new Error('Post not found or not published');
      }

      const analyticsData = {};

      // Get analytics from each platform
      for (const platformPost of post.platformPosts) {
        try {
          const account = await SocialAccount.findById(platformPost.accountId);
          if (!account) continue;

          const service = this.getPlatformService(account.platform);
          const analytics = await service.getPostAnalytics(
            account,
            platformPost.platformPostId
          );

          analyticsData[account.platform] = analytics;
        } catch (error) {
          console.error(`Error getting analytics for ${platformPost.platform}:`, error);
          analyticsData[platformPost.platform] = { error: error.message };
        }
      }

      // Store analytics
      await this.storeAnalytics(postId, analyticsData, ownerId);

      return analyticsData;
    } catch (error) {
      console.error('Error getting post analytics:', error);
      throw error;
    }
  }

  async storeAnalytics(postId, analyticsData, ownerId) {
    try {
      const analytics = new SocialAnalytics({
        post: postId,
        platformData: analyticsData,
        recordedAt: new Date(),
        owner: ownerId,
      });

      return await analytics.save();
    } catch (error) {
      console.error('Error storing analytics:', error);
      throw error;
    }
  }

  // Content Suggestions
  async generateContentSuggestions(prompt, platform, ownerId) {
    try {
      return await socialAIService.generateContent(prompt, platform, ownerId);
    } catch (error) {
      console.error('Error generating content suggestions:', error);
      throw error;
    }
  }

  // Campaign Management
  async createCampaign(campaignData, ownerId) {
    try {
      const campaign = new SocialCampaign({
        ...campaignData,
        owner: ownerId,
        createdAt: new Date(),
      });

      return await campaign.save();
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  async getCampaignAnalytics(campaignId, ownerId) {
    try {
      const campaign = await SocialCampaign.findOne({
        _id: campaignId,
        owner: ownerId,
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Get all posts in campaign
      const posts = await SocialPost.find({
        campaign: campaignId,
        owner: ownerId,
        status: 'published',
      });

      const campaignAnalytics = {
        totalPosts: posts.length,
        platforms: {},
        totalEngagement: 0,
        totalReach: 0,
        totalImpressions: 0,
      };

      // Aggregate analytics for all posts
      for (const post of posts) {
        const postAnalytics = await SocialAnalytics.find({
          post: post._id,
          owner: ownerId,
        }).sort({ recordedAt: -1 }).limit(1);

        if (postAnalytics.length > 0) {
          const analytics = postAnalytics[0].platformData;
          
          for (const [platform, data] of Object.entries(analytics)) {
            if (!campaignAnalytics.platforms[platform]) {
              campaignAnalytics.platforms[platform] = {
                posts: 0,
                engagement: 0,
                reach: 0,
                impressions: 0,
              };
            }

            campaignAnalytics.platforms[platform].posts += 1;
            campaignAnalytics.platforms[platform].engagement += data.engagement || 0;
            campaignAnalytics.platforms[platform].reach += data.reach || 0;
            campaignAnalytics.platforms[platform].impressions += data.impressions || 0;

            campaignAnalytics.totalEngagement += data.engagement || 0;
            campaignAnalytics.totalReach += data.reach || 0;
            campaignAnalytics.totalImpressions += data.impressions || 0;
          }
        }
      }

      return campaignAnalytics;
    } catch (error) {
      console.error('Error getting campaign analytics:', error);
      throw error;
    }
  }

  // Social Listening
  async trackMentions(keywords, ownerId) {
    try {
      const accounts = await this.getConnectedAccounts(ownerId);
      const mentions = [];

      for (const account of accounts) {
        try {
          const service = this.getPlatformService(account.platform);
          const platformMentions = await service.searchMentions(account, keywords);
          
          for (const mention of platformMentions) {
            const socialMention = new SocialMention({
              platform: account.platform,
              content: mention.content,
              author: mention.author,
              url: mention.url,
              publishedAt: mention.publishedAt,
              sentiment: mention.sentiment || 'neutral',
              keywords: keywords,
              owner: ownerId,
              detectedAt: new Date(),
            });

            mentions.push(await socialMention.save());
          }
        } catch (error) {
          console.error(`Error tracking mentions on ${account.platform}:`, error);
        }
      }

      return mentions;
    } catch (error) {
      console.error('Error tracking mentions:', error);
      throw error;
    }
  }

  // Review Management
  async fetchPlatformReviews(platform, accountId, ownerId) {
    try {
      const service = this.getPlatformService(platform);
      const account = await SocialAccount.findOne({
        _id: accountId,
        owner: ownerId,
        isActive: true,
      });

      if (!account) {
        throw new Error('Account not found or inactive');
      }

      const reviews = await service.fetchReviews(account);
      
      // Process and store reviews
      const savedReviews = [];
      for (const review of reviews) {
        // Check if review already exists
        const existingReview = await Review.findOne({
          platform: platform,
          platformReviewId: review.id,
          business: account.business,
        });

        if (!existingReview) {
          // Create new review
          const newReview = new Review({
            business: account.business,
            platform: platform,
            platformReviewId: review.id,
            rating: review.rating,
            title: review.title || '',
            comment: review.comment || '',
            client: {
              name: review.authorName,
              avatarUrl: review.authorAvatar || '',
            },
            publishedAt: review.publishedAt,
            owner: ownerId,
          });

          // Analyze sentiment if comment exists
          if (review.comment) {
            const sentiment = await sentimentAnalysisService.analyzeSentiment(review.comment);
            newReview.sentiment = {
              score: sentiment.score,
              category: sentiment.category,
              keywords: sentiment.keywords || [],
            };
          }

          const savedReview = await newReview.save();
          savedReviews.push(savedReview);
        }
      }

      return savedReviews;
    } catch (error) {
      console.error(`Error fetching ${platform} reviews:`, error);
      throw error;
    }
  }

  async respondToReview(reviewId, responseText, ownerId) {
    try {
      // Find the review
      const review = await Review.findOne({
        _id: reviewId,
        owner: ownerId,
      });

      if (!review) {
        throw new Error('Review not found');
      }

      // Find the account associated with this platform
      const account = await SocialAccount.findOne({
        platform: review.platform,
        owner: ownerId,
        isActive: true,
      });

      if (!account) {
        throw new Error(`No connected ${review.platform} account found`);
      }

      // Get the appropriate service
      const service = this.getPlatformService(review.platform);
      
      // Send response through the platform
      const responseResult = await service.respondToReview(
        account,
        review.platformReviewId,
        responseText
      );

      // Create response record
      const response = new ReviewResponse({
        review: reviewId,
        business: review.business,
        responseText: responseText,
        status: 'sent',
        sentAt: new Date(),
        platformConfirmation: {
          confirmationId: responseResult.id,
          success: true,
          responseUrl: responseResult.responseUrl || '',
        },
        respondent: ownerId,
        respondentModel: 'CompanyOwner',
        owner: ownerId,
      });

      await response.save();
      
      // Update review status
      review.status = 'responded';
      review.hasResponse = true;
      await review.save();

      return {
        review,
        response,
        platformConfirmation: responseResult
      };
    } catch (error) {
      console.error('Error responding to review:', error);
      throw error;
    }
  }

  async generateReviewResponse(reviewId, templateId, ownerId) {
    try {
      // Find the review
      const review = await Review.findOne({
        _id: reviewId,
        owner: ownerId,
      });

      if (!review) {
        throw new Error('Review not found');
      }

      // Find the business
      const business = await Business.findOne({
        _id: review.business,
        owner: ownerId,
      });

      if (!business) {
        throw new Error('Business not found');
      }

      // Find the template or use default based on sentiment
      let template;
      if (templateId) {
        template = await ReviewTemplate.findOne({
          _id: templateId,
          business: business._id,
          owner: ownerId,
        });
      } else {
        // Find appropriate template based on sentiment
        template = await ReviewTemplate.findDefaultTemplate(
          business._id,
          review.sentiment.category,
          review.platform
        );
      }

      if (!template) {
        throw new Error('Response template not found');
      }

      // Generate response using template
      const responseData = {
        businessName: business.name,
        customerName: review.client.name,
        reviewRating: review.rating,
        responseDate: new Date().toLocaleDateString(),
        respondentName: business.contact?.name || '',
        respondentTitle: business.contact?.title || 'Manager',
      };

      const responseText = template.fillTemplate(responseData);

      return {
        responseText,
        templateId: template._id,
        review,
        business
      };
    } catch (error) {
      console.error('Error generating review response:', error);
      throw error;
    }
  }

  // Utility methods
  async getScheduledPosts(ownerId) {
    try {
      return await SocialPost.find({
        owner: ownerId,
        status: 'scheduled',
        scheduledFor: { $lte: new Date() },
      }).sort({ scheduledFor: 1 });
    } catch (error) {
      console.error('Error getting scheduled posts:', error);
      throw error;
    }
  }

  async processScheduledPosts() {
    try {
      const scheduledPosts = await SocialPost.find({
        status: 'scheduled',
        scheduledFor: { $lte: new Date() },
      });

      console.log(`Processing ${scheduledPosts.length} scheduled posts`);

      for (const post of scheduledPosts) {
        try {
          await this.publishPost(post._id, post.owner);
          console.log(`Published post: ${post._id}`);
        } catch (error) {
          console.error(`Error publishing scheduled post ${post._id}:`, error);
          
          // Mark as failed
          post.status = 'failed';
          post.publishResults = [{ error: error.message }];
          await post.save();
        }
      }
    } catch (error) {
      console.error('Error processing scheduled posts:', error);
      throw error;
    }
  }
}

module.exports = new SocialMediaService();