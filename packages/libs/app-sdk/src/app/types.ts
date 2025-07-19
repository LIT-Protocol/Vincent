import type { VincentJWT } from '../jwt/types';

/**
 * @category Interfaces
 */
export interface VincentAppClientConfig {
  appId: string;
}

/**
 * @category Interfaces
 */
export interface RedirectToVincentConsentPageParams {
  redirectUri: string;
  /** This only needs to be provided for local development with the entire stack
   * @hidden
   * */
  consentPageUrl?: string;
}

/**
 * The Vincent Web Application Client is used in web apps to handle interactions with the Vincent app portal.
 *
 * - Consent page redirection
 * - Authentication helpers that are browser specific
 *
 * @category Interfaces
 */
export interface VincentWebAppClient {
  /**
   * Redirects the user to the Vincent consent page.
   *
   * If the user approves your app permissions, they will be redirected back to the `redirectUri`.
   *
   * Use {@link VincentWebAppClient.isLogin} to detect if a user has just opened your app via the consent page
   *
   * Use {@link VincentWebAppClient.decodeVincentLoginJWT} to decode and verify the {@link VincentJWT} from the page URI, and store it for later usage
   *
   * NOTE: You must register the `redirectUri` on your Vincent app for it to be considered a valid redirect target
   *
   * @example
   * ```typescript
   *   import { getVincentWebAppClient } from '@lit-protocol/vincent-app-sdk';
   *
   *   const vincentAppClient = getVincentWebAppClient({ appId: MY_APP_ID });
   *   // ... In your app logic:
   *   if(vincentAppClient.isLogin()) {
   *     // Handle app logic for the user has just logged in
   *     const { decoded, jwt } = vincentAppClient.decodeVincentLoginJWT(EXPECTED_AUDIENCE);
   *     // Store `jwt` for later usage; the user is now logged in.
   *   } else {
   *     // Handle app logic for the user is already logged in (check for stored & unexpired JWT)
   *     // ...
   *
   *     // Handle app logic for the user is not yet logged in
   *    vincentAppClient.redirectToConsentPage({ redirectUri: window.location.href });
   *   }
   * ```
   * @function
   * @inline
   */
  redirectToConsentPage: (redirectConfig: RedirectToVincentConsentPageParams) => void;

  /**
   * Determines whether the current window location is a login URI associated with Vincent

   * You can use this to detect if a user is loading your app as a result of approving permissions
   * on the Vincent consent page -- e.g. they just logged in
   *
   * See: {@link VincentWebAppClient.redirectToConsentPage} for example usage
   *
   * @function
   * @inline
   * @returns `true` if the current window URI is a login URI, otherwise `false`.
   */
  isLogin: () => boolean;

  /**
   * Extracts a decoded/parsed Vincent JWT (JSON Web Token) from the current window location
   *
   * The token is verified as part of this process; if the token is invalid or expired, this method will throw.
   *
   * See: {@link VincentWebAppClient.redirectToConsentPage} for example usage
   *
   * @param { string } expectedAudience Provide a valid `redirectUri` for your app; this is typically your app's origin
   * @function
   * @inline
   * @returns {decodedJWT: VincentJWT; jwtStr: string | null} `null` if no JWT is found, otherwise both the decoded jwt and the original JWT string is returned
   * @throws {Error} If there was a JWT in the page URL, but it was invalid / could not be verified
   */
  decodeVincentLoginJWT: (
    expectedAudience: string
  ) => { decodedJWT: VincentJWT; jwtStr: string } | null;

  /**
   * Removes the Vincent login JWT from the current window URI.
   *
   * This is useful for cleaning up the URL after decoding and storing the JWT,
   * ensuring the redirect URL looks clean for the user and no sensitive information
   * is exposed in the URI.
   *
   * @example
   * ```typescript
   * import { getVincentWebAppClient } from '@lit-protocol/vincent-app-sdk';
   *
   * const vincentAppClient = getVincentWebAppClient({ appId: MY_APP_ID });
   *
   * if (vincentAppClient.isLogin()) {
   *   const { decodedJWT, jwtStr } = vincentAppClient.decodeVincentLoginJWT();
   *   // Store the JWT and use it for authentication
   *
   *   // Now we can remove the JWT from the URL searchParams
   *   vincentAppClient.removeLoginJWTFromURI();
   * }
   * ```
   *
   * @function
   * @inline
   */
  removeLoginJWTFromURI: () => void;
}
