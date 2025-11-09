import storePersist from '@/redux/storePersist';
import axios from 'axios';

// Clear any existing authentication to ensure invitation flow works without interference
export const clearAuthIfNeeded = () => {
  try {
    // Always remove any auth data for the invitation flow, regardless of whether it exists
    // This ensures a clean state for the invitation acceptance
    console.log('Clearing any existing auth data for invitation flow');
    
    // Remove auth data from persist store
    storePersist.remove('auth');
    
    // Clear all auth-related items from localStorage and sessionStorage
    localStorage.removeItem('auth');
    sessionStorage.removeItem('auth');
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    
    // Clean up all auth headers that might be set across different ways axios is used
    delete axios.defaults.headers.common['Authorization'];
    delete axios.defaults.headers['Authorization'];
    if (axios.defaults.headers.common) {
      delete axios.defaults.headers.common['Authorization'];
    }
    
    // Add a header to indicate this is a public request
    axios.defaults.headers.common['X-Public-Request'] = 'true';
    
    // Create a clean interceptor that removes auth headers from all requests
    const interceptorId = axios.interceptors.request.use(config => {
      delete config.headers.Authorization;
      config.headers['X-Public-Request'] = 'true';
      return config;
    });
      // Store the interceptor ID in sessionStorage so we can remove it later if needed
    sessionStorage.setItem('public-interceptor-id', interceptorId);
    
    return true; // Auth clearing actions performed
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
};
