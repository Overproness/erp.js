import { request } from '@/request';

// Account Management Actions
export const loadAccounts = () => async (dispatch) => {
  try {
    dispatch({ type: 'SOCIAL_MEDIA_ACCOUNTS_LOADING' });
    const response = await request.get('social-media/accounts');
    dispatch({
      type: 'SOCIAL_MEDIA_ACCOUNTS_SUCCESS',
      payload: response.result,
    });
    return response.result;
  } catch (error) {
    dispatch({
      type: 'SOCIAL_MEDIA_ACCOUNTS_ERROR',
      payload: error.message,
    });
    throw error;
  }
};

export const connectAccount = (accountData) => async (dispatch) => {
  try {
    const response = await request.post('social-media/accounts', accountData);
    dispatch({
      type: 'SOCIAL_MEDIA_ACCOUNT_CONNECTED',
      payload: response.result,
    });
    return response.result;
  } catch (error) {
    throw error;
  }
};

export const disconnectAccount = (accountId) => async (dispatch) => {
  try {
    await request.delete(`social-media/accounts/${accountId}`);
    dispatch({
      type: 'SOCIAL_MEDIA_ACCOUNT_DISCONNECTED',
      payload: accountId,
    });
  } catch (error) {
    throw error;
  }
};

export const testConnection = (accountId) => async () => {
  try {
    const response = await request.post(`social-media/accounts/${accountId}/test`);
    return response.result;
  } catch (error) {
    throw error;
  }
};

// Post Management Actions
export const loadPosts =
  (options = {}) =>
  async (dispatch) => {
    try {
      dispatch({ type: 'SOCIAL_MEDIA_POSTS_LOADING' });
      const response = await request.get('social-media/posts', { params: options });
      dispatch({
        type: 'SOCIAL_MEDIA_POSTS_SUCCESS',
        payload: response.result,
      });
      return response.result;
    } catch (error) {
      dispatch({
        type: 'SOCIAL_MEDIA_POSTS_ERROR',
        payload: error.message,
      });
      throw error;
    }
  };

export const createPost = (postData) => async (dispatch) => {
  try {
    const response = await request.post('social-media/posts', postData);
    dispatch({
      type: 'SOCIAL_MEDIA_POST_CREATED',
      payload: response.result,
    });
    return response.result;
  } catch (error) {
    throw error;
  }
};

export const publishPost = (postId) => async (dispatch) => {
  try {
    const response = await request.post(`social-media/posts/${postId}/publish`);
    dispatch({
      type: 'SOCIAL_MEDIA_POST_PUBLISHED',
      payload: response.result,
    });
    return response.result;
  } catch (error) {
    throw error;
  }
};

export const schedulePost = (postId, scheduleData) => async (dispatch) => {
  try {
    const response = await request.post(`social-media/posts/${postId}/schedule`, scheduleData);
    dispatch({
      type: 'SOCIAL_MEDIA_POST_SCHEDULED',
      payload: response.result,
    });
    return response.result;
  } catch (error) {
    throw error;
  }
};

// Analytics Actions
export const loadAnalytics =
  (period = '7d') =>
  async (dispatch) => {
    try {
      dispatch({ type: 'SOCIAL_MEDIA_ANALYTICS_LOADING' });
      const response = await request.get('social-media/analytics/overview', { params: { period } });
      dispatch({
        type: 'SOCIAL_MEDIA_ANALYTICS_SUCCESS',
        payload: response.result,
      });
      return response.result;
    } catch (error) {
      dispatch({
        type: 'SOCIAL_MEDIA_ANALYTICS_ERROR',
        payload: error.message,
      });
      throw error;
    }
  };

// Campaign Actions
export const loadCampaigns = () => async (dispatch) => {
  try {
    const response = await request.get('social-media/campaigns');
    dispatch({
      type: 'SOCIAL_MEDIA_CAMPAIGNS_SUCCESS',
      payload: response.result,
    });
    return response.result;
  } catch (error) {
    throw error;
  }
};

export const createCampaign = (campaignData) => async (dispatch) => {
  try {
    const response = await request.post('social-media/campaigns', campaignData);
    dispatch({
      type: 'SOCIAL_MEDIA_CAMPAIGN_CREATED',
      payload: response.result,
    });
    return response.result;
  } catch (error) {
    throw error;
  }
};

export const updateCampaign = (campaignId, campaignData) => async (dispatch) => {
  try {
    const response = await request.patch(`social-media/campaigns/${campaignId}`, campaignData);
    dispatch({
      type: 'SOCIAL_MEDIA_CAMPAIGN_UPDATED',
      payload: response.result,
    });
    return response.result;
  } catch (error) {
    throw error;
  }
};

export const startCampaign = (campaignId) => async (dispatch) => {
  try {
    const response = await request.post(`social-media/campaigns/${campaignId}/start`);
    dispatch({
      type: 'SOCIAL_MEDIA_CAMPAIGN_STARTED',
      payload: response.result,
    });
    return response.result;
  } catch (error) {
    throw error;
  }
};

export const pauseCampaign = (campaignId) => async (dispatch) => {
  try {
    const response = await request.post(`social-media/campaigns/${campaignId}/pause`);
    dispatch({
      type: 'SOCIAL_MEDIA_CAMPAIGN_PAUSED',
      payload: response.result,
    });
    return response.result;
  } catch (error) {
    throw error;
  }
};

export const completeCampaign = (campaignId) => async (dispatch) => {
  try {
    const response = await request.post(`social-media/campaigns/${campaignId}/complete`);
    dispatch({
      type: 'SOCIAL_MEDIA_CAMPAIGN_COMPLETED',
      payload: response.result,
    });
    return response.result;
  } catch (error) {
    throw error;
  }
};

export const getCampaignAnalytics = (campaignId) => async () => {
  try {
    const response = await request.get(`social-media/campaigns/${campaignId}/analytics`);
    return response.result;
  } catch (error) {
    throw error;
  }
};

// Mention Actions
export const loadMentions =
  (options = {}) =>
  async (dispatch) => {
    try {
      const response = await request.get('social-media/mentions', { params: options });
      dispatch({
        type: 'SOCIAL_MEDIA_MENTIONS_SUCCESS',
        payload: response.result,
      });
      return response.result;
    } catch (error) {
      throw error;
    }
  };

export const respondToMention = (mentionId, responseData) => async (dispatch) => {
  try {
    const response = await request.post(`social-media/mentions/${mentionId}/respond`, responseData);
    dispatch({
      type: 'SOCIAL_MEDIA_MENTION_RESPONDED',
      payload: response.result,
    });
    return response.result;
  } catch (error) {
    throw error;
  }
};

export const addMentionNote = (mentionId, note) => async (dispatch) => {
  try {
    const response = await request.post(`social-media/mentions/${mentionId}/notes`, { note });
    dispatch({
      type: 'SOCIAL_MEDIA_MENTION_NOTE_ADDED',
      payload: response.result,
    });
    return response.result;
  } catch (error) {
    throw error;
  }
};

export const updateMentionStatus = (mentionId, status) => async (dispatch) => {
  try {
    const response = await request.patch(`social-media/mentions/${mentionId}`, { status });
    dispatch({
      type: 'SOCIAL_MEDIA_MENTION_STATUS_UPDATED',
      payload: response.result,
    });
    return response.result;
  } catch (error) {
    throw error;
  }
};

export const trackKeywords = (keywords) => async (dispatch) => {
  try {
    const response = await request.post('social-media/mentions/keywords', { keywords });
    dispatch({
      type: 'SOCIAL_MEDIA_KEYWORDS_TRACKED',
      payload: response.result,
    });
    return response.result;
  } catch (error) {
    throw error;
  }
};

// Competitor Analysis Actions
export const loadCompetitors = () => async () => {
  try {
    const response = await request.get('social-media/competitors');
    return response.result || [];
  } catch (error) {
    console.error('Failed to load competitors:', error);
    return [];
  }
};

export const addCompetitor = (competitorData) => async () => {
  try {
    const response = await request.post('social-media/competitors', competitorData);
    return response.result;
  } catch (error) {
    throw error;
  }
};

export const removeCompetitor = (competitorId) => async () => {
  try {
    await request.delete(`social-media/competitors/${competitorId}`);
  } catch (error) {
    throw error;
  }
};

export const getCompetitorAnalytics =
  (period = '7d') =>
  async () => {
    try {
      const response = await request.get('social-media/analytics/competitor-analysis', {
        params: { period },
      });
      return response.result;
    } catch (error) {
      throw error;
    }
  };

// AI Content Actions
export const generateContentIdeas = (prompt) => async () => {
  try {
    const response = await request.post('social-media/ai/content-suggestions', prompt);
    return response.result;
  } catch (error) {
    throw error;
  }
};

export const optimizeContent = (contentData) => async () => {
  try {
    const response = await request.post('social-media/ai/optimize-content', contentData);
    return response.result;
  } catch (error) {
    throw error;
  }
};

export const getHashtagSuggestions = (content, platform) => async () => {
  try {
    const response = await request.post('social-media/ai/hashtag-suggestions', {
      content,
      platform,
    });
    return response.result;
  } catch (error) {
    throw error;
  }
};

export const getOptimalTimes = (platform, audience) => async () => {
  try {
    const response = await request.get('social-media/ai/optimal-times', {
      params: { platform, audience },
    });
    return response.result;
  } catch (error) {
    throw error;
  }
};

// Settings Actions
export const loadSettings = () => async () => {
  try {
    const response = await request.get('social-media/settings');
    return response.result;
  } catch (error) {
    throw error;
  }
};

export const updateSettings = (settingType, settingData) => async () => {
  try {
    const response = await request.patch('social-media/settings', { [settingType]: settingData });
    return response.result;
  } catch (error) {
    throw error;
  }
};

// Platform Integration Actions
export const getOAuthUrl = (platform) => async () => {
  try {
    const response = await request.get(`social-media/oauth/${platform}/url`);
    return response.result.authUrl;
  } catch (error) {
    throw error;
  }
};

export const disconnectPlatform = (platform) => async (dispatch) => {
  try {
    await request.delete(`social-media/platforms/${platform}`);
    dispatch({
      type: 'SOCIAL_MEDIA_PLATFORM_DISCONNECTED',
      payload: platform,
    });
  } catch (error) {
    throw error;
  }
};
