import { parseUri } from '@walletconnect/utils';
import QrReader from '@/components/withdraw/QrReader';
import { walletkit, createWalletKit } from '@/components/withdraw/WalletConnectUtil';
import { Button } from '@/components/ui/button';
import { Fragment, useEffect, useState } from 'react';
import ModalStore from '@/components/withdraw/ModalStore';
import { Input } from '@/components/ui/input';
import Loading from '@/components/layout/Loading';

export default function WalletConnectPage(params: { deepLink?: string }) {
  const { deepLink } = params;
  const [uri, setUri] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize WalletConnect
  useEffect(() => {
    const initWalletConnect = async () => {
      if (!walletkit && !isInitializing) {
        try {
          setIsInitializing(true);
          setError('Initializing WalletConnect...');

          // Default to global region if none provided
          await createWalletKit('global');

          setError(null);
          console.log('WalletConnect initialized successfully');
        } catch (initError) {
          console.error('Failed to initialize WalletConnect:', initError);
          setError('Failed to initialize WalletConnect. Please try refreshing the page.');
        } finally {
          setIsInitializing(false);
        }
      }
    };

    initWalletConnect();
  }, [isInitializing]);

  async function onConnect(uri: string) {
    if (!walletkit) {
      setError('WalletConnect is not initialized yet. Please wait a moment and try again.');
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const { topic: pairingTopic } = parseUri(uri);

      // Set up pairing expired listener if WalletConnect core is available
      if (walletkit.core?.pairing?.events) {
        // if for some reason, the proposal is not received, we need to close the modal when the pairing expires (5mins)
        const pairingExpiredListener = ({ topic }: { topic: string }) => {
          if (pairingTopic === topic) {
            ModalStore.close();
            walletkit.core.pairing.events.removeListener('pairing_expire', pairingExpiredListener);
          }
        };

        // Set up session proposal listener
        walletkit.once('session_proposal', () => {
          walletkit.core.pairing.events.removeListener('pairing_expire', pairingExpiredListener);
        });

        // Register pairing expired listener
        walletkit.core.pairing.events.on('pairing_expire', pairingExpiredListener);
      }

      // Attempt to pair with the URI
      await walletkit.pair({ uri });
    } catch (error) {
      console.error('WalletConnect error:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect. Invalid URI format.');
      ModalStore.close();
    } finally {
      setLoading(false);
      setUri('');
    }
  }

  useEffect(() => {
    if (deepLink && walletkit) {
      onConnect(deepLink);
    }
  }, [deepLink, walletkit]);

  return (
    <Fragment>
      <>
        {!isInitializing && !error && <QrReader onConnect={onConnect} />}

        {error && (
          <div className="w-full mt-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded">
            {error}
          </div>
        )}

        {isInitializing && (
          <div className="w-full flex justify-center items-center py-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p>Initializing WalletConnect...</p>
            </div>
          </div>
        )}

        <div className="flex w-full mt-4">
          <Input
            className="w-full rounded-r-none"
            placeholder="e.g. wc:a281567bb3e4..."
            onChange={(e) => setUri(e.target.value)}
            value={uri}
            data-testid="uri-input"
            disabled={isInitializing || !walletkit}
          />
          <Button
            size="sm"
            className="rounded-l-none"
            disabled={!uri || loading || isInitializing || !walletkit}
            onClick={() => onConnect(uri)}
            data-testid="uri-connect-button"
          >
            {loading ? (
              <div className="flex justify-center">
                <Loading />
              </div>
            ) : (
              'Connect'
            )}
          </Button>
        </div>
      </>
    </Fragment>
  );
}
