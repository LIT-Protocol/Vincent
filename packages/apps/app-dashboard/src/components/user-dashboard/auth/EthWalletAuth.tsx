import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import { useSetAuthInfo } from '@/components/consent/hooks/useAuthInfo';
import { Button } from '@/components/ui/button';

interface WalletAuthProps {
  authWithEthWallet: (
    address: string,
    signMessage: (message: string) => Promise<string>,
  ) => Promise<void>;
  setView: (view: string) => void;
}

export default function EthWalletAuth({ authWithEthWallet, setView }: WalletAuthProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const { setAuthInfo } = useSetAuthInfo();

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
          type: 'Ethereum Wallet',
          value: address,
          authenticatedAt: new Date().toISOString(),
        });
      } catch (storageError) {
        console.error('Error storing wallet auth info in localStorage:', storageError);
      }

      await authWithEthWallet(address, signMessage);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-black animate-spin mb-4"></div>
        <p className="text-sm text-gray-600">Authenticating...</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-xl font-semibold text-center text-gray-800 mb-2">Connect Wallet</h1>

      <p className="text-sm text-gray-600 text-center mb-6">
        {isWalletReady
          ? 'Sign a SIWE message to authenticate'
          : 'Connect your wallet for web3 authentication'}
      </p>

      {isWalletReady && (
        <div className="mb-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-center mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-green-800">Connected wallet</span>
            </div>
            <div className="bg-white rounded p-2 border border-green-200">
              <div className="font-mono text-xs text-gray-900 break-all text-center">{address}</div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full">
        <div className="space-y-4">
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
                        <Button onClick={openConnectModal} className="w-full">
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
              <Button onClick={authenticate} disabled={loading} className="w-full">
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Authenticating...
                  </div>
                ) : (
                  'Sign In with Wallet'
                )}
              </Button>
              <Button onClick={() => disconnect()} variant="outline" className="w-full">
                Disconnect
              </Button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="pt-2">
            <Button onClick={() => setView('default')} variant="outline" className="w-full">
              Back
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
