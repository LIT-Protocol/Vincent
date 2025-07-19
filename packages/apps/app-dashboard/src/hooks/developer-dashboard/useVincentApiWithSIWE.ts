import { SiweMessage, generateNonce } from 'siwe';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { litNodeClient } from '@/utils/user-dashboard/lit';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';

interface StoredSIWE {
  message: string;
  signature: string;
  address: string;
}

const SIWE_STORAGE_KEY = 'vincentDeveloperSIWE';
const SIWE_EXPIRATION_HOURS = 72;

function isValidStoredSIWE(data: any): data is StoredSIWE {
  return (
    data?.message &&
    data?.signature &&
    data?.address &&
    typeof data.message === 'string' &&
    typeof data.signature === 'string' &&
    typeof data.address === 'string'
  );
}

/**
 * Get current SIWE token for request headers using PKP wallet - returns null if invalid
 */
export const getCurrentSIWEToken = async (
  authInfo: any,
  sessionSigs: any,
): Promise<string | null> => {
  if (!authInfo?.agentPKP?.ethAddress || !authInfo?.agentPKP || !sessionSigs) {
    return null;
  }

  const address = authInfo.agentPKP.ethAddress;

  // Check if stored token is still valid
  const stored = localStorage.getItem(SIWE_STORAGE_KEY);
  if (stored) {
    try {
      const data = JSON.parse(stored);
      if (!isValidStoredSIWE(data)) {
        localStorage.removeItem(SIWE_STORAGE_KEY);
      } else {
        // Check if stored address matches current PKP address
        if (data.address !== address) {
          localStorage.removeItem(SIWE_STORAGE_KEY);
        } else {
          const result = await new SiweMessage(data.message).verify({
            signature: data.signature,
            domain: 'staging.registry.heyvincent.ai',
            time: new Date().toISOString(),
          });

          if (result.success) {
            return btoa(JSON.stringify({ message: data.message, signature: data.signature }));
          }
        }
      }
    } catch {
      // Invalid JSON or verification failed - clear it and continue to request new one
      localStorage.removeItem(SIWE_STORAGE_KEY);
    }
  }

  try {
    // Create PKP wallet for signing
    const pkpWallet = new PKPEthersWallet({
      controllerSessionSigs: sessionSigs,
      pkpPubKey: authInfo.agentPKP.publicKey,
      litNodeClient: litNodeClient,
    });
    await pkpWallet.init();

    const siweMessage = new SiweMessage({
      domain: 'staging.registry.heyvincent.ai',
      address: address,
      statement: 'Sign in with Ethereum to authenticate with Vincent Registry API',
      uri: 'https://staging.registry.heyvincent.ai',
      version: '1',
      chainId: 1,
      nonce: generateNonce(),
      issuedAt: new Date().toISOString(),
      expirationTime: new Date(Date.now() + SIWE_EXPIRATION_HOURS * 60 * 60 * 1000).toISOString(),
    });

    const message = siweMessage.prepareMessage();
    const signature = await pkpWallet.signMessage(message);

    const storedData: StoredSIWE = { message, signature, address };
    localStorage.setItem(SIWE_STORAGE_KEY, JSON.stringify(storedData));
    return btoa(JSON.stringify({ message, signature }));
  } catch (error) {
    console.error('Error creating SIWE token with PKP:', error);
    return null;
  }
};

/**
 * Store-compatible version that checks for existing valid SIWE token
 */
export const getCurrentSIWETokenForStore = async (): Promise<string | null> => {
  const stored = localStorage.getItem(SIWE_STORAGE_KEY);
  if (!stored) return null;

  try {
    const data = JSON.parse(stored);
    if (!isValidStoredSIWE(data)) {
      localStorage.removeItem(SIWE_STORAGE_KEY);
      return null;
    }

    // Verify the stored token is still valid
    const result = await new SiweMessage(data.message).verify({
      signature: data.signature,
      domain: 'staging.registry.heyvincent.ai',
      time: new Date().toISOString(),
    });

    if (result.success) {
      return btoa(JSON.stringify({ message: data.message, signature: data.signature }));
    } else {
      localStorage.removeItem(SIWE_STORAGE_KEY);
      return null;
    }
  } catch {
    localStorage.removeItem(SIWE_STORAGE_KEY);
    return null;
  }
};

/**
 * Hook to get current SIWE token for authenticated requests
 */
export const useVincentApiWithPKP = () => {
  const { authInfo, sessionSigs } = useReadAuthInfo();

  const getSIWEToken = async (): Promise<string | null> => {
    return getCurrentSIWEToken(authInfo, sessionSigs);
  };

  return { getSIWEToken };
};
