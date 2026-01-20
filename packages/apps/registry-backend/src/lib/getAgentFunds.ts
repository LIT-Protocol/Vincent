import type {
  GetAgentFundsRequest,
  GetAgentFundsResponse,
} from '@lit-protocol/vincent-registry-sdk';

import { deriveAgentAddress } from '@lit-protocol/vincent-contracts-sdk';

import { fetchTokenBalances } from './utils/alchemy';
import { getBasePublicClient } from './utils/chainConfig';

export async function getAgentFunds(
  request: GetAgentFundsRequest & { appId: number },
): Promise<GetAgentFundsResponse> {
  const { appId, userControllerAddress, networks } = request;

  // Derive the agent smart account address
  const basePublicClient = getBasePublicClient();
  const agentAddress = await deriveAgentAddress(basePublicClient, userControllerAddress, appId);

  // Fetch token balances from Alchemy
  const { tokens, pageKey } = await fetchTokenBalances(agentAddress, networks, {
    withPrices: true,
  });

  return {
    agentAddress,
    tokens,
    pageKey,
  };
}
