function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    console.error(e.message);
    return false;
  }
  return true;
}

export const localStorageHealthCheck = () => {
  try {
    // Clone the localStorage keys to an array since we might modify localStorage during the loop
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      keys.push(localStorage.key(i));
    }
    
    // Now iterate over the keys array
    keys.forEach(key => {
      try {
        const result = window.localStorage.getItem(key);
        
        // Remove items that aren't valid JSON
        if (result !== null && !isJsonString(result)) {
          console.warn(`Removing invalid JSON item from localStorage: ${key}`);
          window.localStorage.removeItem(key);
        }
        
        // Remove items with empty objects
        if (result === '{}' || result === '[]') {
          console.warn(`Removing empty object/array from localStorage: ${key}`);
          window.localStorage.removeItem(key);
        }
      } catch (itemError) {
        console.error(`Error processing localStorage key "${key}":`, itemError);
        // Only remove the problematic key
        window.localStorage.removeItem(key);
      }
    });
    
    // Special cleanup for auth-related items
    const authData = JSON.parse(localStorage.getItem('auth') || '{}');
    if (authData && (!authData.current || !authData.isLoggedIn)) {
      // If auth data is incomplete or indicates not logged in, clean up all auth
      console.warn('Cleaning up incomplete auth data');
      localStorage.removeItem('auth');
      localStorage.removeItem('auth_token');
    }
    
  } catch (error) {
    console.error('Critical localStorage error, clearing all storage:', error);
    try {
      window.localStorage.clear();
    } catch (clearError) {
      console.error('Failed to clear localStorage:', clearError);
    }
  }
};

// Simple localStorage persistence for Redux store state
const storePersist = {
  set: (key, state) => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },
  get: (key) => {
    try {
      const state = localStorage.getItem(key);
      return state ? JSON.parse(state) : undefined;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return undefined;
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
};

export default storePersist;
