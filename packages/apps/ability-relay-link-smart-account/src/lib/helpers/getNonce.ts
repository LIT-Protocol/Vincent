import { Address, Hex } from 'viem';

export interface GetNonceParams {
  rpcUrl: string;
  address: Address;
}

/**
 * Fetches the current transaction nonce for an address from the blockchain
 */
export async function getNonce({ rpcUrl, address }: GetNonceParams): Promise<Hex> {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getTransactionCount',
      params: [address, 'latest'],
    }),
  });

  const result = (await response.json()) as { result: Hex };
  return result.result;
}
