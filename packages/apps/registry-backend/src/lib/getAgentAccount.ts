import { getKernelAddressFromECDSA } from '@zerodev/ecdsa-validator';
import { constants } from '@zerodev/sdk';
import { ethers, providers } from 'ethers';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

import {
  COMBINED_ABI,
  deriveSmartAccountIndex,
  VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
} from '@lit-protocol/vincent-contracts-sdk';

import { env } from '../env';

function getProvider(): providers.JsonRpcProvider {
  return new providers.JsonRpcProvider(env.LIT_TXSENDER_RPC_URL);
}

function getVincentContract(): ethers.Contract {
  const provider = getProvider();
  return new ethers.Contract(VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD, COMBINED_ABI, provider);
}

export async function getAgentAccount(request: {
  appId: number;
  userControllerAddress: string;
}): Promise<string | null> {
  const { appId, userControllerAddress } = request;

  const publicClient = createPublicClient({
    chain: base,
    transport: http(),
  });

  const agentAddress = await getKernelAddressFromECDSA({
    publicClient: publicClient as any,
    eoaAddress: userControllerAddress as `0x${string}`,
    index: deriveSmartAccountIndex(appId),
    entryPoint: constants.getEntryPoint('0.7'),
    kernelVersion: constants.KERNEL_V3_1,
  });

  // Verify the agent exists in Vincent contracts
  const contract = getVincentContract();
  try {
    await contract.getUserAddressForAgent(agentAddress);
    return agentAddress;
  } catch (error: unknown) {
    const errorMessage = (error as Error).message || String(error);
    if (errorMessage.includes('AgentNotRegistered')) {
      console.log('[getAgentAccount] Agent not registered');
      return null;
    }
    throw error;
  }
}
