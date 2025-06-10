import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import StatusMessage from '@/components/consent/components/authForm/StatusMessage';
import QrReader from './QrReader';
import { useState, useCallback, useEffect } from 'react';
import React from 'react';

// Custom hooks
import { useWalletConnectSession } from './useWalletConnectSession';
import { useWalletConnectRequests } from './useWalletConnectRequests';

// UI Components
import { SessionProposal } from './SessionProposal';
import { ActiveSessions } from './ActiveSessions';
import { PendingRequests } from './PendingRequests';

export default function WalletConnectPage(params: {
  deepLink?: string;
  agentPKP?: IRelayPKP;
  sessionSigs?: SessionSigs;
}) {
  const { deepLink, agentPKP, sessionSigs } = params;
  const [uri, setUri] = useState('');
  const [loading, setLoading] = useState(false);

  // Use custom hooks
  const {
    client,
    sessions,
    currentWalletAddress,
    isInitializing,
    walletRegistered,
    pendingProposal,
    processingProposal,
    disconnecting,
    status,
    setStatus,
    handleApproveSession,
    handleRejectSession,
    handleDisconnect,
  } = useWalletConnectSession(agentPKP, sessionSigs);

  const { pendingSessionRequests, processingRequest, handleApproveRequest, handleRejectRequest } =
    useWalletConnectRequests(client, currentWalletAddress);

  // Handle connect with URI
  const onConnect = useCallback(
    async (uriToConnect: string) => {
      if (!client) {
        setStatus({
          message: 'WalletConnect is not initialized yet. Please wait a moment and try again.',
          type: 'error',
        });
        return;
      }

      if (agentPKP && !walletRegistered) {
        setStatus({
          message: 'PKP wallet is not yet registered. Please wait a moment.',
          type: 'error',
        });
        return;
      }

      try {
        setLoading(true);
        setStatus({ message: 'Attempting to connect...', type: 'info' });

        await client.pair({ uri: uriToConnect });
        setStatus({ message: 'Successfully paired with dapp', type: 'success' });
      } catch (error) {
        console.error('WalletConnect error:', error);
        setStatus({
          message:
            error instanceof Error ? error.message : 'Failed to connect. Invalid URI format.',
          type: 'error',
        });
      } finally {
        setLoading(false);
        setUri('');
      }
    },
    [client, agentPKP, walletRegistered, setStatus],
  );

  // Handle deepLink
  useEffect(() => {
    if (deepLink && client) {
      onConnect(deepLink);
    }
  }, [deepLink, client, onConnect]);

  // Enhanced request handlers with status updates
  const handleApproveWithStatus = useCallback(
    async (request: any) => {
      try {
        const result = await handleApproveRequest(request);
        setStatus({
          message: `${result.method === 'eth_sendTransaction' ? 'Transaction' : 'Request'} approved successfully`,
          type: 'success',
        });
      } catch (error) {
        setStatus({
          message: error instanceof Error ? error.message : 'Failed to approve request',
          type: 'error',
        });
      }
    },
    [handleApproveRequest, setStatus],
  );

  const handleRejectWithStatus = useCallback(
    async (request: any) => {
      try {
        await handleRejectRequest(request);
        setStatus({ message: 'Request rejected', type: 'info' });
      } catch (error) {
        setStatus({
          message: error instanceof Error ? error.message : 'Failed to reject request',
          type: 'error',
        });
      }
    },
    [handleRejectRequest, setStatus],
  );

  // Determine if we need to wait for wallet initialization
  const shouldWaitForWallet = !!agentPKP;

  return (
    <div className="w-full max-w-lg mx-auto p-4 bg-white rounded-lg shadow-sm">
      {/* Show loading state while PKP wallet is initializing */}
      {shouldWaitForWallet && !walletRegistered ? (
        <div className="w-full flex justify-center items-center py-8">
          <div className="flex flex-col items-center space-y-4">
            <StatusMessage
              message={status.message || 'Initializing PKP Wallet...'}
              type={status.type || 'info'}
            />
          </div>
        </div>
      ) : (
        <>
          {/* QR reader should be visible once we're initialized */}
          {client && !isInitializing && <QrReader onConnect={onConnect} />}

          {/* Manual URI input */}
          <div className="flex w-full mt-4 mb-4">
            <Input
              className="w-full rounded-r-none"
              placeholder="e.g. wc:a281567bb3e4..."
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUri(e.target.value)}
              value={uri}
              data-testid="uri-input"
              disabled={isInitializing || !client}
            />
            <Button
              size="sm"
              className="rounded-l-none"
              disabled={
                !uri || loading || isInitializing || !client || (agentPKP && !walletRegistered)
              }
              onClick={() => onConnect(uri)}
              data-testid="uri-connect-button"
            >
              {loading ? 'Connecting...' : 'Connect'}
            </Button>
          </div>

          {/* Unified status message */}
          {status.message && <StatusMessage message={status.message} type={status.type} />}

          {/* Session Proposal */}
          {pendingProposal && !loading && (
            <SessionProposal
              proposal={pendingProposal}
              onApprove={handleApproveSession}
              onReject={handleRejectSession}
              processing={processingProposal}
              walletRegistered={walletRegistered}
            />
          )}

          {/* Active Sessions */}
          <ActiveSessions
            sessions={sessions}
            currentWalletAddress={currentWalletAddress}
            onDisconnect={handleDisconnect}
            disconnecting={disconnecting}
          />

          {/* Pending Requests */}
          <PendingRequests
            requests={pendingSessionRequests}
            onApprove={handleApproveWithStatus}
            onReject={handleRejectWithStatus}
            processing={processingRequest}
          />
        </>
      )}
    </div>
  );
}
