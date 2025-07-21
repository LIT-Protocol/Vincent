/** The `jwt` module provides helper methods that allow you to decode and validate Vincent-specific JWTs.
 *
 * Vincent JWTs are composed using the `did-jwt` library, but have a custom `alg` of `ES256K`, and are signed using
 * PKP ethereum keys.
 *
 * Vincent JWTs are issued by the Vincent Dashboard when a user provides delegation permission for your app to their agent PKP.
 * They are passed to your web app using a redirectUri which you configure on your app.
 *
 * The methods exported by the `jwt` module are low-level - you probably will just want to use {@link webAuthClient.getWebAuthClient | getWebAuthClient} to get
 * a {@link webAuthClient.WebAuthClient | WebAuthClient} which handles the redirect process, parsing the JWT from the URL, and verifying it for you.
 *
 * @packageDocumentation
 *
 */
export { create } from './core/create';
export { isExpired } from './core/isExpired';
export { decode, verify } from './core/validate';

export type { JWTConfig, VincentJWT, VincentJWTPayload } from './types';
