import type { VincentJWT, VincentJWTAppSpecific } from '../jwt/types';

export interface WebAuthClientConfig {
  appId: number;
}

export interface RedirectToVincentDelegationPageParams {
  redirectUri: string;
  /** This only needs to be provided for local development with the entire stack
   * @hidden
   * */
  connectPageUrl?: string;
}

/**
 * The Vincent Web Application Client is used in web apps to handle interactions with the Vincent app portal.
 *
 * - Connect page redirection
 * - Authentication helpers that are browser specific
 *
 */
export interface WebAuthClient {
  /**
   * Redirects the user to the Vincent Connect page.
   *
   * If the user approves your app permissions, they will be redirected back to the `redirectUri`.
   *
   * Use {@link WebAuthClient.uriContainsVincentJWT} to detect if a user has just opened your app via the Connect page
   *
   * Use {@link WebAuthClient.decodeVincentJWT} to decode and verify the {@link VincentJWT} from the page URI, and store it for later usage
   *
   * NOTE: You must register the `redirectUri` on your Vincent app for it to be considered a valid redirect target
   *
   * @example
   * ```typescript
   * import { getWebAuthClient } from '@lit-protocol/vincent-app-sdk/webAuthClient';
   *
   * const vincentAppClient = getWebAuthClient({ appId: MY_APP_ID });
   * // ... In your app logic:
   * if(vincentAppClient.uriContainsVincentJWT()) {
   *   // Handle app logic for the user has just logged in
   *   const { decoded, jwtStr } = vincentAppClient.decodeVincentJWT(EXPECTED_AUDIENCE);
   *   // Store `jwtStr` for later usage; the user is now logged in.
   * } else {
   *   // Handle app logic for the user is already logged in (check for stored & unexpired JWT)
   *   // ...
   *    *   // Handle app logic for the user is not yet logged in
   *  vincentAppClient.redirectToConnectPage({ redirectUri: window.location.href });
   * }
   * ```
   * @function
   * @inline
   */
  redirectToConnectPage: (redirectConfig: RedirectToVincentDelegationPageParams) => void;

  /**
   * Determines whether the current window location contains a Vincent JWT

   * You can use this to detect if a user is loading your app as a result of approving permissions
   * on the Vincent Connect page -- e.g. they just logged in
   *
   * See: {@link WebAuthClient.redirectToConnectPage} for example usage
   *
   * @function
   * @inline
   * @returns `true` if the current window URI contains a Vincent JWT, otherwise `false`.
   */
  uriContainsVincentJWT: () => boolean;

  /**
   * Extracts a decoded/parsed Vincent JWT (JSON Web Token) from the current window location
   *
   * The token is verified as part of this process; if the token is invalid or expired, this method will throw.
   *
   * See: {@link WebAuthClient.redirectToConnectPage} for example usage
   *
   * @param expectedAudience Provide a valid `redirectUri` for your app; this is typically your app's origin
   * @function
   * @inline
   * @returns {decodedJWT: VincentJWTAppSpecific; jwtStr: string | null} `null` if no JWT is found, otherwise both the decoded jwt and the original JWT string is returned
   * @throws {Error} If there was a JWT in the page URL, but it was invalid / could not be verified
   */
  decodeVincentJWT: (
    expectedAudience: string
  ) => { decodedJWT: VincentJWTAppSpecific; jwtStr: string } | null;

  /**
   * Removes the Vincent connect JWT from the current window URI.
   *
   * This is useful for cleaning up the URL after decoding and storing the JWT,
   * ensuring the redirect URL looks clean for the user and no sensitive information
   * is exposed in the URI.
   *
   * @example
   * ```typescript
   * import { getWebAuthClient } from '@lit-protocol/vincent-app-sdk/webAuthClient';
   *
   * const vincentAppClient = getWebAuthClient({ appId: MY_APP_ID });
   *
   * if (vincentAppClient.uriContainsVincentJWT()) {
   *   const { decodedJWT, jwtStr } = vincentAppClient.decodeVincentJWT();
   *   // Store the JWT and use it for authentication
   *
   *   // Now we can remove the JWT from the URL searchParams
   *   vincentAppClient.removeVincentJWTFromURI();
   * }
   * ```
   *
   * @function
   * @inline
   */
  removeVincentJWTFromURI: () => void;
}
