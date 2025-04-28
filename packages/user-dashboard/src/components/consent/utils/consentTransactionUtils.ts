import { ethers } from 'ethers';
import { estimateGasWithBuffer } from '@/services/contract/config';
import { LitContracts } from '@lit-protocol/contracts-sdk';
import { AUTH_METHOD_SCOPE } from '@lit-protocol/constants';
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
  errorCallback?: (error: any, title?: string, details?: string) => void
) => {
  try {
    statusCallback?.('Estimating transaction gas fees...', 'info');
    const gasLimit = await estimateGasWithBuffer(
      contract,
      methodName,
      args
    );

    statusCallback?.(statusMessage, 'info');
    const txResponse = await contract[methodName](
      ...args,
      {
        gasLimit,
      }
    );

    statusCallback?.(
      `Transaction submitted! Hash: ${txResponse.hash.substring(0, 10)}...`,
      'info'
    );

    return txResponse;
  } catch (error) {
    console.error(`TRANSACTION FAILED (${methodName}):`, error);

    // Try to extract more specific error information
    const errorObj = error as any;
    const errorMessage = errorObj.message || '';
    const errorData = errorObj.data || '';
    const errorReason = errorObj.reason || '';

    console.error('Error details:', {
      message: errorMessage,
      data: errorData,
      reason: errorReason,
    });

    // Get the raw error message for display in details
    let rawErrorDetails = '';
    if (typeof errorMessage === 'string') {
      rawErrorDetails = errorMessage.substring(0, 500); // Get first 500 chars
    }

    // Format the raw error details for better readability
    if (rawErrorDetails.includes('execution reverted')) {
      const parts = rawErrorDetails.split('execution reverted');
      if (parts.length > 1) {
        rawErrorDetails = 'Execution reverted: ' + parts[1].trim();
      }
    }

    // Check for common contract errors
    let userFriendlyError: string;

    if (errorMessage.includes('AppNotRegistered')) {
      userFriendlyError = `App ID is not registered in the contract`;
    } else if (
      errorMessage.includes('AppVersionNotRegistered') ||
      errorMessage.includes('AppVersionNotEnabled')
    ) {
      userFriendlyError = `App version is not registered or not enabled`;
    } else if (
      errorMessage.includes('EmptyToolIpfsCid') ||
      errorMessage.includes('EmptyPolicyIpfsCid')
    ) {
      userFriendlyError = 'One of the tool or policy IPFS CIDs is empty';
    } else if (
      errorMessage.includes('EmptyParameterName') ||
      errorMessage.includes('EmptyParameterValue')
    ) {
      userFriendlyError = 'Parameter name or value cannot be empty';
    } else if (
      errorMessage.includes('PolicyParameterNameNotRegistered') ||
      errorMessage.includes('ToolNotRegistered') ||
      errorMessage.includes('ToolPolicyNotRegistered')
    ) {
      userFriendlyError =
        'Tool, policy, or parameter is not properly registered for this app version';
    } else if (errorMessage.includes('NotPkpOwner')) {
      userFriendlyError = 'You are not the owner of this PKP';
    } else if (errorMessage.includes('cannot estimate gas')) {
      userFriendlyError =
        'Transaction cannot be completed - the contract rejected it';
    } else {
      // Default error message
      userFriendlyError = `Transaction failed`;
    }

    // Show the error in the popup with detailed information
    errorCallback?.(userFriendlyError, 'Contract Error', rawErrorDetails);
    statusCallback?.('Transaction failed', 'error');

    // Rethrow the error with the user-friendly message
    throw new Error(userFriendlyError);
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
  statusCallback?: (message: string, type: 'info' | 'warning' | 'success' | 'error') => void
) => {
  if (!wallet || !agentPKPTokenId || !toolIpfsCids.length) {
    return { success: false, error: 'Missing required data for adding permitted actions' };
  }

  statusCallback?.(
    `Adding permissions for ${toolIpfsCids.length} action(s)...`,
    'info'
  );

  try {
    // Initialize Lit Contracts
    const litContracts = new LitContracts({
      network: SELECTED_LIT_NETWORK,
      signer: wallet,
    });
    await litContracts.connect();

    const permittedActions = await litContracts.pkpPermissionsContractUtils.read.getPermittedActions(
      agentPKPTokenId
    );

    const permittedActionSet = new Set(
      permittedActions
        .map((cid: string) => {
          const base58Cid = hexToBase58(cid);
          return base58Cid;
        })
        .filter(Boolean)
    );

    // Process policy IPFS CIDs
    for (const ipfsCid of policyIpfsCids) {
      if (IPFS_POLICIES_THAT_NEED_SIGNING[ipfsCid]) {

        if (!permittedActionSet.has(ipfsCid)) {
          await litContracts.addPermittedAction({
            ipfsId: ipfsCid,
            pkpTokenId: agentPKPTokenId,
            authMethodScopes: [AUTH_METHOD_SCOPE.SignAnything],
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
        });
      }
    }

    statusCallback?.('Permission grants successful!', 'success');
    return { success: true };
  } catch (error) {
    statusCallback?.(`Failed to add permitted actions`, 'error');
    return { success: false, error: error };
  }
};
