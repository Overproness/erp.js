/**
 * Platform utility functions
 * Handles platform-specific formatting and API interactions
 */

// Supported review platforms
const PLATFORMS = {
  GOOGLE: 'google',
  FACEBOOK: 'facebook',
  YELP: 'yelp',
  TRIPADVISOR: 'tripadvisor',
  CUSTOM: 'custom',
};

/**
 * Normalize review data from different platforms to a standard format
 * @param {Object} review - Platform-specific review object
 * @param {String} platform - Platform identifier
 * @returns {Object} Normalized review object
 */
const normalizeReviewData = (review, platform) => {
  let normalizedReview = {
    platform,
    platformReviewId: '',
    rating: 0,
    comment: '',
    title: '',
    publishedAt: new Date(),
    client: {
      name: '',
      avatarUrl: '',
    },
  };

  switch (platform.toLowerCase()) {
    case PLATFORMS.GOOGLE:
      normalizedReview = {
        ...normalizedReview,
        platformReviewId: review.reviewId,
        rating: review.starRating || 0,
        comment: review.comment || '',
        publishedAt: new Date(review.createTime || Date.now()),
        client: {
          name: review.reviewer?.displayName || 'Anonymous',
          avatarUrl: review.reviewer?.profilePhotoUrl || '',
        },
      };
      break;

    case PLATFORMS.FACEBOOK:
      normalizedReview = {
        ...normalizedReview,
        platformReviewId: review.id,
        rating: review.rating || (review.recommendation_type === 'POSITIVE' ? 5 : 1),
        comment: review.review_text || '',
        publishedAt: new Date(review.created_time || Date.now()),
        client: {
          name: review.reviewer?.name || 'Anonymous',
          avatarUrl: review.reviewer?.picture?.data?.url || '',
        },
      };
      break;

    case PLATFORMS.YELP:
      normalizedReview = {
        ...normalizedReview,
        platformReviewId: review.id,
        rating: review.rating || 0,
        comment: review.text || '',
        publishedAt: new Date(review.time_created || Date.now()),
        client: {
          name: review.user?.name || 'Anonymous',
          avatarUrl: review.user?.image_url || '',
        },
      };
      break;

    case PLATFORMS.TRIPADVISOR:
      normalizedReview = {
        ...normalizedReview,
        platformReviewId: review.review_id || review.id,
        rating: review.rating || 0,
        comment: review.text || review.review_text || '',
        title: review.title || '',
        publishedAt: new Date(review.published_date || Date.now()),
        client: {
          name: review.user?.username || review.user_name || 'Anonymous',
          avatarUrl: review.user?.avatar || '',
        },
      };
      break;

    case PLATFORMS.CUSTOM:
      // For reviews submitted directly through our system
      normalizedReview = {
        ...normalizedReview,
        platformReviewId: review.id || '',
        rating: review.rating || 0,
        comment: review.comment || '',
        title: review.title || '',
        publishedAt: new Date(review.createdAt || Date.now()),
        client: {
          name: review.client?.name || 'Anonymous',
          avatarUrl: review.client?.avatarUrl || '',
        },
      };
      break;

    default:
      console.warn(`Unsupported platform: ${platform}`);
  }

  return normalizedReview;
};

/**
 * Get platform-specific review URL
 * @param {String} platform - Platform identifier
 * @param {String} businessId - Platform-specific business ID
 * @param {String} reviewId - Platform-specific review ID
 * @returns {String} URL to review on platform
 */
const getPlatformReviewUrl = (platform, businessId, reviewId) => {
  switch (platform.toLowerCase()) {
    case PLATFORMS.GOOGLE:
      return `https://search.google.com/local/reviews?placeid=${businessId}&q=${businessId}&review=${reviewId}`;

    case PLATFORMS.FACEBOOK:
      return `https://www.facebook.com/${businessId}/reviews/${reviewId}`;

    case PLATFORMS.YELP:
      return `https://www.yelp.com/biz/${businessId}?hrid=${reviewId}`;

    case PLATFORMS.TRIPADVISOR:
      return `https://www.tripadvisor.com/ShowUserReviews-g${businessId}-d${reviewId}`;

    default:
      return '';
  }
};

/**
 * Get display name for platform
 * @param {String} platform - Platform identifier
 * @returns {String} Human-readable platform name
 */
const getPlatformDisplayName = (platform) => {
  switch (platform.toLowerCase()) {
    case PLATFORMS.GOOGLE:
      return 'Google';
    case PLATFORMS.FACEBOOK:
      return 'Facebook';
    case PLATFORMS.YELP:
      return 'Yelp';
    case PLATFORMS.TRIPADVISOR:
      return 'TripAdvisor';
    case PLATFORMS.CUSTOM:
      return 'Direct Review';
    default:
      return platform || 'Unknown';
  }
};

/**
 * Get platform logo URL
 * @param {String} platform - Platform identifier
 * @returns {String} URL to platform logo
 */
const getPlatformLogoUrl = (platform) => {
  switch (platform.toLowerCase()) {
    case PLATFORMS.GOOGLE:
      return '/images/platforms/google.png';
    case PLATFORMS.FACEBOOK:
      return '/images/platforms/facebook.png';
    case PLATFORMS.YELP:
      return '/images/platforms/yelp.png';
    case PLATFORMS.TRIPADVISOR:
      return '/images/platforms/tripadvisor.png';
    case PLATFORMS.CUSTOM:
      return '/images/platforms/custom.png';
    default:
      return '/images/platforms/default.png';
  }
};

/**
 * Check if a platform supports response posting
 * @param {String} platform - Platform identifier
 * @returns {Boolean} True if platform supports responses
 */
const platformSupportsResponses = (platform) => {
  switch (platform.toLowerCase()) {
    case PLATFORMS.GOOGLE:
    case PLATFORMS.FACEBOOK:
    case PLATFORMS.YELP:
      return true;
    case PLATFORMS.TRIPADVISOR:
    case PLATFORMS.CUSTOM:
    default:
      return false;
  }
};

/**
 * Get platform rating scale (minimum and maximum values)
 * @param {String} platformId - Platform identifier
 * @returns {Object} Rating scale min and max
 */
const getPlatformRatingScale = (platformId) => {
  switch (platformId.toLowerCase()) {
    case PLATFORMS.FACEBOOK:
      return { min: 1, max: 5 };
    case PLATFORMS.GOOGLE:
      return { min: 1, max: 5 };
    case PLATFORMS.YELP:
      return { min: 1, max: 5 };
    case PLATFORMS.TRIPADVISOR:
      return { min: 1, max: 5 };
    default:
      return { min: 1, max: 5 };
  }
};

module.exports = {
  PLATFORMS,
  normalizeReviewData,
  getPlatformReviewUrl,
  getPlatformDisplayName,
  getPlatformIcon,
  formatResponseForPlatform,
  platformSupportsResponses,
  getPlatformRatingScale,
};
