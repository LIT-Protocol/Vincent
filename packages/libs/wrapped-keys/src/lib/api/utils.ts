import { ethers } from 'ethers';

import type { AuthSig, SessionSigsMap, AccsEVMParams } from '@lit-protocol/types';

import { LIT_RPC } from '@lit-protocol/constants';
import {
  VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
  getPkpTokenId,
} from '@lit-protocol/vincent-contracts-sdk';
import { COMBINED_ABI } from '@lit-protocol/vincent-contracts-sdk/src/constants';

import type { KeyType, Network } from '../types';

import { CHAIN_YELLOWSTONE, NETWORK_SOLANA } from '../constants';

/**
 * Returns the key type for the given network
 *
 * @param network - The network to get the key type for
 * @returns The key type for the given network
 */
export function getKeyTypeFromNetwork(network: Network): KeyType {
  switch (network) {
    case NETWORK_SOLANA:
      return 'ed25519';
    default:
      throw new Error(`Network not implemented ${network}`);
  }
}

/**
 *
 * Extracts the first SessionSig from the SessionSigsMap since we only pass a single SessionSig to the AWS endpoint
 *
 * @param pkpSessionSigs - The PKP sessionSigs (map) used to associate the PKP with the generated private key
 *
 * @returns { AuthSig } - The first SessionSig from the map
 */
export function getFirstSessionSig(pkpSessionSigs: SessionSigsMap): AuthSig {
  const sessionSigsEntries = Object.entries(pkpSessionSigs);

  if (sessionSigsEntries.length === 0) {
    throw new Error(`Invalid pkpSessionSigs, length zero: ${JSON.stringify(pkpSessionSigs)}`);
  }

  const [[, sessionSig]] = sessionSigsEntries;
  return sessionSig;
}

/**
 * Creates access control condition to validate Vincent delegatee authorization
 * via the Vincent registry contract's validateAbilityExecutionAndGetPolicies method
 *
 * This function creates an ACC utilize the Vincent Delegatee's address derived from the inner Auth Sig of the provided Session Signatures,
 * the Agent Wallet's PKP token ID derived from the provided Agent Wallet's address, and the IPFS CID of the executing Lit Action.
 *
 * @returns AccsEVMParams - Access control condition for Vincent registry validation
 */
export async function getVincentRegistryAccessControlCondition({
  agentWalletAddress,
}: {
  agentWalletAddress: string;
}): Promise<AccsEVMParams> {
  if (!ethers.utils.isAddress(agentWalletAddress)) {
    throw new Error(`agentWalletAddress is not a valid Ethereum Address: ${agentWalletAddress}`);
  }

  const agentPkpTokenId = await getPkpTokenId({
    pkpEthAddress: agentWalletAddress,
    signer: ethers.Wallet.createRandom().connect(
      new ethers.providers.StaticJsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE),
    ),
  });

  let functionAbi: {
    name: string;
    type?: string;
    stateMutability: string;
    constant?: boolean;
    inputs: {
      name: string;
      type: string;
      internalType?: string;
    }[];
    outputs: {
      name: string;
      type: string;
      internalType?: string;
    }[];
  };
  try {
    const functionFragment = COMBINED_ABI.getFunction('validateAbilityExecutionAndGetPolicies');
    functionAbi = JSON.parse(functionFragment.format('json'));
  } catch (error) {
    throw new Error(
      `There was an error getting the validateAbilityExecutionAndGetPolicies function ABI: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return {
    contractAddress: VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
    functionAbi,
    chain: CHAIN_YELLOWSTONE,
    functionName: 'validateAbilityExecutionAndGetPolicies',
    functionParams: [':userAddress', agentPkpTokenId.toString(), ':currentActionIpfsCid'],
    returnValueTest: {
      key: 'isValid',
      comparator: '=',
      value: 'true',
    },
  };
}
