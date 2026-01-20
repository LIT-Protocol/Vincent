import { env } from '../../env';

/**
 * Token info returned from Alchemy Portfolio API
 */
export interface AlchemyTokenInfo {
  address: string;
  network: string;
  tokenAddress: string;
  tokenBalance: string;
  tokenMetadata?: {
    decimals: number;
    logo: string | null;
    name: string;
    symbol: string;
  };
  tokenPrices?: Array<{
    currency: string;
    value: string;
    lastUpdatedAt: string;
  }>;
  error?: string | null;
}

interface AlchemyResponse {
  data: {
    tokens: AlchemyTokenInfo[];
    pageKey?: string;
  };
}

export interface FetchTokenBalancesOptions {
  /** Include price data in response (default: false) */
  withPrices?: boolean;
}

/**
 * Fetches token balances from Alchemy Portfolio API for a given address
 */
export async function fetchTokenBalances(
  address: string,
  networks: string[],
  options: FetchTokenBalancesOptions = {},
): Promise<{ tokens: AlchemyTokenInfo[]; pageKey?: string }> {
  const { withPrices = false } = options;

  const alchemyUrl = `https://api.g.alchemy.com/data/v1/${env.ALCHEMY_API_KEY}/assets/tokens/by-address`;

  const response = await fetch(alchemyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      addresses: [
        {
          address,
          networks,
        },
      ],
      withMetadata: true,
      withPrices,
      includeNativeTokens: true,
      includeErc20Tokens: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[alchemy] API error:', errorText);
    throw new Error(`Alchemy API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as AlchemyResponse;

  return {
    tokens: data.data.tokens,
    pageKey: data.data.pageKey,
  };
}
