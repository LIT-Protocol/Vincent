import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../NetworkContextManager';
import { callWithAdjustedOverrides } from '../../utils/callWithAdjustedOverrides';
import { createVincentContracts } from '../../../ContractDataManager';
import { decodeVincentLogs } from '../../utils/decodeVincentLogs';

const RegisterToolsRequest = z.object({
  toolIpfsCids: z.array(z.string()),
});

type RegisterToolsRequest = z.input<typeof RegisterToolsRequest>;

/**
 * Registers tools on the Vincent network
 * @param request The request containing an array of tool IPFS CIDs to register
 * @param ctx The Vincent network context
 * @returns Object containing transaction hash, receipt, and decoded logs
 */
export async function registerTools(
  request: RegisterToolsRequest,
  ctx: VincentNetworkContext,
) {
  const validatedRequest = RegisterToolsRequest.parse(request);
  logger.debug({ validatedRequest });

  const { vincentToolFacetContract, publicClient } =
    createVincentContracts(ctx);

  const hash = await callWithAdjustedOverrides(
    vincentToolFacetContract,
    'registerTools',
    [validatedRequest.toolIpfsCids],
  );

  logger.info({ hash });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const decodedLogs = await decodeVincentLogs(receipt.logs, ctx);

  return { hash, receipt, decodedLogs };
}
