import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../NetworkContextManager';
import { callWithAdjustedOverrides } from '../../utils/callWithAdjustedOverrides';
import { createVincentContracts } from '../../../ContractDataManager';
import { decodeVincentLogs } from '../../utils/decodeVincentLogs';

const RemoveDelegateeRequest = z.object({
  appId: z.bigint(),
  delegatee: z.string().transform((val) => val as `0x${string}`),
});

type RemoveDelegateeRequest = Omit<z.input<typeof RemoveDelegateeRequest>, 'delegatee'> & {
  delegatee: string;
};

/**
 * Removes a delegatee from an existing app on the Vincent network
 * @param request The request containing appId and delegatee address to remove
 * @param ctx The Vincent network context
 * @returns Object containing transaction hash, receipt, and decoded logs
 */
export async function removeDelegatee(request: RemoveDelegateeRequest, ctx: VincentNetworkContext) {
  const validatedRequest = RemoveDelegateeRequest.parse(request);
  logger.debug({ validatedRequest });

  const { vincentAppFacetContract, publicClient } = createVincentContracts(ctx);

  const hash = await callWithAdjustedOverrides(vincentAppFacetContract, 'removeDelegatee', [
    validatedRequest.appId,
    validatedRequest.delegatee,
  ]);

  logger.info({ hash });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const decodedLogs = await decodeVincentLogs(receipt.logs, ctx);

  return { hash, receipt, decodedLogs };
}
