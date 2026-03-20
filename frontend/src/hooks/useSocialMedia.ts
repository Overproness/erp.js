import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { message } from 'antd';
import {
  selectAccounts,
  selectPosts,
  selectAnalytics,
  selectCampaigns,
  selectMentions,
  selectIsAccountsLoading,
  selectIsPostsLoading,
  selectIsAnalyticsLoading,
  selectAccountsList,
  selectPostsList,
  selectConnectedPlatforms,
} from '@/redux/socialMedia/selectors';
import * as socialMediaActions from '@/redux/socialMedia/actions';

// Main hook for social media functionality
export const useSocialMedia = () => {
  const dispatch = useDispatch();
  
  const accounts = useSelector(selectAccounts);
  const posts = useSelector(selectPosts);
  const analytics = useSelector(selectAnalytics);
  const campaigns = useSelector(selectCampaigns);
  const mentions = useSelector(selectMentions);

  const isAccountsLoading = useSelector(selectIsAccountsLoading);
  const isPostsLoading = useSelector(selectIsPostsLoading);
  const isAnalyticsLoading = useSelector(selectIsAnalyticsLoading);

  // Load initial data
  useEffect(() => {
    dispatch(socialMediaActions.loadAccounts());
    dispatch(socialMediaActions.loadPosts());
    dispatch(socialMediaActions.loadAnalytics());
  }, [dispatch]);

  return {
    accounts,
    posts,
    analytics,
    campaigns,
    mentions,
    loading: {
      accounts: isAccountsLoading,
      posts: isPostsLoading,
      analytics: isAnalyticsLoading,
    },
    actions: {
      loadAccounts: () => dispatch(socialMediaActions.loadAccounts()),
      loadPosts: (options) => dispatch(socialMediaActions.loadPosts(options)),
      loadAnalytics: (period) => dispatch(socialMediaActions.loadAnalytics(period)),
      loadCampaigns: () => dispatch(socialMediaActions.loadCampaigns()),
      loadMentions: (options) => dispatch(socialMediaActions.loadMentions(options)),
    },
  };
};

// Hook for account management
export const useAccountManagement = () => {
  const dispatch = useDispatch();
  const accountsList = useSelector(selectAccountsList);
  const connectedPlatforms = useSelector(selectConnectedPlatforms);
  const isLoading = useSelector(selectIsAccountsLoading);

  const connectAccount = useCallback(async (accountData) => {
    try {
      await dispatch(socialMediaActions.connectAccount(accountData));
      message.success('Account connected successfully');
      return true;
    } catch (error) {
      message.error(`Failed to connect account: ${error.message}`);
      return false;
    }
  }, [dispatch]);

  const disconnectAccount = useCallback(async (accountId) => {
    try {
      await dispatch(socialMediaActions.disconnectAccount(accountId));
      message.success('Account disconnected successfully');
      return true;
    } catch (error) {
      message.error(`Failed to disconnect account: ${error.message}`);
      return false;
    }
  }, [dispatch]);

  const testConnection = useCallback(async (accountId) => {
    try {
      const result = await dispatch(socialMediaActions.testConnection(accountId));
      if (result.success) {
        message.success('Connection test successful');
      } else {
        message.warning('Connection test failed');
      }
      return result;
    } catch (error) {
      message.error(`Connection test failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }, [dispatch]);

  return {
    accounts: accountsList,
    connectedPlatforms,
    isLoading,
    connectAccount,
    disconnectAccount,
    testConnection,
    refreshAccounts: () => dispatch(socialMediaActions.loadAccounts()),
  };
};

// Hook for post management
export const usePostManagement = () => {
  const dispatch = useDispatch();
  const postsList = useSelector(selectPostsList);
  const isLoading = useSelector(selectIsPostsLoading);

  const createPost = useCallback(async (postData) => {
    try {
      const result = await dispatch(socialMediaActions.createPost(postData));
      message.success('Post created successfully');
      return result;
    } catch (error) {
      message.error(`Failed to create post: ${error.message}`);
      throw error;
    }
  }, [dispatch]);

  const publishPost = useCallback(async (postId) => {
    try {
      await dispatch(socialMediaActions.publishPost(postId));
      message.success('Post published successfully');
      return true;
    } catch (error) {
      message.error(`Failed to publish post: ${error.message}`);
      return false;
    }
  }, [dispatch]);

  const schedulePost = useCallback(async (postId, scheduleData) => {
    try {
      await dispatch(socialMediaActions.schedulePost(postId, scheduleData));
      message.success('Post scheduled successfully');
      return true;
    } catch (error) {
      message.error(`Failed to schedule post: ${error.message}`);
      return false;
    }
  }, [dispatch]);

  return {
    posts: postsList,
    isLoading,
    createPost,
    publishPost,
    schedulePost,
    refreshPosts: (options) => dispatch(socialMediaActions.loadPosts(options)),
  };
};

// Hook for analytics
export const useAnalytics = () => {
  const dispatch = useDispatch();
  const analytics = useSelector(selectAnalytics);
  const isLoading = useSelector(selectIsAnalyticsLoading);

  const loadAnalytics = useCallback((period = '7d') => {
    dispatch(socialMediaActions.loadAnalytics(period));
  }, [dispatch]);

  return {
    analytics,
    isLoading,
    loadAnalytics,
  };
};

// Hook for campaign management
export const useCampaigns = () => {
  const dispatch = useDispatch();
  const campaigns = useSelector(selectCampaigns);
  const [isLoading, setIsLoading] = useState(false);

  const createCampaign = useCallback(async (campaignData) => {
    try {
      setIsLoading(true);
      const result = await dispatch(socialMediaActions.createCampaign(campaignData));
      message.success('Campaign created successfully');
      return result;
    } catch (error) {
      message.error(`Failed to create campaign: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  const updateCampaign = useCallback(async (campaignId, campaignData) => {
    try {
      setIsLoading(true);
      const result = await dispatch(socialMediaActions.updateCampaign(campaignId, campaignData));
      message.success('Campaign updated successfully');
      return result;
    } catch (error) {
      message.error(`Failed to update campaign: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  const startCampaign = useCallback(async (campaignId) => {
    try {
      await dispatch(socialMediaActions.startCampaign(campaignId));
      message.success('Campaign started successfully');
    } catch (error) {
      message.error(`Failed to start campaign: ${error.message}`);
      throw error;
    }
  }, [dispatch]);

  const pauseCampaign = useCallback(async (campaignId) => {
    try {
      await dispatch(socialMediaActions.pauseCampaign(campaignId));
      message.success('Campaign paused successfully');
    } catch (error) {
      message.error(`Failed to pause campaign: ${error.message}`);
      throw error;
    }
  }, [dispatch]);

  const completeCampaign = useCallback(async (campaignId) => {
    try {
      await dispatch(socialMediaActions.completeCampaign(campaignId));
      message.success('Campaign completed successfully');
    } catch (error) {
      message.error(`Failed to complete campaign: ${error.message}`);
      throw error;
    }
  }, [dispatch]);

  const getCampaignAnalytics = useCallback(async (campaignId) => {
    try {
      const result = await dispatch(socialMediaActions.getCampaignAnalytics(campaignId));
      return result;
    } catch (error) {
      message.error(`Failed to load campaign analytics: ${error.message}`);
      throw error;
    }
  }, [dispatch]);

  return {
    campaigns: campaigns || [],
    isLoading,
    createCampaign,
    updateCampaign,
    startCampaign,
    pauseCampaign,
    completeCampaign,
    getCampaignAnalytics,
    refreshCampaigns: () => dispatch(socialMediaActions.loadCampaigns()),
  };
};

// Hook for mentions and social listening
export const useMentions = () => {
  const dispatch = useDispatch();
  const mentions = useSelector(selectMentions);
  const [isLoading, setIsLoading] = useState(false);

  const refreshMentions = useCallback((options = {}) => {
    dispatch(socialMediaActions.loadMentions(options));
  }, [dispatch]);

  const respondToMention = useCallback(async (mentionId, responseData) => {
    try {
      setIsLoading(true);
      const result = await dispatch(socialMediaActions.respondToMention(mentionId, responseData));
      message.success('Response sent successfully');
      return result;
    } catch (error) {
      message.error(`Failed to send response: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  const addNote = useCallback(async (mentionId, note) => {
    try {
      const result = await dispatch(socialMediaActions.addMentionNote(mentionId, note));
      message.success('Note added successfully');
      return result;
    } catch (error) {
      message.error(`Failed to add note: ${error.message}`);
      throw error;
    }
  }, [dispatch]);

  const updateStatus = useCallback(async (mentionId, status) => {
    try {
      const result = await dispatch(socialMediaActions.updateMentionStatus(mentionId, status));
      message.success('Status updated successfully');
      return result;
    } catch (error) {
      message.error(`Failed to update status: ${error.message}`);
      throw error;
    }
  }, [dispatch]);

  const trackKeywords = useCallback(async (keywords) => {
    try {
      await dispatch(socialMediaActions.trackKeywords(keywords));
      message.success('Keywords tracked successfully');
    } catch (error) {
      message.error(`Failed to track keywords: ${error.message}`);
    }
  }, [dispatch]);

  return {
    mentions: mentions || [],
    isLoading,
    refreshMentions,
    respondToMention,
    addNote,
    updateStatus,
    trackKeywords,
  };
};

// Hook for competitor analysis
export const useCompetitorAnalysis = () => {
  const dispatch = useDispatch();
  const [competitors, setCompetitors] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const addCompetitor = useCallback(async (competitorData) => {
    try {
      setIsLoading(true);
      const result = await dispatch(socialMediaActions.addCompetitor(competitorData));
      setCompetitors(prev => [...prev, result]);
      message.success('Competitor added successfully');
      return result;
    } catch (error) {
      message.error(`Failed to add competitor: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  const removeCompetitor = useCallback(async (competitorId) => {
    try {
      await dispatch(socialMediaActions.removeCompetitor(competitorId));
      setCompetitors(prev => prev.filter(comp => comp._id !== competitorId));
      message.success('Competitor removed successfully');
    } catch (error) {
      message.error(`Failed to remove competitor: ${error.message}`);
    }
  }, [dispatch]);

  const refreshAnalytics = useCallback(async (period = '7d') => {
    try {
      setIsLoading(true);
      const result = await dispatch(socialMediaActions.getCompetitorAnalytics(period));
      setAnalytics(result);
      return result;
    } catch (error) {
      message.error(`Failed to load competitor analytics: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    // Load initial competitors data
    const loadCompetitors = async () => {
      try {
        const result = await dispatch(socialMediaActions.loadCompetitors());
        setCompetitors(result || []);
      } catch (error) {
        console.error('Failed to load competitors:', error);
      }
    };
    loadCompetitors();
  }, [dispatch]);

  return {
    competitors,
    analytics,
    isLoading,
    addCompetitor,
    removeCompetitor,
    refreshAnalytics,
  };
};

// Hook for AI content generation
export const useAIContent = () => {
  const dispatch = useDispatch();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateContentIdeas = useCallback(async (prompt) => {
    setIsGenerating(true);
    try {
      const result = await dispatch(socialMediaActions.generateContentIdeas(prompt));
      return result;
    } catch (error) {
      message.error(`Failed to generate content ideas: ${error.message}`);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [dispatch]);

  const optimizeContent = useCallback(async (contentData) => {
    setIsOptimizing(true);
    try {
      const result = await dispatch(socialMediaActions.optimizeContent(contentData));
      return result;
    } catch (error) {
      message.error(`Failed to optimize content: ${error.message}`);
      throw error;
    } finally {
      setIsOptimizing(false);
    }
  }, [dispatch]);

  const getHashtagSuggestions = useCallback(async (content, platform) => {
    try {
      const result = await dispatch(socialMediaActions.getHashtagSuggestions(content, platform));
      return result;
    } catch (error) {
      message.error(`Failed to generate hashtags: ${error.message}`);
      throw error;
    }
  }, [dispatch]);

  const getOptimalTimes = useCallback(async (platform, audience) => {
    try {
      const result = await dispatch(socialMediaActions.getOptimalTimes(platform, audience));
      return result;
    } catch (error) {
      message.error(`Failed to get optimal times: ${error.message}`);
      throw error;
    }
  }, [dispatch]);

  return {
    isOptimizing,
    isGenerating,
    generateContentIdeas,
    optimizeContent,
    getHashtagSuggestions,
    getOptimalTimes,
  };
};

// Hook for settings management
export const useSettings = () => {
  const dispatch = useDispatch();
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const updateSettings = useCallback(async (settingType, settingData) => {
    try {
      setIsLoading(true);
      const result = await dispatch(socialMediaActions.updateSettings(settingType, settingData));
      setSettings(prev => ({
        ...prev,
        [settingType]: settingData
      }));
      message.success('Settings updated successfully');
      return result;
    } catch (error) {
      message.error(`Failed to update settings: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    // Load initial settings
    const loadSettings = async () => {
      try {
        const result = await dispatch(socialMediaActions.loadSettings());
        setSettings(result);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, [dispatch]);

  return {
    settings,
    isLoading,
    updateSettings,
  };
};

// Hook for platform integration with connection management
export const usePlatformIntegration = () => {
  const connectedPlatforms = useSelector(selectConnectedPlatforms);
  const dispatch = useDispatch();

  const connectPlatform = useCallback(async (platform) => {
    try {
      // Generate OAuth URL and redirect user
      const authUrl = await dispatch(socialMediaActions.getOAuthUrl(platform));
      window.location.href = authUrl;
    } catch (error) {
      message.error(`Failed to connect to ${platform}: ${error.message}`);
      throw error;
    }
  }, [dispatch]);

  const disconnectPlatform = useCallback(async (platform) => {
    try {
      await dispatch(socialMediaActions.disconnectPlatform(platform));
      message.success(`${platform} disconnected successfully`);
    } catch (error) {
      message.error(`Failed to disconnect ${platform}: ${error.message}`);
      throw error;
    }
  }, [dispatch]);

  const testConnection = useCallback(async (platform) => {
    try {
      const result = await dispatch(socialMediaActions.testConnection(platform));
      return result;
    } catch (error) {
      message.error(`Connection test failed for ${platform}: ${error.message}`);
      throw error;
    }
  }, [dispatch]);

  const isPlatformConnected = useCallback((platform) => {
    return !!connectedPlatforms[platform];
  }, [connectedPlatforms]);

  const getConnectedPlatforms = useCallback(() => {
    return Object.keys(connectedPlatforms);
  }, [connectedPlatforms]);

  const getPlatformAccount = useCallback((platform) => {
    return connectedPlatforms[platform];
  }, [connectedPlatforms]);

  return {
    connectedPlatforms,
    connectPlatform,
    disconnectPlatform,
    testConnection,
    isPlatformConnected,
    getConnectedPlatforms,
    getPlatformAccount,
  };
};

// Hook for real-time updates and notifications
export const useSocialMediaNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []);

  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    clearNotifications,
  };
};
