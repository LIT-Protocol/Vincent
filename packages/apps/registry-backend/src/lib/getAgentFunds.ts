import type {
  GetAgentFundsRequest,
  GetAgentFundsResponse,
} from '@lit-protocol/vincent-registry-sdk/dist/src/lib/schemas/agentFunds';

import { deriveAgentAddress } from '@lit-protocol/vincent-contracts-sdk';

import { env } from '../env';
import { getSmartAccountPublicClient } from './chainConfig';

export async function getAgentFunds(
  request: GetAgentFundsRequest & { appId: number },
): Promise<GetAgentFundsResponse> {
  const { appId, userControllerAddress, networks } = request;

  // Derive the agent smart account address (uses smart account chain)
  const smartAccountPublicClient = getSmartAccountPublicClient();
  const agentAddress = await deriveAgentAddress(
    smartAccountPublicClient,
    userControllerAddress,
    appId,
  );

  // Call Alchemy Portfolio API
  const alchemyUrl = `https://api.g.alchemy.com/data/v1/${env.ALCHEMY_API_KEY}/assets/tokens/by-address`;

  const response = await fetch(alchemyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      addresses: [
        {
          address: agentAddress,
          networks,
        },
      ],
      withMetadata: true,
      withPrices: true,
      includeNativeTokens: true,
      includeErc20Tokens: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[getAgentFunds] Alchemy API error:', errorText);
    throw new Error(`Alchemy API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    data: Pick<GetAgentFundsResponse, 'tokens' | 'pageKey'>;
  };

  return {
    agentAddress,
    tokens: data.data.tokens,
    pageKey: data.data.pageKey,
  };
}