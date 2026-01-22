import type { Chain, Hex } from 'viem';
import { createPublicClient, http, concat, encodeFunctionData } from 'viem';
import { getEntryPoint } from '@zerodev/sdk/constants';

const entryPoint = getEntryPoint('0.7');

export interface ZerodevTransaction {
  to: `0x${string}`;
  data: `0x${string}`;
  value: string;
}

export interface RelayTransactionToUserOpParams {
  transaction: {
    to: `0x${string}`;
    data: `0x${string}`;
    value: string;
    chainId: number;
    from: `0x${string}`;
  };
  chain: Chain;
  zerodevRpcUrl: string;
}

export interface TransactionsToZerodevUserOpParams {
  transactions: ZerodevTransaction[];
  chain: Chain;
  zerodevRpcUrl: string;
  sender: `0x${string}`;
}

export interface SubmitSignedUserOpParams {
  userOpSignature: Hex;
  userOp: Record<string, unknown>;
  chain: Chain;
  zerodevRpcUrl: string;
}

/**
 * Convert multiple transactions to a basic UserOperation structure.
 * This creates a minimal UserOp that will be combined with permission account data
 * inside the Lit Action before signing.
 *
 * NOTE: This does NOT include the permission account deserialization - that happens
 * inside the Lit Action to reduce payload size.
 */
export async function transactionsToZerodevUserOp(
  params: TransactionsToZerodevUserOpParams,
): Promise<Record<string, unknown>> {
  const { transactions, chain, zerodevRpcUrl, sender } = params;

  const publicClient = createPublicClient({
    chain,
    transport: http(zerodevRpcUrl),
  });

  // Encode the call data for the transactions
  // For single transaction, it's just the call data
  // For multiple transactions, we need to batch them
  let callData: Hex;
  if (transactions.length === 1) {
    callData = transactions[0].data;
  } else {
    // For batch calls, encode as executeBatch
    const executeBatchAbi = [
      {
        name: 'executeBatch',
        type: 'function',
        inputs: [
          {
            name: 'calls',
            type: 'tuple[]',
            components: [
              { name: 'to', type: 'address' },
              { name: 'value', type: 'uint256' },
              { name: 'data', type: 'bytes' },
            ],
          },
        ],
        outputs: [],
      },
    ] as const;

    callData = encodeFunctionData({
      abi: executeBatchAbi,
      functionName: 'executeBatch',
      args: [
        transactions.map((tx) => ({
          to: tx.to,
          value: BigInt(tx.value || '0'),
          data: tx.data,
        })),
      ],
    });
  }

  // Estimate gas for the UserOp via bundler
  const gasEstimates = await publicClient.request({
    method: 'eth_estimateUserOperationGas',
    params: [
      {
        sender,
        callData,
        signature: '0x' as Hex, // Dummy signature for gas estimation
      },
      entryPoint.address,
    ],
  } as any);

  return {
    sender,
    nonce: '0x0', // Will be filled by bundler
    callData,
    ...(gasEstimates as object),
  } as Record<string, unknown>;
}

/**
 * Convert a Relay.link transaction to a UserOperation for smart account execution.
 * This is a convenience wrapper around transactionsToZerodevUserOp for single transactions.
 */
export async function relayTransactionToUserOp(
  params: RelayTransactionToUserOpParams,
): Promise<Record<string, unknown>> {
  const { transaction, chain, zerodevRpcUrl } = params;

  return transactionsToZerodevUserOp({
    transactions: [
      {
        to: transaction.to,
        data: transaction.data,
        value: transaction.value,
      },
    ],
    chain,
    zerodevRpcUrl,
    sender: transaction.from,
  });
}

/**
 * Submit a signed UserOperation to the ZeroDev bundler.
 *
 * This follows the Kernel v3 signature format:
 * - The signature is prefixed with 0xff to indicate "raw signature mode"
 * - This tells the Kernel account to use the signature as-is without additional processing
 *
 * IMPORTANT: This function submits an already-signed UserOp directly to the bundler
 * via eth_sendUserOperation RPC call. We do NOT need to deserialize the permission
 * account because the UserOp is already fully signed by the PKP.
 *
 * Returns both the UserOp hash and the transaction hash once mined.
 */
export async function submitSignedUserOp(
  params: SubmitSignedUserOpParams,
): Promise<{ userOpHash: Hex; transactionHash: Hex }> {
  const { userOpSignature, userOp, chain, zerodevRpcUrl } = params;

  // Create ZeroDev transport for bundler
  const zerodevTransport = http(zerodevRpcUrl);

  // Create public client for the bundler RPC
  const publicClient = createPublicClient({
    chain,
    transport: zerodevTransport,
  });

  // Add signature to UserOp with 0xff prefix for permission validator
  // Permission validators require the 0xff prefix to identify the signature type
  // See: @zerodev/permissions/toPermissionValidator.ts signUserOperation method
  const signedUserOp = {
    ...userOp,
    signature: concat(['0xff', userOpSignature]),
  };

  console.log('[submitSignedUserOp] Broadcasting UserOp to ZeroDev bundler...');

  // Submit UserOp directly via eth_sendUserOperation RPC
  // Format: eth_sendUserOperation(userOp, entryPoint address)
  const userOpHash = await publicClient.request({
    method: 'eth_sendUserOperation',
    params: [signedUserOp, entryPoint.address],
  } as any);

  console.log(`[submitSignedUserOp] UserOp hash: ${userOpHash}`);

  console.log('[submitSignedUserOp] Waiting for UserOp to be included in a block...');

  // Poll for UserOp receipt
  let receipt: any;
  let attempts = 0;
  const maxAttempts = 60; // 60 attempts * 2s = 2 minutes max wait

  while (!receipt && attempts < maxAttempts) {
    try {
      receipt = await publicClient.request({
        method: 'eth_getUserOperationReceipt',
        params: [userOpHash],
      } as any);

      if (!receipt) {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s between polls
        attempts++;
      }
    } catch (error) {
      // Receipt not found yet, continue polling
      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;
    }
  }

  if (!receipt) {
    throw new Error(`UserOp receipt not found after ${maxAttempts} attempts`);
  }

  console.log('[submitSignedUserOp] ✅ UserOp executed successfully!');
  console.log(`[submitSignedUserOp] Transaction hash: ${receipt.receipt.transactionHash}`);

  return {
    userOpHash: userOpHash as Hex,
    transactionHash: receipt.receipt.transactionHash,
  };
}
