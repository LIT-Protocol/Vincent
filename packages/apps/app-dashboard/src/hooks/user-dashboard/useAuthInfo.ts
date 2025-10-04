import { useEffect, useState, useCallback } from 'react';
import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
import * as Sentry from '@sentry/react';
import { getValidSessionSigs } from '../../utils/user-dashboard/getValidSessionSigs';
import { disconnectWeb3 } from '@lit-protocol/auth-browser';

// Define interfaces for the authentication info
export interface AuthInfo {
  type: string;
  authenticatedAt: string;
  userPKP?: IRelayPKP;
  value?: string;
  userId?: string;
}

export interface ReadAuthInfo {
  authInfo: AuthInfo | null;
  sessionSigs: SessionSigs | null;
  isProcessing: boolean;
  error: string | null;
}

export interface UseSetAuthInfo {
  setAuthInfo: (newAuthInfo: AuthInfo) => boolean;
  updateAuthInfo: (updates: Partial<AuthInfo>) => boolean;
  error: Error | null;
}

const AUTH_INFO_KEY = 'lit-auth-info';

/**
 * Hook to retrieve authentication info from localStorage
 * @returns The authentication info stored in localStorage
 */
export const useReadAuthInfo = (): ReadAuthInfo => {
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);
  const [sessionSigs, setSessionSigs] = useState<SessionSigs | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load auth info from localStorage
  useEffect(() => {
    const loadAuthInfo = async () => {
      try {
        const storedAuthInfo = localStorage.getItem(AUTH_INFO_KEY);
        if (storedAuthInfo) {
          const parsedAuthInfo = JSON.parse(storedAuthInfo) as AuthInfo;
          setAuthInfo(parsedAuthInfo);

          // Only try to get session sigs if we have a userPKP
          if (parsedAuthInfo.userPKP) {
            const sigs = await getValidSessionSigs();
            if (sigs) {
              setSessionSigs(sigs);
            } else {
              // If we have a userPKP but no valid session sigs, clear everything
              await clearInfo();
            }
          } else {
            setSessionSigs(null);
          }
        } else {
          // No auth info stored - just set states to null
          setAuthInfo(null);
          setSessionSigs(null);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error retrieving auth info:', error);
        Sentry.addBreadcrumb({
          category: 'auth',
          message: 'Failed to load auth info from localStorage',
          level: 'error',
          data: {
            hasStoredAuthInfo: !!localStorage.getItem(AUTH_INFO_KEY),
            error: errorMessage,
          },
        });
        setError(errorMessage);

        // Clear state but keep localStorage for retry
        setAuthInfo(null);
        setSessionSigs(null);
      } finally {
        setIsProcessing(false);
      }
    };

    // Initial load
    loadAuthInfo();

    // Listen for storage changes
    const handleStorageChange = (e: Event) => {
      if (
        (e instanceof StorageEvent && (e.key === AUTH_INFO_KEY || e.key === null)) ||
        (e instanceof CustomEvent && e.type === 'auth-info-updated')
      ) {
        setIsProcessing(true);
        loadAuthInfo();
      }
    };

    // Listen for storage events (from OTHER tabs only)
    window.addEventListener('storage', handleStorageChange);
    // Listen for custom events (from SAME tab only)
    window.addEventListener('auth-info-updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-info-updated', handleStorageChange);
    };
  }, []);

  return { authInfo, sessionSigs, isProcessing, error };
};

/**
 * Hook to provide functions for setting and updating authentication info
 * @returns Functions to set and update auth info
 */
export const useSetAuthInfo = (): UseSetAuthInfo => {
  const [error, setError] = useState<Error | null>(null);

  // Set new auth info (replaces existing)
  const setAuthInfo = useCallback((newAuthInfo: AuthInfo) => {
    try {
      localStorage.setItem(AUTH_INFO_KEY, JSON.stringify(newAuthInfo));

      // Dispatch custom event to notify same-tab listeners
      window.dispatchEvent(new CustomEvent('auth-info-updated'));

      return true;
    } catch (err) {
      const error = err as Error;
      console.error('Error storing auth info:', error);
      Sentry.addBreadcrumb({
        category: 'auth',
        message: 'Failed to store auth info in localStorage',
        level: 'error',
        data: {
          error: error.message,
        },
      });
      setError(error);

      throw error;
    }
  }, []);

  // Update existing auth info (merges with existing)
  const updateAuthInfo = useCallback((updates: Partial<AuthInfo>) => {
    try {
      const storedAuthInfo = localStorage.getItem(AUTH_INFO_KEY);
      let updatedAuthInfo: AuthInfo;

      if (storedAuthInfo) {
        const currentAuthInfo = JSON.parse(storedAuthInfo) as AuthInfo;
        updatedAuthInfo = { ...currentAuthInfo, ...updates };
      } else {
        updatedAuthInfo = {
          type: updates.type,
          authenticatedAt: updates.authenticatedAt,
          ...updates,
        } as AuthInfo;
      }

      localStorage.setItem(AUTH_INFO_KEY, JSON.stringify(updatedAuthInfo));

      // Dispatch custom event to notify same-tab listeners
      window.dispatchEvent(new CustomEvent('auth-info-updated'));

      return true;
    } catch (err) {
      const error = err as Error;
      console.error('Error updating auth info:', error);
      Sentry.addBreadcrumb({
        category: 'auth',
        message: 'Failed to update auth info in localStorage',
        level: 'error',
        data: {
          error: error.message,
        },
      });
      setError(error);

      throw error;
    }
  }, []);

  return {
    setAuthInfo,
    updateAuthInfo,
    error,
  };
};

/**
 * Hook to provide a function for clearing authentication info
 * @returns Function to clear auth info
 */
export const useClearAuthInfo = () => {
  const [error, setError] = useState<Error | null>(null);

  // Clear auth info from localStorage
  const clearAuthInfo = useCallback(async () => {
    try {
      await clearInfo();
      return true;
    } catch (err) {
      const error = err as Error;
      console.error('Error clearing auth info:', error);
      setError(error);

      throw error;
    }
  }, []);

  return {
    clearAuthInfo,
    error,
  };
};

async function clearInfo() {
  localStorage.removeItem(AUTH_INFO_KEY);

  // Dispatch custom event to notify all same-tab listeners
  window.dispatchEvent(new CustomEvent('auth-info-updated'));

  disconnectWeb3();
}

// For backward compatibility
export default useReadAuthInfo;
