import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPlatforms,
  connectPlatform,
  disconnectPlatform,
  updatePlatformIntegration,
  syncPlatforms,
  testPlatformConnection
} from '../../redux/reputation/reputationActions';
import {
  selectPlatforms,
  selectConnectedPlatforms,
  selectAvailablePlatforms,
  selectPlatformSyncStatus,
  selectDisconnectedPlatforms
} from '../../redux/reputation/reputationSelectors';

/**
 * Custom hook for platform integration management
 */
export const usePlatformIntegration = (options = {}) => {
  const {
    autoFetch = true,
    autoSync = false,
    syncInterval = 300000 // 5 minutes
  } = options;

  const dispatch = useDispatch();
  const platforms = useSelector(selectPlatforms);
  const connectedPlatforms = useSelector(selectConnectedPlatforms);
  const availablePlatforms = useSelector(selectAvailablePlatforms);
  const syncStatus = useSelector(selectPlatformSyncStatus);
  const disconnectedPlatforms = useSelector(selectDisconnectedPlatforms);

  const [connectionForm, setConnectionForm] = useState({
    platformId: '',
    credentials: {},
    settings: {}
  });
  const [testResults, setTestResults] = useState({});
  const [syncProgress, setSyncProgress] = useState({});

  // Fetch platforms on mount
  useEffect(() => {
    if (autoFetch) {
      dispatch(fetchPlatforms());
    }
  }, [dispatch, autoFetch]);

  // Set up auto-sync if enabled
  useEffect(() => {
    if (autoSync && connectedPlatforms.length > 0) {
      const interval = setInterval(() => {
        syncAllPlatforms();
      }, syncInterval);

      return () => clearInterval(interval);
    }
  }, [autoSync, connectedPlatforms.length, syncInterval]);

  // Connect platform
  const connectToPlatform = useCallback(async (platformId, credentials, settings = {}) => {
    try {
      const result = await dispatch(connectPlatform({ 
        platformId, 
        credentials,
        settings 
      })).unwrap();
      
      // Reset form after successful connection
      setConnectionForm({
        platformId: '',
        credentials: {},
        settings: {}
      });
      
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error };
    }
  }, [dispatch]);

  // Disconnect platform
  const disconnectFromPlatform = useCallback(async (platformId) => {
    try {
      await dispatch(disconnectPlatform(platformId)).unwrap();
      
      // Clear any stored test results for this platform
      setTestResults(prev => {
        const updated = { ...prev };
        delete updated[platformId];
        return updated;
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }, [dispatch]);

  // Update platform configuration
  const updatePlatformConfig = useCallback(async (platformId, config) => {
    try {
      const result = await dispatch(updatePlatformIntegration({ 
        platformId, 
        config 
      })).unwrap();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error };
    }
  }, [dispatch]);

  // Test platform connection
  const testConnection = useCallback(async (platformId, credentials) => {
    try {
      setTestResults(prev => ({
        ...prev,
        [platformId]: { testing: true }
      }));

      const result = await dispatch(testPlatformConnection({ 
        platformId, 
        credentials 
      })).unwrap();
      
      setTestResults(prev => ({
        ...prev,
        [platformId]: { 
          testing: false, 
          success: true, 
          data: result,
          timestamp: new Date().toISOString()
        }
      }));
      
      return { success: true, data: result };
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [platformId]: { 
          testing: false, 
          success: false, 
          error,
          timestamp: new Date().toISOString()
        }
      }));
      
      return { success: false, error };
    }
  }, [dispatch]);

  // Sync all connected platforms
  const syncAllPlatforms = useCallback(async () => {
    const platformIds = connectedPlatforms.map(p => p.id);
    if (platformIds.length === 0) return { success: true, data: [] };

    try {
      setSyncProgress({ inProgress: true, platforms: platformIds });
      
      const result = await dispatch(syncPlatforms(platformIds)).unwrap();
      
      setSyncProgress({ 
        inProgress: false, 
        completed: true,
        timestamp: new Date().toISOString(),
        results: result
      });
      
      return { success: true, data: result };
    } catch (error) {
      setSyncProgress({ 
        inProgress: false, 
        error,
        timestamp: new Date().toISOString()
      });
      
      return { success: false, error };
    }
  }, [dispatch, connectedPlatforms]);

  // Sync specific platforms
  const syncSpecificPlatforms = useCallback(async (platformIds) => {
    try {
      setSyncProgress({ inProgress: true, platforms: platformIds });
      
      const result = await dispatch(syncPlatforms(platformIds)).unwrap();
      
      setSyncProgress({ 
        inProgress: false, 
        completed: true,
        timestamp: new Date().toISOString(),
        results: result
      });
      
      return { success: true, data: result };
    } catch (error) {
      setSyncProgress({ 
        inProgress: false, 
        error,
        timestamp: new Date().toISOString()
      });
      
      return { success: false, error };
    }
  }, [dispatch]);

  // Get platform by ID
  const getPlatformById = useCallback((platformId) => {
    return availablePlatforms.find(p => p.id === platformId);
  }, [availablePlatforms]);

  // Get connection status for platform
  const getConnectionStatus = useCallback((platformId) => {
    const platform = getPlatformById(platformId);
    if (!platform) return 'unknown';
    
    return platform.status;
  }, [getPlatformById]);

  // Check if platform is connected
  const isPlatformConnected = useCallback((platformId) => {
    return getConnectionStatus(platformId) === 'connected';
  }, [getConnectionStatus]);

  // Get platform configuration
  const getPlatformConfig = useCallback((platformId) => {
    const connectedPlatform = connectedPlatforms.find(p => p.id === platformId);
    return connectedPlatform?.config || {};
  }, [connectedPlatforms]);

  // Platform statistics
  const platformStats = useMemo(() => {
    const totalPlatforms = availablePlatforms.length;
    const connectedCount = connectedPlatforms.length;
    const disconnectedCount = disconnectedPlatforms.length;
    
    // Calculate sync health
    const recentSyncErrors = syncStatus.errors.filter(error => {
      const errorTime = new Date(error.timestamp);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return errorTime > oneDayAgo;
    });

    const syncHealth = recentSyncErrors.length === 0 ? 'healthy' : 
                      recentSyncErrors.length < 3 ? 'warning' : 'error';

    return {
      totalPlatforms,
      connectedCount,
      disconnectedCount,
      connectionRate: totalPlatforms > 0 ? Math.round((connectedCount / totalPlatforms) * 100) : 0,
      syncHealth,
      lastSyncTime: syncStatus.lastSync,
      recentErrors: recentSyncErrors.length
    };
  }, [availablePlatforms, connectedPlatforms, disconnectedPlatforms, syncStatus]);

  // Platform capabilities
  const getPlatformCapabilities = useCallback((platformId) => {
    const capabilities = {
      google: {
        canFetchReviews: true,
        canPostResponses: true,
        canGetAnalytics: true,
        requiresAuth: true,
        authType: 'oauth2',
        webhooksSupported: true
      },
      facebook: {
        canFetchReviews: true,
        canPostResponses: true,
        canGetAnalytics: true,
        requiresAuth: true,
        authType: 'oauth2',
        webhooksSupported: true
      },
      yelp: {
        canFetchReviews: true,
        canPostResponses: true,
        canGetAnalytics: false,
        requiresAuth: true,
        authType: 'api_key',
        webhooksSupported: false
      },
      trustpilot: {
        canFetchReviews: true,
        canPostResponses: false,
        canGetAnalytics: true,
        requiresAuth: true,
        authType: 'api_key',
        webhooksSupported: false
      }
    };

    return capabilities[platformId] || {
      canFetchReviews: false,
      canPostResponses: false,
      canGetAnalytics: false,
      requiresAuth: true,
      authType: 'unknown',
      webhooksSupported: false
    };
  }, []);

  // Form handlers
  const updateConnectionForm = useCallback((updates) => {
    setConnectionForm(prev => ({ ...prev, ...updates }));
  }, []);

  const resetConnectionForm = useCallback(() => {
    setConnectionForm({
      platformId: '',
      credentials: {},
      settings: {}
    });
  }, []);

  // Bulk operations
  const bulkActions = useMemo(() => ({
    async connectMultiple(platformConfigs) {
      const results = [];
      
      for (const config of platformConfigs) {
        const result = await connectToPlatform(
          config.platformId, 
          config.credentials, 
          config.settings
        );
        results.push({ platformId: config.platformId, ...result });
      }
      
      return {
        success: results.every(r => r.success),
        results
      };
    },

    async disconnectMultiple(platformIds) {
      const results = [];
      
      for (const platformId of platformIds) {
        const result = await disconnectFromPlatform(platformId);
        results.push({ platformId, ...result });
      }
      
      return {
        success: results.every(r => r.success),
        results
      };
    },

    async testMultiple(platformConfigs) {
      const results = [];
      
      for (const config of platformConfigs) {
        const result = await testConnection(config.platformId, config.credentials);
        results.push({ platformId: config.platformId, ...result });
      }
      
      return results;
    }
  }), [connectToPlatform, disconnectFromPlatform, testConnection]);

  return {
    // Data
    platforms,
    connectedPlatforms,
    availablePlatforms,
    disconnectedPlatforms,
    syncStatus,
    platformStats,
    
    // Forms and UI state
    connectionForm,
    testResults,
    syncProgress,
    
    // Connection actions
    connectPlatform: connectToPlatform,
    disconnectPlatform: disconnectFromPlatform,
    updatePlatformConfig,
    testConnection,
    
    // Sync actions
    syncAllPlatforms,
    syncSpecificPlatforms,
    
    // Utility functions
    getPlatformById,
    getConnectionStatus,
    isPlatformConnected,
    getPlatformConfig,
    getPlatformCapabilities,
    
    // Form handlers
    updateConnectionForm,
    resetConnectionForm,
    
    // Bulk actions
    bulkActions
  };
};

export default usePlatformIntegration;
