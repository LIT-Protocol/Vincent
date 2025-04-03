import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../NetworkContextManager';
import { createVincentContracts } from '../../../ContractDataManager';

// Define raw types from the contract
type RawContractMethod = ReturnType<
  typeof createVincentContracts
>['vincentUserViewFacetContract']['read']['getAllToolsAndPoliciesForApp'];
type RawContractParams = Parameters<RawContractMethod>[0];
type RawContractResponse = Awaited<ReturnType<RawContractMethod>>;

const ExpectedParams = z
  .object({
    pkpTokenId: z.coerce.bigint(),
    appId: z.coerce.bigint(),
  })
  .transform((params): RawContractParams => [params.pkpTokenId, params.appId]);

type ExpectedParams = z.input<typeof ExpectedParams>;

/**
 * Retrieves all tools and their associated policies for a specific PKP token and application
 * @param request The request containing the PKP token ID and application ID
 * @param ctx The Vincent network context
 * @returns Array of tools with their associated policies for the specified PKP and application
 */
export async function getAllToolsAndPoliciesForApp(
  request: ExpectedParams,
  ctx: VincentNetworkContext,
): Promise<RawContractResponse> {
  const validatedRequest = ExpectedParams.parse(request);
  logger.debug({ validatedRequest });

  const { vincentUserViewFacetContract } = createVincentContracts(ctx);

  const tools =
    await vincentUserViewFacetContract.read.getAllToolsAndPoliciesForApp(
      validatedRequest,
    );

  return tools;
}
