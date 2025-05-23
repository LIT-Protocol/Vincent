import { create } from 'zustand';
import { IWalletKit } from '@reown/walletkit';

/**
 * State and actions to track WalletConnect client and sessions
 */
interface WalletConnectState {
  ready: boolean;
  client: IWalletKit | undefined;
  sessions: any[];
  // Store the current wallet address to associate sessions with a specific account
  currentWalletAddress: string | null;
  // Track sessions per wallet address to isolate sessions between accounts
  accountSessions: Record<string, any[]>;
  actions: {
    setClient: (client: IWalletKit) => void;
    refreshSessions: () => void;
    // Add new action to update current wallet address
    setCurrentWalletAddress: (address: string | null) => void;
    // Add ability to clear sessions for a particular address
    clearSessionsForAddress: (address: string | null) => Promise<void>;
  };
}

const useWalletConnectStore = create<WalletConnectState>()((set, get) => ({
  ready: false,
  client: undefined,
  sessions: [],
  currentWalletAddress: null,
  accountSessions: {},
  actions: {
    setClient: (client: IWalletKit) =>
      set((state) => {
        // Get active sessions from client
        const allSessions = Object.values(client.getActiveSessions() || {});

        // Only update sessions for current address if one is set
        const { currentWalletAddress, accountSessions } = state;

        // Store sessions in the account-specific store if an address is set
        const updatedAccountSessions = { ...accountSessions };
        if (currentWalletAddress) {
          updatedAccountSessions[currentWalletAddress] = allSessions;
        }

        return {
          client,
          ready: true,
          // Only show sessions for the current wallet address if one is set
          sessions: currentWalletAddress
            ? updatedAccountSessions[currentWalletAddress] || []
            : allSessions,
          accountSessions: updatedAccountSessions,
        };
      }),
    refreshSessions: () =>
      set((state) => {
        if (!state.client) return { sessions: [] };

        // Get all active sessions
        const allSessions = Object.values(state.client.getActiveSessions() || {});

        // Update the account-specific sessions if we have a current address
        const updatedAccountSessions = { ...state.accountSessions };
        if (state.currentWalletAddress) {
          updatedAccountSessions[state.currentWalletAddress] = allSessions;
        }

        return {
          // Only show sessions for the current wallet if an address is set
          sessions: state.currentWalletAddress
            ? updatedAccountSessions[state.currentWalletAddress] || []
            : allSessions,
          accountSessions: updatedAccountSessions,
        };
      }),
    setCurrentWalletAddress: (address: string | null) =>
      set((state) => {
        if (!state.client) return { currentWalletAddress: address, sessions: [] };

        // When changing the wallet address, we want to:
        // 1. Store the current address
        // 2. Set the visible sessions to those associated with this address

        // If we have active sessions and we're tracking an address before this change
        if (state.currentWalletAddress) {
          // Get current sessions to store them for the previous address
          const currentSessions = Object.values(state.client.getActiveSessions() || {});
          if (currentSessions.length > 0) {
            // Save these sessions under the previous address
            state.accountSessions[state.currentWalletAddress] = currentSessions;
          }
        }

        // Set sessions to show based on the new address
        const sessionsToShow = address
          ? state.accountSessions[address] || []
          : Object.values(state.client.getActiveSessions() || {});

        return {
          currentWalletAddress: address,
          sessions: sessionsToShow,
          accountSessions: { ...state.accountSessions },
        };
      }),
    // Add function to disconnect all sessions for a specific address
    clearSessionsForAddress: async (address: string | null) => {
      if (!address) return;

      const state = get();
      if (!state.client) return;

      // Get the sessions associated with this address
      const sessionsForAddress = state.accountSessions[address] || [];

      // If no sessions, nothing to do
      if (sessionsForAddress.length === 0) return;

      // Disconnect each session
      for (const session of sessionsForAddress) {
        if (session.topic) {
          try {
            console.log(`Disconnecting session ${session.topic} for address ${address}`);
            await state.client.disconnectSession({
              topic: session.topic,
              reason: {
                code: 6000,
                message: 'Wallet switched',
              },
            });
          } catch (error) {
            console.error(`Failed to disconnect session ${session.topic}:`, error);
          }
        }
      }

      // Update the store
      set((state) => {
        const updatedAccountSessions = { ...state.accountSessions };

        // Clear sessions for this address
        updatedAccountSessions[address] = [];

        return {
          accountSessions: updatedAccountSessions,
          // Update visible sessions if this is the current address
          sessions: state.currentWalletAddress === address ? [] : state.sessions,
        };
      });
    },
  },
}));

// Helper functions to access store state without hooks (for non-React contexts)
export const getWalletConnectClient = (): IWalletKit | undefined => {
  return useWalletConnectStore.getState().client;
};

export const getWalletConnectSessions = (): any[] => {
  return useWalletConnectStore.getState().sessions;
};

export const getWalletConnectActions = () => {
  return useWalletConnectStore.getState().actions;
};

export const getCurrentWalletAddress = (): string | null => {
  return useWalletConnectStore.getState().currentWalletAddress;
};

// React hooks for use within components
export const useWalletConnectReady = () => useWalletConnectStore((state) => state.ready);
export const useWalletConnectClient = () => useWalletConnectStore((state) => state.client);
export const useWalletConnectSessions = () => useWalletConnectStore((state) => state.sessions);
export const useWalletConnectStoreActions = () => useWalletConnectStore((state) => state.actions);
export const useCurrentWalletAddress = () =>
  useWalletConnectStore((state) => state.currentWalletAddress);

export default useWalletConnectStore;
