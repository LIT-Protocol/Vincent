import { walletkit } from './WalletConnectUtil';
import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
import { ethers } from 'ethers';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { litNodeClient } from '../../consent/utils/lit';
import { LIT_CHAINS } from '@lit-protocol/constants';

// Store providers for different chains
const chainProviders: Record<string, ethers.providers.JsonRpcProvider> = {};

/**
 * Get a provider for a specific chain ID
 * @param chainId The chain ID to get a provider for (decimal or hex format)
 */
function getProviderForChain(chainId: string | number): ethers.providers.JsonRpcProvider {
  // Convert hex to decimal if needed
  const chainIdDecimal =
    typeof chainId === 'string' && chainId.startsWith('0x')
      ? parseInt(chainId, 16)
      : Number(chainId);

  // Convert to string key for our cache
  const chainIdKey = chainIdDecimal.toString();

  // Return cached provider if exists
  if (chainProviders[chainIdKey]) {
    return chainProviders[chainIdKey];
  }

  // Find RPC URL for this chain
  let rpcUrl = '';

  // Try to get RPC URL from LIT_CHAINS
  for (const [, chainInfo] of Object.entries(LIT_CHAINS)) {
    if (chainInfo.chainId === chainIdDecimal) {
      rpcUrl = chainInfo.rpcUrls[0];
      break;
    }
  }

  // Create and cache the provider
  console.log(`Creating provider for chain ${chainIdDecimal} with RPC URL: ${rpcUrl}`);
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  chainProviders[chainIdKey] = provider;

  return provider;
}

// Store the PKP wallet instance
let pkpWallet: PKPEthersWallet | null = null;

// Add a flag to track if event handlers are registered
let walletConnectHandlersRegistered = false;

/**
 * Notify connected sessions about account changes
 */

async function notifySessionsOfAccount(address: string) {
  if (!walletkit) return;

  try {
    // Get active sessions
    const sessions = Object.values(walletkit.getActiveSessions() || {});
    if (sessions.length === 0) {
      console.log('No active sessions to notify');
      return;
    }
    const chainId = 'eip155:1';

    for (const session of sessions) {
      try {
        // Create accounts changed event
        const accountsChanged = {
          topic: session.topic,
          event: {
            name: 'accountsChanged',
            data: [`${chainId}:${address}`],
          },
          chainId,
        };

        // Emit the account changed event
        await walletkit.emitSessionEvent(accountsChanged);

        console.log('Emitted accountsChanged event to session', session.topic);
      } catch (error) {
        console.error(`Failed to notify session ${session.topic} of account changes:`, error);
      }
    }
  } catch (error) {
    console.error('Failed to notify sessions of account changes:', error);
  }
}

/**
 * Register a PKP wallet with WalletConnect to handle signing requests
 * @param agentPKP The agent's PKP to use for signing
 * @param sessionSigs Session signatures for authentication
 * @returns Information about the registered account
 */
export async function registerPKPWallet(
  agentPKP: IRelayPKP,
  sessionSigs: SessionSigs,
): Promise<{ address: string; publicKey: string; chainId: string }> {
  if (!walletkit) {
    throw new Error('WalletConnect not initialized');
  }

  if (!agentPKP.ethAddress) {
    throw new Error('PKP does not have an Ethereum address');
  }

  // If session signatures are provided, create an actual PKP wallet for signing
  if (sessionSigs) {
    try {
      pkpWallet = new PKPEthersWallet({
        pkpPubKey: agentPKP.publicKey,
        litNodeClient: litNodeClient,
        controllerSessionSigs: sessionSigs,
      });
      await pkpWallet.init();
      await notifySessionsOfAccount(agentPKP.ethAddress);
    } catch (error) {
      console.error('Failed to create PKP wallet:', error);
      throw new Error('Failed to create PKP wallet');
    }
  }

  const address = agentPKP.ethAddress;

  if (!walletConnectHandlersRegistered) {
    walletkit.on('session_request', async ({ id, topic, params }) => {
      try {
        const sessions = walletkit.getActiveSessions();
        if (!sessions || !sessions[topic]) {
          console.warn(
            `Session with topic ${topic} does not exist or is no longer active. Rejecting request.`,
          );
          await walletkit
            .respondSessionRequest({
              topic,
              response: {
                id,
                jsonrpc: '2.0',
                error: {
                  code: 4001,
                  message: 'Session expired or does not exist',
                },
              },
            })
            .catch((e) => {
              console.error('Error responding to invalid session request:', e);
            });
          return;
        }
      } catch (sessionError) {
        console.error('Error validating session:', sessionError);
        return;
      }

      // Extract request details
      const { request } = params;
      const { method } = request;

      try {
        let result;

        // Handle different request methods
        if (!pkpWallet) {
          throw new Error('PKP wallet not initialized');
        }

        console.log('Handling request:', { id, topic, params });
        switch (method) {
          case 'personal_sign': {
            try {
              const message = request.params[0];
              const signature = await pkpWallet.signMessage(ethers.utils.arrayify(message));
              result = signature;
            } catch (error) {
              console.error('Error signing with PKP wallet:', error);
              throw error;
            }
            break;
          }

          case 'eth_signTransaction': {
            try {
              const txParams = request.params[0];
              let provider: ethers.providers.JsonRpcProvider;
              if (txParams.chainId) {
                provider = getProviderForChain(txParams.chainId);
                const rpcUrl = provider.connection.url;
                await pkpWallet.setRpc(rpcUrl);
              }
              const signedTx = await pkpWallet.signTransaction(txParams);
              result = signedTx;
              console.log('Transaction signed with PKP wallet:', signedTx);
            } catch (error) {
              console.error('Error signing transaction with PKP wallet:', error);
              throw error;
            }
            break;
          }

          case 'eth_signTypedData_v4': {
            try {
              const typedData = JSON.parse(request.params[1]);
              const { domain, types, message } = typedData;

              // Make sure types doesn't include EIP712Domain
              if (types.EIP712Domain) {
                delete types.EIP712Domain;
              }

              console.log('Signing typed data', { domain, types, message });
              const signedData = await pkpWallet._signTypedData(domain, types, message);

              result = signedData;
              console.log('Typed data signed with PKP wallet:', signedData);
            } catch (error) {
              console.error('Error signing typed data with PKP wallet:', error);
              throw error;
            }
            break;
          }

          case 'eth_sendTransaction': {
            console.log('Handling eth_sendTransaction request:', request);

            try {
              // Get transaction params
              const txParams = request.params[0];
              let provider: ethers.providers.JsonRpcProvider;

              // Get RPC URL from session's rpcMap if available
              let rpcUrl = '';
              if (txParams.chainId) {
                // Convert chainId from hex to decimal if needed
                const chainIdHex = txParams.chainId;
                const chainId =
                  typeof chainIdHex === 'string' && chainIdHex.startsWith('0x')
                    ? parseInt(chainIdHex, 16)
                    : Number(chainIdHex);

                // Update the chainId in txParams to be a number
                txParams.chainId = chainId;

                console.log(`Transaction for chainId: ${chainId} (converted from ${chainIdHex})`);

                // First check if we have an RPC URL in the session's rpcMap
                try {
                  // Get the active session for this topic
                  const session = walletkit.getActiveSessions()[topic];
                  if (session) {
                    // Check for rpcMap in the namespaces
                    const eip155Namespace = session.namespaces?.eip155;
                    // Access optional properties safely through optional chaining
                    const rpcMapEntry = (eip155Namespace as { rpcMap?: Record<string, string> })
                      ?.rpcMap?.[chainId.toString()];
                    if (rpcMapEntry) {
                      rpcUrl = rpcMapEntry;
                      console.log(
                        `Using RPC URL from session rpcMap: ${rpcUrl} for chain ${chainId}`,
                      );
                    }
                  }
                } catch (rpcMapError) {
                  console.error('Error getting RPC URL from session:', rpcMapError);
                  // Continue with fallback methods
                }

                // If we couldn't get an RPC URL from the session, use our provider function
                if (!rpcUrl) {
                  // Create a provider for this chain
                  provider = getProviderForChain(chainId);
                  rpcUrl = provider.connection.url;
                } else {
                  // Create a provider with the RPC URL from the session
                  provider = new ethers.providers.JsonRpcProvider(rpcUrl);
                }

                // Update the wallet's RPC URL
                await pkpWallet.setRpc(rpcUrl);
                console.log(`Set RPC URL for chain ID ${chainId}: ${rpcUrl}`);
              } else {
                // Default to Ethereum mainnet if no chainId specified
                provider = getProviderForChain(1);
              }

              // Process gas parameters
              if (txParams.gas) {
                if (typeof txParams.gas === 'string' && txParams.gas.startsWith('0x')) {
                  txParams.gasLimit = ethers.BigNumber.from(txParams.gas);
                } else {
                  txParams.gasLimit = ethers.BigNumber.from(txParams.gas);
                }
                // Remove the original gas field as ethers.js uses gasLimit
                delete txParams.gas;
              }

              if (
                txParams.gasPrice &&
                typeof txParams.gasPrice === 'string' &&
                txParams.gasPrice.startsWith('0x')
              ) {
                txParams.gasPrice = ethers.BigNumber.from(txParams.gasPrice);
              }

              // Ensure we have a gas limit if none was provided
              if (!txParams.gasLimit && !txParams.gas) {
                try {
                  // Estimate gas for the transaction
                  const gasEstimate = await provider.estimateGas({
                    to: txParams.to,
                    data: txParams.data,
                    value: txParams.value || '0x0',
                  });
                  // Add 20% buffer to gas estimate
                  txParams.gasLimit = gasEstimate.mul(14).div(10);
                  console.log(`Estimated gas limit: ${txParams.gasLimit.toString()}`);
                } catch (estimateError) {
                  console.error('Error estimating gas:', estimateError);
                  // Provide a safe default gas limit for common transactions (200,000 gas)
                  txParams.gasLimit = ethers.BigNumber.from('0x30d40');
                  console.log(`Using default gas limit: ${txParams.gasLimit.toString()}`);
                }
              }

              console.log('Final transaction parameters:', txParams);

              // Send transaction with PKP wallet
              const tx = await pkpWallet.sendTransaction(txParams);
              result = tx.hash;
              console.log('Transaction sent with PKP wallet:', tx.hash);

              // Emit proper event to notify the client
              await notifyTransactionComplete(tx.hash, topic, txParams.chainId.toString());
            } catch (error) {
              console.error('Error sending transaction with PKP wallet:', error);
              throw error;
            }
            break;
          }

          default:
            throw new Error(`Method ${method} not supported`);
        }

        // Respond to the request
        await walletkit.respondSessionRequest({
          topic,
          response: {
            id,
            jsonrpc: '2.0',
            result,
          },
        });

        console.log(`Successfully responded to ${method} request`);
      } catch (error) {
        // Respond with error
        await walletkit.respondSessionRequest({
          topic,
          response: {
            id,
            jsonrpc: '2.0',
            error: {
              code: 4001,
              message: error instanceof Error ? error.message : 'Unknown error',
            },
          },
        });
      }
    });

    // Setup session_proposal event handler
    walletkit.on('session_proposal', (proposal) => {
      console.log('Received session proposal:', proposal);
    });

    // Mark handlers as registered
    walletConnectHandlersRegistered = true;
    console.log('WalletConnect event handlers registered');
  } else {
    console.log('WalletConnect event handlers already registered, skipping');
  }

  // Return account info
  const accountInfo = {
    address,
    publicKey: agentPKP.publicKey || '',
    chainId: 'eip155:1',
  };

  console.log('PKP wallet event handlers registered with WalletConnect');

  return accountInfo;
}

/**
 * Notify the client that a transaction has completed
 */
async function notifyTransactionComplete(txHash: string, topic: string, chainId: string) {
  if (!walletkit) return;

  try {
    const formattedChainId = chainId.includes(':') ? chainId : `eip155:${chainId}`;
    const transactionEvent = {
      topic: topic,
      event: {
        name: 'transactionComplete',
        data: [txHash],
      },
      chainId: formattedChainId,
    };

    await walletkit.emitSessionEvent(transactionEvent);
    console.log('Emitted transactionComplete event to session', topic);
  } catch (error) {
    console.error('Failed to notify session of transaction completion:', error);
  }
}
