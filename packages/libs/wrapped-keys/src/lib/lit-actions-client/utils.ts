import type { ExecuteJsResponse } from '@lit-protocol/types';

import type { Network } from '../types';
import type { LitActionType } from './types';

import batchGenerateMetadata from '../lit-actions/generated/common/batchGenerateEncryptedKeys-metadata.json';
import generateSolanaMetadata from '../lit-actions/generated/solana/generateEncryptedSolanaPrivateKey-metadata.json';

/**
 *
 * Post processes the Lit Action result to ensure that the result is non-empty and a valid string
 *
 * @param result - The Lit Action result to be processes
 *
 * @returns { string } - The response field in the Lit Action result object
 */
export function postLitActionValidation(result: ExecuteJsResponse | undefined): string {
  if (!result) {
    throw new Error('There was an unknown error running the Lit Action.');
  }

  const { response } = result;
  if (!response) {
    throw new Error(`Expected "response" in Lit Action result: ${JSON.stringify(result)}`);
  }

  if (typeof response !== 'string') {
    // As the return value is a hex string
    throw new Error(`Lit Action should return a string response: ${JSON.stringify(result)}`);
  }

  if (!result.success) {
    throw new Error(`Expected "success" in res: ${JSON.stringify(result)}`);
  }

  if (response.startsWith('Error:')) {
    // Lit Action sets an error response
    throw new Error(`Error executing the Signing Lit Action: ${response}`);
  }

  return response;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function assertNetworkIsValid(network: any): asserts network is Network {
  const validNetworks: Network[] = ['solana'];

  if (!validNetworks.includes(network)) {
    throw new Error(`Invalid network: ${network}. Must be one of ${validNetworks.join(', ')}.`);
  }
}

/**
 * Get the IPFS CID for Vincent wrapped keys Lit Actions.
 * Vincent prefers using IPFS CIDs for production deployment.
 *
 * @param {Network} network The network (must be 'solana' for Vincent)
 * @param {LitActionType} actionType The type of action to get CID for
 * @returns {string} The IPFS CID of the Lit Action
 */
export function getLitActionCid(network: Network, actionType: LitActionType): string {
  assertNetworkIsValid(network);

  if (network === 'solana') {
    switch (actionType) {
      case 'generateEncryptedKey':
        return generateSolanaMetadata.ipfsCid;
      default:
        throw new Error(`Unsupported action type for Solana: ${actionType}`);
    }
  }

  throw new Error(`Unsupported network: ${network}`);
}

/**
 * Get the IPFS CID for network-agnostic Vincent wrapped keys Lit Actions.
 * These actions work across all supported networks.
 *
 * @param {string} actionType The type of common action to get CID for
 * @returns {string} The IPFS CID of the common Lit Action
 */
export function getLitActionCommonCid(actionType: string): string {
  switch (actionType) {
    case 'batchGenerateEncryptedKeys':
      return batchGenerateMetadata.ipfsCid;
    default:
      throw new Error(`Unsupported common action type: ${actionType}`);
  }
}
