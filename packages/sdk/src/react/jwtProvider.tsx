import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { IRelayPKP } from '@lit-protocol/types';

import { verify } from '../jwt';
import type { AppInfo, AuthenticationInfo } from '../jwt/types';
import { useVincentWebAppClient } from './useVincentWebAppClient';

export interface AuthInfo {
  app: AppInfo;
  authentication: AuthenticationInfo;
  jwt: string;
  pkp: IRelayPKP;
}

interface JwtContextType {
  authInfo: AuthInfo | null;
  loading: boolean;
  getJwtFromConsentPage: (redirectUri: string) => void;
  loginWithJwt: () => void;
  logOut: () => void;
}

function jwtContextNotInitialized() {
  throw new Error('JwtContext must be used within an JwtProvider');
}

export const JwtContext = createContext<JwtContextType>({
  authInfo: null,
  loading: false,
  getJwtFromConsentPage: jwtContextNotInitialized,
  loginWithJwt: jwtContextNotInitialized,
  logOut: jwtContextNotInitialized,
});

export function useJwtContext(): JwtContextType {
  return useContext(JwtContext);
}

export interface AsyncStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

interface JwtProviderProps {
  children: ReactNode;
  appId: string;
  storage?: AsyncStorage;
  storageKeyBuilder?: (appId: string) => string;
}

export const JwtProvider: React.FC<JwtProviderProps> = ({
  children,
  appId,
  storage = localStorage,
  storageKeyBuilder = (appId) => `vincent-${appId}-jwt`,
}) => {
  const appJwtKey = storageKeyBuilder(appId);
  const vincentWebAppClient = useVincentWebAppClient(appId);
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const logOut = useCallback(async () => {
    try {
      setLoading(true);
      setAuthInfo(null);
      await storage.removeItem(appJwtKey);
    } finally {
      setLoading(false);
    }
  }, [appJwtKey, storage]);

  const getJwtFromConsentPage = useCallback(
    (redirectUri: string) => {
      // Redirect to Vincent Auth consent page with appId and version
      vincentWebAppClient.redirectToConsentPage({
        // consentPageUrl: `http://localhost:5173/`,
        redirectUri,
      });
    },
    [vincentWebAppClient]
  );

  const getJwt = useCallback(async () => {
    if (vincentWebAppClient.isLogin()) {
      const jwtResult = vincentWebAppClient.decodeVincentLoginJWT(window.location.origin);

      if (!jwtResult) {
        return null;
      }

      const { decodedJWT, jwtStr } = jwtResult;
      await storage.setItem(appJwtKey, jwtStr);
      vincentWebAppClient.removeLoginJWTFromURI();

      return { jwtStr, decodedJWT };
    }

    const existingJwtStr = await storage.getItem(appJwtKey);
    if (!existingJwtStr) {
      return null;
    }

    const decodedJWT = verify(existingJwtStr, window.location.origin);

    return { jwtStr: existingJwtStr, decodedJWT };
  }, [appJwtKey, storage, vincentWebAppClient]);

  const loginWithJwt = useCallback(async () => {
    try {
      setLoading(true);

      const jwtResult = await getJwt();
      if (!jwtResult) {
        throw new Error('Could not get JWT');
      }

      const { decodedJWT, jwtStr } = jwtResult;
      setAuthInfo({
        app: decodedJWT.payload.app,
        authentication: decodedJWT.payload.authentication,
        jwt: jwtStr,
        pkp: decodedJWT.payload.pkp,
      });
    } catch (error) {
      console.error(`Error logging in with JWT. Need to relogin: ${(error as Error).message}`);
      await logOut();
    } finally {
      setLoading(false);
    }
  }, [getJwt, logOut]);

  const value = useMemo<JwtContextType>(
    () => ({
      authInfo,
      getJwtFromConsentPage,
      loading,
      loginWithJwt,
      logOut,
    }),
    [authInfo, getJwtFromConsentPage, loading, loginWithJwt, logOut]
  );

  useEffect(() => {
    loginWithJwt();
  }, [loginWithJwt]);

  return <JwtContext.Provider value={value}>{children}</JwtContext.Provider>;
};
