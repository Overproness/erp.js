const crypto = require('crypto');

class InstagramAuth {
  constructor() {
    this.clientId = process.env.INSTAGRAM_CLIENT_ID || process.env.FACEBOOK_APP_ID;
    this.clientSecret = process.env.INSTAGRAM_CLIENT_SECRET || process.env.FACEBOOK_APP_SECRET;
    this.redirectUri = process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:8888/api/social/auth/instagram/callback';
    this.apiVersion = 'v18.0';
    this.baseUrl = `https://graph.instagram.com/${this.apiVersion}`;
    this.fbBaseUrl = `https://graph.facebook.com/${this.apiVersion}`;
  }

  /**
   * Generate OAuth URL for Instagram authentication
   * Note: Instagram uses Facebook's OAuth system
   * @param {string} state - CSRF state parameter
   * @returns {string} OAuth URL
   */
  generateAuthUrl(state = null) {
    if (!state) {
      state = crypto.randomBytes(32).toString('hex');
    }

    const scope = [
      'instagram_basic',
      'instagram_content_publish',
      'pages_show_list',
      'pages_read_engagement',
      'business_management'
    ].join(',');

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scope,
      response_type: 'code',
      state: state,
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from Facebook/Instagram
   * @returns {Promise<Object>} Token response
   */
  async exchangeCodeForToken(code) {
    try {
      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        code: code,
      });

      const response = await fetch(`${this.fbBaseUrl}/oauth/access_token?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Instagram auth failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Instagram auth error: ${data.error.message}`);
      }

      return {
        accessToken: data.access_token,
        tokenType: data.token_type || 'bearer',
        expiresIn: data.expires_in,
      };
    } catch (error) {
      console.error('Instagram token exchange error:', error);
      throw error;
    }
  }

  /**
   * Get user's Instagram business accounts
   * @param {string} accessToken - User access token
   * @returns {Promise<Array>} List of Instagram business accounts
   */
  async getInstagramAccounts(accessToken) {
    try {
      // First get Facebook pages
      const pagesResponse = await fetch(`${this.fbBaseUrl}/me/accounts?access_token=${accessToken}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!pagesResponse.ok) {
        throw new Error(`Failed to get Facebook pages: ${pagesResponse.statusText}`);
      }

      const pagesData = await pagesResponse.json();

      if (pagesData.error) {
        throw new Error(`Facebook pages error: ${pagesData.error.message}`);
      }

      const instagramAccounts = [];

      // For each page, check if it has an Instagram business account
      for (const page of pagesData.data) {
        try {
          const igResponse = await fetch(
            `${this.fbBaseUrl}/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`,
            {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
              },
            }
          );

          if (igResponse.ok) {
            const igData = await igResponse.json();
            
            if (igData.instagram_business_account) {
              // Get Instagram account details
              const accountResponse = await fetch(
                `${this.fbBaseUrl}/${igData.instagram_business_account.id}?fields=id,username,name,profile_picture_url,followers_count,media_count&access_token=${page.access_token}`,
                {
                  method: 'GET',
                  headers: {
                    'Accept': 'application/json',
                  },
                }
              );

              if (accountResponse.ok) {
                const accountData = await accountResponse.json();
                
                instagramAccounts.push({
                  id: accountData.id,
                  username: accountData.username,
                  name: accountData.name,
                  profilePictureUrl: accountData.profile_picture_url,
                  followersCount: accountData.followers_count,
                  mediaCount: accountData.media_count,
                  pageId: page.id,
                  pageName: page.name,
                  accessToken: page.access_token,
                });
              }
            }
          }
        } catch (pageError) {
          console.warn(`Error checking Instagram account for page ${page.id}:`, pageError);
          // Continue with other pages
        }
      }

      return instagramAccounts;
    } catch (error) {
      console.error('Instagram get accounts error:', error);
      throw error;
    }
  }

  /**
   * Validate Instagram access token
   * @param {string} accessToken - Access token to validate
   * @returns {Promise<Object>} Token validation response
   */
  async validateToken(accessToken) {
    try {
      const response = await fetch(`${this.fbBaseUrl}/me?access_token=${accessToken}&fields=id,name`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Token validation failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Token validation error: ${data.error.message}`);
      }

      return {
        isValid: true,
        userId: data.id,
        userName: data.name,
      };
    } catch (error) {
      console.error('Instagram token validation error:', error);
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  /**
   * Get Instagram account insights
   * @param {string} accountId - Instagram business account ID
   * @param {string} accessToken - Access token
   * @param {string} period - Time period (day, week, days_28)
   * @returns {Promise<Object>} Account insights
   */
  async getAccountInsights(accountId, accessToken, period = 'day') {
    try {
      const metrics = [
        'impressions',
        'reach',
        'profile_views',
        'website_clicks',
        'follower_count'
      ].join(',');

      const response = await fetch(
        `${this.fbBaseUrl}/${accountId}/insights?metric=${metrics}&period=${period}&access_token=${accessToken}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get Instagram insights: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Instagram insights error: ${data.error.message}`);
      }

      return data.data;
    } catch (error) {
      console.error('Instagram insights error:', error);
      throw error;
    }
  }

  /**
   * Get media insights for a specific post
   * @param {string} mediaId - Instagram media ID
   * @param {string} accessToken - Access token
   * @returns {Promise<Object>} Media insights
   */
  async getMediaInsights(mediaId, accessToken) {
    try {
      const metrics = [
        'impressions',
        'reach',
        'engagement',
        'saved',
        'video_views' // Only for video posts
      ].join(',');

      const response = await fetch(
        `${this.fbBaseUrl}/${mediaId}/insights?metric=${metrics}&access_token=${accessToken}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get media insights: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Media insights error: ${data.error.message}`);
      }

      return data.data;
    } catch (error) {
      console.error('Instagram media insights error:', error);
      throw error;
    }
  }

  /**
   * Exchange short-lived token for long-lived token
   * @param {string} shortLivedToken - Short-lived access token
   * @returns {Promise<Object>} Long-lived token response
   */
  async exchangeForLongLivedToken(shortLivedToken) {
    try {
      const params = new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        fb_exchange_token: shortLivedToken,
      });

      const response = await fetch(`${this.fbBaseUrl}/oauth/access_token?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Instagram long-lived token exchange failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Instagram long-lived token error: ${data.error.message}`);
      }

      return {
        accessToken: data.access_token,
        tokenType: data.token_type || 'bearer',
        expiresIn: data.expires_in,
      };
    } catch (error) {
      console.error('Instagram long-lived token exchange error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   * @param {string} accessToken - Current access token
   * @returns {Promise<Object>} Refreshed token or current token
   */
  async refreshToken(accessToken) {
    try {
      const validation = await this.validateToken(accessToken);
      
      if (!validation.isValid) {
        throw new Error('Token is invalid and cannot be refreshed');
      }

      return await this.exchangeForLongLivedToken(accessToken);
    } catch (error) {
      console.error('Instagram token refresh error:', error);
      throw error;
    }
  }

  /**
   * Revoke access token
   * @param {string} accessToken - Token to revoke
   * @returns {Promise<boolean>} Success status
   */
  async revokeToken(accessToken) {
    try {
      const response = await fetch(`${this.fbBaseUrl}/me/permissions`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      return data.success || false;
    } catch (error) {
      console.error('Instagram token revoke error:', error);
      return false;
    }
  }
}

module.exports = new InstagramAuth();
