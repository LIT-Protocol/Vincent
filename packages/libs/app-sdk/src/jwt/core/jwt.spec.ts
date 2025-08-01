import * as secp256k1 from '@noble/secp256k1';
import { ethers } from 'ethers';
import { toUtf8Bytes } from 'ethers/lib/utils';

import type { IRelayPKP } from '@lit-protocol/types';

import type { AnyVincentJWT } from '../types';

import { VINCENT_JWT_API_VERSION } from '../constants';
import { createPlatformUserJWT, createAppUserJWT, createDelegateeJWT } from './create';
import { decodeVincentJWT } from './decode';
import { isExpired } from './isExpired';
import { toBase64Url, validateJWTTime } from './utils';
import { verifyES256KSignature } from './utils/verifyES256KSignature';
import {
  verifyAnyVincentJWT,
  verifyVincentAppUserJWT,
  verifyVincentPlatformJWT,
  verifyVincentDelegateeJWT,
} from './verify';

describe('Vincent JWT - 3 Role Test Suite', () => {
  const testPrivateKey = '0x1234567890123456789012345678901234567890123456789012345678901234';
  const testWallet = new ethers.Wallet(testPrivateKey);
  const publicKeyBytes = secp256k1.getPublicKey(testWallet.privateKey.slice(2), false); // uncompressed
  const publicKeyHex = `0x${Buffer.from(publicKeyBytes).toString('hex')}`;

  const testWalletAddress = `${testWallet.address}` as const;

  const testPkp: IRelayPKP = {
    publicKey: publicKeyHex,
    ethAddress: testWallet.address,
    tokenId: '1',
  };

  const commonAudience = 'https://test-app.com';

  describe('platform-user JWT', () => {
    it('creates and verifies a platform-user token', async () => {
      const jwt = await createPlatformUserJWT({
        pkpWallet: testWallet as any,
        pkpInfo: testPkp,
        authentication: { type: 'email', value: 'test@example.com' },
        audience: commonAudience,
        expiresInMinutes: 60,
        payload: { custom: 'yes' },
      });

      const decoded = await verifyAnyVincentJWT({ jwt, expectedAudience: commonAudience });
      expect(decoded.payload.role).toBe('platform-user');
      expect(decoded.payload.iss).toBe(testWalletAddress);
      expect(decoded.payload.pkpInfo.publicKey).toBe(testPkp.publicKey);
    });

    it('verifies a platform-user token with verifyVincentPlatformJWT', async () => {
      const jwt = await createPlatformUserJWT({
        pkpWallet: testWallet as any,
        pkpInfo: testPkp,
        authentication: { type: 'email', value: 'test@example.com' },
        audience: commonAudience,
        expiresInMinutes: 60,
        payload: { custom: 'yes' },
      });

      const decoded = await verifyVincentPlatformJWT({ jwt, expectedAudience: commonAudience });
      expect(decoded.payload.role).toBe('platform-user');
      expect(decoded.payload.iss).toBe(testWalletAddress);
      expect(decoded.payload.pkpInfo.publicKey).toBe(testPkp.publicKey);
      expect(decoded.payload.authentication.type).toBe('email');
      expect(decoded.payload.authentication.value).toBe('test@example.com');
    });

    it('throws error when verifying non-platform token with verifyVincentPlatformJWT', async () => {
      const jwt = await createAppUserJWT({
        pkpWallet: testWallet as any,
        pkpInfo: testPkp,
        authentication: { type: 'email', value: 'test@example.com' },
        audience: commonAudience,
        expiresInMinutes: 60,
        app: { id: 123, version: 1 },
      });

      await expect(
        verifyVincentPlatformJWT({ jwt, expectedAudience: commonAudience })
      ).rejects.toThrow(/not a platform token/);
    });
  });

  describe('app-user JWT', () => {
    it('creates and verifies an app-user token', async () => {
      const jwt = await createAppUserJWT({
        pkpWallet: testWallet as any,
        pkpInfo: testPkp,
        authentication: { type: 'email', value: 'test@example.com' },
        audience: commonAudience,
        expiresInMinutes: 60,
        app: { id: 123, version: 1 },
        payload: { hello: 'world' },
      });

      const decoded = await verifyVincentAppUserJWT({
        jwt,
        expectedAudience: commonAudience,
        requiredAppId: 123,
      });

      expect(decoded.payload.role).toBe('app-user');
      expect(decoded.payload.app.id).toBe(123);
      expect(decoded.payload.iss).toBe(testWalletAddress);
    });
  });

  describe('app-delegatee JWT', () => {
    it('creates and verifies a delegatee token', async () => {
      const subjectAddress = `0xuser0000000000000000000000000000000000000000`;
      const jwt = await createDelegateeJWT({
        ethersWallet: testWallet,
        subjectAddress,
        audience: commonAudience,
        expiresInMinutes: 60,
      });

      const verified = await verifyAnyVincentJWT({ jwt, expectedAudience: commonAudience });
      expect(verified.payload.role).toBe('app-delegatee');
      expect(verified.payload.sub).toBe(subjectAddress);
      expect(verified.payload.iss).toBe(testWalletAddress);
      expect(verified.payload.publicKey).toBe(publicKeyHex);
    });

    it('verifies a delegatee token with verifyVincentDelegateeJWT', async () => {
      const subjectAddress = `0xuser0000000000000000000000000000000000000000`;
      const jwt = await createDelegateeJWT({
        ethersWallet: testWallet,
        subjectAddress,
        audience: commonAudience,
        expiresInMinutes: 60,
      });

      const verified = await verifyVincentDelegateeJWT({ jwt, expectedAudience: commonAudience });
      expect(verified.payload.role).toBe('app-delegatee');
      expect(verified.payload.sub).toBe(subjectAddress);
      expect(verified.payload.iss).toBe(testWalletAddress);
      expect(verified.payload.publicKey).toBe(publicKeyHex);
    });

    it('throws error when verifying non-delegatee token with verifyVincentDelegateeJWT', async () => {
      const jwt = await createPlatformUserJWT({
        pkpWallet: testWallet as any,
        pkpInfo: testPkp,
        authentication: { type: 'email' },
        audience: commonAudience,
        expiresInMinutes: 60,
      });

      await expect(
        verifyVincentDelegateeJWT({ jwt, expectedAudience: commonAudience })
      ).rejects.toThrow(/not a platform token/);
    });
  });

  describe('isExpired()', () => {
    it('returns true for expired JWT', async () => {
      const jwt = await createPlatformUserJWT({
        pkpWallet: testWallet as any,
        pkpInfo: testPkp,
        authentication: { type: 'email' },
        audience: commonAudience,
        expiresInMinutes: -1,
      });

      const decoded = decodeVincentJWT(jwt);
      expect(isExpired(decoded)).toBe(true);
    });

    it('returns false for valid JWT', async () => {
      const jwt = await createPlatformUserJWT({
        pkpWallet: testWallet as any,
        pkpInfo: testPkp,
        authentication: { type: 'email' },
        audience: commonAudience,
        expiresInMinutes: 10,
      });

      const decoded = decodeVincentJWT(jwt);
      expect(isExpired(decoded)).toBe(false);
    });

    it('returns true if no expiration field exists', () => {
      const jwt: AnyVincentJWT = {
        header: { alg: 'ES256K', typ: 'JWT' },
        // @ts-expect-error Testing invalid payload shape
        payload: {
          iat: Math.floor(Date.now() / 1000),
          iss: testWalletAddress as any,
          aud: commonAudience,
          publicKey: publicKeyHex,
          role: 'app-delegatee',
          __vincentJWTApiVersion: VINCENT_JWT_API_VERSION,
        },
        signature: 'fake',
        data: 'fake',
      };
      expect(isExpired(jwt)).toBe(true);
    });
  });

  describe('decodeVincentJWT()', () => {
    it('throws error for invalid JWT format', () => {
      expect(() => decodeVincentJWT('invalid.jwt.format')).toThrow();
      expect(() => decodeVincentJWT('not-even-a-jwt')).toThrow();
    });

    it('throws error for unrecognized role', () => {
      // Create a JWT-like string with an invalid role
      const header = toBase64Url(toUtf8Bytes(JSON.stringify({ alg: 'ES256K', typ: 'JWT' })));
      const payload = toBase64Url(
        toUtf8Bytes(
          JSON.stringify({ __vincentJWTApiVersion: VINCENT_JWT_API_VERSION, role: 'invalid-role' })
        )
      );
      const invalidJwt = `${header}.${payload}.signature`;

      console.log('invalidJwt', invalidJwt);
      expect(() => decodeVincentJWT(invalidJwt)).toThrow(/Unrecognized role/);
    });

    it('throws error for an invalid version ', () => {
      const header = toBase64Url(toUtf8Bytes(JSON.stringify({ alg: 'ES256K', typ: 'JWT' })));
      const payload = toBase64Url(
        toUtf8Bytes(JSON.stringify({ __vincentJWTApiVersion: -1, role: 'app-user' }))
      );
      const invalidJwt = `${header}.${payload}.signature`;

      console.log('invalidJwt', invalidJwt);
      expect(() => decodeVincentJWT(invalidJwt)).toThrow(/Invalid JWT API version./);
    });
  });

  describe('verifyAnyVincentJWT() error cases', () => {
    it('throws error when expectedAudience is not provided', async () => {
      const jwt = await createPlatformUserJWT({
        pkpWallet: testWallet as any,
        pkpInfo: testPkp,
        authentication: { type: 'email' },
        audience: commonAudience,
        expiresInMinutes: 60,
      });

      // @ts-expect-error - Testing invalid input
      await expect(verifyAnyVincentJWT({ jwt })).rejects.toThrow(
        /must provide an expectedAudience/
      );
    });

    it('throws error when audience does not match', async () => {
      const jwt = await createPlatformUserJWT({
        pkpWallet: testWallet as any,
        pkpInfo: testPkp,
        authentication: { type: 'email' },
        audience: commonAudience,
        expiresInMinutes: 60,
      });

      await expect(
        verifyAnyVincentJWT({ jwt, expectedAudience: 'wrong-audience' })
      ).rejects.toThrow(/Expected audience/);
    });

    it('throws error when JWT is expired', async () => {
      const jwt = await createPlatformUserJWT({
        pkpWallet: testWallet as any,
        pkpInfo: testPkp,
        authentication: { type: 'email' },
        audience: commonAudience,
        expiresInMinutes: -1, // Expired
      });

      await expect(verifyAnyVincentJWT({ jwt, expectedAudience: commonAudience })).rejects.toThrow(
        /JWT expired/
      );
    });
  });

  describe('validateJWTTime()', () => {
    it('validates JWT with valid time claims', () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const payload = {
        iat: currentTime - 60, // Issued 1 minute ago
        nbf: currentTime - 30, // Valid from 30 seconds ago
      };

      expect(validateJWTTime(payload, currentTime)).toBe(true);
    });

    it('throws error when nbf claim is in the future', () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const payload = {
        nbf: currentTime + 60, // Not valid for another minute
      };

      expect(() => validateJWTTime(payload, currentTime)).toThrow(/not yet valid/);
    });

    it('throws error when iat claim is too far in the future', () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const payload = {
        iat: currentTime + 60, // Issued 1 minute in the future
      };

      expect(() => validateJWTTime(payload, currentTime)).toThrow(/issued in the future/);
    });

    it('allows small clock skew for iat claim', () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const payload = {
        iat: currentTime + 20, // Issued 20 seconds in the future (within 30s leeway)
      };

      expect(validateJWTTime(payload, currentTime)).toBe(true);
    });
  });

  describe('verifyES256KSignature()', () => {
    it('verifies a valid signature', async () => {
      // Create a JWT with a valid signature
      const jwt = await createPlatformUserJWT({
        pkpWallet: testWallet as any,
        pkpInfo: testPkp,
        authentication: { type: 'email' },
        audience: commonAudience,
        expiresInMinutes: 60,
      });

      // Decode it and verify the signature
      const decoded = decodeVincentJWT(jwt);
      await expect(verifyES256KSignature({ decoded })).resolves.not.toThrow();
    });

    it('throws error for invalid signature', async () => {
      // Create a JWT with a valid signature
      const jwt = await createPlatformUserJWT({
        pkpWallet: testWallet as any,
        pkpInfo: testPkp,
        authentication: { type: 'email' },
        audience: commonAudience,
        expiresInMinutes: 60,
      });

      // Decode it and tamper with the signature
      const decoded = decodeVincentJWT(jwt);
      const tamperedDecoded = {
        ...decoded,
        signature: 'tampered_signature', // Invalid base64 signature
      };

      await expect(verifyES256KSignature({ decoded: tamperedDecoded })).rejects.toThrow(
        /Invalid signature/
      );
    });

    it('throws error when public key does not match signature', async () => {
      // Create a JWT with a valid signature
      const jwt = await createPlatformUserJWT({
        pkpWallet: testWallet as any,
        pkpInfo: testPkp,
        authentication: { type: 'email' },
        audience: commonAudience,
        expiresInMinutes: 60,
      });

      // Decode it and tamper with the public key
      const decoded = decodeVincentJWT(jwt);
      const tamperedDecoded = {
        ...decoded,
        payload: {
          ...decoded.payload,
          publicKey: '0x' + '1'.repeat(128), // Different public key
        },
      };

      // @ts-expect-error testing invalid input
      await expect(verifyES256KSignature({ decoded: tamperedDecoded })).rejects.toThrow(
        /Invalid signature/
      );
    });
  });
});
