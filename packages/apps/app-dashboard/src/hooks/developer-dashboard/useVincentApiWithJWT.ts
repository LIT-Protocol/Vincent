type StoredJWT = {
  token: string;
  address: string;
  expiresAt: number;
};

const JWT_STORAGE_KEY = 'platformUserJWT';
/*
const EXPECTED_AUDIENCE =
  VITE_ENV === 'development'
    ? 'http://localhost:3000'
    : VITE_ENV === 'staging'
      ? 'staging.registry.heyvincent.ai'
      : 'registry.heyvincent.ai';
*/

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
      // TODO
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
