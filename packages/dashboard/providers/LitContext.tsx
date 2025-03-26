import { createDatilChainManager } from '@lit-protocol/vincent-contracts';
import {
  getWalletClient,
  getAccount,
  reconnect,
  watchAccount,
} from '@wagmi/core';
import { useContext, useEffect, useState, useRef } from 'react';
import { createContext } from 'react';
import { useConfig } from 'wagmi';
import { LogManager, Logger } from '@lit-protocol/logger';

const DEFAULT_CATEGORY = '[LitContext]';

LogManager.Instance.setPrefix(DEFAULT_CATEGORY);
const logger = LogManager.Instance.get();

const NETWORK = 'datil';

// declare empty object to get types
const { vincentApi: vincentApiType } = createDatilChainManager({
  account: {} as any,
  network: NETWORK,
});

// [from user]
interface LitContextConfig {
  chainManager: ReturnType<typeof createDatilChainManager> | null;
  isConnected: boolean;
  error: Error | null;
}

export const LitContext = createContext<LitContextConfig>({
  chainManager: null,
  isConnected: false,
  error: null,
});

export const useLitContext = () => useContext(LitContext);

export const LitContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [chainManager, setChainManager] = useState<ReturnType<
    typeof createDatilChainManager
  > | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const unwatch = useRef<() => void>(() => {});

  // Config for wagmi interactions
  const config = useConfig();

  // Function to initialize the chain manager
  const initChainManager = async () => {
    logger.info(`initialising chain manager`);
    try {
      // Check if a wallet is connected using the getAccount action
      const account = getAccount(config);

      if (!account.isConnected) {
        logger.info('No wallet connected yet, waiting for connection');
        setIsConnected(false);
        return;
      }

      // Only attempt to get wallet client if we have a connected wallet
      const walletClient = await getWalletClient(config);

      if (!walletClient) {
        logger.error('No wallet client available');
        return;
      }

      const chainManager = createDatilChainManager({
        account: walletClient,
        network: NETWORK,
      });

      logger.info(`chain manager initialised`);

      setChainManager(chainManager);
      setIsConnected(true);
    } catch (e) {
      logger.error('Failed to initialise Lit chain manager:', e);
      setError(
        e instanceof Error
          ? e
          : new Error('Unknown error initialising Lit chain manager'),
      );
      setIsConnected(false);
    }
  };

  // Effect to reconnect on mount
  useEffect(() => {
    const init = async () => {
      logger.info(`trying to reconnect`);
      try {
        // Try to reconnect any existing wallet connection first
        await reconnect(config);
        // Initialize after reconnection attempt
        initChainManager();
      } catch (e) {
        logger.error('Failed to reconnect:', e);
      }
    };

    init();
  }, [config]);

  // Effect to watch for account changes
  useEffect(() => {
    // Setup account watcher to react to connection changes
    unwatch.current = watchAccount(config, {
      onChange(account) {
        logger.info('Account changed:', account);
        if (account.isConnected) {
          initChainManager();
        } else {
          setIsConnected(false);
          setChainManager(null);
        }
      },
    });

    // Cleanup function
    return () => {
      if (unwatch.current) {
        unwatch.current();
      }
    };
  }, [config]);

  const contextValue: LitContextConfig = {
    chainManager,
    isConnected,
    error,
  };

  return (
    <LitContext.Provider value={contextValue}>{children}</LitContext.Provider>
  );
};
