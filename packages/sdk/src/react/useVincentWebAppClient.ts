import { useMemo } from 'react';

import { getVincentWebAppClient } from '../app';

/**
 * React hook that provides a memoized VincentWebAppClient instance.
 *
 * This hook creates a VincentWebAppClient instance using the provided App ID and memoizes it
 * to prevent unnecessary re-creation of the client on each render. The client is only
 * re-created when the App ID changes.
 *
 * The VincentWebAppClient provides methods for authentication, JWT handling, and redirecting
 * to consent pages in Vincent applications.
 *
 * @example
 * ```typescript
 * import { useVincentWebAppClient } from '@lit-protocol/vincent-sdk';
 *
 * function MyComponent() {
 *   // Create a memoized Vincent Web App client
 *   const vincentClient = useVincentWebAppClient('my-app-id');
 *
 *   // Check if the user is logging in
 *   useEffect(() => {
 *     if (vincentClient.isLogin()) {
 *       const jwtResult = vincentClient.decodeVincentLoginJWT(window.location.origin);
 *       // Handle successful login
 *       console.log('User logged in with PKP address:', jwtResult.pkpAddress);
 *
 *       // Remove JWT from URI to prevent issues with browser history
 *       vincentClient.removeLoginJWTFromURI();
 *     }
 *   }, [vincentClient]);
 *
 *   // Function to handle the login button click
 *   const handleLogin = () => {
 *     vincentClient.redirectToConsentPage({
 *       redirectUri: window.location.href,
 *     });
 *   };
 *
 *   return <button onClick={handleLogin}>Login with Vincent</button>;
 * }
 * ```
 *
 * @param appId - The unique identifier for your Vincent application
 * @returns A memoized VincentWebAppClient instance
 */
export const useVincentWebAppClient = (appId: string) => {
  return useMemo(() => getVincentWebAppClient({ appId }), [appId]);
};
