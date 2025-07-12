import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { toEthAddress } from '../../../../../../shared/utils/z-transformers';
import { VincentNetworkContext } from '../../../NetworkContextManager';
import { createVincentContracts } from '../../../ContractDataManager';

// Define raw types from the contract
type RawContractMethod = ReturnType<
  typeof createVincentContracts
>['vincentUserViewFacetContract']['read']['getAllRegisteredAgentPkps'];
type RawContractParams = Parameters<RawContractMethod>[0];
type RawContractResponse = Awaited<ReturnType<RawContractMethod>>;

const ExpectedParams = z
  .object({
    userAddress: toEthAddress,
  })
  .transform((params): RawContractParams => [params.userAddress]);

type ExpectedParams = z.input<typeof ExpectedParams>;

/**
 * Retrieves all registered agent PKP token IDs for a specific user address
 * @param request The request containing the user address
 * @param ctx The Vincent network context
 * @returns Array of PKP token IDs registered by the user address
 */
export async function getAllRegisteredAgentPkps(
  request: ExpectedParams,
  ctx: VincentNetworkContext,
): Promise<RawContractResponse> {
  const validatedRequest = ExpectedParams.parse(request);
  logger.debug({ validatedRequest });

  const { vincentUserViewFacetContract } = createVincentContracts(ctx);

  const pkpTokenIds =
    await vincentUserViewFacetContract.read.getAllRegisteredAgentPkps(validatedRequest);

  return pkpTokenIds;
}
