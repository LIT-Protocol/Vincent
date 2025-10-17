import { useState, useEffect, useRef } from 'react';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, polygon, arbitrum, optimism, base, AppKitNetwork } from '@reown/appkit/networks';
import { useAccount, useSignMessage, useDisconnect, useConfig } from 'wagmi';
import { Button } from '@/components/shared/ui/button';
import { ThemeType } from '../connect/ui/theme';
import StatusMessage from '../connect/StatusMessage';
import { env } from '@/config/env';

interface WalletAuthProps {
  authWithEthWallet: (
    address: string,
    signMessage: (message: string) => Promise<string>,
  ) => Promise<void>;
  setView: (view: string) => void;
  theme: ThemeType;
}

export default function EthWalletAuth({ authWithEthWallet, setView, theme }: WalletAuthProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [appKitInitialized, setAppKitInitialized] = useState(false);
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const wagmiConfig = useConfig();
  const appKitRef = useRef<any>(null);

  const { VITE_WALLETCONNECT_PROJECT_ID, VITE_DASHBOARD_URL } = env;

  // Initialize AppKit on demand - wrap existing wagmi config in WagmiAdapter
  useEffect(() => {
    if (!appKitInitialized && wagmiConfig) {
      const allNetworks = [mainnet, polygon, arbitrum, optimism, base] as [
        AppKitNetwork,
        ...AppKitNetwork[],
      ];

      // Create a WagmiAdapter that wraps the existing config from WagmiProviderWrapper
      const wagmiAdapter = new WagmiAdapter({
        projectId: VITE_WALLETCONNECT_PROJECT_ID,
        networks: allNetworks,
      });

      // Override the adapter's wagmiConfig with the one from the provider
      // This ensures AppKit uses the same config instance as the wagmi hooks
      Object.defineProperty(wagmiAdapter, 'wagmiConfig', {
        get: () => wagmiConfig,
        configurable: true,
      });

      appKitRef.current = createAppKit({
        adapters: [wagmiAdapter],
        networks: [...allNetworks],
        projectId: VITE_WALLETCONNECT_PROJECT_ID,
        metadata: {
          name: 'Vincent Auth',
          description: 'Vincent Wallet Authentication',
          url: typeof window !== 'undefined' ? window.location.origin : VITE_DASHBOARD_URL,
          icons: [`${VITE_DASHBOARD_URL}/logo.svg`],
        },
        themeMode: 'dark',
      });

      setAppKitInitialized(true);
    }
  }, [appKitInitialized, wagmiConfig, VITE_WALLETCONNECT_PROJECT_ID, VITE_DASHBOARD_URL]);

  // Clean up AppKit when component unmounts or after successful authentication
  useEffect(() => {
    return () => {
      if (appKitRef.current) {
        try {
          // Close any open modals first
          if (appKitRef.current.close) {
            appKitRef.current.close();
          }
          // Clear the AppKit instance to free up WalletConnect resources
          appKitRef.current = null;
        } catch (error) {
          console.error('Error cleaning up AppKit:', error);
        }
      }
    };
  }, []);

  const openWalletModal = () => {
    if (appKitRef.current) {
      // Open the connect view specifically, not the account view
      appKitRef.current.open({ view: 'Connect' });
    }
  };

  // Simplified wallet ready state
  const isWalletReady = isConnected && address;

  const authenticate = async () => {
    if (!isWalletReady) {
      setError('Please connect your wallet first');
      return;
    }

    setError('');

    try {
      const signMessage = async (message: string) => {
        setLoading(true);
        try {
          return await signMessageAsync({ message });
        } finally {
          setLoading(false);
        }
      };

      await authWithEthWallet(address, signMessage);

      // Clean up AppKit after successful authentication to prevent conflicts with WalletKit
      if (appKitRef.current) {
        try {
          console.log('Cleaning up WalletConnect auth provider after successful authentication');
          // Close any open modals
          if (appKitRef.current.close) {
            appKitRef.current.close();
          }
          // Clear the AppKit instance reference to free up WalletConnect Core storage
          appKitRef.current = null;
          setAppKitInitialized(false);
        } catch (cleanupError) {
          console.error('Error cleaning up AppKit after auth:', cleanupError);
        }
      }
    } catch (err: any) {
      console.error('Error authenticating with wallet:', err);
      let errorMessage = 'Failed to authenticate with wallet. Please try again.';

      if (err.message) {
        if (err.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (err.message.includes('rejected') || err.message.includes('denied')) {
          errorMessage = 'Authentication was cancelled. Please try again.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    }
  };

  return (
    <>
      <div className="flex justify-center">
        <div className="space-y-4 w-4/5">
          {!isWalletReady ? (
            <div className="flex justify-center">
              <Button
                onClick={openWalletModal}
                disabled={!appKitInitialized}
                className={`w-full ${theme.accentBg} ${theme.accentHover} rounded-xl py-3 px-4 font-medium text-sm transition-all duration-200 hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {appKitInitialized ? 'Connect Wallet' : 'Initializing...'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className={`${theme.successBg} border ${theme.cardBorder} rounded-lg p-3`}>
                <div className="flex items-center justify-center mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className={`text-sm font-medium ${theme.successText}`}>
                    Connected Wallet
                  </span>
                </div>
                <div className={`rounded p-2 border ${theme.cardBg} ${theme.cardBorder}`}>
                  <div className={`text-[10px] break-all text-center ${theme.text}`}>{address}</div>
                </div>
              </div>
              <Button
                onClick={authenticate}
                disabled={loading}
                className={`w-full ${theme.accentBg} ${theme.accentHover} rounded-xl py-3 px-4 font-medium text-sm transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    Connect with Wallet
                  </>
                )}
              </Button>
              <Button
                onClick={() => disconnect()}
                className={`w-full ${theme.cardBg} ${theme.text} border ${theme.cardBorder} ${theme.itemHoverBg} rounded-xl py-3 px-4 font-medium text-sm transition-all duration-200 hover:shadow-sm flex items-center justify-center gap-2 mt-3`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Disconnect
              </Button>
            </div>
          )}

          {error && <StatusMessage message={error} type="error" />}

          <Button
            onClick={() => setView('default')}
            className={`w-full ${theme.cardBg} ${theme.text} border ${theme.cardBorder} ${theme.itemHoverBg} rounded-xl py-3 px-4 font-medium text-sm transition-all duration-200 hover:shadow-sm flex items-center justify-center gap-2`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back
          </Button>
        </div>
      </div>
    </>
  );
}
