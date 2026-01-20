import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import {
  createKernelAccount,
  createKernelAccountClient,
  addressToEmptyAccount,
  createZeroDevPaymasterClient,
} from '@zerodev/sdk';
import { KERNEL_V3_3, getEntryPoint } from '@zerodev/sdk/constants';
import {
  createPublicClient,
  http,
  encodeFunctionData,
  parseUnits,
  toHex,
  zeroAddress,
  erc20Abi,
} from 'viem';
import { getUserOperationHash, entryPoint07Address } from 'viem/account-abstraction';

import type {
  Asset,
  RequestWithdrawRequest,
  RequestWithdrawResponse,
} from '@lit-protocol/vincent-registry-sdk';

import { deriveAgentAddress, deriveSmartAccountIndex } from '@lit-protocol/vincent-contracts-sdk';

import type { AlchemyTokenInfo } from './utils/alchemy';

import { env } from '../env';
import { fetchTokenBalances } from './utils/alchemy';
import {
  SUPPORTED_NETWORKS,
  getChainForNetwork,
  getRpcUrlForNetwork,
  getBundlerUrlForNetwork,
} from './utils/chainConfig';

const entryPoint = getEntryPoint('0.7');
const kernelVersion = KERNEL_V3_3;

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
    abi: erc20Abi,
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
    // Validate balance and get decimals from Alchemy data
    const { decimals } = validateAndGetTokenInfo(asset, tokenBalances);
    const rawAmount = parseUnits(asset.amount.toString(), decimals);

    if (asset.tokenAddress.toLowerCase() === zeroAddress) {
      // Native token transfer - just set value, no contract call needed
      calls.push({
        to: recipientAddress as `0x${string}`,
        value: rawAmount,
        data: '0x' as `0x${string}`,
      });
      continue;
    }

    // ERC20 transfer - encode the transfer call
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

/**
 * Prepares unsigned UserOperations for withdrawing assets from an agent smart account.
 * Errors are not caught and will propagate to the caller (e.g., Alchemy API failures,
 * insufficient balance, ZeroDev SDK errors, bundler failures).
 * TODO: Add try/catch with better error context and logging.
 */
export async function requestWithdraw(
  request: RequestWithdrawRequest & { appId: number },
): Promise<RequestWithdrawResponse> {
  const { appId, userControllerAddress, assets } = request;

  const sponsorWithdrawalGas = env.SPONSOR_WITHDRAW_GAS;

  // ZeroDev bundler URL is always required for ERC-4337 operations
  if (!env.ZERODEV_BUNDLER_URL) {
    throw new Error('ZERODEV_BUNDLER_URL is required for withdrawal operations');
  }

  // Group assets by network
  const assetsByNetwork = groupAssetsByNetwork(assets);
  const networks = Array.from(assetsByNetwork.keys());

  // Validate that at least one network is supported
  const firstSupportedNetwork = networks.find((n) => n in SUPPORTED_NETWORKS);
  if (!firstSupportedNetwork) {
    throw new Error(
      `No supported networks in request. Supported: ${Object.keys(SUPPORTED_NETWORKS).join(', ')}`,
    );
  }

  // Use per-network Alchemy RPC for public client operations
  const basePublicClient = createPublicClient({
    chain: getChainForNetwork(firstSupportedNetwork).chain,
    transport: http(getRpcUrlForNetwork(firstSupportedNetwork)),
  });

  // Derive agent address for this app and user
  const agentAddress = await deriveAgentAddress(basePublicClient, userControllerAddress, appId);

  // Fetch token balances from Alchemy for all requested networks
  const { tokens: tokenBalances } = await fetchTokenBalances(agentAddress, networks);

  const withdrawals: RequestWithdrawResponse['withdrawals'] = [];
  const errors: { network: string; error: string }[] = [];

  for (const [network, networkAssets] of assetsByNetwork) {
    if (!(network in SUPPORTED_NETWORKS)) {
      errors.push({ network, error: `Unsupported network: ${network}` });
      continue;
    }

    try {
      const { chain } = getChainForNetwork(network);
      const networkRpcUrl = getRpcUrlForNetwork(network);
      const bundlerUrl = getBundlerUrlForNetwork(network);

      const publicClient = createPublicClient({
        chain,
        transport: http(networkRpcUrl),
      });

      // Build transfer calls, validating balances
      const calls = buildTransferCalls(
        networkAssets,
        userControllerAddress, // Withdraw to user's controller address
        tokenBalances,
      );

      if (calls.length === 0) {
        errors.push({ network, error: 'No valid transfers for this network' });
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

      // Configure paymaster only if gas sponsorship is enabled
      const paymasterConfig = sponsorWithdrawalGas
        ? {
            paymaster: {
              getPaymasterData(userOperation: unknown) {
                const zerodevPaymaster = createZeroDevPaymasterClient({
                  chain,
                  transport: http(bundlerUrl),
                });
                return zerodevPaymaster.sponsorUserOperation({
                  userOperation: userOperation as Parameters<
                    typeof zerodevPaymaster.sponsorUserOperation
                  >[0]['userOperation'],
                });
              },
            },
          }
        : {};

      // Create kernel client (with or without paymaster)
      const kernelClient = createKernelAccountClient({
        chain,
        account: kernelAccount,
        bundlerTransport: http(bundlerUrl),
        client: publicClient,
        ...paymasterConfig,
      });

      const userOp = await kernelClient.prepareUserOperation({
        callData: await kernelAccount.encodeCalls(calls),
      });

      // Compute the UserOp hash for signing
      const userOpHash = getUserOperationHash({
        chainId: chain.id,
        entryPointAddress: entryPoint07Address,
        entryPointVersion: '0.7',
        userOperation: userOp,
      });

      // Serialize the UserOp for transmission (convert bigints to hex)
      const serializedUserOp = serializeUserOp(userOp as unknown as Record<string, unknown>);

      withdrawals.push({
        network,
        userOp: serializedUserOp,
        userOpHash,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push({ network, error: errorMessage });
    }
  }

  // If all networks failed, throw an error
  if (withdrawals.length === 0 && errors.length > 0) {
    throw new Error(
      `All withdrawal requests failed: ${errors.map((e) => `${e.network}: ${e.error}`).join('; ')}`,
    );
  }

  return {
    withdrawals,
    ...(errors.length > 0 && { errors }),
  };
}
