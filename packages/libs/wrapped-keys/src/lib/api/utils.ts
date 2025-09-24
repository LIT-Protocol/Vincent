import { ethers } from 'ethers';

import type { AuthSig, SessionSigsMap, AccsEVMParams } from '@lit-protocol/types';

import { LIT_RPC } from '@lit-protocol/constants';
import {
  VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
  getPkpTokenId,
} from '@lit-protocol/vincent-contracts-sdk';

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
 * via the Vincent registry contract's isDelegateePermitted method
 *
 * This function creates an ACC utilize the Vincent Delegatee's address derived from the inner Auth Sig of the provided Session Signatures,
 * the Agent Wallet's PKP token ID derived from the provided Agent Wallet's address, and the IPFS CID of the executing Lit Action.
 *
 * @returns AccsEVMParams - Access control condition for Vincent registry validation
 */
export async function getVincentRegistryAccessControlCondition({
  agentWalletAddress,
  agentWalletPkpTokenId,
}: {
  agentWalletAddress?: string;
  agentWalletPkpTokenId?: string;
}): Promise<AccsEVMParams> {
  let agentPkpTokenId = agentWalletPkpTokenId;

  if (agentWalletAddress) {
    if (!ethers.utils.isAddress(agentWalletAddress)) {
      throw new Error(`agentWalletAddress is not a valid Ethereum Address: ${agentWalletAddress}`);
    }

    agentPkpTokenId = (
      await getPkpTokenId({
        pkpEthAddress: agentWalletAddress,
        signer: ethers.Wallet.createRandom().connect(
          new ethers.providers.StaticJsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE),
        ),
      })
    ).toString();
  }

  if (!agentPkpTokenId) {
    throw new Error(
      'The agent wallet address or PKP token ID is required to create an access control conditions',
    );
  }

  const functionAbi = {
    type: 'function',
    name: 'isDelegateePermitted',
    inputs: [
      {
        name: 'delegatee',
        type: 'address',
      },
      {
        name: 'pkpTokenId',
        type: 'uint256',
      },
      {
        name: 'abilityIpfsCid',
        type: 'string',
      },
    ],
    outputs: [
      {
        name: 'isPermitted',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
  };

  return {
    contractAddress: VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
    functionAbi,
    chain: CHAIN_YELLOWSTONE,
    functionName: 'isDelegateePermitted',
    functionParams: [':userAddress', agentPkpTokenId, ':currentActionIpfsId'],
    returnValueTest: {
      key: 'isPermitted',
      comparator: '=',
      value: 'true',
    },
  };
}
