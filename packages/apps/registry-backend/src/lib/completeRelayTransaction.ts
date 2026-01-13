import type { ConcurrentPayloadToSign } from '@gelatonetwork/relay-sdk/dist/lib/erc2771/types';

import { GelatoRelay } from '@gelatonetwork/relay-sdk';

import { env } from '../env';

const relaySdk = new GelatoRelay();

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 5;

/**
 * Generic function to complete a relay transaction by submitting signed EIP2771 data to Gelato.
 * Used for install, unpermit, and repermit operations.
 */
export async function completeRelayTransaction(request: {
  typedDataSignature: string;
  dataToSign: ConcurrentPayloadToSign;
  operationName: string;
}) {
  const { typedDataSignature, dataToSign, operationName } = request;

  console.log(`[${operationName}] Submitting to Gelato relay`);

  const struct = {
    ...dataToSign.struct,
    chainId: BigInt(dataToSign.struct.chainId),
  };

  const { taskId } = await relaySdk.sponsoredCallERC2771WithSignature(
    struct,
    typedDataSignature,
    env.GELATO_RELAY_API_KEY,
  );

  console.log(`[${operationName}] Task submitted:`, taskId);

  // Poll for task completion
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    try {
      const status = await relaySdk.getTaskStatus(taskId);

      if (!status) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        continue;
      }

      console.log(`[${operationName}] Task status: ${status.taskState}`);

      if (status.taskState === 'ExecSuccess') {
        return { transactionHash: status.transactionHash };
      }

      if (status.taskState === 'Cancelled' || status.taskState === 'ExecReverted') {
        console.error(
          `[${operationName}] Task failed - full status:`,
          JSON.stringify(status, null, 2),
        );
        throw new Error(`Gelato task failed: ${status.taskState} - ${status.lastCheckMessage}`);
      }

      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    } catch (error) {
      // If it's a task failure (not a network error), re-throw immediately
      if (error instanceof Error && error.message.startsWith('Gelato task failed')) {
        throw error;
      }
      console.warn(
        `[${operationName}] Poll attempt ${attempt + 1}/${MAX_POLL_ATTEMPTS} failed:`,
        error,
      );
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
  }

  throw new Error(`Gelato task timed out after ${MAX_POLL_ATTEMPTS} attempts`);
}
