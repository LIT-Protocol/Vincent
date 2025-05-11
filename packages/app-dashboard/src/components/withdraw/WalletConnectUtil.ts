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
      logger: 'trace',
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

export async function updateSignClientChainId(chainId: string, address: string) {
  console.log('chainId', chainId, address);
  // get most recent session
  const sessions = walletkit.getActiveSessions();
  if (!sessions) return;
  const namespace = chainId.split(':')[0];
  Object.values(sessions).forEach(async (session) => {
    await walletkit.updateSession({
      topic: session.topic,
      namespaces: {
        ...session.namespaces,
        [namespace]: {
          ...session.namespaces[namespace],
          chains: [
            ...new Set(
              [chainId].concat(Array.from(session?.namespaces?.[namespace]?.chains || [])),
            ),
          ],
          accounts: [
            ...new Set(
              [`${chainId}:${address}`].concat(
                Array.from(session?.namespaces?.[namespace]?.accounts || []),
              ),
            ),
          ],
        },
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const chainChanged = {
      topic: session.topic,
      event: {
        name: 'chainChanged',
        data: parseInt(chainId.split(':')[1]),
      },
      chainId: chainId,
    };

    const accountsChanged = {
      topic: session.topic,
      event: {
        name: 'accountsChanged',
        data: [`${chainId}:${address}`],
      },
      chainId,
    };
    await walletkit.emitSessionEvent(chainChanged);
    await walletkit.emitSessionEvent(accountsChanged);
  });
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

/**
 * Disconnect all active WalletConnect sessions
 * @returns Promise that resolves when all sessions are disconnected
 */
export async function disconnectAllSessions() {
  try {
    if (!walletkit) {
      throw new Error('WalletKit is not initialized');
    }

    const sessions = walletkit.getActiveSessions();
    if (!sessions || Object.keys(sessions).length === 0) {
      console.log('No active sessions to disconnect');
      return true;
    }

    const disconnectPromises = Object.values(sessions).map((session) => {
      return disconnectSession(session.topic);
    });

    await Promise.allSettled(disconnectPromises);
    console.log('All sessions disconnected successfully');
    return true;
  } catch (error) {
    console.error('Error disconnecting all sessions:', error);
    throw error;
  }
}
