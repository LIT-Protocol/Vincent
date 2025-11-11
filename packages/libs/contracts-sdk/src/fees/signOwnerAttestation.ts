import type { LitNodeClient } from '@lit-protocol/lit-node-client';
import type { SessionSigsMap } from '@lit-protocol/types';
import { VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD, VINCENT_CONTRACT_ADDRESS_BOOK } from '../constants';

export interface SignOwnerAttestationParams {
  /** The Lit Node client instance */
  litNodeClient: LitNodeClient;
  /** Session signatures for authenticating with Lit */
  sessionSigs: SessionSigsMap;
  /** The PKP public key that will sign the attestation (with 0x prefix) */
  pkpPublicKey: string;
  /** The app ID to create an attestation for */
  appId: number;
  /** The owner address (the app manager) */
  owner: string;
  /** The destination chain ID where the signature will be verified */
  dstChainId: number;
  /** The destination contract address where the signature will be verified (typically the Fee Diamond) */
  dstContract: string;
  /** The IPFS CID of the deployed Lit Action */
  litActionIpfsCid: string;
  /** Source chain ID (defaults to Chronicle Yellowstone chain ID: 175188) */
  srcChainId?: number;
  /** Source contract address (defaults to Vincent Diamond on Chronicle Yellowstone) */
  srcContract?: string;
}

export interface OwnerAttestation {
  srcChainId: number;
  srcContract: string;
  owner: string;
  appId: number;
  issuedAt: number;
  expiresAt: number;
  dstChainId: number;
  dstContract: string;
}

export interface SignOwnerAttestationResult {
  /** The signature in bytes format (r, s, v packed) */
  signature: string;
  /** The attestation that was signed */
  attestation: OwnerAttestation;
}

// Chronicle Yellowstone chain ID
const CHRONICLE_YELLOWSTONE_CHAIN_ID = 175188;

/**
 * Signs an owner attestation using a Lit Action
 *
 * This function executes a Lit Action that:
 * 1. Validates the issuedAt timestamp is within ±30 seconds of current time
 * 2. Verifies the owner is actually the app manager by reading from the Vincent Diamond on Chronicle Yellowstone
 * 3. Creates an OwnerAttestation structure with the provided parameters
 * 4. Signs it using the specified PKP
 * 5. Returns the signature
 *
 * The signature can then be used to call `withdrawAppFees` on the Fee Diamond contract.
 * The Lit Action automatically retrieves the Chronicle Yellowstone RPC URL using Lit.Actions.getRpcUrl().
 *
 * IMPORTANT: This function generates the `issuedAt` timestamp and passes it to all Lit nodes.
 * This ensures all nodes sign the exact same message, which is required for signature combining.
 *
 * @param params - Parameters for signing the owner attestation
 * @returns Promise resolving to the signature and attestation data
 * @throws Error if the Lit Action execution fails or if ownership verification fails
 *
 * @example
 * ```typescript
 * const result = await signOwnerAttestation({
 *   litNodeClient,
 *   sessionSigs,
 *   pkpPublicKey: '0x...',
 *   appId: 12345,
 *   owner: '0x...',
 *   dstChainId: 84532, // Base Sepolia
 *   dstContract: '0x...', // Fee Diamond address
 *   litActionIpfsCid: 'Qm...',
 * });
 *
 * // Use the signature to withdraw fees
 * await feeAdminFacet.withdrawAppFees(
 *   result.attestation.appId,
 *   tokenAddress,
 *   result.attestation,
 *   result.signature,
 * );
 * ```
 */
export async function signOwnerAttestation({
  litNodeClient,
  sessionSigs,
  pkpPublicKey,
  appId,
  owner,
  dstChainId,
  dstContract,
  litActionIpfsCid,
  srcChainId = CHRONICLE_YELLOWSTONE_CHAIN_ID,
  srcContract = VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
}: SignOwnerAttestationParams): Promise<SignOwnerAttestationResult> {
  // Generate issuedAt timestamp here so all nodes use the same value
  // This is critical for signature combining across the 10 parallel Lit nodes
  const issuedAt = Math.floor(Date.now() / 1000);

  const result = await litNodeClient.executeJs({
    sessionSigs,
    ipfsId: litActionIpfsCid,
    jsParams: {
      srcChainId,
      srcContract,
      owner,
      appId,
      issuedAt,
      dstChainId,
      dstContract,
      pkpPublicKey,
    },
  });

  // Check for errors in the response
  if (!result.response) {
    throw new Error('No response from Lit Action');
  }

  const response = result.response as string;

  // Check if the response indicates an error
  if (response.startsWith('Error:')) {
    throw new Error(response);
  }

  try {
    const parsedResult = JSON.parse(response) as SignOwnerAttestationResult;
    return parsedResult;
  } catch (err) {
    throw new Error(`Failed to parse Lit Action response: ${response}`);
  }
}

/**
 * Gets the Base Sepolia Fee Diamond address from the contract address book
 */
export function getBaseSepoliaFeeDiamondAddress(): string {
  return VINCENT_CONTRACT_ADDRESS_BOOK.fee.baseSepolia.address;
}

/**
 * Gets the salt used to deploy the Base Sepolia Fee Diamond
 */
export function getBaseSepoliaFeeDiamondSalt(): string {
  return VINCENT_CONTRACT_ADDRESS_BOOK.fee.baseSepolia.salt;
}
