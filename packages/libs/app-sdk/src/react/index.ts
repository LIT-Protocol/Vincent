/**
 * The `react` module provides React-specific utilities and components for Vincent authentication.
 *
 * This module exports:
 * - {@link JwtProvider}: A context provider that manages JWT authentication state
 * - {@link useJwtContext}: A hook to access the JWT authentication context
 * - {@link useVincentWebAuthClient}: A hook to get a memoized Vincent WebAuth client instance
 *
 * @example
 * ```tsx
 * import { JwtProvider, useJwtContext } from '@lit-protocol/vincent-app-sdk/react';
 *
 * function App() {
 *   return (
 *     <JwtProvider appId="your-vincent-app-id">
 *       <YourAuthenticatedComponent />
 *     </JwtProvider>
 *   );
 * }
 *
 * function YourAuthenticatedComponent() {
 *   const { authInfo, loading, loginWithJwt, logOut } = useJwtContext();
 *   // ... your component logic
 * }
 * ```
 *
 * @packageDocumentation
 */

export * from './jwtProvider';
export * from './useVincentWebAuthClient';
