import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import StatusMessage from '../../consent/components/authForm/StatusMessage';
import QrReader from '@/components/withdraw/WalletConnect/QrReader';
import {
  createWalletConnectClient,
  disconnectSession,
} from '@/components/withdraw/WalletConnect/WalletConnectUtil';
import {
  setupRequestHandlers,
  getPendingSessionRequests,
  clearSessionRequest,
} from '@/components/withdraw/WalletConnect/RequestHandler';
import {
  useWalletConnectClient,
  useWalletConnectSessions,
  useWalletConnectStoreActions,
} from './WalletConnectStore';
import useWalletConnectStore from './WalletConnectStore';
import { Fragment, useEffect, useState, useCallback } from 'react';
import React from 'react';
import { ethers } from 'ethers';
import { LIT_CHAINS } from '@lit-protocol/constants';

// Define proper types to replace any
type SessionMetadata = {
  name: string;
  description: string;
  url: string;
  icons: string[];
};

// Simplified Session type (we'll get these from the store)
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

// Update the Proposal type to match both formats that appear in the code
type Proposal = {
  id: number;
  params: {
    requiredNamespaces: Record<string, any>;
    optionalNamespaces: Record<string, any>;
    proposer: {
      metadata: SessionMetadata;
    };
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

  // Access store state and actions
  const client = useWalletConnectClient();
  const sessions = useWalletConnectSessions();
  const { refreshSessions } = useWalletConnectStoreActions();

  // Create isRegistering ref at the top level of the component
  const isRegistering = React.useRef(false);
  // Track if request handlers have been set up
  const requestHandlersSetup = React.useRef(false);

  // Add a status state to replace all error/loading states
  const [status, setStatus] = useState<{
    message: string;
    type: 'info' | 'warning' | 'success' | 'error' | undefined;
  }>({
    message: '',
    type: undefined,
  });

  // Add state and handlers for session requests
  const [pendingSessionRequests, setPendingSessionRequests] = useState<any[]>([]);
  const [processingRequest, setProcessingRequest] = useState(false);

  // Listen for session requests
  useEffect(() => {
    const updatePendingRequests = () => {
      const requests = getPendingSessionRequests();
      setPendingSessionRequests(requests);
    };

    // Add event listener for custom session request events
    const handleSessionRequest = (event: CustomEvent) => {
      console.log('Captured session request event:', event.detail);
      updatePendingRequests();
    };

    // Use type assertion for the event listener to accept CustomEvent
    window.addEventListener('walletconnect:session_request', handleSessionRequest as EventListener);

    // Initial load of pending requests
    updatePendingRequests();

    return () => {
      window.removeEventListener(
        'walletconnect:session_request',
        handleSessionRequest as EventListener,
      );
    };
  }, []);

  // Handle session request approval
  const handleApproveRequest = useCallback(
    async (request: any) => {
      if (!client) {
        setStatus({
          message: 'WalletConnect is not initialized',
          type: 'error',
        });
        return;
      }

      try {
        setProcessingRequest(true);
        setStatus({ message: 'Processing request...', type: 'info' });

        // Log the full request object for debugging
        console.log('Full request object:', JSON.stringify(request, null, 2));

        // Get the PKP wallet
        const { getPKPWallet } = await import('./PKPWalletUtil');
        const pkpWallet = getPKPWallet();

        if (!pkpWallet) {
          throw new Error('PKP wallet not available');
        }

        // Handle the request based on method
        const { topic, id, params } = request;
        const { request: reqParams } = params;
        const { method, params: methodParams } = reqParams;

        console.log(`Handling ${method} request with params:`, methodParams);
        console.log('Request context:', {
          topic,
          id,
          chainId: params.chainId,
          requestOrigin: params.request?.origin || 'unknown',
        });

        let result;
        // Handle different method types
        if (method === 'personal_sign' || method === 'eth_sign') {
          // For signing messages
          const message = methodParams[0];
          result = await pkpWallet.signMessage(
            typeof message === 'string' && message.startsWith('0x')
              ? Buffer.from(message.slice(2), 'hex').toString('utf8')
              : message,
          );

          console.log('Message signing result:', result);

          // Directly respond to the client with the message signing result
          const response = {
            id,
            jsonrpc: '2.0',
            result,
          };

          console.log('Sending message signing response:', response);

          await client.respondSessionRequest({
            topic,
            response,
          });

          // Log after successful response
          console.log('Successfully sent message signing response');

          // Remove the request from pending requests and update UI
          clearSessionRequest(id);
          setPendingSessionRequests(getPendingSessionRequests());
          setStatus({ message: 'Message signed successfully', type: 'success' });

          // Skip the standard flow
          return;
        } else if (method === 'eth_sendTransaction') {
          // For sending transactions
          const tx = methodParams[0];

          // Make a copy of the transaction to modify
          const txToSend = { ...tx };

          // Convert chainId from hex to number if needed
          if (
            txToSend.chainId &&
            typeof txToSend.chainId === 'string' &&
            txToSend.chainId.startsWith('0x')
          ) {
            console.log(`Converting chainId from hex ${txToSend.chainId} to number`);
            txToSend.chainId = parseInt(txToSend.chainId, 16);
            console.log(`Converted chainId: ${txToSend.chainId}`);
          }

          // Get chainId from params if not in transaction
          const chainId = txToSend.chainId || parseInt(params.chainId.split(':')[1], 10);
          console.log(`Using chainId: ${chainId}`);

          // Choose the right RPC based on chainId from LIT_CHAINS
          // First check if the chainId is in LIT_CHAINS
          let rpcUrl = '';
          let litChainFound = false;

          // Find the chain in LIT_CHAINS
          for (const [chainKey, chainInfo] of Object.entries(LIT_CHAINS)) {
            if (chainInfo.chainId === chainId) {
              rpcUrl = chainInfo.rpcUrls[0];
              litChainFound = true;
              console.log(`Found chainId ${chainId} in LIT_CHAINS: ${chainKey} with RPC ${rpcUrl}`);
              break;
            }
          }

          // If the chain is not supported by LIT_CHAINS, we can't proceed
          if (!litChainFound) {
            throw new Error(
              `Chain with ID ${chainId} is not supported in LIT_CHAINS. Cannot proceed with transaction.`,
            );
          }

          // Connect to the appropriate provider
          if (rpcUrl) {
            console.log(`Setting up provider for chain ${chainId} with RPC URL: ${rpcUrl}`);

            // First try using setRpc if available (preferred way)
            if (typeof pkpWallet.setRpc === 'function') {
              console.log(`Calling pkpWallet.setRpc with: ${rpcUrl}`);
              await pkpWallet.setRpc(rpcUrl);
              console.log(`Successfully set RPC URL using setRpc`);
            } else {
              // Fall back to directly setting provider
              console.log(`setRpc not available, setting provider directly`);
              const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
              pkpWallet.provider = provider;
            }

            // Make sure the transaction chainId matches the network we're connecting to
            txToSend.chainId = chainId;
            console.log(`Set transaction chainId to: ${chainId}`);
          } else {
            throw new Error(`No RPC URL found for chain ID ${chainId} in LIT_CHAINS.`);
          }

          // Check if this is an ERC20 approval (0x095ea7b3 is the function signature for ERC20 approve)
          if (txToSend.data && txToSend.data.startsWith('0x095ea7b3')) {
            console.log('Detected ERC20 approval transaction');

            // ERC20 approvals need higher gas
            const approvalGas = 150000; // Higher default for approvals

            // Override any estimated gas
            txToSend.gas = approvalGas;
            txToSend.gasLimit = approvalGas;
            console.log(`Using high gas limit of ${approvalGas} for ERC20 approval`);
          }

          // Ensure there's gas set
          if (!txToSend.gas && !txToSend.gasLimit) {
            console.log('No gas limit specified, estimating gas...');
            try {
              // Create a copy without the chainId for estimation
              const estimateGasTx = { ...txToSend };
              delete estimateGasTx.chainId; // Remove chainId for estimation

              // Estimate gas using the wallet
              const gasEstimate = await pkpWallet.estimateGas(estimateGasTx);

              // Add 20% buffer for safety
              const gasWithBuffer = gasEstimate.mul(120).div(100);
              console.log(
                `Estimated gas: ${gasEstimate.toString()}, with buffer: ${gasWithBuffer.toString()}`,
              );

              // Set both gas and gasLimit properties to ensure compatibility
              txToSend.gas = gasWithBuffer;
              txToSend.gasLimit = gasWithBuffer;
            } catch (gasError) {
              console.error('Error estimating gas:', gasError);

              // Use a reasonable default gas limit for token approvals (Base chain ERC20 approve typically needs ~65000)
              const defaultGas = 100000;
              console.log(`Using default gas limit of ${defaultGas}`);
              txToSend.gas = defaultGas;
              txToSend.gasLimit = defaultGas;
            }
          } else if (txToSend.gasLimit && !txToSend.gas) {
            // If only gasLimit is set, copy to gas property
            txToSend.gas = txToSend.gasLimit;
          } else if (txToSend.gas && !txToSend.gasLimit) {
            // If only gas is set, copy to gasLimit property
            txToSend.gasLimit = txToSend.gas;
          }

          // Log the transaction we're about to send
          console.log('Transaction request details:');
          console.log('Gas:', txToSend.gas?.toString());
          console.log('Gas price:', txToSend.gasPrice?.toString());
          console.log('ChainId:', txToSend.chainId);
          console.log('To address:', txToSend.to);
          console.log('Value:', txToSend.value?.toString());
          console.log(
            'Data:',
            txToSend.data?.length > 100 ? `${txToSend.data.substring(0, 100)}...` : txToSend.data,
          );
          console.log('Full transaction:', txToSend);
          console.log('Transaction JSON:', JSON.stringify(txToSend, null, 2));

          // Clear any custom serialization that might be causing issues
          if (txToSend._legacySigned) {
            delete txToSend._legacySigned;
          }

          // Log the provider URL if we can access it
          try {
            // Cast to JsonRpcProvider to access the connection property safely
            const jsonRpcProvider = pkpWallet.provider as ethers.providers.JsonRpcProvider;
            if (jsonRpcProvider && jsonRpcProvider.connection && jsonRpcProvider.connection.url) {
              console.log('Provider URL before sending:', jsonRpcProvider.connection.url);

              // If the provider is still using Yellowstone despite our settings, create a new provider
              if (jsonRpcProvider.connection.url.includes('yellowstone-rpc.litprotocol.com')) {
                console.log(
                  'WARNING: Provider still using Yellowstone RPC! Creating a direct Base provider...',
                );

                // Create a new provider for Base
                const baseProvider = new ethers.providers.JsonRpcProvider(rpcUrl);

                // Create a transaction to sign
                console.log('Creating transaction with explicit provider');

                // Check if wallet has a private key property
                if (pkpWallet.privateKey) {
                  try {
                    // Get private key from the wallet
                    const privateKey = pkpWallet.privateKey;

                    // Create a wallet with the private key that uses our correct provider
                    const directWallet = new ethers.Wallet(privateKey, baseProvider);

                    console.log('Created direct wallet with Base provider');

                    // Sign and send transaction directly
                    console.log('Sending transaction directly through correct provider');
                    result = await directWallet.sendTransaction(txToSend);
                  } catch (pkError) {
                    console.error('Unable to use private key for direct transaction:', pkError);

                    // Fall back to PKPWallet with forced provider
                    console.log('Falling back to PKPWallet with forced provider');
                    pkpWallet.provider = baseProvider;
                    result = await pkpWallet.sendTransaction(txToSend);
                  }
                } else {
                  // No getPrivateKey method, have to use the PKPWallet
                  console.log(
                    'No getPrivateKey method available, using PKPWallet with forced provider',
                  );
                  pkpWallet.provider = baseProvider;
                  result = await pkpWallet.sendTransaction(txToSend);
                }
              } else {
                // Provider URL looks good, proceed with normal transaction
                console.log('Provider URL looks correct, proceeding with normal transaction');
                result = await pkpWallet.sendTransaction(txToSend);
              }
            } else {
              console.log('Provider URL not accessible, using standard sendTransaction');
              result = await pkpWallet.sendTransaction(txToSend);
            }
          } catch (e) {
            console.log('Could not access provider URL, using standard sendTransaction:', e);
            result = await pkpWallet.sendTransaction(txToSend);
          }

          console.log('Transaction result:', result);
          console.log('Transaction hash:', result.hash);
          console.log('Transaction result JSON:', JSON.stringify(result, null, 2));

          // Directly respond to the client with the transaction result
          const response = {
            id,
            jsonrpc: '2.0',
            result: result.hash, // Always use just the hash - dApps expect this
          };

          console.log('Sending transaction response:', response);

          await client.respondSessionRequest({
            topic,
            response,
          });

          // Log after successful response
          console.log('Successfully sent transaction response');

          // Remove the request from pending requests and update UI
          clearSessionRequest(id);
          setPendingSessionRequests(getPendingSessionRequests());
          setStatus({ message: 'Transaction sent successfully', type: 'success' });

          // Emit a custom event that we can listen for
          const txEvent = new CustomEvent('transaction:completed', {
            detail: {
              txHash: result.hash,
              method,
              topic,
              id,
            },
          });
          window.dispatchEvent(txEvent);
          console.log('Emitted transaction:completed event');

          // Skip the standard flow
          return;
        } else if (method === 'eth_signTypedData' || method === 'eth_signTypedData_v4') {
          // For signing typed data
          const [_, data] = methodParams;
          let parsedData: any;

          try {
            // Ensure the data is properly parsed
            parsedData = typeof data === 'string' ? JSON.parse(data) : data;
            console.log('Parsed typed data:', parsedData);

            // Extract the primary type safely
            const primaryType = parsedData.primaryType;

            // Check if domain is properly formatted
            if (!parsedData.domain || !parsedData.types || !parsedData.message) {
              throw new Error('Invalid typed data format: missing domain, types, or message');
            }

            // Make a copy of types that we can modify
            const types = { ...parsedData.types };

            // Remove EIP712Domain from types as it's handled internally by ethers
            delete types.EIP712Domain;

            console.log('Signing typed data with:', {
              domain: parsedData.domain,
              primaryType,
              types,
              message: parsedData.message,
            });

            // Use _signTypedData instead of signTypedData as PKPEthersWallet uses ethers.js v5 naming
            result = await pkpWallet._signTypedData(parsedData.domain, types, parsedData.message);

            console.log('Typed data signing result:', result);

            // Directly respond to the client with the typed data signing result
            const response = {
              id,
              jsonrpc: '2.0',
              result,
            };

            console.log('Sending typed data signing response:', response);

            await client.respondSessionRequest({
              topic,
              response,
            });

            // Log after successful response
            console.log('Successfully sent typed data signing response');

            // Remove the request from pending requests and update UI
            clearSessionRequest(id);
            setPendingSessionRequests(getPendingSessionRequests());
            setStatus({ message: 'Data signed successfully', type: 'success' });

            // Skip the standard flow
            return;
          } catch (error) {
            console.error('Error parsing or signing typed data:', error);
            throw new Error(
              `Failed to sign typed data: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
          }
        } else if (method === 'wallet_getCapabilities') {
          // Special method that Uniswap calls to check wallet capabilities
          console.log('Handling wallet_getCapabilities request');

          // Return wallet capabilities
          result = {
            accountProperties: [
              'signTransaction',
              'signMessage',
              'signTypedData',
              'signTypedDataLegacy',
              'signTypedDataV3',
              'signTypedDataV4',
            ],
            chainProperties: ['transactionHistory'],
            walletProperties: ['supportsAddingNetwork', 'supportsSwitchingNetwork'],
          };

          console.log('Wallet capabilities response:', result);

          // Respond to the request immediately and directly
          const response = {
            id,
            jsonrpc: '2.0',
            result,
          };

          console.log('Sending wallet capabilities response:', response);

          await client.respondSessionRequest({
            topic,
            response,
          });

          // Log after successful response
          console.log('Successfully sent wallet capabilities response');

          // Don't emit events or use the standard response flow for this special method
          clearSessionRequest(id);
          setPendingSessionRequests(getPendingSessionRequests());
          setStatus({ message: 'Capabilities request approved', type: 'success' });

          // Skip the standard flow
          return;
        } else {
          throw new Error(`Unsupported method: ${method}`);
        }

        // The following code will only run for methods not handled above
        // We keep it for backward compatibility but most methods should be
        // handled directly with early returns
      } catch (error) {
        console.error('Failed to approve request:', error);

        // Log the detailed error
        if (error instanceof Error) {
          console.error('Error name:', error.name);
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }

        // Directly respond with error
        if (request && request.id && request.topic) {
          try {
            if (client) {
              const errorResponse = {
                id: request.id,
                jsonrpc: '2.0',
                error: {
                  code: 4001,
                  message: error instanceof Error ? error.message : 'Request failed',
                },
              };

              console.log('Sending error response:', errorResponse);

              await client.respondSessionRequest({
                topic: request.topic,
                response: errorResponse,
              });

              console.log('Successfully sent error response');
            } else {
              console.error('Cannot send error response: client is undefined');
            }
          } catch (responseError) {
            console.error('Failed to send error response:', responseError);
            if (responseError instanceof Error) {
              console.error('Response error details:', responseError.message, responseError.stack);
            }
          }
        }

        setStatus({
          message: error instanceof Error ? error.message : 'Failed to approve request',
          type: 'error',
        });
      } finally {
        setProcessingRequest(false);
      }
    },
    [client],
  );

  // Handle session request rejection
  const handleRejectRequest = useCallback(
    async (request: any) => {
      if (!client) {
        setStatus({
          message: 'WalletConnect is not initialized',
          type: 'error',
        });
        return;
      }

      try {
        setProcessingRequest(true);
        setStatus({ message: 'Rejecting request...', type: 'info' });

        const { topic, id } = request;

        // Respond with an error
        await client.respondSessionRequest({
          topic,
          response: {
            id,
            jsonrpc: '2.0',
            error: {
              code: 4001,
              message: 'User rejected request',
            },
          },
        });

        // Remove the request from pending requests
        clearSessionRequest(id);
        setPendingSessionRequests(getPendingSessionRequests());

        setStatus({ message: 'Request rejected', type: 'info' });
      } catch (error) {
        console.error('Failed to reject request:', error);
        setStatus({
          message: error instanceof Error ? error.message : 'Failed to reject request',
          type: 'error',
        });
      } finally {
        setProcessingRequest(false);
      }
    },
    [client],
  );

  // Initialize WalletConnect
  useEffect(() => {
    // Don't try to initialize if it's already in progress
    if (isInitializing) return;

    // Don't try to initialize if we already have a client
    if (client) return;

    // Set initializing state
    setIsInitializing(true);
    setStatus({ message: 'Initializing WalletConnect...', type: 'info' });

    // Define async initialization function
    const doInitialize = async () => {
      try {
        // Initialize the client
        await createWalletConnectClient((clientInstance) => {
          // Set the client in the store using the store.getState() approach
          // This avoids using hooks outside of component render
          useWalletConnectStore.getState().actions.setClient(clientInstance);

          // Call refreshSessions from props
          refreshSessions();

          // Update component state
          setStatus({ message: 'WalletConnect initialized successfully', type: 'success' });
          console.log('WalletConnect initialized successfully');
        });
      } catch (initError) {
        console.error('Failed to initialize WalletConnect:', initError);
        setStatus({
          message: 'Failed to initialize WalletConnect. Please try refreshing the page.',
          type: 'error',
        });
      } finally {
        setIsInitializing(false);
      }
    };

    // Call the initialization function
    doInitialize();
  }, [client, isInitializing, refreshSessions]);

  // Set up request handlers once client is initialized
  useEffect(() => {
    if (client && !requestHandlersSetup.current) {
      // Set up request handlers for the client
      setupRequestHandlers(client);
      requestHandlersSetup.current = true;
      console.log('WalletKit request handlers set up');
    }
  }, [client]);

  // Setup PKP wallet when client is available
  useEffect(() => {
    // Attempt to register if we have the required dependencies and haven't registered yet
    const shouldRegister = client && agentPKP && !walletRegistered;

    // Use the ref defined at the top level
    const setupPKPWallet = async () => {
      // Skip if already registered or in the process of registering
      if (!shouldRegister || isRegistering.current) return;

      try {
        // Mark that we're starting registration
        isRegistering.current = true;
        setStatus({ message: 'Registering PKP wallet...', type: 'info' });

        // Import functions to avoid hook usage inside this async function
        const { registerPKPWallet } = await import('./PKPWalletUtil');
        const { getWalletConnectClient } = await import('./WalletConnectStore');

        // Get client directly from store state
        const clientInstance = getWalletConnectClient();

        if (!clientInstance) {
          throw new Error('WalletKit client not initialized');
        }

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

    // Execute the registration function
    setupPKPWallet();
  }, [client, agentPKP, sessionSigs, walletRegistered]);

  // Listen for session proposals
  useEffect(() => {
    if (!client) return;

    const handleSessionProposal = (proposal: Proposal) => {
      console.log('Received session proposal:', proposal);
      setPendingProposal(proposal);
    };

    // Add event listener for session proposals
    client.on('session_proposal', handleSessionProposal);

    return () => {
      // Clean up event listener
      client.off('session_proposal', handleSessionProposal);
    };
  }, [client]);

  // Listen for session deletions and other events
  useEffect(() => {
    if (!client) return;

    const handleSessionDelete = (event: { topic: string }) => {
      try {
        console.log('Session deleted:', event);
        refreshSessions();
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

    // Add event listener for session deletions
    client.on('session_delete', handleSessionDelete);

    return () => {
      // Clean up event listener
      client.off('session_delete', handleSessionDelete);
    };
  }, [client, refreshSessions]);

  // Handle session approval
  const handleApproveSession = useCallback(async () => {
    if (!client || !pendingProposal) {
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
      const sessionProperties = {
        capabilities: JSON.stringify({
          signTransaction: true,
          signMessage: true,
          signTypedData: true,
          sendTransaction: true,
        }),
        pkpWalletInfo: JSON.stringify({
          implementation: 'PKP',
          version: '1.0.0',
          provider: 'Lit Protocol',
        }),
      };

      // Approve the session proposal with properly formatted namespaces and properties
      await client.approveSession({
        id,
        namespaces: approvedNamespaces,
        sessionProperties,
      });

      console.log('Session proposal approved successfully');
      setStatus({ message: 'Session approved successfully', type: 'success' });
      setPendingProposal(null);

      // Update sessions in the store
      refreshSessions();
    } catch (error) {
      console.error('Failed to approve session:', error);
      setStatus({
        message: error instanceof Error ? error.message : 'Failed to approve session',
        type: 'error',
      });
    } finally {
      setProcessingProposal(false);
    }
  }, [client, pendingProposal, agentPKP, refreshSessions]);

  // Handle session rejection
  const handleRejectSession = useCallback(async () => {
    if (!client || !pendingProposal) {
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

      // Reject the session proposal
      await client.rejectSession({
        id,
        reason: {
          code: 4001,
          message: 'User rejected the session',
        },
      });

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
  }, [client, pendingProposal]);

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

        // Attempt to pair with the URI
        console.log('Attempting to pair with URI:', uriToConnect);

        await client.pair({ uri: uriToConnect });
        console.log('Pairing successful');
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
    [client, agentPKP, walletRegistered],
  );

  // Handle session disconnect
  const handleDisconnect = useCallback(
    async (topic: string) => {
      if (!client) {
        setStatus({
          message: 'WalletConnect is not initialized yet.',
          type: 'error',
        });
        return;
      }

      try {
        setDisconnecting(topic);
        setStatus({ message: 'Disconnecting session...', type: 'info' });

        await disconnectSession(topic, refreshSessions);

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
    },
    [client, refreshSessions],
  );

  // Handle deepLink
  useEffect(() => {
    if (deepLink && client) {
      onConnect(deepLink);
    }
  }, [deepLink, client, onConnect]);

  // Add a status for the PKP wallet
  const pkpStatus = agentPKP
    ? walletRegistered
      ? `Ready with PKP address: ${agentPKP.ethAddress.slice(0, 6)}...${agentPKP.ethAddress.slice(-4)}`
      : 'PKP wallet setup in progress...'
    : 'No PKP wallet provided';

  // Determine if we need to wait for wallet initialization
  const shouldWaitForWallet = !!agentPKP; // Only wait for wallet if there's a PKP

  return (
    <Fragment>
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
                onChange={(e) => setUri(e.target.value)}
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
                    const metadata = pendingProposal?.params?.proposer?.metadata || {};

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
            {sessions.length > 0 && (
              <div className="w-full mt-2 p-2 bg-gray-50 border border-gray-100 text-gray-600 text-sm rounded mb-2">
                <p className="font-medium">Active Sessions:</p>
                <ul className="mt-1">
                  {sessions.map((session: Session, index) => {
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

            {/* Show pending requests */}
            {pendingSessionRequests.length > 0 && (
              <div className="w-full mt-2 p-3 bg-orange-50 border border-orange-100 text-orange-700 text-sm rounded mb-2">
                <p className="font-medium mb-2">Pending Session Requests:</p>

                {pendingSessionRequests.map((request, _) => {
                  const { id, params } = request;
                  const { request: req } = params;
                  const { method, params: methodParams } = req;

                  // Determine request type and format display
                  let requestDescription = '';
                  let requestDetails = null;

                  if (method === 'personal_sign' || method === 'eth_sign') {
                    // For message signing
                    const message = methodParams[0];
                    const displayMsg =
                      typeof message === 'string' && message.startsWith('0x')
                        ? Buffer.from(message.slice(2), 'hex').toString('utf8')
                        : message;
                    requestDescription = 'Sign Message';
                    requestDetails = (
                      <div className="mt-1 p-2 bg-gray-50 rounded text-gray-800 text-xs font-mono whitespace-pre-wrap">
                        {displayMsg}
                      </div>
                    );
                  } else if (method === 'eth_sendTransaction') {
                    // For transaction sending
                    const tx = methodParams[0];
                    requestDescription = 'Send Transaction';
                    requestDetails = (
                      <div className="mt-1 p-2 bg-gray-50 rounded text-gray-800 text-xs font-mono overflow-auto">
                        <p>To: {tx.to}</p>
                        {tx.value && <p>Value: {tx.value.toString()} wei</p>}
                        {tx.data && tx.data !== '0x' && <p>Data: {tx.data.slice(0, 20)}...</p>}
                      </div>
                    );
                  } else if (method === 'eth_signTypedData' || method === 'eth_signTypedData_v4') {
                    // For typed data signing
                    requestDescription = 'Sign Typed Data';
                    requestDetails = (
                      <div className="mt-1 p-2 bg-gray-50 rounded text-gray-800 text-xs font-mono overflow-auto">
                        <p>Structured data signature request</p>
                      </div>
                    );
                  } else if (method === 'wallet_getCapabilities') {
                    requestDescription = 'Get Wallet Capabilities';
                    requestDetails = (
                      <div className="mt-1 p-2 bg-gray-50 rounded text-gray-800 text-xs font-mono overflow-auto">
                        <p>Request for wallet capabilities</p>
                      </div>
                    );
                  } else {
                    // For other methods
                    requestDescription = `Request: ${method}`;
                  }

                  return (
                    <div key={id} className="mb-4 p-3 bg-white border border-orange-200 rounded">
                      <p className="font-semibold">{requestDescription}</p>
                      {requestDetails}
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700 text-xs"
                          onClick={() => handleApproveRequest(request)}
                          disabled={processingRequest}
                        >
                          {processingRequest ? 'Processing...' : 'Approve'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="text-xs"
                          onClick={() => handleRejectRequest(request)}
                          disabled={processingRequest}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </Fragment>
  );
}
