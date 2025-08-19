import { SessionSigs } from '@lit-protocol/types';
import { AuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { createPlatformUserJWT, verifyVincentPlatformJWT } from '@lit-protocol/vincent-app-sdk/jwt';
import { initPkpSigner } from '@/utils/developer-dashboard/initPkpSigner';
import { env } from '@/config/env';

const { VITE_ENV, VITE_JWT_EXPIRATION_MINUTES } = env;

type StoredJWT = {
  token: string;
  address: string;
  expiresAt: number;
};

const JWT_STORAGE_KEY = 'platformUserJWT';
const EXPECTED_AUDIENCE =
  VITE_ENV === 'staging' ? `staging.registry.heyvincent.ai` : `registry.heyvincent.ai`;

/**
 * Get current JWT token for request headers using PKP wallet - returns null if invalid
 */
export const getCurrentJwt = async (
  authInfo: AuthInfo,
  sessionSigs: SessionSigs,
): Promise<string | null> => {
  if (!authInfo?.userPKP?.ethAddress || !authInfo?.userPKP || !sessionSigs) {
    return null;
  }

  const address = authInfo.userPKP.ethAddress;

  // Check if stored token is still valid
  const stored = localStorage.getItem(JWT_STORAGE_KEY);
  if (stored) {
    try {
      const data = JSON.parse(stored);
      if (!isValidStoredJWT(data)) {
        localStorage.removeItem(JWT_STORAGE_KEY);
      } else {
        // Check if stored address matches current PKP address
        if (data.address !== address) {
          localStorage.removeItem(JWT_STORAGE_KEY);
        } else if (Date.now() < data.expiresAt) {
          // Check if token is still valid
          verifyVincentPlatformJWT({
            jwt: data.token,
            expectedAudience: EXPECTED_AUDIENCE,
          });
          return data.token;
        }
        // Token is expired or invalid, remove it
        localStorage.removeItem(JWT_STORAGE_KEY);
      }
    } catch {
      // Invalid JSON - clear it and continue to request new one
      localStorage.removeItem(JWT_STORAGE_KEY);
    }
  }

  try {
    // Create PKP wallet for signing
    const pkpWallet = await initPkpSigner({ authInfo, sessionSigs });

    // Create JWT configuration
    // Create JWT using app-SDK
    const jwt = await createPlatformUserJWT({
      pkpWallet,
      pkpInfo: authInfo.userPKP,
      payload: {
        name: 'Vincent Platform User',
      },
      expiresInMinutes: VITE_JWT_EXPIRATION_MINUTES,
      audience: EXPECTED_AUDIENCE,
      authentication: {
        type: authInfo.type,
        ...(authInfo.value ? { value: authInfo.value } : {}),
      },
    });

    const expiresAt = Date.now() + VITE_JWT_EXPIRATION_MINUTES * 60 * 1000;
    const storedData: StoredJWT = { token: jwt, address, expiresAt };
    localStorage.setItem(JWT_STORAGE_KEY, JSON.stringify(storedData));
    return jwt;
  } catch (error) {
    console.error('Error creating JWT token with PKP:', error);
    return null;
  }
};

/**
 * Store-compatible version that checks for existing valid JWT token
 */
export const getCurrentJwtTokenForStore = async (): Promise<string | null> => {
  const stored = localStorage.getItem(JWT_STORAGE_KEY);
  if (!stored) return null;

  try {
    const data = JSON.parse(stored);
    if (!isValidStoredJWT(data)) {
      localStorage.removeItem(JWT_STORAGE_KEY);
      return null;
    }

    // Check if token is still valid
    if (Date.now() < data.expiresAt) {
      verifyVincentPlatformJWT({
        jwt: data.token,
        expectedAudience: EXPECTED_AUDIENCE,
      });
      return data.token;
    }

    // Token is expired or invalid
    localStorage.removeItem(JWT_STORAGE_KEY);
    return null;
  } catch {
    localStorage.removeItem(JWT_STORAGE_KEY);
    return null;
  }
};

/**
 * Validates the structure of stored JWT data
 */
function isValidStoredJWT(data: any): data is StoredJWT {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.token === 'string' &&
    typeof data.address === 'string' &&
    typeof data.expiresAt === 'number'
  );
}
