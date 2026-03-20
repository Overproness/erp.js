function isJsonString(str: string): boolean {
  try {
    JSON.parse(str);
  } catch (e) {
    console.error((e as Error).message);
    return false;
  }
  return true;
}

export const localStorageHealthCheck = (): void => {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      keys.push(localStorage.key(i)!);
    }

    keys.forEach((key) => {
      try {
        const result = window.localStorage.getItem(key);

        if (result !== null && !isJsonString(result)) {
          console.warn(`Removing invalid JSON item from localStorage: ${key}`);
          window.localStorage.removeItem(key);
        }

        if (result === '{}' || result === '[]') {
          console.warn(`Removing empty object/array from localStorage: ${key}`);
          window.localStorage.removeItem(key);
        }
      } catch (itemError) {
        console.error(`Error processing localStorage key "${key}":`, itemError);
        window.localStorage.removeItem(key);
      }
    });

    const authData = JSON.parse(localStorage.getItem('auth') || '{}');
    if (authData && (!authData.current || !authData.isLoggedIn)) {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StorePersistValue = any;

const storePersist = {
  set: (key: string, state: StorePersistValue): void => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },
  get: (key: string): StorePersistValue => {
    try {
      const state = localStorage.getItem(key);
      return state ? JSON.parse(state) : undefined;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return undefined;
    }
  },
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
};

export default storePersist;
