import { create } from 'zustand';
import { IWalletKit } from '@reown/walletkit';

/**
 * State and actions to track WalletConnect client and sessions
 */
interface WalletConnectState {
  ready: boolean;
  client: IWalletKit | undefined;
  sessions: any[];
  actions: {
    setClient: (client: IWalletKit) => void;
    refreshSessions: () => void;
  };
}

const useWalletConnectStore = create<WalletConnectState>()((set) => ({
  ready: false,
  client: undefined,
  sessions: [],
  actions: {
    setClient: (client: IWalletKit) =>
      set({
        client,
        ready: true,
        sessions: Object.values(client.getActiveSessions() || {}),
      }),
    refreshSessions: () =>
      set((state) => ({
        sessions: Object.values(state.client?.getActiveSessions() || {}),
      })),
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

// React hooks for use within components
export const useWalletConnectReady = () => useWalletConnectStore((state) => state.ready);
export const useWalletConnectClient = () => useWalletConnectStore((state) => state.client);
export const useWalletConnectSessions = () => useWalletConnectStore((state) => state.sessions);
export const useWalletConnectStoreActions = () => useWalletConnectStore((state) => state.actions);

export default useWalletConnectStore;
