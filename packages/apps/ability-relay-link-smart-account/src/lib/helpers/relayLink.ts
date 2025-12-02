import { Address, getAddress } from 'viem';
import { z } from 'zod';

/**
 * Relay.link API endpoints
 */
export const RELAY_LINK_API_MAINNET = 'https://api.relay.link';
export const RELAY_LINK_API_TESTNET = 'https://api.testnets.relay.link';

/**
 * Get the appropriate Relay.link API endpoint based on chain ID
 */
export function getRelayLinkApi(chainId: number): string {
  // Common testnets
  const testnets = [
    11155111, // Sepolia
    84532, // Base Sepolia
    421614, // Arbitrum Sepolia
    11155420, // Optimism Sepolia
    534351, // Scroll Sepolia
  ];

  return testnets.includes(chainId) ? RELAY_LINK_API_TESTNET : RELAY_LINK_API_MAINNET;
}

/**
 * Quote request parameters schema
 */
export const relayLinkQuoteParamsSchema = z.object({
  user: z.string().describe('Address depositing funds and submitting transactions'),
  originChainId: z.number().describe('Source chain identifier'),
  destinationChainId: z.number().describe('Target chain identifier'),
  originCurrency: z
    .string()
    .describe(
      'Token being sent (address or "0x0000000000000000000000000000000000000000" for native)',
    ),
  destinationCurrency: z
    .string()
    .describe(
      'Token being received (address or "0x0000000000000000000000000000000000000000" for native)',
    ),
  amount: z.string().describe('Amount to swap in smallest unit'),
  tradeType: z.enum(['EXACT_INPUT', 'EXACT_OUTPUT', 'EXPECTED_OUTPUT']).default('EXACT_INPUT'),
  recipient: z.string().optional().describe('Defaults to user address if unspecified'),
  slippageTolerance: z.number().optional().describe('Basis points (50 = 0.5%)'),
  topupGas: z.boolean().optional().describe('Include destination gas topup for recipient'),
  useReceiver: z
    .boolean()
    .optional()
    .default(true)
    .describe('Route payments via receiver contract'),
  appFees: z.number().optional().describe('Basis points charged for execution'),
  subsidizeFees: z.boolean().optional().describe('Sponsor pays associated fees'),
  protocolVersion: z.enum(['v1', 'v2', 'preferV2']).optional().default('preferV2'),
  userOperationGasOverhead: z
    .number()
    .optional()
    .describe('Additional gas overhead for ERC-4337 user operations vs EOA transactions'),
});

export type RelayLinkQuoteParams = z.infer<typeof relayLinkQuoteParamsSchema>;

/**
 * Execute request parameters schema
 */
export const relayLinkExecuteParamsSchema = z.object({
  executionKind: z.literal('rawCalls').default('rawCalls'),
  data: z.object({
    chainId: z.number().describe('EVM network identifier'),
    to: z.string().describe('Contract address to invoke'),
    data: z.string().describe('Encoded function call information'),
    value: z.string().describe('ETH amount in wei'),
    authorizationList: z
      .array(
        z.object({
          chainId: z.string(),
          address: z.string(),
          nonce: z.string(),
          yParity: z.number(),
          r: z.string(),
          s: z.string(),
        }),
      )
      .optional(),
  }),
  executionOptions: z.object({
    referrer: z.string().describe('Application identifier'),
    subsidizeFees: z.boolean().describe('Whether app sponsors gas costs'),
    destinationChainExecutionData: z
      .object({
        calls: z.array(z.unknown()).optional(),
        authorizationList: z.array(z.unknown()).optional(),
      })
      .optional(),
  }),
});

export type RelayLinkExecuteParams = z.infer<typeof relayLinkExecuteParamsSchema>;

/**
 * Get a quote from Relay.link
 */
export async function getRelayLinkQuote(
  params: RelayLinkQuoteParams,
  apiKey?: string,
): Promise<any> {
  const apiUrl = getRelayLinkApi(params.originChainId);
  const url = `${apiUrl}/quote`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Relay.link quote request failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Execute a transaction via Relay.link
 */
export async function executeRelayLinkTransaction(
  params: RelayLinkExecuteParams,
  apiKey: string,
): Promise<{ message: string; requestId: string }> {
  const apiUrl = getRelayLinkApi(params.data.chainId);
  const url = `${apiUrl}/execute`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Relay.link execute request failed: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return result as { message: string; requestId: string };
}

/**
 * Relay.link Receiver contract addresses per chain
 * These are the addresses that should be allowed as transaction targets
 * Source: Based on Relay documentation and on-chain verification
 * The Relay Receiver contract is deployed at the same address across multiple chains
 */
const RELAY_RECEIVER_ADDRESS = getAddress('0xa5f565650890fba1824ee0f21ebbbf660a179934');

/**
 * Alternative Relay.link execute address seen in quotes (for same-chain swaps)
 */
const RELAY_EXECUTE_ALT_ADDRESS = getAddress('0xf5042e6ffac5a625d4e7848e0b01373d8eb9e222');

export const RELAY_LINK_EXECUTE_ADDRESSES: Record<number, Address[]> = {
  // Mainnets
  1: [RELAY_RECEIVER_ADDRESS, RELAY_EXECUTE_ALT_ADDRESS], // Ethereum
  137: [RELAY_RECEIVER_ADDRESS, RELAY_EXECUTE_ALT_ADDRESS], // Polygon
  42161: [RELAY_RECEIVER_ADDRESS, RELAY_EXECUTE_ALT_ADDRESS], // Arbitrum
  10: [RELAY_RECEIVER_ADDRESS, RELAY_EXECUTE_ALT_ADDRESS], // Optimism
  8453: [
    RELAY_RECEIVER_ADDRESS,
    RELAY_EXECUTE_ALT_ADDRESS,
    getAddress('0x4cd00e387622c35bddb9b4c962c136462338bc31'),
  ], // Base (includes V2 depository)
  43114: [RELAY_RECEIVER_ADDRESS, RELAY_EXECUTE_ALT_ADDRESS], // Avalanche
  56: [RELAY_RECEIVER_ADDRESS, RELAY_EXECUTE_ALT_ADDRESS], // BNB Chain
  100: [RELAY_RECEIVER_ADDRESS, RELAY_EXECUTE_ALT_ADDRESS], // Gnosis
  534352: [RELAY_RECEIVER_ADDRESS, RELAY_EXECUTE_ALT_ADDRESS], // Scroll
  59144: [RELAY_RECEIVER_ADDRESS, RELAY_EXECUTE_ALT_ADDRESS], // Linea
  324: [RELAY_RECEIVER_ADDRESS, RELAY_EXECUTE_ALT_ADDRESS], // zkSync
  // Testnets
  11155111: [RELAY_RECEIVER_ADDRESS, RELAY_EXECUTE_ALT_ADDRESS], // Sepolia
  84532: [RELAY_RECEIVER_ADDRESS, RELAY_EXECUTE_ALT_ADDRESS], // Base Sepolia
  421614: [RELAY_RECEIVER_ADDRESS, RELAY_EXECUTE_ALT_ADDRESS], // Arbitrum Sepolia
  11155420: [RELAY_RECEIVER_ADDRESS, RELAY_EXECUTE_ALT_ADDRESS], // Optimism Sepolia
  534351: [RELAY_RECEIVER_ADDRESS, RELAY_EXECUTE_ALT_ADDRESS], // Scroll Sepolia
};

/**
 * Get Relay.link execute contract addresses for a specific chain
 */
export function getRelayLinkExecuteAddresses(chainId: number): Address[] {
  const addresses = RELAY_LINK_EXECUTE_ADDRESSES[chainId];
  if (!addresses) {
    throw new Error(
      `Relay.link execute address not configured for chain ${chainId}. Supported chains: ${Object.keys(RELAY_LINK_EXECUTE_ADDRESSES).join(', ')}`,
    );
  }
  return addresses;
}

/**
 * Get the primary Relay.link execute contract address for a specific chain
 */
export function getRelayLinkExecuteAddress(chainId: number): Address {
  const addresses = getRelayLinkExecuteAddresses(chainId);
  return addresses[0];
}

/**
 * Check if an address is a Relay.link execute contract
 */
export function isRelayLinkExecuteAddress(address: Address, chainId: number): boolean {
  try {
    const relayLinkAddresses = getRelayLinkExecuteAddresses(chainId);
    return relayLinkAddresses.some(
      (relayAddr) => address.toLowerCase() === relayAddr.toLowerCase(),
    );
  } catch {
    return false;
  }
}
