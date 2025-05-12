import QrReader from '@/components/withdraw/WalletConnect/QrReader';
import { walletkit, createWalletKit } from '@/components/withdraw/WalletConnect/WalletConnectUtil';
import { registerPKPWallet } from '@/components/withdraw/WalletConnect/PKPWalletUtil';
import { Button } from '@/components/ui/button';
import { Fragment, useEffect, useState } from 'react';
import ModalStore from '@/components/withdraw/WalletConnect/ModalStore';
import { Input } from '@/components/ui/input';
import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
import StatusMessage from '../../consent/components/authForm/StatusMessage';
import React from 'react';

// Define proper types to replace any
type NamespaceRequirement = {
  chains: string[];
  methods: string[];
  events: string[];
};

type SessionMetadata = {
  name: string;
  description: string;
  url: string;
  icons: string[];
};

// Update the Proposal type to match both formats that appear in the code
type Proposal = {
  id: number;
  params: {
    requiredNamespaces: Record<string, NamespaceRequirement>;
    optionalNamespaces: Record<string, NamespaceRequirement>;
    proposer: {
      metadata: SessionMetadata;
    };
  };
  // Add this for direct access pattern seen in the code
  proposer?: {
    metadata: SessionMetadata;
    requiredNamespaces?: Record<string, NamespaceRequirement>;
  };
};

type Session = {
  topic: string;
  namespaces: Record<string, unknown>;
  expiry: number;
  acknowledged: boolean;
  controller: string;
  peer: {
    metadata: SessionMetadata;
  };
  relay: {
    protocol: string;
  };
};

// Add more specific WalletConnect types to fix the type errors
type RejectSessionParams = {
  id: number;
  reason: {
    code: number;
    message: string;
  };
};

type DisconnectSessionParams = {
  topic: string;
  reason: {
    code: number;
    message: string;
  };
};

export default function WalletConnectPage(params: {
  deepLink?: string;
  agentPKP?: IRelayPKP;
  sessionSigs?: SessionSigs;
}) {
  const { deepLink, agentPKP, sessionSigs } = params;
  const [uri, setUri] = useState('');
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [walletRegistered, setWalletRegistered] = useState(false);
  const [pendingProposal, setPendingProposal] = useState<Proposal | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [processingProposal, setProcessingProposal] = useState(false);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);

  // Create isRegistering ref at the top level of the component
  const isRegistering = React.useRef(false);

  // Add a status state to replace all error/loading states
  const [status, setStatus] = useState<{
    message: string;
    type: 'info' | 'warning' | 'success' | 'error' | undefined;
  }>({
    message: '',
    type: undefined,
  });

  // Initialize WalletConnect
  useEffect(() => {
    const initWalletConnect = async () => {
      if (!walletkit && !isInitializing) {
        try {
          setIsInitializing(true);
          setStatus({ message: 'Initializing WalletConnect...', type: 'info' });

          // Default to global region if none provided
          const initialized = await createWalletKit();
          if (initialized) {
            setStatus({ message: 'WalletConnect initialized successfully', type: 'success' });
            console.log('WalletConnect initialized successfully');
          }
        } catch (initError) {
          console.error('Failed to initialize WalletConnect:', initError);
          setStatus({
            message: 'Failed to initialize WalletConnect. Please try refreshing the page.',
            type: 'error',
          });
        } finally {
          setIsInitializing(false);
        }
      }
    };

    initWalletConnect();
  }, [isInitializing]);

  // Register PKP wallet with WalletConnect
  useEffect(() => {
    // Only attempt to register if we have the required dependencies and haven't registered yet
    const shouldRegister = walletkit && agentPKP && !walletRegistered;

    // Use the ref defined at the top level
    const setupPKPWallet = async () => {
      // Skip if already registered or in the process of registering
      if (!shouldRegister || isRegistering.current) return;

      try {
        // Mark that we're starting registration
        isRegistering.current = true;
        setStatus({ message: 'Registering PKP wallet...', type: 'info' });

        // Register the PKP wallet with session signatures if available
        const accountInfo = await registerPKPWallet(agentPKP, sessionSigs);

        console.log('PKP wallet registered successfully', accountInfo);
        setWalletRegistered(true);
        setStatus({ message: 'PKP wallet registered successfully', type: 'success' });
      } catch (err) {
        console.error('Failed to register PKP wallet:', err);
        setStatus({
          message: `Failed to register PKP wallet: ${err instanceof Error ? err.message : 'Unknown error'}`,
          type: 'error',
        });
      } finally {
        // Reset the registering flag regardless of success/failure
        isRegistering.current = false;
      }
    };

    setupPKPWallet();
  }, [walletkit, agentPKP, sessionSigs, walletRegistered]);

  // Setup session proposal listener
  useEffect(() => {
    if (walletkit) {
      // Listen for session proposals
      const onSessionProposal = (proposal: any) => {
        console.log('Received session proposal:', proposal);
        setPendingProposal(proposal as unknown as Proposal);
      };

      walletkit.on('session_proposal', onSessionProposal);

      return () => {
        // Clean up listener when component unmounts
        walletkit.off('session_proposal', onSessionProposal);
      };
    }
  }, [walletkit]);

  // Setup additional session event handlers (safely)
  useEffect(() => {
    if (!walletkit) return;

    const handleSessionDelete = (event: { topic: string }) => {
      try {
        console.log('Session deleted:', event);
        const sessions = Object.values(walletkit.getActiveSessions() || {}) as Session[];
        setActiveSessions(sessions);
        if (event.topic) {
          setStatus({
            message: `Session disconnected: ${event.topic.slice(0, 8)}...`,
            type: 'info',
          });
        }
      } catch (error) {
        console.error('Error handling session delete event:', error);
      }
    };

    // Try to setup event handlers, but don't fail the whole component if it errors
    try {
      walletkit.on('session_delete', handleSessionDelete);

      return () => {
        try {
          walletkit.off('session_delete', handleSessionDelete);
        } catch (e) {
          console.error('Error cleaning up session_delete handler:', e);
        }
      };
    } catch (error) {
      console.error('Error setting up session event handlers:', error);
      // Return a non-empty function that logs the fact that no cleanup was needed
      return () => console.log('No session event handlers needed cleanup');
    }
  }, [walletkit]);

  // Handle session approval
  async function handleApproveSession() {
    if (!walletkit || !pendingProposal) {
      setStatus({
        message: 'No pending proposal to approve',
        type: 'error',
      });
      return;
    }

    if (!agentPKP?.ethAddress) {
      setStatus({
        message: 'PKP wallet is not available to approve session',
        type: 'error',
      });
      return;
    }

    try {
      setProcessingProposal(true);
      setStatus({ message: 'Approving session proposal...', type: 'info' });

      // Extract required namespaces from the proposal
      const { id, params } = pendingProposal;
      const { requiredNamespaces, optionalNamespaces } = params;
      console.log('requiredNamespaces', requiredNamespaces);
      console.log('optionalNamespaces', optionalNamespaces);

      // Create approved namespaces with proper account format
      const formattedAddress = agentPKP.ethAddress.toLowerCase();
      const approvedNamespaces: Record<string, any> = {};

      // Handle required namespaces
      for (const [chain, requirements] of Object.entries({
        ...requiredNamespaces,
        ...optionalNamespaces,
      })) {
        if (chain === 'eip155') {
          const chains = (requirements as any).chains || [];
          const methods = (requirements as any).methods || [];
          const events = (requirements as any).events || [];

          // Format accounts as "eip155:chainId:address"
          const accounts = chains.map((chainId: string) => {
            // Make sure chainId is in the format "eip155:1" (not just "1")
            const formattedChainId = chainId.includes(':')
              ? chainId
              : `eip155:${chainId.replace('eip155:', '')}`;
            return `${formattedChainId}:${formattedAddress}`;
          });

          approvedNamespaces[chain] = {
            accounts,
            methods,
            events,
          };
        } else {
          // Handle other chain types if needed
          approvedNamespaces[chain] = requirements;
        }
      }

      console.log('Approving session with namespaces:', approvedNamespaces);

      // Add wallet capabilities as session properties
      const capabilities = {
        // Define what our PKP wallet can do
        signTransaction: true,
        signMessage: true,
        signTypedData: true,
        sendTransaction: true,
      };

      const sessionProperties = {
        capabilities: JSON.stringify(capabilities),
        // Add PKP wallet implementation details
        pkpWalletInfo: JSON.stringify({
          implementation: 'PKP',
          version: '1.0.0',
          provider: 'Lit Protocol',
        }),
      };

      // Approve the session proposal with properly formatted namespaces and properties
      await walletkit.approveSession({
        id,
        namespaces: approvedNamespaces,
        sessionProperties,
      });

      console.log('Session proposal approved successfully');
      setStatus({ message: 'Session approved successfully', type: 'success' });
      setPendingProposal(null);

      // Update active sessions
      const sessions = Object.values(walletkit.getActiveSessions() || {}) as Session[];
      setActiveSessions(sessions);
    } catch (error) {
      console.error('Failed to approve session:', error);
      setStatus({
        message: error instanceof Error ? error.message : 'Failed to approve session',
        type: 'error',
      });
    } finally {
      setProcessingProposal(false);
    }
  }

  // Handle session rejection
  async function handleRejectSession() {
    if (!walletkit || !pendingProposal) {
      setStatus({
        message: 'No pending proposal to reject',
        type: 'error',
      });
      return;
    }

    try {
      setProcessingProposal(true);
      setStatus({ message: 'Rejecting session proposal...', type: 'info' });

      // Extract proposal ID
      const { id } = pendingProposal;

      // Reject the session proposal with explicitly typed parameters
      const rejectParams: RejectSessionParams = {
        id,
        reason: {
          code: 4001,
          message: 'User rejected the session',
        },
      };

      await walletkit.rejectSession(rejectParams);

      console.log('Session proposal rejected successfully');
      setStatus({ message: 'Session rejected successfully', type: 'success' });
      setPendingProposal(null);
    } catch (error) {
      console.error('Failed to reject session:', error);
      setStatus({
        message: error instanceof Error ? error.message : 'Failed to reject session',
        type: 'error',
      });
    } finally {
      setProcessingProposal(false);
    }
  }

  async function onConnect(uri: string) {
    if (!walletkit) {
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

      // Attempt to pair with the URI
      console.log('Attempting to pair with URI:', uri);

      await walletkit.pair({ uri });
      console.log('Pairing successful');
      setStatus({ message: 'Successfully paired with dapp', type: 'success' });
    } catch (error) {
      console.error('WalletConnect error:', error);
      setStatus({
        message: error instanceof Error ? error.message : 'Failed to connect. Invalid URI format.',
        type: 'error',
      });
      ModalStore.close();
    } finally {
      setLoading(false);
      setUri('');
    }
  }

  // Handle session disconnect
  async function handleDisconnect(topic: string) {
    if (!walletkit) {
      setStatus({
        message: 'WalletConnect is not initialized yet.',
        type: 'error',
      });
      return;
    }

    try {
      setDisconnecting(topic);
      setStatus({ message: 'Disconnecting session...', type: 'info' });

      // Disconnect with explicitly typed parameters
      const disconnectParams: DisconnectSessionParams = {
        topic,
        reason: {
          code: 6000,
          message: 'User disconnected session',
        },
      };

      await walletkit.disconnectSession(disconnectParams);

      // Update active sessions after disconnect
      const sessions = Object.values(walletkit.getActiveSessions() || {}) as Session[];
      setActiveSessions(sessions);

      setStatus({ message: 'Session disconnected successfully', type: 'success' });
    } catch (error) {
      console.error('Failed to disconnect session:', error);
      setStatus({
        message: error instanceof Error ? error.message : 'Failed to disconnect session.',
        type: 'error',
      });
    } finally {
      setDisconnecting(null);
    }
  }

  useEffect(() => {
    if (deepLink && walletkit) {
      onConnect(deepLink);
    }
  }, [deepLink, walletkit]);

  // Add a status for the PKP wallet
  const pkpStatus = agentPKP
    ? walletRegistered
      ? `Ready with PKP address: ${agentPKP.ethAddress.slice(0, 6)}...${agentPKP.ethAddress.slice(-4)}`
      : 'PKP wallet setup in progress...'
    : 'No PKP wallet provided';

  // Monitor active sessions periodically
  useEffect(() => {
    if (!walletkit) return;

    // Function to refresh sessions
    const refreshSessions = () => {
      try {
        const sessions = Object.values(walletkit.getActiveSessions() || {}) as Session[];
        setActiveSessions(sessions);
      } catch (error) {
        console.error('Error refreshing sessions:', error);
      }
    };

    // Initially refresh
    refreshSessions();

    // Set interval to refresh every 30 seconds
    const interval = setInterval(refreshSessions, 30000);

    return () => clearInterval(interval);
  }, [walletkit]);

  // Determine if we need to wait for wallet initialization
  const shouldWaitForWallet = !!agentPKP; // Only wait for wallet if there's a PKP

  return (
    <Fragment>
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
          {!isInitializing && <QrReader onConnect={onConnect} />}

          {/* Unified status message */}
          {status.message && <StatusMessage message={status.message} type={status.type} />}

          {/* Show PKP status */}
          <div className="w-full mt-2 p-2 bg-blue-50 border border-blue-100 text-blue-600 text-sm rounded mb-2">
            <p>PKP Status: {pkpStatus}</p>
          </div>

          {/* Show pending proposal and approval/rejection buttons */}
          {pendingProposal && !loading && (
            <div className="w-full mt-2 p-3 bg-yellow-50 border border-yellow-100 text-yellow-700 text-sm rounded mb-2">
              <p className="font-medium mb-2">Pending Connection Request:</p>

              {/* Extract and show dapp info */}
              {(() => {
                let dappName = 'Unknown';
                let dappUrl = '';
                let dappDescription = '';
                let dappIcon = '';

                try {
                  const metadata =
                    pendingProposal?.params?.proposer?.metadata ||
                    pendingProposal?.proposer?.metadata ||
                    {};

                  dappName = metadata.name || 'Unknown';
                  dappUrl = metadata.url || '';
                  dappDescription = metadata.description || '';
                  dappIcon = metadata.icons?.[0] || '';
                } catch (e) {
                  console.error('Error extracting dapp metadata:', e);
                }

                return (
                  <div className="flex items-start mb-2">
                    {dappIcon && (
                      <div className="mr-2 flex-shrink-0">
                        <img
                          src={dappIcon}
                          alt={`${dappName} icon`}
                          className="w-8 h-8 rounded-full border border-gray-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{dappName}</p>
                      {dappUrl && <p className="text-xs text-gray-500">{dappUrl}</p>}
                      {dappDescription && <p className="text-xs mt-1">{dappDescription}</p>}
                    </div>
                  </div>
                );
              })()}

              {/* Extract and show requested permissions */}
              {(() => {
                const permissions: string[] = [];
                try {
                  // Try to extract chains and methods from various possible locations
                  const requiredNamespaces = pendingProposal?.params?.requiredNamespaces || {};
                  const optionalNamespaces = pendingProposal?.params?.optionalNamespaces || {};
                  const proposerNamespaces = pendingProposal?.proposer?.requiredNamespaces || {};

                  // Function to extract permissions from namespaces
                  const extractPermissions = (
                    namespaces: Record<string, { chains?: string[]; methods?: string[] }>,
                    isOptional = false,
                  ) => {
                    Object.entries(namespaces).forEach(([key, value]) => {
                      const namespace = key;
                      const chains = value.chains || [];
                      const methods = value.methods || [];

                      if (chains.length > 0) {
                        permissions.push(
                          `${isOptional ? '(Optional) ' : ''}Access to ${namespace} chains: ${chains.join(', ')}`,
                        );
                      }

                      if (methods.length > 0) {
                        // Group methods by type for better readability
                        const readMethods = methods.filter(
                          (m) =>
                            m.startsWith('eth_') && (m.includes('get') || m.includes('accounts')),
                        );
                        const signMethods = methods.filter((m) => m.includes('sign'));
                        const walletMethods = methods.filter((m) => m.startsWith('wallet_'));
                        const otherMethods = methods.filter(
                          (m) =>
                            !readMethods.includes(m) &&
                            !signMethods.includes(m) &&
                            !walletMethods.includes(m),
                        );

                        if (readMethods.length) {
                          permissions.push(
                            `${isOptional ? '(Optional) ' : ''}Read access: ${readMethods.map((m) => m.replace('eth_', '')).join(', ')}`,
                          );
                        }

                        if (signMethods.length) {
                          permissions.push(
                            `${isOptional ? '(Optional) ' : ''}Sign transactions/messages`,
                          );
                        }

                        if (walletMethods.length) {
                          permissions.push(
                            `${isOptional ? '(Optional) ' : ''}Wallet operations: ${walletMethods.map((m) => m.replace('wallet_', '')).join(', ')}`,
                          );
                        }

                        if (otherMethods.length) {
                          permissions.push(
                            `${isOptional ? '(Optional) ' : ''}Other methods: ${otherMethods.join(', ')}`,
                          );
                        }
                      }
                    });
                  };

                  // Extract permissions from all namespace types
                  if (Object.keys(requiredNamespaces).length > 0) {
                    extractPermissions(requiredNamespaces);
                  }

                  if (Object.keys(optionalNamespaces).length > 0) {
                    extractPermissions(optionalNamespaces, true);
                  }

                  if (
                    Object.keys(requiredNamespaces).length === 0 &&
                    Object.keys(optionalNamespaces).length === 0 &&
                    Object.keys(proposerNamespaces).length > 0
                  ) {
                    extractPermissions(proposerNamespaces);
                  }
                } catch (e) {
                  console.error('Error extracting permissions:', e);
                }

                return permissions.length > 0 ? (
                  <div className="mb-3">
                    <p className="font-medium mb-1">Requesting permission to:</p>
                    <ul className="list-disc ml-5 text-xs space-y-1">
                      {permissions.map((permission, i) => (
                        <li key={i}>{permission}</li>
                      ))}
                    </ul>
                  </div>
                ) : null;
              })()}

              {/* Approval and Rejection buttons */}
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleApproveSession}
                  disabled={processingProposal || !walletRegistered}
                  data-testid="approve-session-button"
                >
                  {processingProposal ? 'Processing...' : 'Approve Connection'}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleRejectSession}
                  disabled={processingProposal}
                  data-testid="reject-session-button"
                >
                  Reject
                </Button>
              </div>
            </div>
          )}

          {/* Show active sessions */}
          {activeSessions.length > 0 && (
            <div className="w-full mt-2 p-2 bg-gray-50 border border-gray-100 text-gray-600 text-sm rounded mb-2">
              <p className="font-medium">Active Sessions:</p>
              <ul className="mt-1">
                {activeSessions.map((session, index) => {
                  const dappName = session.peer?.metadata?.name || 'Unknown';
                  const dappUrl = session.peer?.metadata?.url || null;
                  const dappIcon = session.peer?.metadata?.icons?.[0] || null;
                  const sessionTopic = session.topic || '';

                  return (
                    <li
                      key={index}
                      className="flex items-center justify-between gap-2 py-2 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        {dappIcon && (
                          <img
                            src={dappIcon}
                            alt={`${dappName} logo`}
                            className="w-6 h-6 rounded-full"
                            onError={(e) => {
                              // Hide broken images
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <div>
                          {dappUrl ? (
                            <a
                              href={dappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {dappName}
                            </a>
                          ) : (
                            <span className="font-medium">{dappName}</span>
                          )}
                          <span className="text-xs text-gray-400 ml-1">
                            ({sessionTopic.slice(0, 8)}...)
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDisconnect(sessionTopic)}
                        disabled={disconnecting === sessionTopic}
                        className="h-7 px-2 text-xs"
                      >
                        {disconnecting === sessionTopic ? 'Disconnecting...' : 'Disconnect'}
                      </Button>
                    </li>
                  );
                })}
              </ul>
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
              disabled={
                !uri || loading || isInitializing || !walletkit || (agentPKP && !walletRegistered)
              }
              onClick={() => onConnect(uri)}
              data-testid="uri-connect-button"
            >
              {loading ? 'Connecting...' : 'Connect'}
            </Button>
          </div>
        </>
      )}
    </Fragment>
  );
}
