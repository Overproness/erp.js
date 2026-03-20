// @ts-nocheck
const crypto = require('crypto');

class SocialMediaHelper {
  constructor() {
    this.supportedPlatforms = ['facebook', 'instagram', 'twitter'];
    this.contentLimits = {
      facebook: { text: 63206, images: 10, videos: 1 },
      instagram: { text: 2200, images: 10, videos: 1 },
      twitter: { text: 280, images: 4, videos: 1 },
    };
  }

  /**
   * Validate post content for specific platform
   * @param {string} platform - Social media platform
   * @param {Object} content - Post content object
   * @returns {Object} Validation result
   */
  validatePostContent(platform, content) {
    const errors = [];
    const warnings = [];

    if (!this.supportedPlatforms.includes(platform.toLowerCase())) {
      errors.push(`Unsupported platform: ${platform}`);
      return { isValid: false, errors, warnings };
    }

    const limits = this.contentLimits[platform.toLowerCase()];
    
    // Validate text content
    if (content.text && content.text.length > limits.text) {
      errors.push(`Text exceeds ${limits.text} character limit for ${platform}`);
    }

    // Validate images
    if (content.images && content.images.length > limits.images) {
      errors.push(`Too many images. ${platform} allows maximum ${limits.images} images`);
    }

    // Validate videos
    if (content.videos && content.videos.length > limits.videos) {
      errors.push(`Too many videos. ${platform} allows maximum ${limits.videos} videos`);
    }

    // Platform-specific validations
    if (platform.toLowerCase() === 'twitter') {
      // Twitter-specific validations
      if (content.text && content.images?.length > 0 && content.text.length > 259) {
        warnings.push('Text length should be shorter when including images on Twitter');
      }
    }

    if (platform.toLowerCase() === 'instagram') {
      // Instagram-specific validations
      if (!content.images && !content.videos) {
        errors.push('Instagram posts require at least one image or video');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Optimize content for specific platform
   * @param {string} platform - Social media platform
   * @param {Object} content - Original content
   * @returns {Object} Optimized content
   */
  optimizeContentForPlatform(platform, content) {
    const optimized = { ...content };
    const limits = this.contentLimits[platform.toLowerCase()];

    // Truncate text if necessary
    if (optimized.text && optimized.text.length > limits.text) {
      optimized.text = optimized.text.substring(0, limits.text - 3) + '...';
      optimized.truncated = true;
    }

    // Limit media files
    if (optimized.images && optimized.images.length > limits.images) {
      optimized.images = optimized.images.slice(0, limits.images);
      optimized.mediaLimited = true;
    }

    if (optimized.videos && optimized.videos.length > limits.videos) {
      optimized.videos = optimized.videos.slice(0, limits.videos);
      optimized.mediaLimited = true;
    }

    // Platform-specific optimizations
    switch (platform.toLowerCase()) {
      case 'twitter':
        optimized.hashtags = this.optimizeHashtags(optimized.hashtags || [], 2);
        break;
      case 'instagram':
        optimized.hashtags = this.optimizeHashtags(optimized.hashtags || [], 30);
        break;
      case 'facebook':
        optimized.hashtags = this.optimizeHashtags(optimized.hashtags || [], 5);
        break;
    }

    return optimized;
  }

  /**
   * Optimize hashtags for character limits
   * @param {Array} hashtags - Array of hashtags
   * @param {number} maxCount - Maximum number of hashtags
   * @returns {Array} Optimized hashtags
   */
  optimizeHashtags(hashtags, maxCount) {
    return hashtags.slice(0, maxCount).map(tag => {
      // Ensure hashtag format
      if (!tag.startsWith('#')) {
        return `#${tag}`;
      }
      return tag;
    });
  }

  /**
   * Calculate best posting times based on platform and audience
   * @param {string} platform - Social media platform
   * @param {string} timezone - Audience timezone
   * @returns {Array} Suggested posting times
   */
  getBestPostingTimes(platform, timezone = 'UTC') {
    const bestTimes = {
      facebook: [
        { day: 'tuesday', hour: 9 },
        { day: 'wednesday', hour: 13 },
        { day: 'friday', hour: 15 },
      ],
      instagram: [
        { day: 'monday', hour: 11 },
        { day: 'tuesday', hour: 14 },
        { day: 'friday', hour: 10 },
      ],
      twitter: [
        { day: 'tuesday', hour: 9 },
        { day: 'wednesday', hour: 12 },
        { day: 'thursday', hour: 14 },
      ],
    };

    return bestTimes[platform.toLowerCase()] || [];
  }

  /**
   * Generate engaging content suggestions
   * @param {string} industry - Business industry
   * @param {string} platform - Social media platform
   * @returns {Array} Content suggestions
   */
  generateContentSuggestions(industry, platform) {
    const suggestions = {
      general: [
        'Share behind-the-scenes content',
        'Post customer testimonials',
        'Create educational content',
        'Share industry news and insights',
        'Post user-generated content',
      ],
      technology: [
        'Share tech tips and tutorials',
        'Announce product updates',
        'Post about industry trends',
        'Share development insights',
      ],
      retail: [
        'Showcase new products',
        'Share styling tips',
        'Post customer photos',
        'Announce sales and promotions',
      ],
      food: [
        'Share recipe content',
        'Post food photography',
        'Share cooking tips',
        'Feature customer reviews',
      ],
    };

    const industrySuggestions = suggestions[industry.toLowerCase()] || suggestions.general;
    
    // Platform-specific adjustments
    if (platform.toLowerCase() === 'instagram') {
      return industrySuggestions.map(suggestion => 
        suggestion + ' with high-quality visuals'
      );
    }

    return industrySuggestions;
  }

  /**
   * Extract mentions and hashtags from text
   * @param {string} text - Post text content
   * @returns {Object} Extracted mentions and hashtags
   */
  extractSocialElements(text) {
    const hashtags = text.match(/#[\w]+/g) || [];
    const mentions = text.match(/@[\w]+/g) || [];
    const urls = text.match(/https?:\/\/[^\s]+/g) || [];

    return {
      hashtags: hashtags.map(tag => tag.toLowerCase()),
      mentions: mentions.map(mention => mention.toLowerCase()),
      urls,
    };
  }

  /**
   * Generate post analytics summary
   * @param {Object} metrics - Raw analytics data
   * @param {string} platform - Social media platform
   * @returns {Object} Analytics summary
   */
  generateAnalyticsSummary(metrics, platform) {
    const summary = {
      engagement: {
        total: 0,
        rate: 0,
        likes: metrics.likes || 0,
        comments: metrics.comments || 0,
        shares: metrics.shares || 0,
      },
      reach: {
        total: metrics.reach || 0,
        impressions: metrics.impressions || 0,
      },
      performance: 'low', // low, medium, high
    };

    // Calculate total engagement
    summary.engagement.total = summary.engagement.likes + 
                               summary.engagement.comments + 
                               summary.engagement.shares;

    // Calculate engagement rate
    if (summary.reach.impressions > 0) {
      summary.engagement.rate = (summary.engagement.total / summary.reach.impressions) * 100;
    }

    // Determine performance level
    if (summary.engagement.rate > 5) {
      summary.performance = 'high';
    } else if (summary.engagement.rate > 2) {
      summary.performance = 'medium';
    }

    return summary;
  }

  /**
   * Schedule optimization based on timezone and platform
   * @param {Date} scheduledTime - Intended schedule time
   * @param {string} platform - Social media platform
   * @param {string} timezone - Target timezone
   * @returns {Date} Optimized schedule time
   */
  optimizeScheduleTime(scheduledTime, platform, timezone) {
    // This is a simplified version - in production, you'd want more sophisticated logic
    const date = new Date(scheduledTime);
    const hour = date.getHours();

    // Avoid posting during low-engagement hours (1-6 AM)
    if (hour >= 1 && hour <= 6) {
      date.setHours(9); // Set to 9 AM instead
    }

    return date;
  }

  /**
   * Generate unique post ID
   * @returns {string} Unique post identifier
   */
  generatePostId() {
    return `post_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Calculate estimated reach based on follower count and engagement
   * @param {number} followerCount - Number of followers
   * @param {number} avgEngagementRate - Average engagement rate (percentage)
   * @returns {Object} Reach estimation
   */
  estimateReach(followerCount, avgEngagementRate) {
    // Typical organic reach is 2-10% of followers
    const organicReachRate = Math.min(10, Math.max(2, avgEngagementRate * 2));
    const estimatedReach = Math.floor(followerCount * (organicReachRate / 100));

    return {
      estimated: estimatedReach,
      range: {
        min: Math.floor(estimatedReach * 0.7),
        max: Math.floor(estimatedReach * 1.3),
      },
      organicReachRate,
    };
  }

  /**
   * Validate social media account credentials
   * @param {string} platform - Social media platform
   * @param {Object} credentials - Account credentials
   * @returns {Object} Validation result
   */
  validateCredentials(platform, credentials) {
    const errors = [];

    switch (platform.toLowerCase()) {
      case 'facebook':
        if (!credentials.accessToken) {
          errors.push('Facebook access token is required');
        }
        if (!credentials.pageId) {
          errors.push('Facebook page ID is required');
        }
        break;

      case 'instagram':
        if (!credentials.accessToken) {
          errors.push('Instagram access token is required');
        }
        if (!credentials.accountId) {
          errors.push('Instagram business account ID is required');
        }
        break;

      case 'twitter':
        if (!credentials.accessToken) {
          errors.push('Twitter access token is required');
        }
        if (!credentials.refreshToken) {
          errors.push('Twitter refresh token is required');
        }
        break;

      default:
        errors.push(`Unsupported platform: ${platform}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format error messages for user display
   * @param {Error} error - Error object
   * @param {string} platform - Social media platform
   * @returns {string} User-friendly error message
   */
  formatErrorMessage(error, platform) {
    const message = error.message || 'Unknown error occurred';
    
    // Common error patterns and user-friendly messages
    const errorPatterns = {
      'unauthorized': `Please reconnect your ${platform} account - your authentication has expired`,
      'rate limit': `${platform} rate limit exceeded. Please try again later`,
      'token': `Please reconnect your ${platform} account - your token is invalid`,
      'permissions': `Insufficient permissions for ${platform}. Please check your account settings`,
      'not found': `${platform} account or content not found`,
    };

    for (const [pattern, friendlyMessage] of Object.entries(errorPatterns)) {
      if (message.toLowerCase().includes(pattern)) {
        return friendlyMessage;
      }
    }

    return `${platform} error: ${message}`;
  }
}

module.exports = new SocialMediaHelper();
