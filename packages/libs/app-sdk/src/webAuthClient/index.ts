/** The webAuthClient module contains methods and types that are used to implement authentication in Vincent web apps
 * Authentication is handled via redirects to the Vincent dashboard portal that return JWTs with authentication information
 * that can be used to secure your backend Vincent app UI.
 *
 * ```typescript
 * import { getWebAuthClient } from '@lit-protocol/vincent-app-sdk/webAuthClient';
 * ```
 * @packageDocumentation
 */
import { getWebAuthClient } from './app';

export { getWebAuthClient };

export type {
  WebAuthClient,
  WebAuthClientConfig,
  RedirectToVincentDelegationPageParams,
} from './types';
