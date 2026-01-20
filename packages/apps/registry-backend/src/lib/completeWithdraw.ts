import type { Hex } from 'viem';
import { createPublicClient, http } from 'viem';
import { entryPoint07Address } from 'viem/account-abstraction';

import type {
  CompleteWithdrawRequest,
  CompleteWithdrawResponse,
  SignedWithdrawal,
} from '@lit-protocol/vincent-registry-sdk';

import { getChainForNetwork, getBundlerUrlForNetwork } from './utils/chainConfig';

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 5; // 5 attempts * 3 seconds = 15s max wait

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
  const { chain } = getChainForNetwork(network);
  const bundlerUrl = getBundlerUrlForNetwork(network);

  const publicClient = createPublicClient({
    chain,
    transport: http(bundlerUrl),
  });

  // UserOp is already serialized as hex strings from requestWithdraw
  // Just add the user's signature
  const userOpForRpc = {
    ...userOp,
    signature,
  };

  // Submit the signed UserOperation to the bundler
  const userOpHash = (await publicClient.request({
    method: 'eth_sendUserOperation' as any,
    params: [userOpForRpc, entryPoint07Address] as any,
  })) as Hex;

  // Poll for receipt until confirmed
  let receipt = null;
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    try {
      receipt = await publicClient.request({
        method: 'eth_getUserOperationReceipt' as any,
        params: [userOpHash] as any,
      });
      if (receipt) break;
    } catch {
      // Receipt not available yet, continue polling
    }
  }

  if (!receipt) {
    const timeoutSeconds = (MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000;
    throw new Error(`UserOp ${userOpHash} not confirmed after ${timeoutSeconds} seconds`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const receiptData = receipt as any;
  const transactionHash = receiptData.receipt?.transactionHash || receiptData.transactionHash;

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
  const transactions: CompleteWithdrawResponse['transactions'] = [];
  const errors: { network: string; error: string }[] = [];

  // Process withdrawals sequentially to avoid bundler rate limiting
  for (const withdrawal of withdrawals) {
    try {
      const result = await submitWithdrawal(withdrawal);
      transactions.push({
        network: result.network,
        transactionHash: result.transactionHash,
        userOpHash: result.userOpHash,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
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

  return {
    transactions,
    ...(errors.length > 0 && { errors }),
  };
}
