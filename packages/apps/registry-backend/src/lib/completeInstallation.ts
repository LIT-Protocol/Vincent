import type { ConcurrentPayloadToSign } from '@gelatonetwork/relay-sdk/dist/lib/erc2771/types';

import { GelatoRelay } from '@gelatonetwork/relay-sdk';

import { env } from '../env';

const relaySdk = new GelatoRelay();

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 20;

export async function completeInstallation(request: {
  typedDataSignature: string;
  appInstallationDataToSign: ConcurrentPayloadToSign;
}) {
  const { typedDataSignature, appInstallationDataToSign } = request;

  console.log('[completeInstallation] Submitting to Gelato relay');

  const struct = {
    ...appInstallationDataToSign.struct,
    chainId: BigInt(appInstallationDataToSign.struct.chainId),
  };

  const { taskId } = await relaySdk.sponsoredCallERC2771WithSignature(
    struct,
    typedDataSignature,
    env.GELATO_RELAY_API_KEY,
  );

  console.log('[completeInstallation] Task submitted:', taskId);

  // Poll for task completion
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const status = await relaySdk.getTaskStatus(taskId);

    if (!status) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      continue;
    }

    console.log(`[completeInstallation] Task status: ${status.taskState}`);

    if (status.taskState === 'ExecSuccess') {
      return { transactionHash: status.transactionHash };
    }

    if (status.taskState === 'Cancelled' || status.taskState === 'ExecReverted') {
      console.error(
        '[completeInstallation] Task failed - full status:',
        JSON.stringify(status, null, 2),
      );
      throw new Error(`Gelato task failed: ${status.taskState} - ${status.lastCheckMessage}`);
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  throw new Error(`Gelato task timed out after ${MAX_POLL_ATTEMPTS} attempts`);
}
