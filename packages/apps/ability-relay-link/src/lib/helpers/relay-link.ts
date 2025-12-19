import { Address, getAddress } from 'viem';
import {
  createClient,
  fetchChainConfigs,
  MAINNET_RELAY_API,
  TESTNET_RELAY_API,
  type Execute,
} from '@relayprotocol/relay-sdk';

/**
 * Relay SDK client instance (lazy initialized)
 */
let mainnetClient: ReturnType<typeof createClient> | null = null;
let testnetClient: ReturnType<typeof createClient> | null = null;

/**
 * Get or create the Relay SDK client for mainnet
 */
function getMainnetClient() {
  if (!mainnetClient) {
    mainnetClient = createClient({
      baseApiUrl: MAINNET_RELAY_API,
      source: 'vincent',
    });
  }
  return mainnetClient;
}

/**
 * Get or create the Relay SDK client for testnet
 */
function getTestnetClient() {
  if (!testnetClient) {
    testnetClient = createClient({
      baseApiUrl: TESTNET_RELAY_API,
      source: 'vincent',
    });
  }
  return testnetClient;
}

/**
 * Known testnet chain IDs supported by Relay
 * Source: https://api.testnets.relay.link/chains
 */
const RELAY_TESTNETS = new Set([
  919, // Mode Testnet
  1301, // Unichain Sepolia
  1337, // Hyperliquid Testnet
  11011, // Shape Sepolia
  11124, // Abstract Testnet
  17069, // Garnet (Redstone)
  80002, // Polygon Amoy
  84532, // Base Sepolia
  421614, // Arbitrum Sepolia
  695569, // Pyrope
  1118190, // Eclipse Testnet
  9092725, // Bitcoin Testnet4
  11155111, // Sepolia
  11155420, // Optimism Sepolia
  845320008, // Lordchain Testnet
  1936682084, // Solana Devnet
]);

/**
 * Check if a chain ID is a testnet
 */
export function isTestnet(chainId: number): boolean {
  return RELAY_TESTNETS.has(chainId);
}

/**
 * Get the appropriate Relay SDK client based on chain ID
 */
export function getRelayClient(chainId: number) {
  return isTestnet(chainId) ? getTestnetClient() : getMainnetClient();
}

/**
 * Quote request parameters (matching SDK's getQuote parameters)
 */
export interface RelayLinkQuoteParams {
  user: string;
  originChainId: number;
  destinationChainId: number;
  originCurrency: string;
  destinationCurrency: string;
  amount: string;
  tradeType?: 'EXACT_INPUT' | 'EXACT_OUTPUT' | 'EXPECTED_OUTPUT';
  recipient?: string;
  slippageTolerance?: number;
  topupGas?: boolean;
  useReceiver?: boolean;
  appFees?: number;
  subsidizeFees?: boolean;
  protocolVersion?: 'v1' | 'v2' | 'preferV2';
  userOperationGasOverhead?: number;
}

/**
 * Quote response type from SDK
 */
export type RelayLinkQuoteResponse = Execute;

/**
 * Transaction data from quote response steps
 */
export interface RelayLinkTransactionData {
  from: string;
  to: string;
  data: string;
  value: string;
  chainId: number;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  gas?: string;
}

/**
 * Get a quote from Relay.link using the SDK
 */
export async function getRelayLinkQuote(
  params: RelayLinkQuoteParams,
): Promise<RelayLinkQuoteResponse> {
  const client = getRelayClient(params.originChainId);

  const quote = await client.actions.getQuote({
    chainId: params.originChainId,
    toChainId: params.destinationChainId,
    currency: params.originCurrency,
    toCurrency: params.destinationCurrency,
    amount: params.amount,
    tradeType: params.tradeType || 'EXACT_INPUT',
    recipient: params.recipient || params.user, // Default to user if recipient not specified
    user: params.user,
  });

  return quote;
}

/**
 * Contracts structure from Relay chain config
 */
interface RelayContracts {
  relayReceiver?: string;
  erc20Router?: string;
  approvalProxy?: string;
  v3?: {
    erc20Router?: string;
    approvalProxy?: string;
  };
}

/**
 * Protocol structure from Relay chain config
 */
interface RelayProtocol {
  v2?: {
    depository?: string;
  };
}

/**
 * Extended chain config with contracts (the SDK type doesn't include this)
 */
interface RelayChainWithContracts {
  id: number;
  contracts?: RelayContracts;
  protocol?: RelayProtocol;
}

/**
 * Fetch Relay.link contract addresses for a specific chain using the SDK
 */
export async function fetchRelayLinkAddresses(chainId: number): Promise<Address[]> {
  const apiUrl = isTestnet(chainId) ? TESTNET_RELAY_API : MAINNET_RELAY_API;

  // fetchChainConfigs returns RelayChain[] but the actual API response includes contracts
  const chains = (await fetchChainConfigs(apiUrl)) as unknown as RelayChainWithContracts[];
  const chainInfo = chains.find((c) => c.id === chainId);

  if (!chainInfo) {
    throw new Error(`Chain ${chainId} not found in Relay API response`);
  }

  // Collect all relevant contract addresses
  const addresses: Address[] = [];
  const contracts = chainInfo.contracts;
  const protocol = chainInfo.protocol;

  if (contracts) {
    // Top-level contracts
    if (contracts.relayReceiver) {
      addresses.push(getAddress(contracts.relayReceiver));
    }
    if (contracts.erc20Router) {
      addresses.push(getAddress(contracts.erc20Router));
    }
    if (contracts.approvalProxy) {
      addresses.push(getAddress(contracts.approvalProxy));
    }

    // V3 contracts
    if (contracts.v3?.erc20Router) {
      addresses.push(getAddress(contracts.v3.erc20Router));
    }
    if (contracts.v3?.approvalProxy) {
      addresses.push(getAddress(contracts.v3.approvalProxy));
    }
  }

  // V2 protocol depository
  if (protocol?.v2?.depository) {
    addresses.push(getAddress(protocol.v2.depository));
  }

  if (addresses.length === 0) {
    throw new Error(`No Relay contract addresses found for chain ${chainId}`);
  }

  return addresses;
}

/**
 * Check if an address is a Relay.link contract (async - fetches from API)
 */
export async function isRelayLinkAddress(address: Address, chainId: number): Promise<boolean> {
  try {
    const relayAddresses = await fetchRelayLinkAddresses(chainId);
    return relayAddresses.some((relayAddr) => address.toLowerCase() === relayAddr.toLowerCase());
  } catch {
    return false;
  }
}
