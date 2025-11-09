const crypto = require('crypto');

class TwitterAuth {
  constructor() {
    this.clientId = process.env.TWITTER_CLIENT_ID;
    this.clientSecret = process.env.TWITTER_CLIENT_SECRET;
    this.redirectUri = process.env.TWITTER_REDIRECT_URI || 'http://localhost:8888/api/social/auth/twitter/callback';
    this.apiVersion = '2';
    this.baseUrl = `https://api.twitter.com/${this.apiVersion}`;
  }

  /**
   * Generate OAuth 2.0 URL for Twitter authentication
   * @param {string} state - CSRF state parameter
   * @returns {string} OAuth URL
   */
  generateAuthUrl(state = null) {
    if (!state) {
      state = crypto.randomBytes(32).toString('hex');
    }

    // Generate code verifier and challenge for PKCE
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

    const scope = [
      'tweet.read',
      'tweet.write',
      'users.read',
      'follows.read',
      'follows.write',
      'offline.access' // For refresh tokens
    ].join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scope,
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    // Store code verifier for later use (in practice, you'd store this in session/cache)
    this.codeVerifier = codeVerifier;

    return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from Twitter
   * @param {string} codeVerifier - PKCE code verifier
   * @returns {Promise<Object>} Token response
   */
  async exchangeCodeForToken(code, codeVerifier = null) {
    try {
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        code: code,
        code_verifier: codeVerifier || this.codeVerifier,
      });

      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Twitter auth failed: ${response.statusText} - ${errorData}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Twitter auth error: ${data.error_description || data.error}`);
      }

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        tokenType: data.token_type || 'bearer',
        expiresIn: data.expires_in,
        scope: data.scope,
      };
    } catch (error) {
      console.error('Twitter token exchange error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New token response
   */
  async refreshToken(refreshToken) {
    try {
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
      });

      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Twitter token refresh failed: ${response.statusText} - ${errorData}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Twitter token refresh error: ${data.error_description || data.error}`);
      }

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        tokenType: data.token_type || 'bearer',
        expiresIn: data.expires_in,
        scope: data.scope,
      };
    } catch (error) {
      console.error('Twitter token refresh error:', error);
      throw error;
    }
  }

  /**
   * Validate access token by getting user info
   * @param {string} accessToken - Access token to validate
   * @returns {Promise<Object>} Token validation response
   */
  async validateToken(accessToken) {
    try {
      const response = await fetch(`${this.baseUrl}/users/me?user.fields=id,name,username,profile_image_url,public_metrics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Token validation failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.errors) {
        throw new Error(`Token validation error: ${data.errors[0].detail}`);
      }

      return {
        isValid: true,
        userId: data.data.id,
        userName: data.data.name,
        username: data.data.username,
        profileImageUrl: data.data.profile_image_url,
        publicMetrics: data.data.public_metrics,
      };
    } catch (error) {
      console.error('Twitter token validation error:', error);
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  /**
   * Revoke access token
   * @param {string} accessToken - Token to revoke
   * @returns {Promise<boolean>} Success status
   */
  async revokeToken(accessToken) {
    try {
      const body = new URLSearchParams({
        token: accessToken,
        client_id: this.clientId,
      });

      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await fetch('https://api.twitter.com/2/oauth2/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json',
        },
        body: body.toString(),
      });

      return response.ok;
    } catch (error) {
      console.error('Twitter token revoke error:', error);
      return false;
    }
  }

  /**
   * Get user's Twitter account information
   * @param {string} accessToken - Access token
   * @returns {Promise<Object>} User account information
   */
  async getUserInfo(accessToken) {
    try {
      const response = await fetch(
        `${this.baseUrl}/users/me?user.fields=id,name,username,description,profile_image_url,public_metrics,verified,created_at`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get user info: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.errors) {
        throw new Error(`User info error: ${data.errors[0].detail}`);
      }

      return {
        id: data.data.id,
        name: data.data.name,
        username: data.data.username,
        description: data.data.description,
        profileImageUrl: data.data.profile_image_url,
        followersCount: data.data.public_metrics.followers_count,
        followingCount: data.data.public_metrics.following_count,
        tweetCount: data.data.public_metrics.tweet_count,
        listedCount: data.data.public_metrics.listed_count,
        verified: data.data.verified,
        createdAt: data.data.created_at,
      };
    } catch (error) {
      console.error('Twitter get user info error:', error);
      throw error;
    }
  }

  /**
   * Generate state parameter for OAuth
   * @returns {string} Random state string
   */
  generateState() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate PKCE code verifier and challenge
   * @returns {Object} Code verifier and challenge
   */
  generatePKCE() {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    
    return {
      codeVerifier,
      codeChallenge,
    };
  }

  /**
   * Get rate limit information for current token
   * @param {string} accessToken - Access token
   * @returns {Promise<Object>} Rate limit info
   */
  async getRateLimitInfo(accessToken) {
    try {
      const response = await fetch(`${this.baseUrl}/tweets/search/recent?query=test&max_results=10`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      const rateLimitInfo = {
        limit: response.headers.get('x-rate-limit-limit'),
        remaining: response.headers.get('x-rate-limit-remaining'),
        reset: response.headers.get('x-rate-limit-reset'),
      };

      return rateLimitInfo;
    } catch (error) {
      console.error('Twitter rate limit check error:', error);
      return null;
    }
  }
}

module.exports = new TwitterAuth();
