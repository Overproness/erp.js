// @ts-nocheck
const { google } = require('googleapis');
const config = require('@/config/platformConfig');

class GoogleReviewsService {
  constructor() {
    this.apiKey = config.google.apiKey || process.env.GOOGLE_API_KEY;
    this.clientId = config.google.clientId || process.env.GOOGLE_CLIENT_ID;
    this.clientSecret = config.google.clientSecret || process.env.GOOGLE_CLIENT_SECRET;
    this.mybusinessApi = google.mybusiness;
    this.scopes = [
      'https://www.googleapis.com/auth/business.manage',
      'https://www.googleapis.com/auth/userinfo.email'
    ];
  }
  
  /**
   * Create OAuth2 client
   * @param {Object} credentials - User credentials
   * @returns {Object} OAuth2 client
   */
  createOAuth2Client(credentials = {}) {
    const oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      config.google.redirectUri || process.env.GOOGLE_REDIRECT_URI
    );
    
    if (credentials.accessToken) {
      oauth2Client.setCredentials({
        access_token: credentials.accessToken,
        refresh_token: credentials.refreshToken,
        expiry_date: credentials.expiryDate
      });
    }
    
    return oauth2Client;
  }
  
  /**
   * Generate authentication URL
   * @returns {String} Auth URL
   */
  getAuthUrl() {
    const oauth2Client = this.createOAuth2Client();
    
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.scopes,
      prompt: 'consent'
    });
  }
  
  /**
   * Exchange auth code for tokens
   * @param {String} code - Authorization code
   * @returns {Promise<Object>} Tokens
   */
  async getTokensFromCode(code) {
    const oauth2Client = this.createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date
    };
  }
  
  /**
   * Refresh access token
   * @param {Object} credentials - User credentials
   * @returns {Promise<Object>} Updated credentials
   */
  async refreshAccessToken(credentials) {
    const oauth2Client = this.createOAuth2Client(credentials);
    
    try {
      const { credentials: newCredentials } = await oauth2Client.refreshAccessToken();
      
      return {
        accessToken: newCredentials.access_token,
        refreshToken: credentials.refreshToken || newCredentials.refresh_token,
        expiryDate: newCredentials.expiry_date
      };
    } catch (error) {
      console.error('Error refreshing Google access token:', error);
      throw error;
    }
  }
  
  /**
   * Get user's Google My Business accounts
   * @param {Object} credentials - User credentials
   * @returns {Promise<Array>} Business accounts
   */
  async getBusinessAccounts(credentials) {
    const oauth2Client = this.createOAuth2Client(credentials);
    google.options({ auth: oauth2Client });
    
    try {
      // First get user info to get account name
      const oauth2 = google.oauth2({ version: 'v2' });
      const userInfo = await oauth2.userinfo.get();
      
      // Then get business accounts
      const mybusiness = google.mybusinessaccountmanagement({ version: 'v1' });
      const response = await mybusiness.accounts.list();
      
      return response.data.accounts.map(account => ({
        id: account.name,
        displayName: account.accountName || userInfo.data.email,
        type: 'location_group',
        email: userInfo.data.email
      }));
    } catch (error) {
      console.error('Error getting Google My Business accounts:', error);
      throw error;
    }
  }
  
  /**
   * Get locations for a business account
   * @param {Object} credentials - User credentials
   * @param {String} accountId - Account ID
   * @returns {Promise<Array>} Business locations
   */
  async getLocations(credentials, accountId) {
    const oauth2Client = this.createOAuth2Client(credentials);
    google.options({ auth: oauth2Client });
    
    try {
      const mybusiness = google.mybusinessbusinessinformation({ version: 'v1' });
      const response = await mybusiness.accounts.locations.list({
        parent: accountId,
        readMask: 'name,title,storeCode,phoneNumbers,categories,storefrontAddress,websiteUri,regularHours,specialHours'
      });
      
      return (response.data.locations || []).map(location => ({
        id: location.name,
        name: location.title || 'Unnamed Location',
        address: this.formatAddress(location.storefrontAddress),
        phone: location.phoneNumbers?.primary || '',
        website: location.websiteUri || '',
        categories: location.categories?.map(c => c.displayName) || []
      }));
    } catch (error) {
      console.error('Error getting Google My Business locations:', error);
      throw error;
    }
  }
  
  /**
   * Get reviews for a business location
   * @param {Object} credentials - User credentials
   * @param {String} locationId - Location ID
   * @returns {Promise<Array>} Reviews
   */
  async getReviews(credentials, locationId) {
    const oauth2Client = this.createOAuth2Client(credentials);
    google.options({ auth: oauth2Client });
    
    try {
      const mybusiness = google.mybusinessbusinessinformation({ version: 'v1' });
      const response = await mybusiness.locations.reviews.list({
        parent: locationId
      });
      
      return (response.data.reviews || []).map(review => ({
        id: review.name,
        rating: review.starRating,
        comment: review.comment || '',
        createTime: review.createTime,
        updateTime: review.updateTime,
        reviewer: {
          displayName: review.reviewer.displayName || 'Anonymous',
          profilePhotoUrl: review.reviewer.profilePhotoUrl || ''
        },
        reply: review.reviewReply ? {
          comment: review.reviewReply.comment,
          updateTime: review.reviewReply.updateTime
        } : null
      }));
    } catch (error) {
      console.error('Error getting Google reviews:', error);
      throw error;
    }
  }
  
  /**
   * Respond to a review
   * @param {Object} credentials - User credentials
   * @param {String} reviewId - Review ID 
   * @param {String} comment - Response comment
   * @returns {Promise<Object>} Response result
   */
  async respondToReview(credentials, reviewId, comment) {
    const oauth2Client = this.createOAuth2Client(credentials);
    google.options({ auth: oauth2Client });
    
    try {
      const mybusiness = google.mybusiness({ version: 'v4' });
      const response = await mybusiness.accounts.locations.reviews.updateReply({
        name: reviewId,
        resource: {
          comment: comment
        }
      });
      
      return {
        success: true,
        reviewId: reviewId,
        reply: {
          comment: response.data.comment,
          updateTime: response.data.updateTime
        }
      };
    } catch (error) {
      console.error('Error responding to Google review:', error);
      throw error;
    }
  }
  
  /**
   * Delete a review response
   * @param {Object} credentials - User credentials
   * @param {String} reviewId - Review ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteReviewResponse(credentials, reviewId) {
    const oauth2Client = this.createOAuth2Client(credentials);
    google.options({ auth: oauth2Client });
    
    try {
      const mybusiness = google.mybusiness({ version: 'v4' });
      await mybusiness.accounts.locations.reviews.deleteReply({
        name: reviewId
      });
      
      return {
        success: true,
        reviewId: reviewId,
        message: 'Review response deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting Google review response:', error);
      throw error;
    }
  }
  
  /**
   * Format Google address object to string
   * @param {Object} address - Address object
   * @returns {String} Formatted address
   */
  formatAddress(address) {
    if (!address) return '';
    
    const parts = [
      address.addressLines?.join(', '),
      address.locality,
      address.administrativeArea,
      address.postalCode,
      address.regionCode
    ].filter(Boolean);
    
    return parts.join(', ');
  }
}

module.exports = new GoogleReviewsService();
