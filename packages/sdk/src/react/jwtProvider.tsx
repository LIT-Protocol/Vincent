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

import { jwt } from '..';

import { useVincentWebAppClient } from './useVincentWebAppClient';

const { verify } = jwt;

export interface AuthInfo {
  jwt: string;
  pkp: IRelayPKP;
}

interface JwtContextType {
  authInfo: AuthInfo | null;
  getJwtFromConsentPage: (redirectUri: string) => void;
  logWithJwt: (token: string | null) => void;
  logOut: () => void;
}

function jwtContextNotInitialized() {
  throw new Error('JwtContext must be used within an JwtProvider');
}

export const JwtContext = createContext<JwtContextType>({
  authInfo: null,
  getJwtFromConsentPage: jwtContextNotInitialized,
  logWithJwt: jwtContextNotInitialized,
  logOut: jwtContextNotInitialized,
});

export function useJwtContext(): JwtContextType {
  return useContext(JwtContext);
}

interface JwtProviderProps {
  children: ReactNode;
  appId: string;
}

export const JwtProvider: React.FC<JwtProviderProps> = ({ children, appId }) => {
  const appJwtKey = `${appId}-jwt`;
  const vincentWebAppClient = useVincentWebAppClient(appId);
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);

  const logOut = useCallback(() => {
    setAuthInfo(null);
    localStorage.removeItem(appJwtKey);
  }, []);

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

  const logWithJwt = useCallback(() => {
    const existingJwtStr = localStorage.getItem(appJwtKey);
    const didJustLogin = vincentWebAppClient.isLogin();

    if (didJustLogin) {
      try {
        const jwtResult = vincentWebAppClient.decodeVincentLoginJWT(window.location.origin);

        if (jwtResult) {
          const { decodedJWT, jwtStr } = jwtResult;

          localStorage.setItem(appJwtKey, jwtStr);
          vincentWebAppClient.removeLoginJWTFromURI();
          setAuthInfo({
            jwt: jwtStr,
            pkp: decodedJWT.payload.pkp,
          });
          return;
        } else {
          logOut();
          return;
        }
      } catch (e) {
        console.error('Error decoding JWT:', e);
        logOut();
        return;
      }
    }

    if (existingJwtStr) {
      try {
        const decodedJWT = verify(existingJwtStr, window.location.origin);

        setAuthInfo({
          jwt: existingJwtStr,
          pkp: decodedJWT.payload.pkp,
        });
      } catch (error: unknown) {
        console.error(`Error verifying existing JWT. Need to relogin: ${(error as Error).message}`);
        logOut();
      }
    }
  }, [logOut, vincentWebAppClient]);

  const value = useMemo(
    () => ({
      authInfo,
      getJwtFromConsentPage,
      logWithJwt,
      logOut,
    }),
    [authInfo, getJwtFromConsentPage, logWithJwt, logOut]
  );

  useEffect(() => {
    try {
      logWithJwt();
    } catch {
      logOut();
    }
  }, [logWithJwt, logOut]);

  return <JwtContext.Provider value={value}>{children}</JwtContext.Provider>;
};
