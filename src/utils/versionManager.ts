/**
 * Version Manager Utility
 * Handles app version checking and cache clearing on new deployments
 */

const APP_VERSION_KEY = 'expertclaims_app_version';
const BUILD_TIMESTAMP_KEY = 'expertclaims_build_timestamp';

// Get version from package.json (will be replaced during build)
// Fallback to timestamp-based version if not set (for development)
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || 
  (import.meta.env.DEV ? `dev-${Date.now()}` : '0.0.0');
export const BUILD_TIMESTAMP = import.meta.env.VITE_BUILD_TIMESTAMP || Date.now().toString();

/**
 * Check if app version has changed and clear cache if needed
 */
export const checkVersionAndClearCache = (): boolean => {
  try {
    const storedVersion = localStorage.getItem(APP_VERSION_KEY);
    const storedTimestamp = localStorage.getItem(BUILD_TIMESTAMP_KEY);
    
    // If version or timestamp changed, clear all app-related localStorage
    if (storedVersion !== APP_VERSION || storedTimestamp !== BUILD_TIMESTAMP) {
      console.log('App version changed. Clearing cache...', {
        oldVersion: storedVersion,
        newVersion: APP_VERSION,
        oldTimestamp: storedTimestamp,
        newTimestamp: BUILD_TIMESTAMP
      });

      // Clear all localStorage items related to the app
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('expertclaims_') ||
          key.startsWith('supabase.') ||
          key.startsWith('sb-')
        )) {
          keysToRemove.push(key);
        }
      }

      // Remove all app-related keys
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          console.log(`Cleared localStorage key: ${key}`);
        } catch (error) {
          console.error(`Error clearing key ${key}:`, error);
        }
      });

      // Store new version and timestamp
      localStorage.setItem(APP_VERSION_KEY, APP_VERSION);
      localStorage.setItem(BUILD_TIMESTAMP_KEY, BUILD_TIMESTAMP);
      
      // Force reload to ensure fresh assets are loaded
      if (storedVersion !== null) {
        // Only reload if this isn't the first time (storedVersion exists)
        console.log('Version changed. Reloading page to load new assets...');
        // Use setTimeout to allow any initialization to complete
        setTimeout(() => {
          window.location.reload();
        }, 100);
        return true; // Indicates reload will happen
      }
    } else {
      console.log('App version unchanged. No cache clear needed.', {
        version: APP_VERSION,
        timestamp: BUILD_TIMESTAMP
      });
    }

    // Store current version if not already stored
    if (!storedVersion) {
      localStorage.setItem(APP_VERSION_KEY, APP_VERSION);
      localStorage.setItem(BUILD_TIMESTAMP_KEY, BUILD_TIMESTAMP);
    }

    return false; // No reload needed
  } catch (error) {
    console.error('Error checking version:', error);
    return false;
  }
};

/**
 * Get current app version from localStorage
 */
export const getStoredVersion = (): string | null => {
  return localStorage.getItem(APP_VERSION_KEY);
};

/**
 * Get current build timestamp from localStorage
 */
export const getStoredBuildTimestamp = (): string | null => {
  return localStorage.getItem(BUILD_TIMESTAMP_KEY);
};

/**
 * Force clear all app cache (use with caution)
 */
export const forceClearCache = (): void => {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('expertclaims_') ||
        key.startsWith('supabase.') ||
        key.startsWith('sb-')
      )) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    // Clear sessionStorage as well
    sessionStorage.clear();

    console.log('Cache cleared. Reloading...');
    window.location.reload();
  } catch (error) {
    console.error('Error forcing cache clear:', error);
  }
};
