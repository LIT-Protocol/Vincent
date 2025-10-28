import { ethers } from 'ethers';

import type { AccsEVMParams, EvmContractConditions } from '@lit-protocol/types';

import { LIT_NETWORK, LIT_RPC } from '@lit-protocol/constants';
import { LitContracts } from '@lit-protocol/contracts-sdk';

import { COMBINED_ABI, VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD } from '../../constants';
import { getPkpTokenId } from '../../utils/pkpInfo';

const CHAIN_YELLOWSTONE = 'yellowstone' as const;

/**
 * Creates access control condition to validate Vincent delegatee and platform user authorization
 * via the Vincent registry contract's isDelegateePermitted method and the PKP NFT contract's ownerOf method
 *
 * Creates access control conditions for both the delegatee and the platform user.
 * Delegatee authorization is validated by the Vincent registry contract's isDelegateePermitted method.
 * Platform user authorization is validated by validating the owner of the delegator PKP token is the requester by checking
 * the Lit PKP NFT contract's ownerOf method.
 *
 * @param delegatorAddress - The address of the delegator
 *
 * @returns EvmContractConditions - Access control conditions authorizing a valid delegatee OR a platform user that is the owner of the delegator's PKP token
 */
export async function getVincentWrappedKeysAccs({
  delegatorAddress,
}: {
  delegatorAddress: string;
}): Promise<EvmContractConditions> {
  if (!ethers.utils.isAddress(delegatorAddress)) {
    throw new Error(`delegatorAddress is not a valid Ethereum Address: ${delegatorAddress}`);
  }

  const delegatorPkpTokenId = (
    await getPkpTokenId({
      pkpEthAddress: delegatorAddress,
      signer: ethers.Wallet.createRandom().connect(
        new ethers.providers.StaticJsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE),
      ), // Read only; signer identity is irrelevant in this code path :),
    })
  ).toString();

  return Promise.all([
    getDelegateeAccessControlConditions({
      delegatorPkpTokenId,
    }),
    Promise.resolve({ operator: 'or' }),
    getPlatformUserAccessControlConditions({
      delegatorPkpTokenId,
    }),
  ]);
}

async function getDelegateeAccessControlConditions({
  delegatorPkpTokenId,
}: {
  delegatorPkpTokenId: string;
}): Promise<AccsEVMParams> {
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
    chain: CHAIN_YELLOWSTONE,
    functionAbi,
    functionName: 'isDelegateePermitted',
    functionParams: [':userAddress', delegatorPkpTokenId, ':currentActionIpfsId'],
    returnValueTest: {
      key: 'isPermitted',
      comparator: '=',
      value: 'true',
    },
  };
}

/**
 * Delegated wrapped keys access control condition is 'the owner of the PKP may decrypt this'
 * - e.g. the Vincent 'user PKP' can decrypt the wrapped keys for all of their agent PKPs
 *
 * This contrasts from the original wrapped keys access control condition, which was 'the PKP itself may decrypt this'
 *
 * @param delegatorPkpTokenId
 */
async function getPlatformUserAccessControlConditions({
  delegatorPkpTokenId,
}: {
  delegatorPkpTokenId: string;
}): Promise<AccsEVMParams> {
  const contractAddresses = await LitContracts.getContractAddresses(
    LIT_NETWORK.Datil,
    new ethers.providers.StaticJsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE),
  );

  const pkpNftContractInfo: { address: string; abi: any[] } = contractAddresses.PKPNFT;
  if (!pkpNftContractInfo) {
    throw new Error('PKP NFT contract address not found for Datil network');
  }

  return {
    contractAddress: pkpNftContractInfo.address,
    chain: CHAIN_YELLOWSTONE,
    functionAbi: {
      type: 'function',
      name: 'ownerOf',
      inputs: [
        {
          name: 'tokenId',
          type: 'uint256',
        },
      ],
      outputs: [
        {
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
    },
    functionName: 'ownerOf',
    functionParams: [delegatorPkpTokenId],
    returnValueTest: {
      key: '',
      comparator: '=',
      value: ':userAddress',
    },
  };
}
