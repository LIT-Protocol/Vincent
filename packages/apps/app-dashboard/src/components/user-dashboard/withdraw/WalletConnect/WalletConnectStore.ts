import { create } from 'zustand';
import { IWalletKit } from '@reown/walletkit';

/**
 * State and actions to track WalletConnect client and sessions
 */
interface WalletConnectState {
  ready: boolean;
  client: IWalletKit | undefined;
  sessions: any[];
  currentWalletAddress: string | null;
  accountSessions: Record<string, any[]>;
  actions: {
    setClient: (client: IWalletKit) => void;
    refreshSessions: () => void;
    setCurrentWalletAddress: (address: string | null) => void;
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
        const allSessions = Object.values(client.getActiveSessions() || {});
        const { currentWalletAddress, accountSessions } = state;

        const updatedAccountSessions = { ...accountSessions };
        if (currentWalletAddress) {
          updatedAccountSessions[currentWalletAddress] = allSessions;
        }

        return {
          client,
          ready: true,
          sessions: currentWalletAddress
            ? updatedAccountSessions[currentWalletAddress] || []
            : allSessions,
          accountSessions: updatedAccountSessions,
        };
      }),
    refreshSessions: () =>
      set((state) => {
        if (!state.client) return { sessions: [] };

        const allSessions = Object.values(state.client.getActiveSessions() || {});

        const updatedAccountSessions = { ...state.accountSessions };
        if (state.currentWalletAddress) {
          updatedAccountSessions[state.currentWalletAddress] = allSessions;
        }

        return {
          sessions: state.currentWalletAddress
            ? updatedAccountSessions[state.currentWalletAddress] || []
            : allSessions,
          accountSessions: updatedAccountSessions,
        };
      }),
    setCurrentWalletAddress: (address: string | null) =>
      set((state) => {
        if (!state.client) return { currentWalletAddress: address, sessions: [] };
        if (state.currentWalletAddress) {
          const currentSessions = Object.values(state.client.getActiveSessions() || {});
          if (currentSessions.length > 0) {
            state.accountSessions[state.currentWalletAddress] = currentSessions;
          }
        }

        const sessionsToShow = address
          ? state.accountSessions[address] || []
          : Object.values(state.client.getActiveSessions() || {});

        return {
          currentWalletAddress: address,
          sessions: sessionsToShow,
          accountSessions: { ...state.accountSessions },
        };
      }),
    clearSessionsForAddress: async (address: string | null) => {
      if (!address) return;

      const state = get();
      if (!state.client) return;

      const sessionsForAddress = state.accountSessions[address] || [];

      if (sessionsForAddress.length === 0) return;

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

      set((state) => {
        const updatedAccountSessions = { ...state.accountSessions };

        updatedAccountSessions[address] = [];

        return {
          accountSessions: updatedAccountSessions,
          sessions: state.currentWalletAddress === address ? [] : state.sessions,
        };
      });
    },
  },
}));

export const getWalletConnectSessions = (): any[] => {
  return useWalletConnectStore.getState().sessions;
};

export const getWalletConnectActions = () => {
  return useWalletConnectStore.getState().actions;
};

export const getCurrentWalletAddress = (): string | null => {
  return useWalletConnectStore.getState().currentWalletAddress;
};

export const useWalletConnectClient = () => useWalletConnectStore((state) => state.client);
export const useWalletConnectSessions = () => useWalletConnectStore((state) => state.sessions);
export const useWalletConnectStoreActions = () => useWalletConnectStore((state) => state.actions);
export const useCurrentWalletAddress = () =>
  useWalletConnectStore((state) => state.currentWalletAddress);

export default useWalletConnectStore;
