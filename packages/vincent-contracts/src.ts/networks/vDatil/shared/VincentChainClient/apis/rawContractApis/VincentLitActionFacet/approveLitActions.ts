import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../vincentNetworkContext';
import { callWithAdjustedOverrides } from '../../utils/callWithAdjustedOverrides';
import { createVincentContracts } from '../../utils/createVincentContracts';
import { decodeVincentLogs } from '../../utils/decodeVincentLogs';

const ApproveLitActionsRequest = z.object({
  litActionIpfsCids: z.array(z.string()),
});

type ApproveLitActionsRequest = z.input<typeof ApproveLitActionsRequest>;

/**
 * Approves tools for use on the Vincent network
 * @param request The request containing an array of tool IPFS CIDs to approve
 * @param ctx The Vincent network context
 * @returns Object containing transaction hash, receipt, and decoded logs
 */
export async function approveLitActions(
  request: ApproveLitActionsRequest,
  ctx: VincentNetworkContext,
) {
  const validatedRequest = ApproveLitActionsRequest.parse(request);
  logger.debug({ validatedRequest });

  const { vincentLitActionFacetContract, publicClient } =
    createVincentContracts(ctx);

  const hash = await callWithAdjustedOverrides(
    vincentLitActionFacetContract,
    'approveLitActions',
    [validatedRequest.litActionIpfsCids],
  );

  logger.info({ hash });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const decodedLogs = await decodeVincentLogs(receipt.logs, ctx);

  return { hash, receipt, decodedLogs };
}
