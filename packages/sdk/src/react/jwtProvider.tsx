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

/**
 * Interface representing the authenticated user information.
 *
 * Contains details about the application, authentication method, JWT token,
 * and the PKP (Programmable Key Pair) associated with the authenticated user.
 */
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

/**
 * React hook to access the JWT authentication context.
 *
 * This hook provides access to authentication state and methods for managing JWT-based
 * authentication in Vincent applications. It must be used within a component that is a
 * descendant of JwtProvider.
 *
 * @example
 * ```tsx
 * import { useJwtContext } from '@lit-protocol/vincent-sdk';
 *
 * function AuthenticatedComponent() {
 *   const { authInfo, loading, loginWithJwt, logOut } = useJwtContext();
 *
 *   if (loading) {
 *     return <div>Loading authentication...</div>;
 *   }
 *
 *   if (!authInfo) {
 *     return (
 *       <button onClick={loginWithJwt}>
 *         Login
 *       </button>
 *     );
 *   }
 *
 *   return (
 *     <div>
 *       <p>Logged in with PKP: {authInfo.pkp.ethAddress}</p>
 *       <button onClick={logOut}>Logout</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns The JWT context containing authentication state and methods
 */
export function useJwtContext(): JwtContextType {
  return useContext(JwtContext);
}

/**
 * Interface for storage providers that can be used with JwtProvider.
 *
 * This allows you to use custom storage solutions (like AsyncStorage in React Native)
 * instead of the default localStorage.
 */
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

/**
 * React component that provides JWT authentication capabilities for Vincent applications.
 *
 * The JwtProvider handles JWT token management, including
 * - Retrieving and validating JWTs from the Vincent consent page
 * - Storing and retrieving JWTs from persistent storage
 * - Providing authentication state and methods to child components
 * - Managing login/logout flows
 *
 * It uses the Context API to make authentication information and methods available
 * throughout your application without prop drilling.
 *
 * @example
 * ```tsx
 * import { JwtProvider } from '@lit-protocol/vincent-sdk';
 *
 * function App() {
 *   return (
 *     <JwtProvider appId="your-vincent-app-id">
 *       <YourApplication />
 *     </JwtProvider>
 *   );
 * }
 *
 * // In a child component:
 * function LoginButton() {
 *   const { authInfo, loading, getJwtFromConsentPage, logOut } = useJwtContext();
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   if (authInfo) {
 *     return (
 *       <div>
 *         <p>Logged in as: {authInfo.pkp.ethAddress}</p>
 *         <button onClick={logOut}>Log out</button>
 *       </div>
 *     );
 *   }
 *
 *   return (
 *     <button
 *       onClick={() => getJwtFromConsentPage(window.location.href)}
 *     >
 *       Login with Vincent
 *     </button>
 *   );
 * }
 * ```
 *
 * @param props - Props for the JwtProvider component
 * @param props.children - Child components that will have access to the JWT context
 * @param props.appId - Your Vincent App Id
 * @param props.storage - Optional custom storage implementation (defaults to localStorage)
 * @param props.storageKeyBuilder - Optional function to customize the storage key for JWT tokens
 */
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
