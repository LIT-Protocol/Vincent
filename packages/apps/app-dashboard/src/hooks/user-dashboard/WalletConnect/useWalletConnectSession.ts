import { useState, useEffect, useCallback, useRef } from 'react';
import * as Sentry from '@sentry/react';
import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
import {
  useWalletConnectClient,
  useWalletConnectSessions,
  useWalletConnectStoreActions,
  useCurrentWalletAddress,
} from '@/components/user-dashboard/withdraw/WalletConnect/WalletConnectStore';
import {
  createWalletConnectClient,
  disconnectSession,
  registerPKPWallet,
} from '@/components/user-dashboard/withdraw/WalletConnect/WalletConnectUtil';
import useWalletConnectStore from '@/components/user-dashboard/withdraw/WalletConnect/WalletConnectStore';

type Proposal = {
  id: number;
  params: {
    requiredNamespaces: Record<string, any>;
    optionalNamespaces: Record<string, any>;
    proposer: {
      metadata: {
        name: string;
        description: string;
        url: string;
        icons: string[];
      };
    };
  };
};

export function useWalletConnectSession(agentPKP?: IRelayPKP, sessionSigs?: SessionSigs) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [walletRegistered, setWalletRegistered] = useState(false);
  const [pendingProposal, setPendingProposal] = useState<Proposal | null>(null);
  const [processingProposal, setProcessingProposal] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    message: string;
    type: 'info' | 'warning' | 'success' | 'error' | undefined;
  }>({
    message: '',
    type: undefined,
  });

  const client = useWalletConnectClient();
  const sessions = useWalletConnectSessions();
  const { refreshSessions } = useWalletConnectStoreActions();
  const currentWalletAddress = useCurrentWalletAddress();

  const isRegistering = useRef(false);
  const requestHandlersSetup = useRef(false);
  const previousWalletAddress = useRef<string | null>(null);

  // Initialize WalletConnect
  useEffect(() => {
    if (isInitializing || client) return;

    setIsInitializing(true);
    setStatus({ message: 'Initializing WalletConnect...', type: 'info' });

    const doInitialize = async () => {
      try {
        await createWalletConnectClient((clientInstance) => {
          useWalletConnectStore.getState().actions.setClient(clientInstance);
          refreshSessions();
          setStatus({ message: 'WalletConnect initialized successfully', type: 'success' });
        });
      } catch (initError) {
        console.error('Failed to initialize WalletConnect:', initError);
        Sentry.addBreadcrumb({
          category: 'walletconnect.init',
          message: 'Failed to initialize WalletConnect client',
          level: 'error',
          data: {
            error: initError instanceof Error ? initError.message : String(initError),
          },
        });
        setStatus({
          message: 'Failed to initialize WalletConnect. Please try refreshing the page.',
          type: 'error',
        });
      } finally {
        setIsInitializing(false);
      }
    };

    doInitialize();
  }, [client, isInitializing, refreshSessions]);

  // Reset walletRegistered when agentPKP changes
  useEffect(() => {
    if (
      agentPKP &&
      previousWalletAddress.current &&
      previousWalletAddress.current !== agentPKP.ethAddress
    ) {
      setWalletRegistered(false);
    }
  }, [agentPKP]);

  // Setup PKP wallet when client is available
  useEffect(() => {
    const shouldRegister = client && agentPKP && !walletRegistered;

    const setupPKPWallet = async () => {
      if (!shouldRegister || isRegistering.current) return;

      try {
        isRegistering.current = true;
        setStatus({ message: 'Registering PKP wallet...', type: 'info' });

        await registerPKPWallet(agentPKP, sessionSigs);
        refreshSessions();

        setWalletRegistered(true);
        setStatus({ message: 'PKP wallet registered successfully', type: 'success' });
      } catch (err) {
        console.error('Failed to register PKP wallet:', err);
        Sentry.addBreadcrumb({
          category: 'walletconnect.pkp',
          message: 'Failed to register PKP wallet',
          level: 'error',
          data: {
            pkpAddress: agentPKP?.ethAddress,
            error: err instanceof Error ? err.message : String(err),
          },
        });
        setStatus({
          message: `Failed to register PKP wallet: ${err instanceof Error ? err.message : 'Unknown error'}`,
          type: 'error',
        });
      } finally {
        isRegistering.current = false;
      }
    };

    setupPKPWallet();
  }, [client, agentPKP, sessionSigs, walletRegistered, refreshSessions]);

  // Handle session approval
  const handleApproveSession = useCallback(async () => {
    if (!client || !pendingProposal || !agentPKP?.ethAddress) {
      setStatus({ message: 'Cannot approve session', type: 'error' });
      return;
    }

    try {
      setProcessingProposal(true);
      setStatus({ message: 'Approving session proposal...', type: 'info' });

      const { id, params } = pendingProposal;
      const { requiredNamespaces, optionalNamespaces } = params;
      const formattedAddress = agentPKP.ethAddress.toLowerCase();
      const approvedNamespaces: Record<string, any> = {};

      for (const [chain, requirements] of Object.entries({
        ...requiredNamespaces,
        ...optionalNamespaces,
      })) {
        if (chain === 'eip155') {
          const chains = (requirements as any).chains || [];
          const methods = (requirements as any).methods || [];
          const events = (requirements as any).events || [];

          const accounts = chains.map((chainId: string) => {
            // Ensure chainId is in the correct format (eip155:chainNumber)
            let formattedChainId: string;
            if (chainId.startsWith('eip155:')) {
              formattedChainId = chainId; // Already in correct format
            } else {
              // Remove any existing eip155: prefix and add it properly
              const cleanChainId = chainId.replace('eip155:', '');
              formattedChainId = `eip155:${cleanChainId}`;
            }
            return `${formattedChainId}:${formattedAddress}`;
          });

          approvedNamespaces[chain] = { accounts, methods, events };
        } else {
          // Skip non-EIP155 namespaces since we only support Ethereum
          continue;
        }
      }

      const sessionProperties = {
        capabilities: JSON.stringify({
          signTransaction: true,
          signMessage: true,
          signTypedData: true,
          sendTransaction: true,
        }),
      };

      await client.approveSession({
        id,
        namespaces: approvedNamespaces,
        sessionProperties,
      });
      setStatus({ message: 'Session approved successfully', type: 'success' });
      setPendingProposal(null);
      refreshSessions();
    } catch (error) {
      console.error('Failed to approve session:', error);
      Sentry.addBreadcrumb({
        category: 'walletconnect.session',
        message: 'Failed to approve session proposal',
        level: 'error',
        data: {
          proposalId: pendingProposal?.id,
          agentPkpAddress: agentPKP?.ethAddress,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      setStatus({
        message: error instanceof Error ? error.message : 'Failed to approve session',
        type: 'error',
      });

      setPendingProposal(null);
    } finally {
      setProcessingProposal(false);
    }
  }, [client, pendingProposal, agentPKP, refreshSessions]);

  // Handle session rejection
  const handleRejectSession = useCallback(async () => {
    if (!client || !pendingProposal) return;

    try {
      setProcessingProposal(true);
      setStatus({ message: 'Rejecting session proposal...', type: 'info' });

      await client.rejectSession({
        id: pendingProposal.id,
        reason: { code: 4001, message: 'User rejected the session' },
      });

      setStatus({ message: 'Session rejected successfully', type: 'success' });
      setPendingProposal(null);
    } catch (error) {
      console.error('Failed to reject session:', error);
      Sentry.addBreadcrumb({
        category: 'walletconnect.session',
        message: 'Failed to reject session proposal',
        level: 'error',
        data: {
          proposalId: pendingProposal?.id,
          error: error instanceof Error ? error.message : String(error),
        },
      });
      setStatus({
        message: error instanceof Error ? error.message : 'Failed to reject session',
        type: 'error',
      });
    } finally {
      setProcessingProposal(false);
    }
  }, [client, pendingProposal]);

  // Handle session disconnect
  const handleDisconnect = useCallback(
    async (topic: string) => {
      if (!client) return;

      try {
        setDisconnecting(topic);
        await disconnectSession(topic, refreshSessions);
      } catch (error) {
        console.error('Failed to disconnect session:', error);
        Sentry.addBreadcrumb({
          category: 'walletconnect.session',
          message: 'Failed to disconnect session',
          level: 'error',
          data: {
            sessionTopic: topic,
            error: error instanceof Error ? error.message : String(error),
          },
        });
        setStatus({
          message: error instanceof Error ? error.message : 'Failed to disconnect session.',
          type: 'error',
        });
      } finally {
        setDisconnecting(null);
      }
    },
    [client, refreshSessions],
  );

  // Listen for session proposals
  useEffect(() => {
    if (!client) return;

    const handleSessionProposal = (proposal: Proposal) => {
      console.log('Received session proposal:', proposal);
      setPendingProposal(proposal);
    };

    const handleSessionDelete = (event: { topic: string }) => {
      console.log('Session deleted:', event);
      refreshSessions();
      if (event.topic) {
        setStatus({
          message: `Session disconnected: ${event.topic.slice(0, 8)}...`,
          type: 'success',
        });
      }
    };

    client.on('session_proposal', handleSessionProposal);
    client.on('session_delete', handleSessionDelete);

    return () => {
      client.off('session_proposal', handleSessionProposal);
      client.off('session_delete', handleSessionDelete);
    };
  }, [client, refreshSessions]);

  // Disconnect all sessions when wallet address changes to a different address
  useEffect(() => {
    if (!client || !currentWalletAddress) return;

    // Only disconnect if the wallet address actually changed to a different address
    // AND we had a previous address (not first time initialization)
    if (
      previousWalletAddress.current &&
      previousWalletAddress.current !== currentWalletAddress &&
      previousWalletAddress.current !== null
    ) {
      const disconnectAllSessions = async () => {
        try {
          const activeSessions = client.getActiveSessions() || {};
          const sessionTopics = Object.keys(activeSessions);

          if (sessionTopics.length > 0) {
            console.log(
              `Wallet changed from ${previousWalletAddress.current} to ${currentWalletAddress}, disconnecting ${sessionTopics.length} active sessions`,
            );

            for (const topic of sessionTopics) {
              try {
                await disconnectSession(topic);
                console.log(`Disconnected session: ${topic.slice(0, 8)}...`);
              } catch (error) {
                console.error(`Failed to disconnect session ${topic}:`, error);
                Sentry.addBreadcrumb({
                  category: 'walletconnect.cleanup',
                  message: 'Failed to disconnect old session during wallet change',
                  level: 'warning',
                  data: {
                    sessionTopic: topic,
                    error: error instanceof Error ? error.message : String(error),
                  },
                });
              }
            }

            refreshSessions();
            setStatus({
              message: 'Previous sessions cleared for new wallet',
              type: 'info',
            });
          }
        } catch (error) {
          console.error('Failed to disconnect sessions on wallet change:', error);
          Sentry.addBreadcrumb({
            category: 'walletconnect.cleanup',
            message: 'Failed to cleanup sessions during wallet change',
            level: 'error',
            data: {
              agentPkpAddress: agentPKP?.ethAddress,
              error: error instanceof Error ? error.message : String(error),
            },
          });
        }
      };

      disconnectAllSessions();
    }

    // Update the previous wallet address
    previousWalletAddress.current = currentWalletAddress;
  }, [currentWalletAddress, client, refreshSessions]);

  return {
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
    requestHandlersSetup,
  };
}
