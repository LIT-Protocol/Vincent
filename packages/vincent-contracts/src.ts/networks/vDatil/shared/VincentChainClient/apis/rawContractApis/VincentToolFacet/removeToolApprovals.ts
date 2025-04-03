import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../NetworkContextManager';
import { callWithAdjustedOverrides } from '../../utils/callWithAdjustedOverrides';
import { createVincentContracts } from '../../../ContractDataManager';
import { decodeVincentLogs } from '../../utils/decodeVincentLogs';

const RemoveToolApprovalsRequest = z.object({
  toolIpfsCids: z.array(z.string()),
});

type RemoveToolApprovalsRequest = z.input<typeof RemoveToolApprovalsRequest>;

/**
 * Removes approvals for tools on the Vincent network
 * @param request The request containing an array of tool IPFS CIDs to remove approvals for
 * @param ctx The Vincent network context
 * @returns Object containing transaction hash, receipt, and decoded logs
 */
export async function removeToolApprovals(
  request: RemoveToolApprovalsRequest,
  ctx: VincentNetworkContext,
) {
  const validatedRequest = RemoveToolApprovalsRequest.parse(request);
  logger.debug({ validatedRequest });

  const { vincentToolFacetContract, publicClient } =
    createVincentContracts(ctx);

  const hash = await callWithAdjustedOverrides(
    vincentToolFacetContract,
    'removeToolApprovals',
    [validatedRequest.toolIpfsCids],
  );

  logger.info({ hash });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const decodedLogs = await decodeVincentLogs(receipt.logs, ctx);

  return { hash, receipt, decodedLogs };
}
