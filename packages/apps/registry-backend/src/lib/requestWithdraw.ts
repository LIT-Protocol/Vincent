import { createPublicClient, http, encodeFunctionData, parseUnits, toHex } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import {
  createKernelAccount,
  createKernelAccountClient,
  addressToEmptyAccount,
} from '@zerodev/sdk';
import { KERNEL_V3_3, getEntryPoint } from '@zerodev/sdk/constants';
import { createZeroDevPaymasterClient } from '@zerodev/sdk';

import { deriveAgentAddress, deriveSmartAccountIndex } from '@lit-protocol/vincent-contracts-sdk';
import type {
  Asset,
  RequestWithdrawRequest,
  RequestWithdrawResponse,
} from '@lit-protocol/vincent-registry-sdk/src/lib/schemas/withdraw';

import { env } from '../env';

const entryPoint = getEntryPoint('0.7');
const kernelVersion = KERNEL_V3_3;

// ERC20 transfer function ABI
const ERC20_TRANSFER_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// Network configuration mapping
const NETWORK_CONFIG: Record<
  string,
  {
    chainId: number;
    chain: typeof base | typeof baseSepolia;
  }
> = {
  'base-mainnet': {
    chainId: 8453,
    chain: base,
  },
  'base-sepolia': {
    chainId: 84532,
    chain: baseSepolia,
  },
};

// Zero address constant for native token identification
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// Token info from Alchemy API response
interface AlchemyTokenInfo {
  address: string;
  network: string;
  tokenAddress: string;
  tokenBalance: string;
  tokenMetadata?: {
    decimals: number;
    name: string;
    symbol: string;
  };
}

interface AlchemyResponse {
  data: {
    tokens: AlchemyTokenInfo[];
  };
}

/**
 * Fetches token balances from Alchemy API for the agent address
 */
async function fetchAgentTokenBalances(
  agentAddress: string,
  networks: string[],
): Promise<AlchemyTokenInfo[]> {
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
      withPrices: false,
      includeNativeTokens: true,
      includeErc20Tokens: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[requestWithdraw] Alchemy API error:', errorText);
    throw new Error(`Alchemy API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as AlchemyResponse;
  return data.data.tokens;
}

/**
 * Groups assets by network for batched transactions
 */
function groupAssetsByNetwork(assets: Asset[]): Map<string, Asset[]> {
  const grouped = new Map<string, Asset[]>();
  for (const asset of assets) {
    const existing = grouped.get(asset.network) || [];
    existing.push(asset);
    grouped.set(asset.network, existing);
  }
  return grouped;
}

/**
 * Validates that the agent has sufficient balance for the requested withdrawal
 * and returns the token info with decimals
 */
function validateAndGetTokenInfo(
  asset: Asset,
  tokenBalances: AlchemyTokenInfo[],
): { decimals: number; rawBalance: bigint } {
  // Find matching token in balances (filter out null/undefined entries)
  const tokenInfo = tokenBalances.find(
    (t) =>
      t &&
      t.tokenAddress &&
      t.network === asset.network &&
      t.tokenAddress.toLowerCase() === asset.tokenAddress.toLowerCase(),
  );

  if (!tokenInfo) {
    throw new Error(
      `Token ${asset.tokenAddress} not found in agent balance on network ${asset.network}`,
    );
  }

  if (!tokenInfo.tokenMetadata) {
    throw new Error(
      `Token metadata not available for ${asset.tokenAddress} on network ${asset.network}`,
    );
  }

  const decimals = tokenInfo.tokenMetadata.decimals;
  const rawBalance = BigInt(tokenInfo.tokenBalance);
  const requestedRawAmount = parseUnits(asset.amount.toString(), decimals);

  if (rawBalance < requestedRawAmount) {
    const humanBalance = Number(rawBalance) / Math.pow(10, decimals);
    throw new Error(
      `Insufficient balance for ${tokenInfo.tokenMetadata.symbol} on ${asset.network}: ` +
        `requested ${asset.amount}, available ${humanBalance.toFixed(decimals)}`,
    );
  }

  return { decimals, rawBalance };
}

/**
 * Encodes an ERC20 transfer call
 */
function encodeErc20Transfer(to: string, amount: bigint): `0x${string}` {
  return encodeFunctionData({
    abi: ERC20_TRANSFER_ABI,
    functionName: 'transfer',
    args: [to as `0x${string}`, amount],
  });
}

/**
 * Builds transfer call data for the assets, validating balances.
 * Returns call objects for Kernel's encodeCalls.
 */
function buildTransferCalls(
  assets: Asset[],
  recipientAddress: string,
  tokenBalances: AlchemyTokenInfo[],
): { to: `0x${string}`; value: bigint; data: `0x${string}` }[] {
  const calls: { to: `0x${string}`; value: bigint; data: `0x${string}` }[] = [];

  for (const asset of assets) {
    if (asset.tokenAddress.toLowerCase() === ZERO_ADDRESS.toLowerCase()) {
      console.warn(
        `[requestWithdraw] Native token transfers not yet supported, skipping ${asset.amount} native tokens`,
      );
      continue;
    }

    // Validate balance and get decimals from Alchemy data
    const { decimals } = validateAndGetTokenInfo(asset, tokenBalances);
    const rawAmount = parseUnits(asset.amount.toString(), decimals);

    // Encode the ERC20 transfer call
    const transferCallData = encodeErc20Transfer(recipientAddress, rawAmount);

    calls.push({
      to: asset.tokenAddress as `0x${string}`,
      value: 0n,
      data: transferCallData,
    });
  }

  return calls;
}

/**
 * Converts a UserOperation to a serializable format with hex strings
 */
function serializeUserOp(userOp: Record<string, unknown>): Record<string, unknown> {
  const serialized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(userOp)) {
    if (typeof value === 'bigint') {
      serialized[key] = toHex(value);
    } else if (value !== undefined && value !== null) {
      serialized[key] = value;
    }
  }

  return serialized;
}

export async function requestWithdraw(
  request: RequestWithdrawRequest & { appId: number },
): Promise<RequestWithdrawResponse> {
  const { appId, userControllerAddress, assets } = request;

  console.log('[requestWithdraw] Processing withdrawal request:', {
    appId,
    userControllerAddress,
    assetCount: assets.length,
  });

  // Group assets by network
  const assetsByNetwork = groupAssetsByNetwork(assets);
  const networks = Array.from(assetsByNetwork.keys());

  // Get a public client for deriving agent address (use first supported network)
  const firstSupportedNetwork = networks.find((n) => NETWORK_CONFIG[n]);
  if (!firstSupportedNetwork) {
    throw new Error(
      `No supported networks in request. Supported: ${Object.keys(NETWORK_CONFIG).join(', ')}`,
    );
  }

  // Use ZeroDev transport for both RPC and bundler
  const zerodevTransport = http(env.ZERODEV_RPC_URL);

  const basePublicClient = createPublicClient({
    chain: NETWORK_CONFIG[firstSupportedNetwork].chain,
    transport: zerodevTransport,
  });

  // Derive agent address for this app and user
  const agentAddress = await deriveAgentAddress(basePublicClient, userControllerAddress, appId);

  console.log('[requestWithdraw] Agent address:', agentAddress);

  // Fetch token balances from Alchemy for all requested networks
  const tokenBalances = await fetchAgentTokenBalances(agentAddress, networks);

  console.log('[requestWithdraw] Fetched token balances:', {
    tokenCount: tokenBalances.length,
    networks,
  });

  const withdrawals: RequestWithdrawResponse['withdrawals'] = [];

  for (const [network, networkAssets] of assetsByNetwork) {
    const networkConfig = NETWORK_CONFIG[network];
    if (!networkConfig) {
      console.warn(`[requestWithdraw] Unsupported network: ${network}, skipping`);
      continue;
    }

    const chain = networkConfig.chain;

    const publicClient = createPublicClient({
      chain,
      transport: zerodevTransport,
    });

    console.log(`[requestWithdraw] Processing ${networkAssets.length} assets on ${network}`);

    // Build transfer calls, validating balances
    const calls = buildTransferCalls(
      networkAssets,
      userControllerAddress, // Withdraw to user's controller address
      tokenBalances,
    );

    if (calls.length === 0) {
      console.warn(`[requestWithdraw] No valid transfers for network ${network}`);
      continue;
    }

    // Create an empty account for the owner (we can't sign, but we can derive addresses and prepare UserOps)
    const ownerEmptyAccount = addressToEmptyAccount(userControllerAddress as `0x${string}`);

    // Create owner validator with the empty account
    const ownerValidator = await signerToEcdsaValidator(publicClient, {
      entryPoint,
      kernelVersion,
      signer: ownerEmptyAccount,
    });

    // Create/connect to the Kernel account at the derived address
    const smartAccountIndex = deriveSmartAccountIndex(appId);
    const kernelAccount = await createKernelAccount(publicClient, {
      entryPoint,
      kernelVersion,
      plugins: {
        sudo: ownerValidator,
      },
      address: agentAddress as `0x${string}`,
      index: smartAccountIndex,
    });

    // Create paymaster client
    const zerodevPaymaster = createZeroDevPaymasterClient({
      chain,
      transport: zerodevTransport,
    });

    // Create kernel client with paymaster
    const kernelClient = createKernelAccountClient({
      chain,
      account: kernelAccount,
      bundlerTransport: zerodevTransport,
      client: publicClient,
      paymaster: {
        getPaymasterData(userOperation) {
          return zerodevPaymaster.sponsorUserOperation({ userOperation });
        },
      },
    });

    // Prepare the UserOperation (batched if multiple transfers)
    console.log(`[requestWithdraw] Preparing UserOperation for ${calls.length} transfer(s)`);

    const userOp = await kernelClient.prepareUserOperation({
      callData: await kernelAccount.encodeCalls(calls),
    });

    // Serialize the UserOp for transmission (convert bigints to hex)
    const serializedUserOp = serializeUserOp(userOp as unknown as Record<string, unknown>);

    withdrawals.push({
      network,
      userOp: serializedUserOp,
    });
  }

  console.log(
    '[requestWithdraw] Generated withdrawal data for',
    withdrawals.length,
    'UserOperations',
  );

  return { withdrawals };
}
