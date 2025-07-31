/** The `jwt` module provides helper methods that allow you to decode and validate Vincent-specific JWTs.
 *
 * Vincent JWTs are signed using `alg: ES256K`.  The signed data is EIP191 compliant.
 *
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
export { createPlatformUserJWT, createDelegateeJWT, createAppUserJWT } from './core/create';
export { isExpired } from './core/isExpired';
export {
  verifyAnyVincentJWT,
  verifyVincentAppUserJWT,
  verifyVincentPlatformJWT,
  verifyVincentDelegateeJWT,
} from './core/verify';
export { decodeVincentJWT } from './core/decode';
export {
  isAppUser,
  isPlatformUser,
  isAnyVincentJWT,
  isDelegateee,
  assertIsPKPSignedVincentJWT,
} from './typeGuards';

export type {
  BaseDecodedJWT,
  BaseJWTPayload,
  BaseVincentJWTPayload,
  AnyVincentJWT,
  VincentJWTPlatformUser,
  VincentJWTAppUser,
  VincentJWTDelegatee,
  VincentJWTRole,
  CreatePlatformUserJWTParams,
  CreateAppUserJWTParams,
  CreateDelegateeJWTParams,
  VincentPKPPayload,
} from './types';
export {
  getAppInfo,
  getPKPInfo,
  getRole,
  getSubjectAddress,
  getIssuerAddress,
  getAudience,
  getPublicKey,
  getAuthentication,
} from './accessors';
