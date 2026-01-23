import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import { getAddress } from 'ethers/lib/utils';
import { registryDomain, registryUrl } from '@/config/registry';

const SIWE_STORAGE_KEY = 'vincentDeveloperSIWE';
const SIWE_EXPIRATION_DAYS = 7;

type StoredSIWE = {
  message: string;
  signature: string;
  address: string;
  expiresAt: number;
  signedAt: number;
};

/**
 * Generates a secure random nonce
 */
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Creates a SIWE message following the EIP-4361 spec
 */
function createSiweMessage(params: {
  domain: string;
  address: string;
  uri: string;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
  statement?: string;
  chainId?: number;
  version?: string;
}): string {
  const {
    domain,
    address,
    uri,
    nonce,
    issuedAt,
    expirationTime,
    statement = 'Sign in with Ethereum to authenticate with Vincent Registry API',
    chainId = 1,
    version = '1',
  } = params;

  const lines = [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    '',
    statement,
    '',
    `URI: ${uri}`,
    `Version: ${version}`,
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ];

  if (expirationTime) {
    lines.push(`Expiration Time: ${expirationTime}`);
  }

  return lines.join('\n');
}

/**
 * Validates the structure of stored SIWE data
 */
function isValidStoredSIWE(data: unknown): data is StoredSIWE {
  return (
    data !== null &&
    typeof data === 'object' &&
    'message' in data &&
    'signature' in data &&
    'address' in data &&
    'expiresAt' in data &&
    'signedAt' in data &&
    typeof (data as StoredSIWE).message === 'string' &&
    typeof (data as StoredSIWE).signature === 'string' &&
    typeof (data as StoredSIWE).address === 'string' &&
    typeof (data as StoredSIWE).expiresAt === 'number' &&
    typeof (data as StoredSIWE).signedAt === 'number'
  );
}

/**
 * Gets the stored SIWE auth from localStorage if valid
 */
export function getStoredAuth(): StoredSIWE | null {
  try {
    const stored = localStorage.getItem(SIWE_STORAGE_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored);
    if (!isValidStoredSIWE(data)) {
      localStorage.removeItem(SIWE_STORAGE_KEY);
      return null;
    }

    // Check if token is still valid (not expired)
    if (Date.now() >= data.expiresAt) {
      localStorage.removeItem(SIWE_STORAGE_KEY);
      return null;
    }

    return data;
  } catch {
    localStorage.removeItem(SIWE_STORAGE_KEY);
    return null;
  }
}

/**
 * Gets the SIWE auth token in the format expected by the registry API
 * Returns the base64-encoded JSON payload with message and signature
 */
export function getSiweAuthToken(): string | null {
  const stored = getStoredAuth();
  if (!stored) return null;

  const payload = JSON.stringify({
    message: stored.message,
    signature: stored.signature,
  });

  return btoa(payload);
}

/**
 * Stores the SIWE auth in localStorage
 */
function storeAuth(auth: StoredSIWE): void {
  localStorage.setItem(SIWE_STORAGE_KEY, JSON.stringify(auth));
}

/**
 * Clears the SIWE auth from localStorage
 */
export function clearStoredAuth(): void {
  localStorage.removeItem(SIWE_STORAGE_KEY);
}

// Auth context type
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isSigningIn: boolean;
  authAddress: string | null;
  isWalletConnected: boolean;
  walletAddress: string | undefined;
  error: string | null;
  signIn: () => Promise<boolean>;
  signOut: () => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Provider component for authentication state.
 * Wrap your app with this to share auth state across all useAuth consumers.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authAddress, setAuthAddress] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing valid auth on mount and when wallet changes
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
   * Signs in by requesting a SIWE signature
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
      const issuedAt = new Date(timestamp).toISOString();
      const expirationTime = new Date(
        timestamp + SIWE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString();

      // Get checksummed address (EIP-55 required by SIWE)
      const checksummedAddress = getAddress(address);

      // Domain and URI must match registry's EXPECTED_AUDIENCE
      const domain = registryDomain;
      const uri = registryUrl;

      // Create the SIWE message
      const message = createSiweMessage({
        domain,
        address: checksummedAddress,
        uri,
        nonce: generateNonce(),
        issuedAt,
        expirationTime,
      });

      // Request signature from wallet
      const signature = await signMessageAsync({ message });

      // Store the auth data
      const authData: StoredSIWE = {
        message,
        signature,
        address: checksummedAddress,
        expiresAt: timestamp + SIWE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
        signedAt: timestamp,
      };

      storeAuth(authData);
      setIsAuthenticated(true);
      setAuthAddress(checksummedAddress);

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
   * Signs out by clearing the stored auth and disconnecting wallet
   */
  const signOut = useCallback(() => {
    clearStoredAuth();
    disconnect();
    setIsAuthenticated(false);
    setAuthAddress(null);
    setError(null);
  }, [disconnect]);

  /**
   * Clears only the auth without disconnecting wallet
   */
  const clearAuth = useCallback(() => {
    clearStoredAuth();
    setIsAuthenticated(false);
    setAuthAddress(null);
    setError(null);
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    isSigningIn,
    authAddress,
    isWalletConnected: isConnected,
    walletAddress: address,
    error,
    signIn,
    signOut,
    clearAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook for managing authentication state with SIWE stored in localStorage.
 * Requires user to sign a SIWE message to prove wallet ownership.
 * Auth is valid for 7 days.
 *
 * Must be used within an AuthProvider.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default useAuth;
