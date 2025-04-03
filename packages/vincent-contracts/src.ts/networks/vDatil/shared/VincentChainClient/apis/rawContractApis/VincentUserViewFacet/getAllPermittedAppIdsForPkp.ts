import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../NetworkContextManager';
import { createVincentContracts } from '../../../ContractDataManager';

// Define raw types from the contract
type RawContractMethod = ReturnType<
  typeof createVincentContracts
>['vincentUserViewFacetContract']['read']['getAllPermittedAppIdsForPkp'];
type RawContractParams = Parameters<RawContractMethod>[0];
type RawContractResponse = Awaited<ReturnType<RawContractMethod>>;

const ExpectedParams = z
  .object({
    pkpTokenId: z.coerce.bigint(),
  })
  .transform((params): RawContractParams => [params.pkpTokenId]);

type ExpectedParams = z.input<typeof ExpectedParams>;

/**
 * Retrieves all permitted application IDs for a specific PKP token
 * @param request The request containing the PKP token ID
 * @param ctx The Vincent network context
 * @returns Array of application IDs that the PKP token is permitted to use
 */
export async function getAllPermittedAppIdsForPkp(
  request: ExpectedParams,
  ctx: VincentNetworkContext,
): Promise<RawContractResponse> {
  const validatedRequest = ExpectedParams.parse(request);
  logger.debug({ validatedRequest });

  const { vincentUserViewFacetContract } = createVincentContracts(ctx);

  const appIds =
    await vincentUserViewFacetContract.read.getAllPermittedAppIdsForPkp(
      validatedRequest,
    );

  return appIds;
}
