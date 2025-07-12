import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../NetworkContextManager';
import { callWithAdjustedOverrides } from '../../utils/callWithAdjustedOverrides';
import { createVincentContracts } from '../../../ContractDataManager';
import { decodeVincentLogs } from '../../utils/decodeVincentLogs';

const DeleteAppRequest = z.object({
  appId: z.bigint(),
});

type DeleteAppRequest = z.input<typeof DeleteAppRequest>;

/**
 * Deletes an app on the Vincent network by setting its isDeleted flag to true
 * @param request The request containing appId to delete
 * @param ctx The Vincent network context
 * @returns Object containing transaction hash, receipt, and decoded logs
 */
export async function deleteApp(request: DeleteAppRequest, ctx: VincentNetworkContext) {
  const validatedRequest = DeleteAppRequest.parse(request);
  logger.debug({ validatedRequest });

  const { vincentAppFacetContract, publicClient } = createVincentContracts(ctx);

  const hash = await callWithAdjustedOverrides(vincentAppFacetContract, 'deleteApp', [
    validatedRequest.appId,
  ]);

  logger.info({ hash });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const decodedLogs = await decodeVincentLogs(receipt.logs, ctx);

  return { hash, receipt, decodedLogs };
}
