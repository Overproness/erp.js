// @ts-nocheck
const axios = require('axios');
const crypto = require('crypto');
const twitterAuth = require('@/utils/socialMedia/twitterAuth');

class TwitterService {
  constructor() {
    this.baseURL = 'https://api.twitter.com/2';
    this.v1BaseURL = 'https://api.twitter.com/1.1';
    this.maxRetries = 3;
  }

  async makeRequest(endpoint, options = {}) {
    const { method = 'GET', data, bearerToken, accessToken, accessTokenSecret, retryCount = 0, version = 2 } = options;

    try {
      const baseURL = version === 1 ? this.v1BaseURL : this.baseURL;
      
      const config = {
        method,
        url: `${baseURL}${endpoint}`,
        headers: {},
      };

      // Use Bearer token for v2 API or OAuth 1.0a for v1
      if (bearerToken) {
        config.headers.Authorization = `Bearer ${bearerToken}`;
      } else if (accessToken && accessTokenSecret) {
        config.headers.Authorization = this.generateOAuthHeader(
          method,
          `${baseURL}${endpoint}`,
          accessToken,
          accessTokenSecret,
          options.params || {}
        );
      }

      if (options.params) {
        config.params = options.params;
      }

      if (data) {
        config.data = data;
        config.headers['Content-Type'] = 'application/json';
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (retryCount < this.maxRetries && this.isRetryableError(error)) {
        console.log(`Retrying Twitter request (${retryCount + 1}/${this.maxRetries})`);
        await this.delay(1000 * (retryCount + 1));
        return this.makeRequest(endpoint, { ...options, retryCount: retryCount + 1 });
      }

      console.error('Twitter API Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.title || error.response?.data?.detail || error.message);
    }
  }

  generateOAuthHeader(method, url, accessToken, accessTokenSecret, params = {}) {
    // OAuth 1.0a signature generation for Twitter API v1.1
    const oauthParams = {
      oauth_consumer_key: process.env.TWITTER_API_KEY,
      oauth_token: accessToken,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_version: '1.0',
    };

    // Combine OAuth and request parameters
    const allParams = { ...oauthParams, ...params };
    
    // Create parameter string
    const paramString = Object.keys(allParams)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(allParams[key])}`)
      .join('&');

    // Create signature base string
    const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;
    
    // Create signing key
    const signingKey = `${encodeURIComponent(process.env.TWITTER_API_KEY_SECRET)}&${encodeURIComponent(accessTokenSecret)}`;
    
    // Generate signature
    const signature = crypto.createHmac('sha1', signingKey).update(signatureBaseString).digest('base64');
    oauthParams.oauth_signature = signature;

    // Create authorization header
    const authHeaderParams = Object.keys(oauthParams)
      .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
      .join(', ');

    return `OAuth ${authHeaderParams}`;
  }

  isRetryableError(error) {
    const status = error.response?.status;
    return status === 429 || status >= 500;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async validateCredentials(credentials) {
    try {
      const { accessToken, accessTokenSecret } = credentials;
      
      const response = await this.makeRequest('/users/me', {
        bearerToken: process.env.TWITTER_BEARER_TOKEN,
        params: {
          'user.fields': 'id,name,username,profile_image_url,public_metrics'
        }
      });

      return {
        id: response.data.id,
        name: response.data.name,
        username: response.data.username,
        profileImage: response.data.profile_image_url,
        followersCount: response.data.public_metrics?.followers_count || 0,
        platform: 'twitter'
      };
    } catch (error) {
      throw new Error(`Twitter credential validation failed: ${error.message}`);
    }
  }

  async publishPost(account, postData) {
    try {
      const { content, urls = [], media = [] } = postData;
      const { credentials } = account;

      let text = content;
      if (urls.length > 0) {
        text += '\n\n' + urls.map(urlData => urlData.shortUrl || urlData.originalUrl).join('\n');
      }

      const tweetData = { text };

      // Handle media uploads
      if (media.length > 0) {
        const mediaIds = [];
        
        for (const mediaItem of media) {
          try {
            const mediaId = await this.uploadMedia(mediaItem, credentials);
            mediaIds.push(mediaId);
          } catch (mediaError) {
            console.warn('Failed to upload media:', mediaError.message);
          }
        }

        if (mediaIds.length > 0) {
          tweetData.media = { media_ids: mediaIds };
        }
      }

      const response = await this.makeRequest('/tweets', {
        method: 'POST',
        data: tweetData,
        bearerToken: process.env.TWITTER_BEARER_TOKEN,
      });

      return {
        id: response.data.id,
        url: `https://twitter.com/${account.accountInfo.username}/status/${response.data.id}`,
        platform: 'twitter',
        success: true,
        text: response.data.text,
      };
    } catch (error) {
      throw new Error(`Twitter post publication failed: ${error.message}`);
    }
  }

  async uploadMedia(mediaItem, credentials) {
    try {
      // This is a simplified media upload - in production, implement proper media upload
      // Twitter media upload requires chunked upload for larger files
      
      const mediaData = {
        media_data: mediaItem.base64Data, // Base64 encoded media
        media_category: mediaItem.type === 'video' ? 'tweet_video' : 'tweet_image',
      };

      const response = await this.makeRequest('/media/upload.json', {
        method: 'POST',
        data: mediaData,
        accessToken: credentials.accessToken,
        accessTokenSecret: credentials.accessTokenSecret,
        version: 1
      });

      return response.media_id_string;
    } catch (error) {
      throw new Error(`Twitter media upload failed: ${error.message}`);
    }
  }

  async getPostAnalytics(account, tweetId) {
    try {
      // Get tweet data
      const tweetData = await this.makeRequest(`/tweets/${tweetId}`, {
        bearerToken: process.env.TWITTER_BEARER_TOKEN,
        params: {
          'tweet.fields': 'created_at,public_metrics,context_annotations',
          'user.fields': 'username'
        }
      });

      const metrics = tweetData.data.public_metrics || {};

      return {
        platform: 'twitter',
        tweetId,
        likes: metrics.like_count || 0,
        retweets: metrics.retweet_count || 0,
        replies: metrics.reply_count || 0,
        quotes: metrics.quote_count || 0,
        impressions: metrics.impression_count || 0,
        engagement: (metrics.like_count || 0) + 
                   (metrics.retweet_count || 0) + 
                   (metrics.reply_count || 0) + 
                   (metrics.quote_count || 0),
        createdAt: tweetData.data.created_at,
        text: tweetData.data.text,
        retrievedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to get Twitter post analytics: ${error.message}`);
    }
  }

  async searchMentions(account, keywords) {
    try {
      const mentions = [];

      for (const keyword of keywords) {
        try {
          // Search for recent tweets mentioning the keyword
          const response = await this.makeRequest('/tweets/search/recent', {
            bearerToken: process.env.TWITTER_BEARER_TOKEN,
            params: {
              query: keyword,
              'tweet.fields': 'created_at,author_id,public_metrics,context_annotations',
              'user.fields': 'username,name,profile_image_url',
              'expansions': 'author_id',
              max_results: 100
            }
          });

          const tweets = response.data || [];
          const users = response.includes?.users || [];

          for (const tweet of tweets) {
            const author = users.find(user => user.id === tweet.author_id);
            
            mentions.push({
              platform: 'twitter',
              content: tweet.text,
              author: author?.name || 'Unknown',
              authorUsername: author?.username,
              authorImage: author?.profile_image_url,
              url: `https://twitter.com/${author?.username}/status/${tweet.id}`,
              publishedAt: new Date(tweet.created_at),
              tweetId: tweet.id,
              keyword,
              sentiment: this.analyzeSentiment(tweet.text),
              metrics: tweet.public_metrics,
            });
          }
        } catch (searchError) {
          console.warn(`Twitter search failed for keyword "${keyword}":`, searchError.message);
        }
      }

      return mentions;
    } catch (error) {
      throw new Error(`Twitter mention search failed: ${error.message}`);
    }
  }

  analyzeSentiment(text) {
    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'awesome', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'horrible', 'worst', 'disappointing'];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveScore = 0;
    let negativeScore = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveScore++;
      if (negativeWords.includes(word)) negativeScore++;
    });

    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  async getAccountAnalytics(account, startDate, endDate) {
    try {
      const { credentials } = account;

      // Get user metrics (limited by Twitter API)
      const userResponse = await this.makeRequest('/users/me', {
        bearerToken: process.env.TWITTER_BEARER_TOKEN,
        params: {
          'user.fields': 'public_metrics'
        }
      });

      const metrics = userResponse.data.public_metrics || {};

      return {
        platform: 'twitter',
        followersCount: metrics.followers_count || 0,
        followingCount: metrics.following_count || 0,
        tweetCount: metrics.tweet_count || 0,
        listedCount: metrics.listed_count || 0,
        retrievedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to get Twitter account analytics: ${error.message}`);
    }
  }

  async deleteTweet(account, tweetId) {
    try {
      await this.makeRequest(`/tweets/${tweetId}`, {
        method: 'DELETE',
        bearerToken: process.env.TWITTER_BEARER_TOKEN,
      });

      return { success: true, platform: 'twitter' };
    } catch (error) {
      throw new Error(`Failed to delete Twitter tweet: ${error.message}`);
    }
  }

  async getFollowers(account, maxResults = 1000) {
    try {
      const response = await this.makeRequest('/users/me/followers', {
        bearerToken: process.env.TWITTER_BEARER_TOKEN,
        params: {
          'user.fields': 'username,name,profile_image_url,public_metrics',
          max_results: Math.min(maxResults, 1000)
        }
      });

      return response.data || [];
    } catch (error) {
      throw new Error(`Failed to get Twitter followers: ${error.message}`);
    }
  }

  async getTrends(account, location = 1) { // 1 = worldwide
    try {
      const response = await this.makeRequest('/trends/place.json', {
        bearerToken: process.env.TWITTER_BEARER_TOKEN,
        params: { id: location },
        version: 1
      });

      return response[0]?.trends || [];
    } catch (error) {
      throw new Error(`Failed to get Twitter trends: ${error.message}`);
    }
  }
}

module.exports = new TwitterService();