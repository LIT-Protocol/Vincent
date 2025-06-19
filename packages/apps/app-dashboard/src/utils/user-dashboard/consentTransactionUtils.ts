import { ethers } from 'ethers';
import { JsonRpcProvider as V6JsonRpcProvider } from 'ethers-v6';
import { estimateGasWithBuffer } from '@/services/contract/config';
import { LitContracts } from '@lit-protocol/contracts-sdk';
import { AUTH_METHOD_SCOPE, LIT_RPC } from '@lit-protocol/constants';
import { SELECTED_LIT_NETWORK } from './lit';
import { IPFS_POLICIES_THAT_NEED_SIGNING } from '@/config/policyConstants';
import { hexToBase58 } from './consentVerificationUtils';

/**
 * Handles sending a transaction with proper error handling
 * @param contract The contract to interact with
 * @param methodName The contract method to call
 * @param args The arguments to pass to the method
 * @param statusMessage Status message to display while sending the transaction
 * @param statusCallback Optional callback for status updates
 * @param errorCallback Optional callback for error handling
 * @returns The transaction response
 */
export const sendTransaction = async (
  contract: any,
  methodName: string,
  args: any[],
  statusMessage: string,
  statusCallback?: (message: string, type: 'info' | 'warning' | 'success' | 'error') => void,
) => {
  try {
    statusCallback?.('Estimating transaction gas fees...', 'info');
    const gasLimit = await estimateGasWithBuffer(contract, methodName, args);

    const provider = contract.provider;
    const gasEstimationProvider = new V6JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE);
    const feeData = await gasEstimationProvider.getFeeData();

    const txOptions: any = {
      gasLimit,
    };

    if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
      txOptions.type = 2;
      txOptions.maxFeePerGas = feeData.maxFeePerGas;
      txOptions.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
    } else if (feeData.gasPrice) {
      txOptions.gasPrice = feeData.gasPrice;
    } else {
      const gasPrice = await provider.getGasPrice();
      txOptions.gasPrice = gasPrice;
    }

    statusCallback?.(statusMessage, 'info');
    const txResponse = await contract[methodName](...args, txOptions);

    statusCallback?.(`Transaction submitted! Hash: ${txResponse.hash.substring(0, 10)}...`, 'info');

    return txResponse;
  } catch (error) {
    console.error(`TRANSACTION FAILED (${methodName}):`, error);
    statusCallback?.('Transaction failed', 'error');
    throw error;
  }
};

/**
 * Adds permitted actions for tools to a PKP
 * @param wallet The PKP wallet to use for signing
 * @param agentPKPTokenId The token ID of the agent PKP
 * @param toolIpfsCids Array of IPFS CIDs for the tools to permit
 * @param policyIpfsCids Array of IPFS CIDs for the policies to permit
 * @param statusCallback Optional callback for status updates
 */
export const addPermittedActions = async (
  wallet: ethers.Signer,
  agentPKPTokenId: string,
  toolIpfsCids: string[],
  policyIpfsCids: string[],
  statusCallback?: (message: string, type: 'info' | 'warning' | 'success' | 'error') => void,
) => {
  if (!wallet || !agentPKPTokenId || !toolIpfsCids.length) {
    return { success: false, error: 'Missing required data for adding permitted actions' };
  }

  statusCallback?.(`Adding permissions for ${toolIpfsCids.length} action(s)...`, 'info');

  try {
    // Get provider and prepare gas options
    const provider = wallet.provider;
    if (!provider) {
      throw new Error('Wallet provider not available');
    }

    const gasEstimationProvider = new V6JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE);
    const feeData = await gasEstimationProvider.getFeeData();

    // Prepare gas options for the SDK
    const gasOptions: any = {};
    if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
      gasOptions.maxFeePerGas = feeData.maxFeePerGas;
      gasOptions.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
      gasOptions.type = 2;
    } else if (feeData.gasPrice) {
      gasOptions.gasPrice = feeData.gasPrice;
    } else {
      const gasPrice = await provider.getGasPrice();
      gasOptions.gasPrice = gasPrice;
    }

    // Initialize Lit Contracts
    const litContracts = new LitContracts({
      network: SELECTED_LIT_NETWORK,
      signer: wallet,
    });
    await litContracts.connect();

    const permittedActions =
      await litContracts.pkpPermissionsContractUtils.read.getPermittedActions(agentPKPTokenId);

    const permittedActionSet = new Set(
      permittedActions
        .map((cid: string) => {
          const base58Cid = hexToBase58(cid);
          return base58Cid;
        })
        .filter(Boolean),
    );

    // Process policy IPFS CIDs
    for (const ipfsCid of policyIpfsCids) {
      if (IPFS_POLICIES_THAT_NEED_SIGNING[ipfsCid]) {
        if (!permittedActionSet.has(ipfsCid)) {
          await litContracts.addPermittedAction({
            ipfsId: ipfsCid,
            pkpTokenId: agentPKPTokenId,
            authMethodScopes: [AUTH_METHOD_SCOPE.SignAnything],
            ...gasOptions, // Provide the corrected gas options
          });
        }
      }
    }

    // Process tool IPFS CIDs
    for (const ipfsCid of toolIpfsCids) {
      if (!permittedActionSet.has(ipfsCid)) {
        await litContracts.addPermittedAction({
          ipfsId: ipfsCid,
          pkpTokenId: agentPKPTokenId,
          authMethodScopes: [AUTH_METHOD_SCOPE.SignAnything],
          ...gasOptions, // Provide the corrected gas options
        });
      }
    }

    statusCallback?.('Permission grants successful!', 'success');
    return { success: true };
  } catch (error) {
    console.error('addPermittedActions error:', error);
    statusCallback?.(`Failed to add permitted actions`, 'error');
    return { success: false, error: error };
  }
};
