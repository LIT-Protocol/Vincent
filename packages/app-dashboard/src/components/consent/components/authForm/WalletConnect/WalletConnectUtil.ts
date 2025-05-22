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
 * @returns The initialized WalletKit client
 */
export async function createWalletConnectClient(
  setClient?: (client: IWalletKit) => void,
): Promise<IWalletKit> {
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
