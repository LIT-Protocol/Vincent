import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { toEthAddress } from '../../../../../../shared/utils/z-transformers';
import { VincentNetworkContext } from '../../../NetworkContextManager';
import { callWithAdjustedOverrides } from '../../utils/callWithAdjustedOverrides';
import { createVincentContracts } from '../../../ContractDataManager';
import { decodeVincentLogs } from '../../utils/decodeVincentLogs';

const UpdateApprovedToolsManagerRequest = z.object({
  newManager: toEthAddress,
});

type UpdateApprovedToolsManagerRequest = z.input<
  typeof UpdateApprovedToolsManagerRequest
>;

/**
 * Updates the approved tools manager on the Vincent network
 * @param request The request containing the new manager address
 * @param ctx The Vincent network context
 * @returns Object containing transaction hash, receipt, and decoded logs
 */
export async function updateApprovedToolsManager(
  request: UpdateApprovedToolsManagerRequest,
  ctx: VincentNetworkContext,
) {
  const validatedRequest = UpdateApprovedToolsManagerRequest.parse(request);
  logger.debug({ validatedRequest });

  const { vincentToolFacetContract, publicClient } =
    createVincentContracts(ctx);

  const hash = await callWithAdjustedOverrides(
    vincentToolFacetContract,
    'updateApprovedToolsManager',
    [validatedRequest.newManager],
  );

  logger.info({ hash });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const decodedLogs = await decodeVincentLogs(receipt.logs, ctx);

  return { hash, receipt, decodedLogs };
}
