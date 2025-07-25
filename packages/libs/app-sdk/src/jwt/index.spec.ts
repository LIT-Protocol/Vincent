import * as didJWT from 'did-jwt';
import { ethers } from 'ethers';

import type { IRelayPKP } from '@lit-protocol/types';

import type { JWTConfig, VincentJWT } from './types';

import { create, decode, verify, isExpired } from './index';

describe('JWT Module', () => {
  // Test data
  const testPrivateKey = '0x1234567890123456789012345678901234567890123456789012345678901234';
  const testWallet = new ethers.Wallet(testPrivateKey);
  const testPkp: IRelayPKP = {
    publicKey: testWallet.publicKey, // Use the actual public key from the wallet
    ethAddress: testWallet.address,
    tokenId: '1',
  };

  // JWT config using actual ethers.Wallet
  const jwtConfig: JWTConfig = {
    pkpWallet: testWallet as any, // Using 'as any' to satisfy the type requirement
    pkp: testPkp,
    payload: { customClaim: 'test-value' },
    expiresInMinutes: 60,
    audience: 'https://test-app.com',
    app: {
      id: 123,
      version: 1,
    },
    authentication: {
      type: 'email',
      value: 'test@example.com',
    },
  };

  describe('create', () => {
    it('should create a valid JWT', async () => {
      const result = await create(jwtConfig);

      // Decode the JWT to verify its contents
      const decoded = didJWT.decodeJWT(result);

      // Verify the JWT contains the expected claims
      expect(decoded.payload).toMatchObject({
        aud: jwtConfig.audience,
        iss: `did:ethr:${testPkp.ethAddress}`,
        customClaim: 'test-value',
      });

      // Verify the JWT has the expected header
      expect(decoded.header).toMatchObject({
        alg: 'ES256K',
        typ: 'JWT',
      });

      // Verify the JWT has the expected timestamps
      expect(decoded.payload.iat).toBeDefined();
      expect(decoded.payload.exp).toBeDefined();
      expect(typeof decoded.payload.iat).toBe('number');
      expect(typeof decoded.payload.exp).toBe('number');

      // Verify the JWT expiration is set correctly
      const now = Math.floor(Date.now() / 1000);
      expect(decoded.payload.exp).toBeGreaterThan(now);
      expect(decoded.payload.exp).toBeLessThanOrEqual(now + jwtConfig.expiresInMinutes * 60);
    });
  });

  describe('decode', () => {
    it('should decode a valid JWT', async () => {
      // Create a real JWT using our test wallet
      const jwt = await create(jwtConfig);

      // Decode the JWT using our function
      const result = decode({ jwt, requiredAppId: undefined });

      // Verify the decoded JWT contains the expected fields
      expect(result).toMatchObject({
        payload: {
          pkp: testPkp,
          app: {
            id: 123,
            version: 1,
          },
          authentication: {
            type: 'email',
            value: 'test@example.com',
          },
          aud: 'https://test-app.com',
          iss: `did:ethr:${testPkp.ethAddress}`,
        },
        header: {
          alg: 'ES256K',
          typ: 'JWT',
        },
      });
    });

    it('should throw an error if JWT is missing pkp', async () => {
      // Create a config without pkp
      const configWithoutPkp = { ...jwtConfig };
      // @ts-expect-error This is a test.
      delete configWithoutPkp.pkp;

      // Create a JWT without pkp
      const jwt = await create(configWithoutPkp as any);

      // Verify that decode throws the expected error
      expect(() => decode({ jwt, requiredAppId: undefined })).toThrow(
        /Missing "pkp" field in JWT payload/
      );
    });

    it('should not throw an error if JWT is missing app but no `requiredAppId` is provided', async () => {
      // Create a config without app
      const configWithoutApp = { ...jwtConfig };
      delete configWithoutApp.app;

      // Create a JWT without app
      const jwt = await create(configWithoutApp);

      // Verify that decode throws the expected error
      expect(() => decode({ jwt, requiredAppId: undefined })).not.toThrow();
    });

    it('should throw an error if JWT is missing app and requires one', async () => {
      // Create a config without app
      const configWithoutApp = { ...jwtConfig };
      delete configWithoutApp.app;

      // Create a JWT without app
      const jwt = await create(configWithoutApp);

      // Verify that decode throws the expected error
      expect(() => decode({ jwt, requiredAppId: 555 })).toThrow(
        /JWT is not app specific; cannot verify requiredAppId/
      );
    });

    it('should throw an error if JWT has wrong app ID', async () => {
      // Create a config without app

      // Create a JWT without app
      const jwt = await create(jwtConfig);

      // Verify that decode throws the expected error
      expect(() => decode({ jwt: jwt, requiredAppId: 555 })).toThrow(
        /appId in JWT does not match requiredAppId/
      );
    });
  });

  describe('verify', () => {
    it('should verify a valid JWT', async () => {
      // Create a real JWT using our test wallet
      const jwt = await create(jwtConfig);

      // Verify the JWT with the correct audience
      const result = verify({
        jwt,
        expectedAudience: 'https://test-app.com',
        requiredAppId: undefined,
      });

      // Verify the result contains the expected fields
      expect(result).toMatchObject({
        payload: {
          pkp: testPkp,
          aud: 'https://test-app.com',
          app: {
            id: 123,
            version: 1,
          },
          authentication: {
            type: 'email',
            value: 'test@example.com',
          },
        },
      });
    });

    it('should throw an error if JWT is expired', async () => {
      // Create a JWT that is already expired
      const expiredJwt = await create({
        ...jwtConfig,
        expiresInMinutes: -60, // :lol:
        payload: {
          ...jwtConfig.payload,
        },
      });

      // Verify that verification throws the expected error
      expect(() =>
        verify({
          jwt: expiredJwt,
          expectedAudience: 'https://test-app.com',
          requiredAppId: undefined,
        })
      ).toThrow(/JWT expired/);
    });

    it('should throw an error if audience does not match', async () => {
      // Create a JWT with a different audience
      const jwt = await create({
        ...jwtConfig,
        audience: 'https://different-app.com',
      });

      // Verify that verification throws the expected error when using a different audience
      expect(() =>
        verify({ jwt, expectedAudience: 'https://test-app.com', requiredAppId: undefined })
      ).toThrow(/Expected audience/);
    });
  });

  describe('isExpired', () => {
    it('should return true if JWT is expired', async () => {
      // Create a JWT that is already expired
      const expiredJwt = await create({
        ...jwtConfig,
        expiresInMinutes: -60, // :lol:
        payload: {
          ...jwtConfig.payload,
        },
      });

      // Decode the JWT
      const decodedJwt = decode({ jwt: expiredJwt, requiredAppId: undefined });

      // Check if it's expired
      expect(isExpired(decodedJwt)).toBe(true);
    });

    it('should return false if JWT is not expired', async () => {
      // Create a JWT that is not expired
      const iat = Math.floor(Date.now() / 1000);
      const exp = Math.floor(Date.now() / 1000) + 3600; // Expires in 1 hour
      const validJwt = await create({
        ...jwtConfig,
        expiresInMinutes: (exp - iat) / 60, // Calculate minutes between iat and exp
        payload: {
          ...jwtConfig.payload,
          iat,
          exp,
        },
      });

      // Decode the JWT
      const decodedJwt = decode({ jwt: validJwt, requiredAppId: undefined });

      // Check if it's expired
      expect(isExpired(decodedJwt)).toBe(false);
    });

    it('should return true if JWT has no expiration', () => {
      // Create a JWT object with no expiration
      const noExpJWT: VincentJWT = {
        header: { alg: 'ES256K', typ: 'JWT' },
        payload: {
          iat: Math.floor(Date.now() / 1000),
          // No exp field
          iss: `did:ethr:${testPkp.ethAddress}`,
          aud: 'https://test-app.com',
          pkp: testPkp,
          app: {
            id: 123,
            version: 1,
          },
          authentication: {
            type: 'email',
            value: 'test@example.com',
          },
        },
        signature: 'signature',
        data: 'data',
      };

      // Check if it's expired
      expect(isExpired(noExpJWT)).toBe(true);
    });
  });
});
