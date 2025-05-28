import { IWalletKit, WalletKit } from '@reown/walletkit';
import { Core } from '@walletconnect/core';
import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { litNodeClient } from '@/components/consent/utils/lit';
import { getWalletConnectActions, getCurrentWalletAddress } from './WalletConnectStore';

import { env } from '@/config/env';

const { VITE_WALLETCONNECT_PROJECT_ID } = env;

let pkpWallet: PKPEthersWallet | null = null;
let walletKitClient: IWalletKit | null = null;
let isInitializing = false;

/**
 * Create a PKPEthersWallet using the agent PKP and session signatures
 * @param agentPKP The agent's PKP to use for signing
 * @param sessionSigs Session signatures for authentication
 * @returns The created PKPEthersWallet instance
 */
export async function createPKPWallet(
  agentPKP: IRelayPKP,
  sessionSigs: SessionSigs,
): Promise<PKPEthersWallet> {
  if (!agentPKP?.publicKey) {
    throw new Error('PKP does not have a public key');
  }

  pkpWallet = new PKPEthersWallet({
    pkpPubKey: agentPKP.publicKey,
    litNodeClient: litNodeClient,
    controllerSessionSigs: sessionSigs,
  });

  await pkpWallet.init();
  return pkpWallet;
}

/**
 * Register a PKP wallet with WalletKit to handle signing requests
 * @param agentPKP The agent's PKP to use for signing
 * @param sessionSigs Session signatures for authentication
 * @returns Information about the registered account
 */
export async function registerPKPWallet(
  agentPKP: IRelayPKP,
  sessionSigs?: SessionSigs,
): Promise<{ address: string; publicKey: string }> {
  if (!agentPKP?.ethAddress) {
    throw new Error('PKP does not have an Ethereum address');
  }

  const newAddress = agentPKP.ethAddress;
  const storedWalletAddress = getCurrentWalletAddress();
  const walletHasChanged = storedWalletAddress !== null && storedWalletAddress !== newAddress;

  const actions = getWalletConnectActions();

  if (walletHasChanged) {
    console.log(`Wallet has changed from ${storedWalletAddress} to ${newAddress}`);

    // First disconnect any sessions associated with the previous wallet to ensure
    // dApps know that wallet has been disconnected
    if (storedWalletAddress) {
      console.log(`Disconnecting all sessions for previous wallet: ${storedWalletAddress}`);
      try {
        await actions.clearSessionsForAddress(storedWalletAddress);
      } catch (error) {
        console.error('Error disconnecting sessions for previous wallet:', error);
      }
    }

    await resetWalletConnectClient();

    // Update the current wallet address in the store
    actions.setCurrentWalletAddress(newAddress);
  } else if (newAddress && storedWalletAddress !== newAddress) {
    actions.setCurrentWalletAddress(newAddress);
  }

  // Get or create the client
  await createWalletConnectClient();

  if (sessionSigs) {
    try {
      if (pkpWallet) {
        pkpWallet = null;
      }

      pkpWallet = await createPKPWallet(agentPKP, sessionSigs);
    } catch (error) {
      console.error('Failed to create PKP wallet:', error);
      throw new Error('Failed to create PKP wallet');
    }
  }

  return {
    address: agentPKP.ethAddress,
    publicKey: agentPKP.publicKey,
  };
}

/**
 * Get the initialized PKP wallet instance
 * @returns The PKP wallet instance or null if not initialized
 */
export function getPKPWallet(): PKPEthersWallet | null {
  return pkpWallet;
}

/**
 * Initialize WalletKit directly without any React hooks
 * @param setClient Optional callback to set the client in state
 * @param forceReset Whether to force a reset of the client
 * @returns The initialized WalletKit client
 */
export async function createWalletConnectClient(
  setClient?: (client: IWalletKit) => void,
  forceReset = false,
): Promise<IWalletKit> {
  // If we're forcing a reset, clean up the existing client
  if (forceReset && walletKitClient) {
    await resetWalletConnectClient();
  }

  // If already initialized, return existing instance
  if (walletKitClient) {
    if (setClient) {
      setClient(walletKitClient);
    }
    return walletKitClient;
  }

  // Prevent concurrent initialization
  if (isInitializing) {
    // Wait for initialization to complete
    return new Promise<IWalletKit>((resolve) => {
      const checkInterval = setInterval(() => {
        if (walletKitClient && !isInitializing) {
          clearInterval(checkInterval);
          if (setClient) {
            setClient(walletKitClient);
          }
          resolve(walletKitClient);
        }
      }, 100);
    });
  }

  try {
    isInitializing = true;

    // Create a shared Core instance
    const core = new Core({
      projectId: VITE_WALLETCONNECT_PROJECT_ID,
    });

    // Initialize WalletKit with the required parameters - according to documentation
    walletKitClient = await WalletKit.init({
      core, // Pass the shared core instance
      metadata: {
        name: 'Vincent App',
        description: 'Vincent App using PKP with WalletKit',
        url: window.location.origin,
        icons: [`${window.location.origin}/logo.svg`], // This should work when deployed, but it doesn't really matter
      },
    });

    // Store the client in the store if a setter was provided
    if (setClient) {
      setClient(walletKitClient);
    }

    return walletKitClient;
  } finally {
    isInitializing = false;
  }
}

/**
 * Reset the WalletKit client by disconnecting all sessions and clearing the instance
 * @returns Promise that resolves when reset is complete
 */
export async function resetWalletConnectClient(): Promise<void> {
  try {
    if (walletKitClient) {
      try {
        // Get all active sessions
        const activeSessions = walletKitClient.getActiveSessions() || {};

        if (Object.keys(activeSessions).length > 0) {
          // Disconnect all active sessions
          const disconnectPromises = Object.keys(activeSessions).map(async (topic) => {
            try {
              if (walletKitClient) {
                await walletKitClient.disconnectSession({
                  topic,
                  reason: {
                    code: 6000,
                    message: 'Wallet reset',
                  },
                });
                console.log(`Disconnected session: ${topic}`);
              }
            } catch (error) {
              console.error(`Failed to disconnect session ${topic}:`, error);
              // Continue with reset even if individual disconnect fails
            }
          });

          // Wait for all disconnect operations to complete with a timeout
          await Promise.race([
            Promise.all(disconnectPromises),
            new Promise((resolve) => setTimeout(resolve, 1000)), // 1 second timeout
          ]);
        } else {
          console.log('No active sessions to disconnect');
        }
      } catch (sessionError) {
        console.error('Error during session disconnect:', sessionError);
        // Continue with reset even if session handling fails
      }

      // Reset the client reference - still do this even if there were errors above
      walletKitClient = null;
      console.log('WalletKit client has been reset');
    }
  } catch (error) {
    console.error('Error resetting WalletKit client:', error);
    // Still set client to null even if there's an error
    walletKitClient = null;
  } finally {
    // Ensure initialization flag is reset
    isInitializing = false;
  }
}

/**
 * Disconnect a specific WalletConnect session by topic
 * @param topic The session topic to disconnect
 * @param refreshSessions Optional callback to refresh sessions after disconnecting
 * @returns Promise that resolves when the session is disconnected
 */
export async function disconnectSession(
  topic: string,
  refreshSessions?: () => void,
): Promise<boolean> {
  try {
    if (!walletKitClient) {
      throw new Error('WalletKit client is not initialized');
    }

    // Use the WalletKit disconnectSession method
    await walletKitClient.disconnectSession({
      topic,
      reason: {
        code: 6000,
        message: 'User disconnected session',
      },
    });

    // Refresh sessions after disconnecting
    if (refreshSessions) {
      refreshSessions();
    }

    console.log(`Successfully disconnected session: ${topic}`);
    return true;
  } catch (error) {
    console.error(`Error disconnecting session: ${topic}`, error);
    throw error;
  }
}
