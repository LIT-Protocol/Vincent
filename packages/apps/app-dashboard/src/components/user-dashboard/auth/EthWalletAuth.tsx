import { useState } from 'react';
import { useAppKit } from '@reown/appkit/react';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import { useSetAuthInfo } from '../../../hooks/user-dashboard/useAuthInfo';
import { Button } from '@/components/shared/ui/button';
import { ThemeType } from '../connect/ui/theme';
import StatusMessage from '../connect/StatusMessage';
import Loading from '@/components/shared/ui/Loading';

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
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const { setAuthInfo } = useSetAuthInfo();

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

      try {
        setAuthInfo({
          type: 'wallet',
          value: address,
          authenticatedAt: new Date().toISOString(),
        });
      } catch (storageError) {
        console.error('Error storing wallet auth info in localStorage:', storageError);
      }

      await authWithEthWallet(address, signMessage);
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

  if (loading) {
    return <Loading text="Please sign the message in your wallet" />;
  }

  return (
    <>
      {isWalletReady && (
        <div className="mb-4 flex justify-center">
          <div className="w-4/5">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-center mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-green-800">Connected Wallet</span>
              </div>
              <div className="rounded p-2 border bg-white border-green-300">
                <div className="text-[10px] break-all text-center text-black">{address}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <div className="space-y-4 w-4/5">
          {!isWalletReady ? (
            <div className="flex justify-center">
              <Button
                onClick={() => open()}
                className={`w-full ${theme.accentBg} ${theme.accentHover} rounded-xl py-3 px-4 font-medium text-sm transition-all duration-200 hover:shadow-md flex items-center justify-center gap-2`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Connect Wallet
              </Button>
            </div>
          ) : (
            <div>
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
