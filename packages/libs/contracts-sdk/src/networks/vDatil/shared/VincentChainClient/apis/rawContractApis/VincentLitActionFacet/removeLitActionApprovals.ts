import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../NetworkContextManager';
import { callWithAdjustedOverrides } from '../../utils/callWithAdjustedOverrides';
import { createVincentContracts } from '../../../ContractDataManager';
import { decodeVincentLogs } from '../../utils/decodeVincentLogs';

const RemoveLitActionApprovalsRequest = z.object({
  litActionIpfsCids: z.array(z.string()),
});

type RemoveLitActionApprovalsRequest = z.input<typeof RemoveLitActionApprovalsRequest>;

/**
 * Removes approvals for tools on the Vincent network
 * @param request The request containing an array of tool IPFS CIDs to remove approvals for
 * @param ctx The Vincent network context
 * @returns Object containing transaction hash, receipt, and decoded logs
 */
export async function removeLitActionApprovals(
  request: RemoveLitActionApprovalsRequest,
  ctx: VincentNetworkContext,
) {
  const validatedRequest = RemoveLitActionApprovalsRequest.parse(request);
  logger.debug({ validatedRequest });

  const { vincentLitActionFacetContract, publicClient } = createVincentContracts(ctx);

  const hash = await callWithAdjustedOverrides(
    vincentLitActionFacetContract,
    'removeLitActionApprovals',
    [validatedRequest.litActionIpfsCids],
  );

  logger.info({ hash });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const decodedLogs = await decodeVincentLogs(receipt.logs, ctx);

  return { hash, receipt, decodedLogs };
}
