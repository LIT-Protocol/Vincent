import { SiweMessage, generateNonce } from 'siwe';
import { getAddress } from 'ethers/lib/utils';

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
 * Get current SIWE token for request headers - returns null if invalid
 */
export const getCurrentSIWEToken = async (): Promise<string | null> => {
  // Check if stored token is still valid
  const stored = localStorage.getItem(SIWE_STORAGE_KEY);
  if (stored) {
    try {
      const data = JSON.parse(stored);
      if (!isValidStoredSIWE(data)) {
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
    } catch {
      // Invalid JSON or verification failed - clear it and continue to request new one
      localStorage.removeItem(SIWE_STORAGE_KEY);
    }
  }

  // Request new signature (should never be null, how would they be signed in if they don't have a wallet?)
  if (!window.ethereum) return null;

  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (!accounts?.length) return null;

    const address = getAddress(accounts[0]);
    const siweMessage = new SiweMessage({
      domain: 'staging.registry.heyvincent.ai',
      address,
      statement: 'Sign in with Ethereum to authenticate with Vincent Registry API',
      uri: 'https://staging.registry.heyvincent.ai',
      version: '1',
      chainId: 1,
      nonce: generateNonce(),
      issuedAt: new Date().toISOString(),
      expirationTime: new Date(Date.now() + SIWE_EXPIRATION_HOURS * 60 * 60 * 1000).toISOString(),
    });

    const message = siweMessage.prepareMessage();
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, accounts[0]],
    });

    const storedData: StoredSIWE = { message, signature, address };
    localStorage.setItem(SIWE_STORAGE_KEY, JSON.stringify(storedData));
    return btoa(JSON.stringify({ message, signature }));
  } catch {
    return null;
  }
};
