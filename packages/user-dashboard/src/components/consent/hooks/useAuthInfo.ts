import { useEffect, useState, useCallback } from 'react';
import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
import { getValidSessionSigs } from '../utils/getValidSessionSigs';
import { disconnectWeb3 } from '@lit-protocol/auth-browser';
// Define interfaces for the authentication info
export interface AuthInfo {
  type: string;
  authenticatedAt: string;
  agentPKP?: IRelayPKP;
  userPKP?: IRelayPKP;
  value?: string;
  userId?: string;
}

export interface UseReadAuthInfo { 
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
export const useReadAuthInfo = (): UseReadAuthInfo => {
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
        }
        const sigs = await getValidSessionSigs();
        if (sigs) {
          setSessionSigs(sigs);
        } else {
          await clearInfo();
        }
      } catch (error) {
        console.error('Error retrieving auth info:', error);
        setError(error as string);
        await clearInfo();
      } finally {
        setIsProcessing(false);
      }
    };
    loadAuthInfo();
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
      return true;
    } catch (err) {
      const error = err as Error;
      console.error('Error storing auth info:', error);
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
          ...updates
        } as AuthInfo;
      }
      
      localStorage.setItem(AUTH_INFO_KEY, JSON.stringify(updatedAuthInfo));
      return true;
    } catch (err) {
      const error = err as Error;
      console.error('Error updating auth info:', error);
      setError(error);
      localStorage.removeItem(AUTH_INFO_KEY);
      throw error;
    }
  }, []);

  return {
    setAuthInfo,
    updateAuthInfo,
    error
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
    error
  };
};

async function clearInfo() {
  localStorage.removeItem(AUTH_INFO_KEY);
  await disconnectWeb3();
}

// For backward compatibility
export default useReadAuthInfo; 