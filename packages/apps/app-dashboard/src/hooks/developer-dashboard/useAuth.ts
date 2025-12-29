import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';

const JWT_STORAGE_KEY = 'vincentDeveloperJWT';
const JWT_EXPIRATION_DAYS = 7;

type StoredJWT = {
  token: string;
  address: string;
  expiresAt: number;
  signedAt: number;
};

/**
 * Creates a message for the user to sign to authenticate
 */
function createSignInMessage(address: string, timestamp: number): string {
  return `Sign in to Vincent Developer Dashboard\n\nWallet: ${address}\nTimestamp: ${timestamp}\n\nThis signature proves you own this wallet and will be valid for 7 days.`;
}

/**
 * Creates a JWT-like token from the signature
 * In production, this would be verified server-side
 */
function createToken(address: string, signature: string, timestamp: number): string {
  const payload = {
    address: address.toLowerCase(),
    signature,
    timestamp,
    expiresAt: timestamp + JWT_EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
  };
  // Base64 encode the payload as a simple token
  return btoa(JSON.stringify(payload));
}

/**
 * Validates the structure of stored JWT data
 */
function isValidStoredJWT(data: unknown): data is StoredJWT {
  return (
    data !== null &&
    typeof data === 'object' &&
    'token' in data &&
    'address' in data &&
    'expiresAt' in data &&
    'signedAt' in data &&
    typeof (data as StoredJWT).token === 'string' &&
    typeof (data as StoredJWT).address === 'string' &&
    typeof (data as StoredJWT).expiresAt === 'number' &&
    typeof (data as StoredJWT).signedAt === 'number'
  );
}

/**
 * Gets the stored JWT from localStorage if valid
 */
export function getStoredAuth(): StoredJWT | null {
  try {
    const stored = localStorage.getItem(JWT_STORAGE_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored);
    if (!isValidStoredJWT(data)) {
      localStorage.removeItem(JWT_STORAGE_KEY);
      return null;
    }

    // Check if token is still valid (not expired)
    if (Date.now() >= data.expiresAt) {
      localStorage.removeItem(JWT_STORAGE_KEY);
      return null;
    }

    return data;
  } catch {
    localStorage.removeItem(JWT_STORAGE_KEY);
    return null;
  }
}

/**
 * Stores the JWT in localStorage
 */
function storeAuth(auth: StoredJWT): void {
  localStorage.setItem(JWT_STORAGE_KEY, JSON.stringify(auth));
}

/**
 * Clears the JWT from localStorage
 */
export function clearStoredAuth(): void {
  localStorage.removeItem(JWT_STORAGE_KEY);
}

/**
 * Hook for managing authentication state with JWT stored in localStorage.
 * Requires user to sign a message to prove wallet ownership.
 * JWT is valid for 7 days.
 */
export function useAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authAddress, setAuthAddress] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing valid JWT on mount and when wallet changes
  useEffect(() => {
    const storedAuth = getStoredAuth();

    if (storedAuth) {
      // If wallet is connected, verify it matches the stored auth
      if (isConnected && address) {
        if (storedAuth.address.toLowerCase() === address.toLowerCase()) {
          setIsAuthenticated(true);
          setAuthAddress(storedAuth.address);
        } else {
          // Wallet changed, clear old auth
          clearStoredAuth();
          setIsAuthenticated(false);
          setAuthAddress(null);
        }
      } else {
        // No wallet connected but have stored auth - still authenticated
        setIsAuthenticated(true);
        setAuthAddress(storedAuth.address);
      }
    } else {
      setIsAuthenticated(false);
      setAuthAddress(null);
    }

    setIsLoading(false);
  }, [address, isConnected]);

  /**
   * Signs in by requesting a wallet signature
   */
  const signIn = useCallback(async (): Promise<boolean> => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return false;
    }

    setIsSigningIn(true);
    setError(null);

    try {
      const timestamp = Date.now();
      const message = createSignInMessage(address, timestamp);

      // Request signature from wallet
      const signature = await signMessageAsync({ message });

      // Create and store the token
      const token = createToken(address, signature, timestamp);
      const expiresAt = timestamp + JWT_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;

      const authData: StoredJWT = {
        token,
        address: address.toLowerCase(),
        expiresAt,
        signedAt: timestamp,
      };

      storeAuth(authData);
      setIsAuthenticated(true);
      setAuthAddress(address);

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in';
      if (message.includes('User rejected') || message.includes('user rejected')) {
        setError('Signature request was rejected');
      } else {
        setError(message);
      }
      return false;
    } finally {
      setIsSigningIn(false);
    }
  }, [address, isConnected, signMessageAsync]);

  /**
   * Signs out by clearing the stored JWT and disconnecting wallet
   */
  const signOut = useCallback(() => {
    clearStoredAuth();
    disconnect();
    setIsAuthenticated(false);
    setAuthAddress(null);
    setError(null);
  }, [disconnect]);

  /**
   * Clears only the JWT without disconnecting wallet
   */
  const clearAuth = useCallback(() => {
    clearStoredAuth();
    setIsAuthenticated(false);
    setAuthAddress(null);
    setError(null);
  }, []);

  return {
    /** Whether the user is authenticated (has valid JWT) */
    isAuthenticated,
    /** Whether initial auth check is in progress */
    isLoading,
    /** Whether sign-in is in progress */
    isSigningIn,
    /** The authenticated wallet address */
    authAddress,
    /** Whether a wallet is connected (may not be authenticated yet) */
    isWalletConnected: isConnected,
    /** The connected wallet address */
    walletAddress: address,
    /** Any error message from sign-in */
    error,
    /** Sign in with wallet signature */
    signIn,
    /** Sign out and disconnect wallet */
    signOut,
    /** Clear auth without disconnecting wallet */
    clearAuth,
  };
}

export default useAuth;
