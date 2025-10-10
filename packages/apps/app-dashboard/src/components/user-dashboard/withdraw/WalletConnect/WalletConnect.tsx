import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
import * as Sentry from '@sentry/react';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import StatusMessage from '@/components/user-dashboard/connect/StatusMessage';
import QrReader from '@/components/user-dashboard/withdraw/WalletConnect/QrReader';
import { useState, useCallback, useEffect } from 'react';
import React from 'react';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';

// Custom hooks
import { useWalletConnectSession } from '@/hooks/user-dashboard/WalletConnect/useWalletConnectSession';
import { useWalletConnectRequests } from '@/hooks/user-dashboard/WalletConnect/useWalletConnectRequests';

// UI Components
import { SessionProposal } from './SessionProposal';
import { ActiveSessions } from './ActiveSessions';
import { PendingRequests } from './PendingRequests';
import LoadingLock from '@/components/shared/ui/LoadingLock';

export default function WalletConnectPage(params: {
  deepLink?: string;
  agentPKP?: IRelayPKP;
  sessionSigs?: SessionSigs;
  onSwitchToManual?: () => void;
}) {
  const { deepLink, agentPKP, sessionSigs, onSwitchToManual } = params;
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

  // Auto-hide success messages after 3 seconds
  useEffect(() => {
    if (status.message && status.type === 'success') {
      const timer = setTimeout(() => {
        setStatus({ message: '', type: undefined });
      }, 3000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [status.message, status.type, setStatus]);

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
        setStatus({ message: 'Successfully paired with dApp', type: 'success' });
      } catch (error) {
        console.error('WalletConnect error:', error);
        Sentry.captureException(error);
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

  // Handle URI input change and auto-connect on paste
  const handleUriChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newUri = e.target.value;
      setUri(newUri);

      // Auto-connect if a valid WalletConnect URI is pasted
      if (
        newUri.startsWith('wc:') &&
        !loading &&
        !isInitializing &&
        client &&
        (!agentPKP || walletRegistered)
      ) {
        onConnect(newUri);
      }
    },
    [loading, isInitializing, client, agentPKP, walletRegistered, onConnect],
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
        Sentry.captureException(error);
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
        setStatus({ message: 'Request rejected', type: 'success' });
      } catch (error) {
        Sentry.captureException(error);
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
    <>
      {/* Show loading state while PKP wallet is initializing */}
      {shouldWaitForWallet && !walletRegistered ? (
        <div className="w-full flex justify-center items-center py-8">
          <LoadingLock />
        </div>
      ) : (
        <>
          {/* Unified status message */}
          <StatusMessage
            message={status.message || 'Idle'}
            type={status.message ? status.type : 'info'}
          />

          {/* QR reader should be visible once we're initialized */}
          {client && !isInitializing && <QrReader onConnect={onConnect} />}

          {/* OR divider */}
          <div className="flex items-center my-4">
            <div className={`flex-1 border-t ${theme.cardBorder}`}></div>
            <span className={`px-3 text-sm ${theme.textMuted}`} style={fonts.heading}>
              OR
            </span>
            <div className={`flex-1 border-t ${theme.cardBorder}`}></div>
          </div>

          {/* Manual URI input */}
          <div className="w-full mb-4">
            <Input
              className={`w-full ${theme.itemBg} ${theme.cardBorder} ${theme.text} text-xs sm:text-sm placeholder:text-xs sm:placeholder:text-sm`}
              placeholder="Paste WalletConnect URI (e.g. wc:a281...)"
              onChange={handleUriChange}
              value={uri}
              data-testid="uri-input"
              disabled={isInitializing || !client}
            />
          </div>

          {/* Manual Withdraw Button */}
          {onSwitchToManual && (
            <div className="mt-4 text-center px-2">
              <Button
                variant="ghost"
                className="text-sm transition-colors whitespace-normal h-auto py-2 leading-relaxed"
                style={{ color: theme.brandOrange, ...fonts.body }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                onClick={onSwitchToManual}
              >
                Issues with WalletConnect? Click here to manually withdraw.
              </Button>
            </div>
          )}

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
            client={client}
          />
        </>
      )}
    </>
  );
}
