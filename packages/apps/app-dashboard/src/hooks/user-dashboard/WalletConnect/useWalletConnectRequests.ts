import { useState, useEffect, useCallback } from 'react';
import * as Sentry from '@sentry/react';
import { LIT_CHAINS } from '@lit-protocol/constants';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import {
  setupRequestHandlers,
  getPendingSessionRequests,
  clearSessionRequest,
} from '@/components/user-dashboard/withdraw/WalletConnect/RequestHandler';
import { getPKPWallet } from '@/components/user-dashboard/withdraw/WalletConnect/WalletConnectUtil';
import { ethers } from 'ethers';
import { JsonRpcProvider as V6JsonRpcProvider } from 'ethers-v6';

export function useWalletConnectRequests(client: any, currentWalletAddress: string | null) {
  const [pendingSessionRequests, setPendingSessionRequests] = useState<any[]>([]);
  const [processingRequest, setProcessingRequest] = useState(false);

  // Listen for session requests
  useEffect(() => {
    const updatePendingRequests = () => {
      const walletSpecificRequests = getPendingSessionRequests();
      setPendingSessionRequests(walletSpecificRequests);
    };

    const handleSessionRequest = (event: CustomEvent) => {
      console.log('Captured session request event:', event.detail);
      updatePendingRequests();
    };

    window.addEventListener('walletconnect:session_request', handleSessionRequest as EventListener);
    updatePendingRequests();

    return () => {
      window.removeEventListener(
        'walletconnect:session_request',
        handleSessionRequest as EventListener,
      );
    };
  }, [client, currentWalletAddress]);

  // Set up request handlers once client is initialized
  useEffect(() => {
    if (client) {
      setupRequestHandlers(client);
      console.log('WalletKit request handlers set up');
    }
  }, [client]);

  const handleApproveRequest = useCallback(
    async (request: any) => {
      if (!client) {
        throw new Error('WalletConnect is not initialized');
      }

      setProcessingRequest(true);

      try {
        const pkpWallet = getPKPWallet();
        if (!pkpWallet) {
          throw new Error('PKP wallet not available');
        }

        const { topic, id, params } = request;
        const { request: reqParams } = params;
        const { method, params: methodParams } = reqParams;

        console.log(`Handling ${method} request with params:`, methodParams);

        // Validate session topic
        const activeSessions = client.getActiveSessions() || {};
        if (!activeSessions[topic]) {
          clearSessionRequest(id);
          setPendingSessionRequests(getPendingSessionRequests());
          throw new Error(
            `Cannot process request: session ${topic} is no longer active at approval time. Active sessions: ${Object.keys(activeSessions).join(', ')}`,
          );
        }

        let result;
        let response;

        // Auto-approve wallet_getCapabilities without user interaction
        if (method === 'wallet_getCapabilities') {
          result = getWalletCapabilities();
          response = { id, jsonrpc: '2.0', result };
          await client.respondSessionRequest({ topic, response });
          clearSessionRequest(id);
          setPendingSessionRequests(getPendingSessionRequests());
          return { success: true, method };
        }

        switch (method) {
          case 'personal_sign':
          case 'eth_sign':
            result = await handleSignMessage(pkpWallet, methodParams);
            response = { id, jsonrpc: '2.0', result };
            break;

          case 'eth_sendTransaction':
            result = await handleSendTransaction(pkpWallet, methodParams, params);
            response = { id, jsonrpc: '2.0', result: result.hash };
            break;

          case 'eth_signTypedData':
          case 'eth_signTypedData_v4':
            result = await handleSignTypedData(pkpWallet, methodParams);
            response = { id, jsonrpc: '2.0', result };
            break;

          default:
            throw new Error(`Unsupported method: ${method}`);
        }

        await client.respondSessionRequest({ topic, response });

        clearSessionRequest(id);
        setPendingSessionRequests(getPendingSessionRequests());

        return { success: true, method };
      } catch (error) {
        console.error('Failed to approve request:', error);
        Sentry.captureException(error);

        if (request?.id && request?.topic) {
          try {
            const errorResponse = {
              id: request.id,
              jsonrpc: '2.0',
              error: {
                code: 4001,
                message: error instanceof Error ? error.message : 'Request failed',
              },
            };

            await client.respondSessionRequest({
              topic: request.topic,
              response: errorResponse,
            });
          } catch (responseError) {
            console.error('Failed to send error response:', responseError);
            Sentry.captureException(responseError);
          }
        }

        throw error;
      } finally {
        setProcessingRequest(false);
      }
    },
    [client],
  );

  const handleRejectRequest = useCallback(
    async (request: any) => {
      if (!client) {
        throw new Error('WalletConnect is not initialized');
      }

      setProcessingRequest(true);

      try {
        const { topic, id } = request;

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

        clearSessionRequest(id);
        setPendingSessionRequests(getPendingSessionRequests());
      } finally {
        setProcessingRequest(false);
      }
    },
    [client],
  );

  return {
    pendingSessionRequests,
    processingRequest,
    handleApproveRequest,
    handleRejectRequest,
  };
}

// Helper functions
async function handleSignMessage(pkpWallet: PKPEthersWallet, methodParams: any[]) {
  const message = methodParams[0];
  return await pkpWallet.signMessage(
    typeof message === 'string' && message.startsWith('0x')
      ? Buffer.from(message.slice(2), 'hex').toString('utf8')
      : message,
  );
}

async function handleSendTransaction(pkpWallet: PKPEthersWallet, methodParams: any[], params: any) {
  const tx = { ...methodParams[0] };

  // Convert chainId from hex to number if needed
  if (tx.chainId && typeof tx.chainId === 'string' && tx.chainId.startsWith('0x')) {
    tx.chainId = ethers.BigNumber.from(tx.chainId).toNumber();
  }

  const chainId = tx.chainId || parseInt(params.chainId.split(':')[1], 10);

  // Find RPC URL for chain
  let rpcUrl = '';
  for (const [chainKey, chainInfo] of Object.entries(LIT_CHAINS)) {
    if ((chainInfo as any).chainId === chainId) {
      rpcUrl = (chainInfo as any).rpcUrls[0];
      console.log(`Found chainId ${chainId} in LIT_CHAINS: ${chainKey} with RPC ${rpcUrl}`);
      break;
    }
  }

  if (!rpcUrl) {
    throw new Error(`Chain with ID ${chainId} is not supported in LIT_CHAINS`);
  }
  await pkpWallet.setRpc(rpcUrl);
  tx.chainId = chainId;

  // Create v6 provider for gas estimation and fee data
  const v6Provider = new V6JsonRpcProvider(rpcUrl);

  // Check if this should be an EIP-1559 transaction and pre-populate fee fields
  // This prevents PKPEthersWallet from creating BigNumber objects internally
  if (!tx.gasPrice && !tx.maxFeePerGas && !tx.maxPriorityFeePerGas) {
    try {
      const feeData = await v6Provider.getFeeData();

      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        tx.maxFeePerGas = ethers.BigNumber.from(feeData.maxFeePerGas.toString());
        tx.maxPriorityFeePerGas = ethers.BigNumber.from(feeData.maxPriorityFeePerGas.toString());
        tx.type = 2;
      } else {
        // Fallback to legacy gasPrice
        if (feeData.gasPrice) {
          tx.gasPrice = ethers.BigNumber.from(feeData.gasPrice.toString());
        }
      }
    } catch (feeError) {
      console.error('Failed to fetch fee data:', feeError);
      Sentry.captureException(feeError);
      throw new Error('Failed to fetch fee data');
    }
  }

  const isEIP1559 = tx.maxFeePerGas !== undefined || tx.maxPriorityFeePerGas !== undefined;

  if (isEIP1559) {
    tx.type = 2;
    delete tx.gasPrice;
  }

  if (!tx.gas && !tx.gasLimit) {
    console.log('No gas limit specified, estimating gas with v6 provider...');

    // Prepare gas estimation transaction for v6
    const estimateGasTx = {
      to: tx.to,
      data: tx.data || '0x',
      value: tx.value ? BigInt(tx.value.toString()) : 0n,
      from: await pkpWallet.getAddress(),
    };

    try {
      const gasEstimate = await v6Provider.estimateGas(estimateGasTx);
      const gasWithBuffer = ethers.BigNumber.from(gasEstimate.toString()).mul(120).div(100);
      tx.gas = gasWithBuffer;
      tx.gasLimit = gasWithBuffer;
      console.log('Gas estimate with buffer:', gasWithBuffer.toString());
    } catch (gasError) {
      console.error('Failed to estimate gas:', gasError);
      throw new Error('Failed to estimate gas for transaction');
    }
  } else if (tx.gasLimit && !tx.gas) {
    tx.gas = tx.gasLimit;
  } else if (tx.gas && !tx.gasLimit) {
    tx.gasLimit = tx.gas;
  }

  console.log('Final transaction object:', tx);
  return await pkpWallet.sendTransaction(tx);
}

async function handleSignTypedData(pkpWallet: PKPEthersWallet, methodParams: any[]) {
  const [, data] = methodParams;
  const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

  if (!parsedData.domain || !parsedData.types || !parsedData.message) {
    throw new Error('Invalid typed data format');
  }

  const types = { ...parsedData.types };
  delete types.EIP712Domain;

  return await pkpWallet._signTypedData(parsedData.domain, types, parsedData.message);
}

function getWalletCapabilities() {
  return {
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
}
