import { IWalletKit } from '@reown/walletkit';
import { WalletKit } from '@reown/walletkit';
import { getPKPWallet } from './PKPWalletUtil';
import { Core } from '@walletconnect/core';

// Track initialization status
let isInitializing = false;
let walletKitClient: IWalletKit | null = null;

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
    console.log('Force resetting WalletKit client');
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
    console.log('WalletKit initialization in progress, waiting...');
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
    console.log('Initializing new WalletKit instance');

    // Create a shared Core instance
    const core = new Core({
      projectId: '48dbb3e862642b9a8004ab871a2ac82d',
    });

    // Initialize WalletKit with the required parameters - according to documentation
    walletKitClient = await WalletKit.init({
      core, // Pass the shared core instance
      metadata: {
        name: 'Vincent App',
        description: 'Vincent App using PKP with WalletKit',
        url: window.location.origin,
        icons: ['https://lit.network/favicon.ico'],
      },
    });

    // Add PKP wallet if available
    const pkpWallet = getPKPWallet();
    if (pkpWallet && walletKitClient) {
      // Register the PKP wallet to receive signing requests
      console.log('PKP wallet available for WalletKit');
    }

    // Store the client in the store if a setter was provided
    if (setClient) {
      setClient(walletKitClient);
    }

    return walletKitClient;
  } catch (error) {
    console.error('Error initializing WalletKit:', error);
    throw error;
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
      console.log('Resetting WalletKit client');

      try {
        // Get all active sessions
        const activeSessions = walletKitClient.getActiveSessions() || {};

        if (Object.keys(activeSessions).length > 0) {
          console.log(`Disconnecting ${Object.keys(activeSessions).length} active sessions`);

          // Disconnect all active sessions
          const disconnectPromises = Object.keys(activeSessions).map(async (topic) => {
            try {
              await walletKitClient!.disconnectSession({
                topic,
                reason: {
                  code: 6000,
                  message: 'Wallet reset',
                },
              });
              console.log(`Disconnected session: ${topic}`);
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
 * Get the current WalletKit client instance without initialization
 * @returns The current WalletKit client instance or null if not initialized
 */
export function getWalletConnectClient(): IWalletKit | null {
  return walletKitClient;
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
