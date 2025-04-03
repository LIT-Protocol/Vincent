import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { toEthAddress } from '../../../../../../shared/utils/z-transformers';
import { VincentNetworkContext } from '../../../NetworkContextManager';
import { createVincentContracts } from '../../../ContractDataManager';

// Define raw types from the contract
type RawContractMethod = ReturnType<
  typeof createVincentContracts
>['vincentUserViewFacetContract']['read']['validateToolExecutionAndGetPolicies'];
type RawContractParams = Parameters<RawContractMethod>[0];
type RawContractResponse = Awaited<ReturnType<RawContractMethod>>;

const ExpectedParams = z
  .object({
    delegatee: toEthAddress,
    pkpTokenId: z.coerce.bigint(),
    toolIpfsCid: z.string(),
  })
  .transform(
    (params): RawContractParams => [
      params.delegatee,
      params.pkpTokenId,
      params.toolIpfsCid,
    ],
  );

type ExpectedParams = z.input<typeof ExpectedParams>;

/**
 * Validates if a tool execution is permitted for a specific PKP token and retrieves its policies
 * @param request The request containing the delegatee address, PKP token ID, and tool IPFS CID
 * @param ctx The Vincent network context
 * @returns Tool execution validation result including permitted status and associated policies
 */
export async function validateToolExecutionAndGetPolicies(
  request: ExpectedParams,
  ctx: VincentNetworkContext,
): Promise<RawContractResponse> {
  const validatedRequest = ExpectedParams.parse(request);
  logger.debug({ validatedRequest });

  const { vincentUserViewFacetContract } = createVincentContracts(ctx);

  const validation =
    await vincentUserViewFacetContract.read.validateToolExecutionAndGetPolicies(
      validatedRequest,
    );

  return validation;
}
