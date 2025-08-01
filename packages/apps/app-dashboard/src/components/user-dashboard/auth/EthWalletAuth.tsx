import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import { useSetAuthInfo } from '../../../hooks/user-dashboard/useAuthInfo';
import { Button } from '@/components/shared/ui/button';
import { ThemeType } from '../connect/ui/theme';
import StatusMessage from '../connect/StatusMessage';

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
  const { setAuthInfo } = useSetAuthInfo();

  // Simplified wallet ready state
  const isWalletReady = isConnected && address;

  const authenticate = async () => {
    if (!isWalletReady) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const signMessage = async (message: string) => {
        return await signMessageAsync({ message });
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
        if (err.message.includes('User rejected') || err.message.includes('denied')) {
          errorMessage = 'Signature was cancelled. Please try again.';
        } else if (err.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <div
          className={`w-12 h-12 rounded-full border-4 border-t-black animate-spin mb-4 ${theme.cardBorder}`}
        ></div>
        <p className={`text-sm ${theme.textMuted}`}>Authenticating...</p>
      </div>
    );
  }

  return (
    <>
      <h1 className={`text-xl font-semibold text-center mb-2 ${theme.text}`}>
        Connect with your Wallet
      </h1>
      <p className={`text-sm text-center mb-6 ${theme.textMuted}`}>
        Connect and sign with your Ethereum wallet
      </p>
      {isWalletReady && (
        <div className="mb-4 flex justify-center">
          <div className="w-4/5">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-center mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-green-800">Connected wallet</span>
              </div>
              <div className={`rounded p-2 border ${theme.cardBg} ${theme.cardBorder}`}>
                <div className={`font-mono text-xs break-all text-center ${theme.text}`}>
                  {address}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <div className="space-y-4 w-4/5">
          {!isWalletReady ? (
            <div className="flex justify-center">
              <ConnectButton.Custom>
                {({ account, chain, openConnectModal, mounted }) => {
                  const ready = mounted;
                  const connected = ready && account && chain;

                  return (
                    <div
                      {...(!ready && {
                        'aria-hidden': true,
                        style: {
                          opacity: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                      className="w-full"
                    >
                      {!connected && (
                        <Button
                          onClick={openConnectModal}
                          className={`w-full ${theme.accentBg} ${theme.accentHover}`}
                        >
                          Connect Wallet
                        </Button>
                      )}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                onClick={authenticate}
                disabled={loading}
                className={`w-full ${theme.accentBg} ${theme.accentHover}`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Authenticating...
                  </div>
                ) : (
                  'Connect with Wallet'
                )}
              </Button>
              <Button
                onClick={() => disconnect()}
                className={`w-full ${theme.cardBg} ${theme.text} border ${theme.cardBorder} ${theme.itemHoverBg}`}
              >
                Disconnect
              </Button>
            </div>
          )}

          {error && <StatusMessage message={error} type="error" />}

          <div className="pt-2">
            <Button
              onClick={() => setView('default')}
              className={`w-full ${theme.cardBg} ${theme.text} border ${theme.cardBorder} ${theme.itemHoverBg}`}
            >
              Back
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
