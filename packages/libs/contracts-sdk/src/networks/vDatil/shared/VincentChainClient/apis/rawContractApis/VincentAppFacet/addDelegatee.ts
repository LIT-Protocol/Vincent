import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../NetworkContextManager';
import { callWithAdjustedOverrides } from '../../utils/callWithAdjustedOverrides';
import { createVincentContracts } from '../../../ContractDataManager';
import { decodeVincentLogs } from '../../utils/decodeVincentLogs';

const AddDelegateeRequest = z.object({
  appId: z.bigint(),
  delegatee: z.string().transform((val) => val as `0x${string}`),
});

type AddDelegateeRequest = Omit<z.input<typeof AddDelegateeRequest>, 'delegatee'> & {
  delegatee: string;
};

/**
 * Adds a delegatee to an existing app on the Vincent network
 * @param request The request containing appId and delegatee address
 * @param ctx The Vincent network context
 * @returns Object containing transaction hash, receipt, and decoded logs
 */
export async function addDelegatee(request: AddDelegateeRequest, ctx: VincentNetworkContext) {
  const validatedRequest = AddDelegateeRequest.parse(request);
  logger.debug({ validatedRequest });

  const { vincentAppFacetContract, publicClient } = createVincentContracts(ctx);

  const hash = await callWithAdjustedOverrides(vincentAppFacetContract, 'addDelegatee', [
    validatedRequest.appId,
    validatedRequest.delegatee,
  ]);

  logger.info({ hash });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const decodedLogs = await decodeVincentLogs(receipt.logs, ctx);

  return { hash, receipt, decodedLogs };
}
