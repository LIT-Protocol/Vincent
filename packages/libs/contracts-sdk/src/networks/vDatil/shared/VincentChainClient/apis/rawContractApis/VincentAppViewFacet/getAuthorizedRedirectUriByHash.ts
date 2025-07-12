import { z } from 'zod';
import { VincentNetworkContext } from '../../../NetworkContextManager';
import { createVincentContracts } from '../../../ContractDataManager';
import { toHexString } from '../../../../../../shared/utils/z-transformers';

type RawContractMethod = ReturnType<
  typeof createVincentContracts
>['vincentAppViewFacetContract']['read']['getAuthorizedRedirectUriByHash'];
type RawContractParams = Parameters<RawContractMethod>[0];
type RawContractResponse = Awaited<ReturnType<RawContractMethod>>;

// Validate at runtime that our transformation matches contract params
const ExpectedParams = z
  .object({
    hashedRedirectUri: toHexString,
  })
  .transform((obj): RawContractParams => [obj.hashedRedirectUri as `0x${string}`]);

type ExpectedParams = z.input<typeof ExpectedParams>;

/**
 * Retrieves the authorized redirect URI from its hash
 * @param request Object containing the hashedRedirectUri
 * @param ctx Vincent network context
 * @returns The redirect URI string corresponding to the hash
 */
export async function getAuthorizedRedirectUriByHash(
  request: ExpectedParams,
  ctx: VincentNetworkContext,
): Promise<RawContractResponse> {
  const contractParams = ExpectedParams.parse(request);
  const { vincentAppViewFacetContract } = createVincentContracts(ctx);
  return await vincentAppViewFacetContract.read.getAuthorizedRedirectUriByHash(contractParams);
}
