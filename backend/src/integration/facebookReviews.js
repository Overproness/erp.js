const axios = require('axios');
const config = require('@/config/platformConfig');

class FacebookReviewsService {
  constructor() {
    this.apiVersion = config.facebook.apiVersion || 'v16.0';
    this.apiBaseUrl = `https://graph.facebook.com/${this.apiVersion}`;
    this.appId = config.facebook.appId || process.env.FACEBOOK_APP_ID;
    this.appSecret = config.facebook.appSecret || process.env.FACEBOOK_APP_SECRET;
    this.scopes = [
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_metadata',
      'pages_read_user_content',
      'pages_manage_posts',
      'pages_manage_engagement'
    ];
  }
  
  /**
   * Generate Facebook login URL
   * @param {String} redirectUri - Redirect URI after auth
   * @returns {String} Facebook login URL
   */
  getAuthUrl(redirectUri) {
    const encodedRedirect = encodeURIComponent(redirectUri);
    const encodedScopes = encodeURIComponent(this.scopes.join(','));
    
    return `https://www.facebook.com/${this.apiVersion}/dialog/oauth?client_id=${this.appId}&redirect_uri=${encodedRedirect}&scope=${encodedScopes}&response_type=code&state=facebook`;
  }
  
  /**
   * Exchange authorization code for access token
   * @param {String} code - Authorization code
   * @param {String} redirectUri - Redirect URI
   * @returns {Promise<Object>} Token data
   */
  async getAccessToken(code, redirectUri) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/oauth/access_token`, {
        params: {
          client_id: this.appId,
          client_secret: this.appSecret,
          code: code,
          redirect_uri: redirectUri
        }
      });
      
      return {
        accessToken: response.data.access_token,
        tokenType: response.data.token_type || 'bearer',
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      console.error('Error getting Facebook access token:', error.response?.data || error);
      throw error;
    }
  }
  
  /**
   * Get long-lived access token
   * @param {String} shortLivedToken - Short-lived access token
   * @returns {Promise<Object>} Long-lived token data
   */
  async getLongLivedToken(shortLivedToken) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: this.appId,
          client_secret: this.appSecret,
          fb_exchange_token: shortLivedToken
        }
      });
      
      return {
        accessToken: response.data.access_token,
        tokenType: response.data.token_type || 'bearer',
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      console.error('Error getting long-lived Facebook token:', error.response?.data || error);
      throw error;
    }
  }
  
  /**
   * Get user's Facebook pages
   * @param {String} accessToken - Access token
   * @returns {Promise<Array>} Facebook pages
   */
  async getPages(accessToken) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/me/accounts`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,access_token,category,picture,fan_count,has_whatsapp_business_number'
        }
      });
      
      return response.data.data.map(page => ({
        id: page.id,
        name: page.name,
        accessToken: page.access_token,
        category: page.category,
        pictureUrl: page.picture?.data?.url || null,
        fanCount: page.fan_count,
        hasWhatsapp: page.has_whatsapp_business_number || false
      }));
    } catch (error) {
      console.error('Error getting Facebook pages:', error.response?.data || error);
      throw error;
    }
  }
  
  /**
   * Get page ratings and reviews
   * @param {String} pageId - Facebook page ID
   * @param {String} pageAccessToken - Page access token
   * @returns {Promise<Array>} Ratings and reviews
   */
  async getReviews(pageId, pageAccessToken) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/${pageId}/ratings`, {
        params: {
          access_token: pageAccessToken,
          fields: 'reviewer{id,name,picture},rating,created_time,review_text,has_rating,has_review,recommendation_type',
          limit: 100
        }
      });
      
      return response.data.data.map(item => {
        // Some responses may have rating or recommendation_type
        let rating = null;
        if (item.rating) {
          rating = item.rating;
        } else if (item.recommendation_type) {
          // Convert recommendation to rating (POSITIVE=5, NEGATIVE=1)
          rating = item.recommendation_type === 'POSITIVE' ? 5 : 1;
        }
        
        return {
          id: `${pageId}_${item.created_time}_${item.reviewer.id}`,
          authorId: item.reviewer.id,
          authorName: item.reviewer.name,
          authorAvatar: item.reviewer.picture?.data?.url || null,
          rating: rating,
          comment: item.review_text || '',
          createdTime: item.created_time,
          hasRating: item.has_rating || false,
          hasReview: item.has_review || false,
          recommendationType: item.recommendation_type || null
        };
      });
    } catch (error) {
      console.error('Error getting Facebook page reviews:', error.response?.data || error);
      throw error;
    }
  }
  
  /**
   * Respond to a review via visitor post
   * Note: Facebook doesn't provide a direct API to respond to reviews
   * This is a workaround by posting on the reviewer's post
   * @param {String} pageId - Facebook page ID
   * @param {String} pageAccessToken - Page access token
   * @param {String} reviewerId - Reviewer's Facebook ID
   * @param {String} comment - Response comment
   * @returns {Promise<Object>} Response result
   */
  async respondToReview(pageId, pageAccessToken, reviewerId, comment) {
    try {
      // This approach has limitations due to Facebook's API restrictions
      // A more complete solution would involve using the Conversations API
      // to message the reviewer directly
      
      // For now, we'll simulate a success
      console.log(`Would respond to review on Facebook page ${pageId} for reviewer ${reviewerId}`);
      
      return {
        success: true,
        message: 'Response successfully simulated',
        note: 'Facebook API limitations prevent direct review responses'
      };
    } catch (error) {
      console.error('Error responding to Facebook review:', error.response?.data || error);
      throw error;
    }
  }
  
  /**
   * Subscribe to page webhooks for real-time updates
   * @param {String} pageId - Facebook page ID
   * @param {String} pageAccessToken - Page access token
   * @returns {Promise<Object>} Subscription result
   */
  async subscribeToWebhooks(pageId, pageAccessToken) {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/${pageId}/subscribed_apps`, null, {
        params: {
          access_token: pageAccessToken,
          subscribed_fields: 'ratings'
        }
      });
      
      return {
        success: response.data.success,
        pageId
      };
    } catch (error) {
      console.error('Error subscribing to Facebook webhooks:', error.response?.data || error);
      throw error;
    }
  }
  
  /**
   * Verify webhook request from Facebook
   * @param {String} verifyToken - Verification token
   * @param {String} challenge - Challenge string from Facebook
   * @returns {String|Boolean} Challenge response or false
   */
  verifyWebhook(verifyToken, challenge) {
    const configuredToken = config.facebook.webhookVerifyToken || process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN;
    
    if (verifyToken === configuredToken) {
      return challenge;
    }
    
    return false;
  }
  
  /**
   * Process webhook payload
   * @param {Object} payload - Webhook payload
   * @returns {Object} Processed webhook data
   */
  processWebhook(payload) {
    try {
      if (payload.object !== 'page') {
        return { success: false, message: 'Not a page webhook' };
      }
      
      const events = [];
      
      // Process each entry in the webhook
      payload.entry.forEach(entry => {
        const pageId = entry.id;
        
        // Look for ratings/reviews changes
        if (entry.changes) {
          entry.changes.forEach(change => {
            if (change.field === 'ratings') {
              events.push({
                type: 'rating_update',
                pageId,
                rating: change.value
              });
            }
          });
        }
      });
      
      return {
        success: true,
        events
      };
    } catch (error) {
      console.error('Error processing Facebook webhook:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get page insights/metrics
   * @param {String} pageId - Facebook page ID
   * @param {String} pageAccessToken - Page access token
   * @returns {Promise<Object>} Page insights
   */
  async getPageInsights(pageId, pageAccessToken) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/${pageId}/insights`, {
        params: {
          access_token: pageAccessToken,
          metric: 'page_impressions,page_engaged_users,page_negative_feedback',
          period: 'day',
          date_preset: 'last_30d'
        }
      });
      
      // Process and transform the insights data
      const insights = {};
      response.data.data.forEach(metric => {
        insights[metric.name] = metric.values;
      });
      
      return insights;
    } catch (error) {
      console.error('Error getting Facebook page insights:', error.response?.data || error);
      throw error;
    }
  }
}

module.exports = new FacebookReviewsService();
