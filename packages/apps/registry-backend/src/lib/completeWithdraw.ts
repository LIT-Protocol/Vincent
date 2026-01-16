import type { Hex } from 'viem';
import { createPublicClient, http, hexToBigInt, toHex } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { entryPoint07Address } from 'viem/account-abstraction';

import type {
  CompleteWithdrawRequest,
  CompleteWithdrawResponse,
} from '@lit-protocol/vincent-registry-sdk/src/lib/schemas/withdraw';

import { env } from '../env';

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

interface SignedWithdrawal {
  network: string;
  userOp: Record<string, unknown>;
  signature: string;
}

// Deserialized UserOperation with bigint fields
interface DeserializedUserOp {
  sender: Hex;
  nonce: bigint;
  callData: Hex;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  signature: Hex;
  factory?: Hex;
  factoryData?: Hex;
  paymaster?: Hex;
  paymasterData?: Hex;
  paymasterVerificationGasLimit?: bigint;
  paymasterPostOpGasLimit?: bigint;
}

/**
 * Converts hex string values back to bigints for UserOperation fields
 */
function deserializeUserOp(serializedUserOp: Record<string, unknown>): DeserializedUserOp {
  const hexFields = [
    'nonce',
    'callGasLimit',
    'verificationGasLimit',
    'preVerificationGas',
    'maxFeePerGas',
    'maxPriorityFeePerGas',
    'paymasterVerificationGasLimit',
    'paymasterPostOpGasLimit',
  ];

  const deserialized: Record<string, unknown> = { ...serializedUserOp };

  for (const field of hexFields) {
    if (
      typeof deserialized[field] === 'string' &&
      (deserialized[field] as string).startsWith('0x')
    ) {
      deserialized[field] = hexToBigInt(deserialized[field] as Hex);
    }
  }

  return deserialized as unknown as DeserializedUserOp;
}

/**
 * Submits a single signed UserOperation to the ZeroDev bundler and waits for completion.
 * Uses viem's bundler actions directly instead of kernel client to avoid any modifications.
 */
async function submitWithdrawal(withdrawal: SignedWithdrawal): Promise<{
  network: string;
  transactionHash: string;
  userOpHash: string;
}> {
  const { network, userOp, signature } = withdrawal;

  const networkConfig = NETWORK_CONFIG[network];
  if (!networkConfig) {
    throw new Error(`Unsupported network: ${network}`);
  }

  console.log(`[completeWithdraw] Submitting withdrawal for network: ${network}`);

  const chain = networkConfig.chain;
  const zerodevTransport = http(env.ZERODEV_RPC_URL);

  // Create a public client for JSON-RPC calls
  const publicClient = createPublicClient({
    chain,
    transport: zerodevTransport,
  });

  // Deserialize the UserOp (convert hex strings back to bigints)
  const deserializedUserOp = deserializeUserOp(userOp);

  // For EntryPoint v0.7 with sudo mode, the signature is passed directly without prefix
  // The ZeroDev SDK's getSignatureData for v0.7 sudo mode just returns userOpSignature as-is
  const signedUserOp = {
    ...deserializedUserOp,
    signature: signature as Hex,
  };

  // Convert UserOp to hex strings for JSON-RPC
  const userOpForRpc = {
    sender: signedUserOp.sender,
    nonce: toHex(signedUserOp.nonce as bigint),
    callData: signedUserOp.callData,
    callGasLimit: toHex(signedUserOp.callGasLimit as bigint),
    verificationGasLimit: toHex(signedUserOp.verificationGasLimit as bigint),
    preVerificationGas: toHex(signedUserOp.preVerificationGas as bigint),
    maxFeePerGas: toHex(signedUserOp.maxFeePerGas as bigint),
    maxPriorityFeePerGas: toHex(signedUserOp.maxPriorityFeePerGas as bigint),
    signature: signedUserOp.signature,
    ...(signedUserOp.factory && { factory: signedUserOp.factory }),
    ...(signedUserOp.factoryData && { factoryData: signedUserOp.factoryData }),
    ...(signedUserOp.paymaster && { paymaster: signedUserOp.paymaster }),
    ...(signedUserOp.paymasterData && { paymasterData: signedUserOp.paymasterData }),
    ...(signedUserOp.paymasterVerificationGasLimit && {
      paymasterVerificationGasLimit: toHex(signedUserOp.paymasterVerificationGasLimit as bigint),
    }),
    ...(signedUserOp.paymasterPostOpGasLimit && {
      paymasterPostOpGasLimit: toHex(signedUserOp.paymasterPostOpGasLimit as bigint),
    }),
  };

  console.log(`[completeWithdraw] Broadcasting UserOp to ZeroDev bundler...`);

  // Submit the signed UserOperation directly via JSON-RPC
  const userOpHash = (await publicClient.request({
    method: 'eth_sendUserOperation' as any,
    params: [userOpForRpc, entryPoint07Address] as any,
  })) as Hex;
  console.log(`[completeWithdraw] UserOp hash: ${userOpHash}`);

  // Wait for the UserOperation to be included in a block
  console.log(`[completeWithdraw] Waiting for UserOp to be included in a block...`);

  // Poll for receipt using eth_getUserOperationReceipt
  let receipt = null;
  let attempts = 0;
  const maxAttempts = 60; // 60 attempts * 2 seconds = 2 minutes max wait

  while (!receipt && attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
    attempts++;

    try {
      receipt = await publicClient.request({
        method: 'eth_getUserOperationReceipt' as any,
        params: [userOpHash] as any,
      });
    } catch {
      // Receipt not available yet, continue polling
    }
  }

  if (!receipt) {
    throw new Error(`UserOp ${userOpHash} not confirmed after ${maxAttempts * 2} seconds`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const receiptData = receipt as any;
  const transactionHash = receiptData.receipt?.transactionHash || receiptData.transactionHash;

  console.log(`[completeWithdraw] ✅ UserOp executed successfully!`);
  console.log(`[completeWithdraw] Transaction hash: ${transactionHash}`);

  return {
    network,
    transactionHash,
    userOpHash,
  };
}

/**
 * Completes multiple withdrawal transactions by submitting signed UserOperations to the ZeroDev bundler.
 * Processes withdrawals sequentially to avoid rate limiting.
 */
export async function completeWithdraw(
  request: CompleteWithdrawRequest,
): Promise<CompleteWithdrawResponse> {
  const { withdrawals } = request;

  console.log('[completeWithdraw] Processing', withdrawals.length, 'withdrawals');

  const transactions: CompleteWithdrawResponse['transactions'] = [];
  const errors: { network: string; error: string }[] = [];

  // Process withdrawals sequentially to avoid bundler rate limiting
  for (const withdrawal of withdrawals) {
    try {
      const result = await submitWithdrawal(withdrawal as SignedWithdrawal);
      transactions.push({
        network: result.network,
        transactionHash: result.transactionHash,
        userOpHash: result.userOpHash,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        `[completeWithdraw] Failed to process withdrawal for ${withdrawal.network}:`,
        errorMessage,
      );
      errors.push({
        network: withdrawal.network,
        error: errorMessage,
      });
    }
  }

  // If all withdrawals failed, throw an error
  if (transactions.length === 0 && errors.length > 0) {
    throw new Error(
      `All withdrawals failed: ${errors.map((e) => `${e.network}: ${e.error}`).join('; ')}`,
    );
  }

  // Log any partial failures
  if (errors.length > 0) {
    console.warn('[completeWithdraw] Some withdrawals failed:', errors);
  }

  console.log('[completeWithdraw] Completed', transactions.length, 'withdrawals');

  return { transactions };
}
