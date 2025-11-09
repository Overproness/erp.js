const crypto = require('crypto');

class FacebookAuth {
  constructor() {
    this.clientId = process.env.FACEBOOK_APP_ID;
    this.clientSecret = process.env.FACEBOOK_APP_SECRET;
    this.redirectUri = process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:8888/api/social/auth/facebook/callback';
    this.apiVersion = 'v18.0';
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
  }

  /**
   * Generate OAuth URL for Facebook authentication
   * @param {string} state - CSRF state parameter
   * @returns {string} OAuth URL
   */
  generateAuthUrl(state = null) {
    if (!state) {
      state = crypto.randomBytes(32).toString('hex');
    }

    const scope = [
      'pages_manage_posts',
      'pages_read_engagement',
      'pages_read_user_content',
      'pages_show_list',
      'publish_to_groups',
      'instagram_basic',
      'instagram_content_publish',
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
   * @param {string} code - Authorization code from Facebook
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

      const response = await fetch(`${this.baseUrl}/oauth/access_token?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Facebook auth failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Facebook auth error: ${data.error.message}`);
      }

      return {
        accessToken: data.access_token,
        tokenType: data.token_type || 'bearer',
        expiresIn: data.expires_in,
      };
    } catch (error) {
      console.error('Facebook token exchange error:', error);
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

      const response = await fetch(`${this.baseUrl}/oauth/access_token?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Facebook long-lived token exchange failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Facebook long-lived token error: ${data.error.message}`);
      }

      return {
        accessToken: data.access_token,
        tokenType: data.token_type || 'bearer',
        expiresIn: data.expires_in, // Usually 60 days for long-lived tokens
      };
    } catch (error) {
      console.error('Facebook long-lived token exchange error:', error);
      throw error;
    }
  }

  /**
   * Get user's Facebook pages
   * @param {string} accessToken - User access token
   * @returns {Promise<Array>} List of pages
   */
  async getUserPages(accessToken) {
    try {
      const response = await fetch(`${this.baseUrl}/me/accounts?access_token=${accessToken}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get Facebook pages: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Facebook pages error: ${data.error.message}`);
      }

      return data.data.map(page => ({
        id: page.id,
        name: page.name,
        accessToken: page.access_token,
        category: page.category,
        tasks: page.tasks || [],
      }));
    } catch (error) {
      console.error('Facebook get pages error:', error);
      throw error;
    }
  }

  /**
   * Validate access token
   * @param {string} accessToken - Access token to validate
   * @returns {Promise<Object>} Token validation response
   */
  async validateToken(accessToken) {
    try {
      const response = await fetch(`${this.baseUrl}/me?access_token=${accessToken}&fields=id,name,email`, {
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
        userEmail: data.email,
      };
    } catch (error) {
      console.error('Facebook token validation error:', error);
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  /**
   * Refresh access token if needed
   * @param {string} accessToken - Current access token
   * @returns {Promise<Object>} Refreshed token or current token
   */
  async refreshToken(accessToken) {
    try {
      // Facebook doesn't have a traditional refresh token flow
      // Instead, we validate the current token and exchange for long-lived if needed
      const validation = await this.validateToken(accessToken);
      
      if (!validation.isValid) {
        throw new Error('Token is invalid and cannot be refreshed');
      }

      // Try to exchange for long-lived token
      return await this.exchangeForLongLivedToken(accessToken);
    } catch (error) {
      console.error('Facebook token refresh error:', error);
      throw error;
    }
  }

  /**
   * Get debug information about a token
   * @param {string} accessToken - Token to debug
   * @returns {Promise<Object>} Debug information
   */
  async debugToken(accessToken) {
    try {
      const appToken = `${this.clientId}|${this.clientSecret}`;
      const response = await fetch(
        `${this.baseUrl}/debug_token?input_token=${accessToken}&access_token=${appToken}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Token debug failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Token debug error: ${data.error.message}`);
      }

      return data.data;
    } catch (error) {
      console.error('Facebook token debug error:', error);
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
      const response = await fetch(`${this.baseUrl}/me/permissions`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      return data.success || false;
    } catch (error) {
      console.error('Facebook token revoke error:', error);
      return false;
    }
  }
}

module.exports = new FacebookAuth();
