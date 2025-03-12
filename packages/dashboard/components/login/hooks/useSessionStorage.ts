import { useState, useEffect, useCallback } from 'react';
import { AuthMethod, IRelayPKP } from '@lit-protocol/types';

const SESSION_STORAGE_KEYS = {
  AUTH_METHOD: 'lit-auth-method',
  PKP: 'lit-pkp',
  ACTIVE: 'lit-session-active'
};

export function useSessionStorage() {
  const [sessionData, setSessionData] = useState<{
    authMethod: AuthMethod | null;
    pkp: IRelayPKP | null;
    isActive: boolean;
  }>({
    authMethod: null,
    pkp: null,
    isActive: false
  });

  // Load session data on mount
  useEffect(() => {
    const storedAuthMethod = localStorage.getItem(SESSION_STORAGE_KEYS.AUTH_METHOD);
    const storedPKP = localStorage.getItem(SESSION_STORAGE_KEYS.PKP);
    const isActive = localStorage.getItem(SESSION_STORAGE_KEYS.ACTIVE) === 'true';

    if (storedAuthMethod && storedPKP && isActive) {
      try {
        setSessionData({
          authMethod: JSON.parse(storedAuthMethod),
          pkp: JSON.parse(storedPKP),
          isActive: true
        });
      } catch (err) {
        console.error('Failed to parse stored session:', err);
        clearSession();
      }
    }
  }, []);

  const storeSession = useCallback((authMethod: AuthMethod, pkp: IRelayPKP) => {
    console.log('Storing session:', { authMethod, pkp });
    localStorage.setItem(SESSION_STORAGE_KEYS.AUTH_METHOD, JSON.stringify(authMethod));
    localStorage.setItem(SESSION_STORAGE_KEYS.PKP, JSON.stringify(pkp));
    localStorage.setItem(SESSION_STORAGE_KEYS.ACTIVE, 'true');
    
    setSessionData({
      authMethod,
      pkp,
      isActive: true
    });
  }, []);

  const clearSession = useCallback(() => {
    console.log('Clearing session...');
    localStorage.removeItem(SESSION_STORAGE_KEYS.AUTH_METHOD);
    localStorage.removeItem(SESSION_STORAGE_KEYS.PKP);
    localStorage.removeItem(SESSION_STORAGE_KEYS.ACTIVE);
    
    setSessionData({
      authMethod: null,
      pkp: null,
      isActive: false
    });
  }, []);

  return {
    sessionData,
    storeSession,
    clearSession,
    isAuthenticated: sessionData.isActive && !!sessionData.authMethod && !!sessionData.pkp
  };
} 