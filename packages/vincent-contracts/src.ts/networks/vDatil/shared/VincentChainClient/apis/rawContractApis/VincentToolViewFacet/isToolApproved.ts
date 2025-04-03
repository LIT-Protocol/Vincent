import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../NetworkContextManager';
import { createVincentContracts } from '../../../ContractDataManager';

// Define raw types from the contract
type RawContractMethod = ReturnType<
  typeof createVincentContracts
>['vincentToolViewFacetContract']['read']['isToolApproved'];
type RawContractParams = Parameters<RawContractMethod>[0];
type RawContractResponse = Awaited<ReturnType<RawContractMethod>>;

const ExpectedParams = z
  .object({
    toolIpfsCid: z.string().min(1, 'toolIpfsCid cannot be empty'),
  })
  .transform((params): RawContractParams => [params.toolIpfsCid]);

type ExpectedParams = z.input<typeof ExpectedParams>;

/**
 * Checks if a tool is approved on the Vincent network
 * @param request The request containing the tool IPFS CID to check
 * @param ctx The Vincent network context
 * @returns Boolean indicating whether the tool is approved
 */
export async function isToolApproved(
  request: ExpectedParams,
  ctx: VincentNetworkContext,
): Promise<{ isApproved: RawContractResponse }> {
  const validatedRequest = ExpectedParams.parse(request);
  logger.debug({ validatedRequest });

  const { vincentToolViewFacetContract } = createVincentContracts(ctx);

  const isApproved =
    await vincentToolViewFacetContract.read.isToolApproved(validatedRequest);

  logger.debug({ isApproved });

  return { isApproved };
}
