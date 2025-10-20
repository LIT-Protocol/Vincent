import { ethers } from 'ethers';

import type { AuthSig, SessionSigsMap, AccsEVMParams } from '@lit-protocol/types';

import { LIT_RPC } from '@lit-protocol/constants';
import {
  VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
  getPkpTokenId,
  COMBINED_ABI,
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
 * the delegator's PKP token ID derived from the provided delegator's address, and the IPFS CID of the executing Lit Action.
 *
 * @returns AccsEVMParams - Access control condition for Vincent registry validation
 */
export async function getVincentRegistryAccessControlCondition({
  delegatorAddress,
}: {
  delegatorAddress: string;
}): Promise<AccsEVMParams> {
  if (!ethers.utils.isAddress(delegatorAddress)) {
    throw new Error(`delegatorAddress is not a valid Ethereum Address: ${delegatorAddress}`);
  }

  const delegatorPkpTokenId = (
    await getPkpTokenId({
      pkpEthAddress: delegatorAddress,
      signer: ethers.Wallet.createRandom().connect(
        new ethers.providers.StaticJsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE),
      ),
    })
  ).toString();

  const contractInterface = new ethers.utils.Interface(COMBINED_ABI.fragments);
  const fragment = contractInterface.getFunction('isDelegateePermitted');

  const functionAbi = {
    type: 'function',
    name: fragment.name,
    inputs: fragment.inputs.map((input) => ({
      name: input.name,
      type: input.type,
    })),
    outputs: fragment.outputs?.map((output) => ({
      name: output.name,
      type: output.type,
    })),
    stateMutability: fragment.stateMutability,
  };

  return {
    contractAddress: VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
    functionAbi,
    chain: CHAIN_YELLOWSTONE,
    functionName: 'isDelegateePermitted',
    functionParams: [':userAddress', delegatorPkpTokenId, ':currentActionIpfsId'],
    returnValueTest: {
      key: 'isPermitted',
      comparator: '=',
      value: 'true',
    },
  };
}
