import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { SessionSigs, IRelayPKP } from '@lit-protocol/types';
import { SELECTED_LIT_NETWORK } from '@/components/consent/utils/lit';
import { LIT_CHAINS } from '@lit-protocol/constants';

// WalletConnect imports
import SignClient from '@walletconnect/sign-client';
import { formatJsonRpcResult, formatJsonRpcError } from '@walletconnect/jsonrpc-utils';

// QR code scanner
import { QrReader } from 'react-qr-reader';

// WalletConnect project ID - this should be in an environment variable in production
const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '48dbb3e862642b9a8004ab871a2ac82d';

interface WalletConnectProps {
  sessionSigs: SessionSigs;
  agentPKP: IRelayPKP;
  chainId: string;
  onStatusChange?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

// Define a simplified Session type that matches the expected structure
interface Session {
  topic: string;
  peer: {
    metadata: {
      name?: string;
      url?: string;
      description?: string;
      icons?: string[];
    };
  };
  // Other fields as needed
}

const WalletConnect: React.FC<WalletConnectProps> = ({
  sessionSigs,
  agentPKP,
  chainId,
  onStatusChange
}) => {
  const [scanning, setScanning] = useState<boolean>(false);
  const [pkpWallet, setPkpWallet] = useState<PKPEthersWallet | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [signClient, setSignClient] = useState<SignClient | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize WalletConnect SignClient
  const initSignClient = useCallback(async () => {
    try {
      const client = await SignClient.init({
        projectId: PROJECT_ID,
        metadata: {
          name: 'Vincent PKP Wallet',
          description: 'Vincent PKP Wallet powered by Lit Protocol',
          url: window.location.origin,
          icons: [`${window.location.origin}/V.svg`]
        }
      });
      
      setSignClient(client);
      
      // Setup event listeners for session proposals and requests
      client.on('session_proposal', handleSessionProposal);
      client.on('session_request', handleSessionRequest);
      client.on('session_delete', handleSessionDelete);
      
      // Get existing sessions
      const clientSessions = client.session.getAll();
      setSessions(clientSessions as unknown as Session[]);
      
      return client;
    } catch (error) {
      console.error('Failed to initialize WalletConnect client:', error);
      onStatusChange?.(`Error initializing WalletConnect: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      return null;
    }
  }, []);

  // Initialize Lit Node Client and PKP Wallet
  const initPKPWallet = useCallback(async () => {
    try {
      const chain = LIT_CHAINS[chainId];
      const rpcUrl = chain.rpcUrls?.[0];
      
      const litNodeClient = new LitNodeClient({
        litNetwork: SELECTED_LIT_NETWORK
      });
      await litNodeClient.connect();
      
      // Create and initialize PKP wallet
      const wallet = new PKPEthersWallet({
        pkpPubKey: agentPKP.publicKey,
        litNodeClient: litNodeClient,
        controllerSessionSigs: sessionSigs,
        rpc: rpcUrl
      });
      
      await wallet.init();
      setPkpWallet(wallet);
      return wallet;
    } catch (error) {
      console.error('Error initializing PKP wallet:', error);
      onStatusChange?.(`Error initializing PKP wallet: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      return null;
    }
  }, [agentPKP, sessionSigs, chainId]);

  // Define type for session proposal
  type SessionProposal = {
    id: number;
    params: {
      requiredNamespaces: Record<string, {
        chains?: string[];
        methods: string[];
        events: string[];
      }>;
      relays: Array<{ protocol: string }>;
      proposer?: {
        metadata?: {
          name?: string;
          description?: string;
          url?: string;
          icons?: string[];
        }
      };
    };
  };

  // Handle WalletConnect session proposal
  const handleSessionProposal = async (proposal: SessionProposal) => {
    try {
      if (!pkpWallet) {
        await initPKPWallet();
      }
      
      setConnecting(true);
      onStatusChange?.(`Connection request from ${proposal.params.proposer?.metadata?.name || 'dApp'}...`, 'info');
      
      const { id, params } = proposal;
      const { requiredNamespaces, relays } = params;
      
      // Extract chains and methods from the required namespaces
      const chains: string[] = [];
      const methods: string[] = [];
      const events: string[] = [];
      
      Object.values(requiredNamespaces).forEach(namespace => {
        if (namespace.chains) chains.push(...namespace.chains);
        methods.push(...namespace.methods);
        events.push(...namespace.events);
      });
      
      const namespaces: Record<string, { accounts: string[], methods: string[], events: string[] }> = {};
      
      // Create response with supported chains and methods
      Object.keys(requiredNamespaces).forEach(key => {
        const accounts: string[] = [];
        // For each chain, create an account with the PKP wallet address
        const chains = requiredNamespaces[key].chains || [];
        chains.forEach(chainId => {
          accounts.push(`${chainId}:${agentPKP.ethAddress.toLowerCase()}`);
        });
        
        namespaces[key] = {
          accounts,
          methods: requiredNamespaces[key].methods,
          events: requiredNamespaces[key].events,
        };
      });
      
      // Approve the session
      const { acknowledged } = await signClient!.approve({
        id,
        relayProtocol: relays[0].protocol,
        namespaces,
      });
      
      // Wait for session acknowledgement
      await acknowledged();
      
      // Update sessions
      setSessions(signClient!.session.getAll() as unknown as Session[]);
      onStatusChange?.('Connected to dApp successfully!', 'success');
    } catch (error) {
      console.error('Failed to approve session:', error);
      onStatusChange?.(`Failed to connect to dApp: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setConnecting(false);
      setScanning(false);
    }
  };

  // Define type for session request
  type SessionRequest = {
    id: number;
    topic: string;
    params: {
      request: {
        method: string;
        params: any[];
      };
      chainId?: string;
    };
  };

  // Handle WalletConnect session requests (like signing)
  const handleSessionRequest = async (requestEvent: SessionRequest) => {
    try {
      const { id, topic, params } = requestEvent;
      const { request, chainId: requestChainId } = params;
      const session = signClient!.session.get(topic);
      
      // Find the session
      const sessionInfo = sessions.find(s => s.topic === topic);
      const dAppName = sessionInfo?.peer.metadata.name || 'dApp';
      
      // Initialize PKP wallet if needed
      if (!pkpWallet) {
        await initPKPWallet();
      }
      
      // Handle different request methods
      switch (request.method) {
        case 'eth_sendTransaction': {
          onStatusChange?.(`Transaction request from ${dAppName}...`, 'info');
          
          // Extract transaction parameters
          const transaction = request.params[0];
          
          // Confirm with user (in a real app, you'd show a confirmation dialog)
          const confirmTransaction = window.confirm(
            `${dAppName} is requesting to send a transaction:\n\n` +
            `To: ${transaction.to}\n` +
            `Value: ${transaction.value ? parseInt(transaction.value, 16) / 1e18 + ' ETH' : '0 ETH'}\n\n` +
            `Do you want to approve this transaction?`
          );
          
          if (!confirmTransaction) {
            await signClient!.respond({
              topic,
              response: formatJsonRpcError(id, {
                code: 4001,
                message: 'User rejected the request'
              })
            });
            onStatusChange?.('Transaction rejected', 'warning');
            return;
          }
          
          // Sign and send the transaction using PKP wallet
          const txHash = await pkpWallet!.sendTransaction(transaction);
          
          // Return the response
          await signClient!.respond({
            topic,
            response: formatJsonRpcResult(id, txHash.hash)
          });
          onStatusChange?.('Transaction sent successfully!', 'success');
          break;
        }
        
        case 'eth_sign':
        case 'personal_sign': {
          // Extract message to sign
          const messageHex = typeof request.params[0] === 'string' 
            ? request.params[0] 
            : typeof request.params[1] === 'string' 
            ? request.params[1] 
            : '';
            
          // Convert hex to text if possible for display
          let messageText = messageHex;
          try {
            if (messageHex.startsWith('0x')) {
              const bytes = Buffer.from(messageHex.slice(2), 'hex');
              messageText = bytes.toString('utf8');
            }
          } catch (e) {
            // If conversion fails, use the original hex
            messageText = messageHex;
          }
          
          onStatusChange?.(`Signing request from ${dAppName}...`, 'info');
          
          // Confirm with user
          const confirmSign = window.confirm(
            `${dAppName} is requesting to sign this message:\n\n` +
            `${messageText}\n\n` +
            `Do you want to sign this message?`
          );
          
          if (!confirmSign) {
            await signClient!.respond({
              topic,
              response: formatJsonRpcError(id, {
                code: 4001,
                message: 'User rejected the request'
              })
            });
            onStatusChange?.('Signing rejected', 'warning');
            return;
          }
          
          // Sign message with PKP wallet
          const signature = await pkpWallet!.signMessage(messageHex);
          
          // Return the signature
          await signClient!.respond({
            topic,
            response: formatJsonRpcResult(id, signature)
          });
          onStatusChange?.('Message signed successfully!', 'success');
          break;
        }
        
        case 'eth_signTypedData':
        case 'eth_signTypedData_v4': {
          onStatusChange?.(`Typed data signing request from ${dAppName}...`, 'info');
          
          // Extract typed data
          const typedData = typeof request.params[1] === 'string' 
            ? JSON.parse(request.params[1]) 
            : request.params[1];
            
          // Confirm with user
          const confirmSign = window.confirm(
            `${dAppName} is requesting to sign typed data for domain:\n\n` +
            `${typedData.domain.name} (${typedData.domain.verifyingContract || 'No contract'})\n\n` +
            `Do you want to sign this data?`
          );
          
          if (!confirmSign) {
            await signClient!.respond({
              topic,
              response: formatJsonRpcError(id, {
                code: 4001,
                message: 'User rejected the request'
              })
            });
            onStatusChange?.('Signing rejected', 'warning');
            return;
          }
          
          // Sign typed data with PKP wallet (if supported)
          if (typeof (pkpWallet as any)._signTypedData === 'function') {
            const signature = await (pkpWallet as any)._signTypedData(
              typedData.domain,
              typedData.types,
              typedData.message
            );
            
            // Return the signature
            await signClient!.respond({
              topic,
              response: formatJsonRpcResult(id, signature)
            });
            onStatusChange?.('Typed data signed successfully!', 'success');
          } else {
            // Method not supported
            await signClient!.respond({
              topic,
              response: formatJsonRpcError(id, {
                code: 4200,
                message: 'The requested method is not supported by this wallet'
              })
            });
            onStatusChange?.('Signing method not supported', 'error');
          }
          break;
        }
        
        default: {
          // Method not supported
          await signClient!.respond({
            topic,
            response: formatJsonRpcError(id, {
              code: 4200,
              message: 'The requested method is not supported by this wallet'
            })
          });
          onStatusChange?.(`Unsupported method: ${request.method}`, 'warning');
        }
      }
    } catch (error) {
      console.error('Failed to handle session request:', error);
      onStatusChange?.(`Error processing request: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  // Handle session deletion
  const handleSessionDelete = ({ id, topic }: { id: number; topic: string }) => {
    setSessions(prev => prev.filter(session => session.topic !== topic));
    onStatusChange?.('Disconnected from dApp', 'info');
  };

  // Parse WalletConnect URI from QR code
  const handleScan = async (data: string | null) => {
    if (data && data.startsWith('wc:')) {
      try {
        setScanning(false);
        onStatusChange?.('QR code detected, connecting...', 'info');
        
        // Initialize if needed
        if (!signClient) {
          await initSignClient();
        }
        
        if (!pkpWallet) {
          await initPKPWallet();
        }
        
        // Parse URI and connect
        await signClient!.pair({ uri: data });
        
      } catch (error) {
        console.error('Error connecting with WalletConnect URI:', error);
        onStatusChange?.(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        setError(`Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  // Handle scan error
  const handleScanError = (err: Error) => {
    console.error('QR scan error:', err);
    setError(`QR scan error: ${err.message}`);
    onStatusChange?.(`QR scan error: ${err.message}`, 'error');
  };

  // Start scanning
  const startScanning = () => {
    setError(null);
    setScanning(true);
    
    // Request camera permission
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(() => {
          setPermissionGranted(true);
        })
        .catch((err) => {
          console.error('Camera permission denied:', err);
          setPermissionGranted(false);
          setError('Camera permission denied. Please allow camera access to scan QR codes.');
          onStatusChange?.('Camera permission denied', 'error');
        });
    } else {
      setPermissionGranted(false);
      setError('Camera not available on this device or browser.');
      onStatusChange?.('Camera not available', 'error');
    }
  };

  // Disconnect all sessions
  const disconnectAllSessions = async () => {
    if (!signClient) return;
    
    try {
      // Disconnect each session
      for (const session of sessions) {
        await signClient.disconnect({
          topic: session.topic,
          reason: {
            code: 6000,
            message: 'User disconnected'
          }
        });
      }
      
      // Clear sessions
      setSessions([]);
      onStatusChange?.('Disconnected from all dApps', 'info');
    } catch (error) {
      console.error('Error disconnecting sessions:', error);
      onStatusChange?.(`Error: ${error instanceof Error ? error.message : 'Failed to disconnect'}`, 'error');
    }
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
    if (!expanded && !signClient) {
      // Initialize on first expand
      initSignClient();
      initPKPWallet();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (signClient) {
        signClient.off('session_proposal', handleSessionProposal);
        signClient.off('session_request', handleSessionRequest);
        signClient.off('session_delete', handleSessionDelete);
      }
    };
  }, [signClient]);

  return (
    <div className="p-4 border rounded mb-4">
      <button 
        onClick={toggleExpanded} 
        className="flex items-center justify-between w-full py-2 text-left"
      >
        <div className="flex items-center">
          <div className="mr-3 text-gray-700">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.42 12.4048C9.51 9.3048 14.49 9.3048 17.58 12.4048L18.29 13.1148C18.48 13.3048 18.48 13.6248 18.29 13.8148L17.18 14.9348C17.09 15.0248 16.95 15.0248 16.86 14.9348L15.88 13.9548C13.7 11.7748 10.31 11.7748 8.12 13.9548L7.13 14.9448C7.04 15.0348 6.9 15.0348 6.81 14.9448L5.7 13.8148C5.51 13.6248 5.51 13.3048 5.7 13.1148L6.42 12.4048ZM19.24 10.7448C23.97 15.4748 23.97 23.0748 19.24 27.8048L18.35 28.6948C18.16 28.8848 17.84 28.8848 17.65 28.6948L16.53 27.5748C16.44 27.4848 16.44 27.3448 16.53 27.2548L17.02 26.7648C20.59 23.1948 20.59 17.3548 17.02 13.7848L16.06 12.8248C15.97 12.7348 15.97 12.5948 16.06 12.5048L17.17 11.3948C17.36 11.2048 17.68 11.2048 17.87 11.3948L19.24 10.7448ZM4.76 28.6948C1.03 24.9648 1.03 17.3648 4.76 13.6348L5.65 12.7448C5.84 12.5548 6.16 12.5548 6.35 12.7448L7.47 13.8648C7.56 13.9548 7.56 14.0948 7.47 14.1848L6.98 14.6748C3.41 18.2448 3.41 24.0848 6.98 27.6548L7.94 28.6148C8.03 28.7048 8.03 28.8448 7.94 28.9348L6.83 30.0448C6.64 30.2348 6.32 30.2348 6.13 30.0448L4.76 28.6948Z" fill="#3B99FC"/>
            </svg>
          </div>
          <span className="font-medium">WalletConnect</span>
        </div>
        <div className="text-gray-500">
          {expanded ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </button>
      
      {expanded && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-4">
            Connect your PKP wallet to dApps using WalletConnect. Scan a QR code from any dApp to connect.
          </p>
          
          {/* Active sessions */}
          {sessions.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Active Connections</h4>
              <div className="border rounded divide-y">
                {sessions.map(session => (
                  <div key={session.topic} className="p-3 flex items-center justify-between">
                    <div className="flex items-center">
                      {session.peer.metadata.icons && session.peer.metadata.icons.length > 0 ? (
                        <div className="h-8 w-8 rounded overflow-hidden mr-3">
                          <img 
                            src={session.peer.metadata.icons[0]} 
                            alt={session.peer.metadata.name || 'dApp'} 
                            className="h-full w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="h-8 w-8 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm6 6H7v2h6v-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium line-clamp-1">{session.peer.metadata.name || 'Unknown dApp'}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{session.peer.metadata.url || ''}</p>
                        {session.peer.metadata.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{session.peer.metadata.description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          await signClient!.disconnect({
                            topic: session.topic,
                            reason: {
                              code: 6000,
                              message: 'User disconnected'
                            }
                          });
                          setSessions(prev => prev.filter(s => s.topic !== session.topic));
                          onStatusChange?.('Disconnected from dApp', 'info');
                        } catch (error) {
                          console.error('Error disconnecting session:', error);
                          onStatusChange?.(`Error: ${error instanceof Error ? error.message : 'Failed to disconnect'}`, 'error');
                        }
                      }}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md"
                    >
                      Disconnect
                    </button>
                  </div>
                ))}
              </div>
              {sessions.length > 1 && (
                <button
                  onClick={disconnectAllSessions}
                  className="mt-2 w-full py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50"
                >
                  Disconnect All
                </button>
              )}
            </div>
          )}
          
          {/* QR Code Scanner */}
          {scanning ? (
            <div className="p-4 border rounded-lg">
              {error ? (
                <div className="text-red-500 text-center p-4">
                  <p>{error}</p>
                  <button 
                    onClick={() => setScanning(false)} 
                    className="mt-3 px-3 py-1 bg-gray-200 rounded text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : permissionGranted === false ? (
                <div className="text-center p-4">
                  <p className="text-red-500 mb-2">Camera permission denied</p>
                  <p className="text-sm text-gray-600 mb-4">Please allow camera access in your browser settings to scan QR codes.</p>
                  <button 
                    onClick={() => setScanning(false)} 
                    className="px-3 py-1 bg-gray-200 rounded text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div>
                  <div className="rounded-lg overflow-hidden mb-3">
                    <QrReader
                      constraints={{ facingMode: 'environment' }}
                      onResult={(result) => {
                        if (result) {
                          handleScan(result.getText());
                        }
                      }}
                      scanDelay={500}
                      videoStyle={{ 
                        width: '100%', 
                        height: '100%',
                        borderRadius: '0.5rem'
                      }}
                      videoContainerStyle={{
                        paddingTop: '100%', // 1:1 aspect ratio
                        position: 'relative',
                        borderRadius: '0.5rem',
                        overflow: 'hidden',
                      }}
                      videoId="qr-reader"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">Scan a WalletConnect QR code from a dApp</p>
                    <button 
                      onClick={() => setScanning(false)} 
                      className="px-4 py-2 bg-gray-200 rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : connecting ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-sm">Connecting to dApp...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Connect to a dApp</h3>
              <p className="text-sm text-gray-600 text-center mb-4">
                Scan a WalletConnect QR code to connect your PKP wallet to a decentralized application.
              </p>
              <button
                onClick={startScanning}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                Scan QR Code
              </button>
            </div>
          )}
          
          <div className="mt-4 text-xs text-gray-500">
            <p className="mb-1">What you can do:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Scan QR codes from dApps to connect your PKP wallet</li>
              <li>Sign transactions and messages requested by connected dApps</li>
              <li>Manage your dApp connections</li>
              <li>Disconnect from dApps at any time</li>
            </ul>
            <p className="mt-2">Note: Always verify what you're signing. Only connect to dApps you trust.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnect; 