import { WalletKit, IWalletKit } from '@reown/walletkit';
import { Core } from '@walletconnect/core';
export let walletkit: IWalletKit;

// Add flag to track initialization
let isInitializing = false;

export async function createWalletKit() {
  // If already initialized or currently initializing, return the existing instance
  if (walletkit) {
    console.log('WalletKit already initialized, reusing existing instance');
    return walletkit;
  }

  // Prevent concurrent initialization
  if (isInitializing) {
    console.log('WalletKit initialization in progress, waiting...');
    // Wait for initialization to complete
    await new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (walletkit && !isInitializing) {
          clearInterval(checkInterval);
          resolve(walletkit);
        }
      }, 100);
    });
    return walletkit;
  }

  try {
    isInitializing = true;
    console.log('Initializing new WalletKit instance');

    const core = new Core({
      projectId: '48dbb3e862642b9a8004ab871a2ac82d',
      relayUrl: 'wss://relay.walletconnect.com',
    });
    walletkit = await WalletKit.init({
      core,
      metadata: {
        name: 'React Wallet Example',
        description: 'React Wallet for WalletConnect',
        url: 'https://intense-valid-hamster.ngrok-free.app/',
        icons: ['https://avatars.githubusercontent.com/u/37784886'],
      },
      signConfig: {
        disableRequestQueue: false,
      },
    });
    console.log('walletkit', walletkit);

    try {
      const clientId = await walletkit.engine.signClient.core.crypto.getClientId();
      console.log('WalletConnect ClientID: ', clientId);
      localStorage.setItem('WALLETCONNECT_CLIENT_ID', clientId);
    } catch (error) {
      console.error('Failed to set WalletConnect clientId in localStorage: ', error);
    }

    return walletkit;
  } catch (error) {
    console.error('Error initializing WalletKit:', error);
    throw error;
  } finally {
    isInitializing = false;
  }
}

/**
 * Disconnect a specific WalletConnect session by topic
 * @param topic The session topic to disconnect
 * @returns Promise that resolves when the session is disconnected
 */
export async function disconnectSession(topic: string) {
  try {
    if (!walletkit) {
      throw new Error('WalletKit is not initialized');
    }

    await walletkit.disconnectSession({
      topic,
      reason: {
        code: 6000,
        message: 'User disconnected session',
      },
    });

    console.log(`Successfully disconnected session: ${topic}`);
    return true;
  } catch (error) {
    console.error(`Error disconnecting session: ${topic}`, error);
    throw error;
  }
}
