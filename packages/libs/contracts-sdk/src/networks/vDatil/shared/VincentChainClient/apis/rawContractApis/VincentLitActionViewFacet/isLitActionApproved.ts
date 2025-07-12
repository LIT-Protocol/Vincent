import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../NetworkContextManager';
import { createVincentContracts } from '../../../ContractDataManager';

// Define raw types from the contract
type RawContractMethod = ReturnType<
  typeof createVincentContracts
>['vincentLitActionViewFacetContract']['read']['isLitActionApproved'];
type RawContractParams = Parameters<RawContractMethod>[0];
type RawContractResponse = Awaited<ReturnType<RawContractMethod>>;

const ExpectedParams = z
  .object({
    litActionIpfsCid: z.string().min(1, 'litActionIpfsCid cannot be empty'),
  })
  .transform((params): RawContractParams => [params.litActionIpfsCid]);

type ExpectedParams = z.input<typeof ExpectedParams>;

/**
 * Checks if a lit action is approved on the Vincent network
 * @param request The request containing the lit action IPFS CID to check
 * @param ctx The Vincent network context
 * @returns Boolean indicating whether the lit action is approved
 */
export async function isLitActionApproved(
  request: ExpectedParams,
  ctx: VincentNetworkContext,
): Promise<{ isApproved: RawContractResponse }> {
  const validatedRequest = ExpectedParams.parse(request);
  logger.debug({ validatedRequest });

  const { vincentLitActionViewFacetContract } = createVincentContracts(ctx);

  const isApproved =
    await vincentLitActionViewFacetContract.read.isLitActionApproved(validatedRequest);

  logger.debug({ isApproved });

  return { isApproved };
}
