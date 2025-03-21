import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../_vincentConfig';
import { callWithAdjustedOverrides } from '../../utils/callWithAdjustedOverrides';
import { createVincentContracts } from '../../utils/createVincentContracts';
import { decodeVincentLogs } from '../../utils/decodeVincentLogs';

const EnableAppVersionRequest = z.object({
  appId: z.bigint(),
  appVersion: z.bigint(),
  enabled: z.boolean()
});

type EnableAppVersionRequest = z.input<typeof EnableAppVersionRequest>;

/**
 * Enables or disables a specific version of an app on the Vincent network
 * @param request The request containing appId, appVersion, and enabled status
 * @param ctx The Vincent network context
 * @returns Object containing transaction hash, receipt, and decoded logs
 */
export async function enableAppVersion(request: EnableAppVersionRequest, ctx: VincentNetworkContext) {
  const validatedRequest = EnableAppVersionRequest.parse(request);
  logger.debug({ validatedRequest });

  const {
    vincentAppFacetContract,
    publicClient,
  } = createVincentContracts(ctx);

  const hash = await callWithAdjustedOverrides(
    vincentAppFacetContract,
    "enableAppVersion",
    [
      validatedRequest.appId,
      validatedRequest.appVersion,
      validatedRequest.enabled,
    ]
  );

  logger.info({ hash });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const decodedLogs = await decodeVincentLogs(receipt.logs, ctx);

  return { hash, receipt, decodedLogs };
}
