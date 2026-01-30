import type { Hex } from 'viem';

import { http } from 'viem';
import { createBundlerClient, entryPoint07Address } from 'viem/account-abstraction';

import type {
  CompleteWithdrawRequest,
  CompleteWithdrawResponse,
  SignedWithdrawal,
} from '@lit-protocol/vincent-registry-sdk';

import { getZerodevBundlerRpcUrl } from './getZerodevBundlerRpcUrl';
import { getChainForNetwork } from './utils/chainConfig';

/**
 * Submits a single signed UserOperation to the ZeroDev bundler and waits for completion.
 * Uses viem's bundler client for proper receipt waiting.
 */
async function submitWithdrawal(withdrawal: SignedWithdrawal): Promise<{
  network: string;
  transactionHash: string;
  userOpHash: string;
}> {
  const { network, userOp, signature } = withdrawal;
  const { chain, chainId } = getChainForNetwork(network);
  const bundlerUrl = getZerodevBundlerRpcUrl(chainId);

  const bundlerClient = createBundlerClient({
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
  const userOpHash = (await bundlerClient.request({
    method: 'eth_sendUserOperation' as any,
    params: [userOpForRpc, entryPoint07Address] as any,
  })) as Hex;

  // Wait for the UserOperation receipt
  const receipt = await bundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  return {
    network,
    transactionHash: receipt.receipt.transactionHash,
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
