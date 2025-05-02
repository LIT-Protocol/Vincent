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
import { useVincentWebAppClient } from './useVincentWebAppClient';

export interface AuthInfo {
  jwt: string;
  pkp: IRelayPKP;
}

interface JwtContextType {
  authInfo: AuthInfo | null;
  loading: boolean;
  getJwtFromConsentPage: (redirectUri: string) => void;
  logWithJwt: (token: string | null) => void;
  logOut: () => void;
}

function jwtContextNotInitialized() {
  throw new Error('JwtContext must be used within an JwtProvider');
}

export const JwtContext = createContext<JwtContextType>({
  authInfo: null,
  loading: false,
  getJwtFromConsentPage: jwtContextNotInitialized,
  logWithJwt: jwtContextNotInitialized,
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

  const logWithJwt = useCallback(async () => {
    try {
      setLoading(true);

      const didJustLogin = vincentWebAppClient.isLogin();
      if (didJustLogin) {
        try {
          const jwtResult = vincentWebAppClient.decodeVincentLoginJWT(window.location.origin);

          if (jwtResult) {
            const { decodedJWT, jwtStr } = jwtResult;

            await storage.setItem(appJwtKey, jwtStr);
            vincentWebAppClient.removeLoginJWTFromURI();
            setAuthInfo({
              jwt: jwtStr,
              pkp: decodedJWT.payload.pkp,
            });
            return;
          } else {
            await logOut();
            return;
          }
        } catch (e) {
          console.error('Error decoding JWT:', e);
          await logOut();
          return;
        }
      }

      const existingJwtStr = await storage.getItem(appJwtKey);
      if (existingJwtStr) {
        try {
          const decodedJWT = verify(existingJwtStr, window.location.origin);

          setAuthInfo({
            jwt: existingJwtStr,
            pkp: decodedJWT.payload.pkp,
          });
        } catch (error: unknown) {
          console.error(
            `Error verifying existing JWT. Need to relogin: ${(error as Error).message}`
          );
          await logOut();
        }
      }
    } finally {
      setLoading(false);
    }
  }, [appJwtKey, logOut, storage, vincentWebAppClient]);

  const value = useMemo<JwtContextType>(
    () => ({
      authInfo,
      getJwtFromConsentPage,
      loading,
      logWithJwt,
      logOut,
    }),
    [authInfo, getJwtFromConsentPage, loading, logWithJwt, logOut]
  );

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        await logWithJwt();
      } catch (error) {
        console.error(`Error verifying existing JWT. Need to relogin: ${(error as Error).message}`);
        await logOut();
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [logWithJwt, logOut]);

  return <JwtContext.Provider value={value}>{children}</JwtContext.Provider>;
};
