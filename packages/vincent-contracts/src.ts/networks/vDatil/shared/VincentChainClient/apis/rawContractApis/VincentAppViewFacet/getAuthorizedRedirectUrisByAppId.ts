import { z } from 'zod';
import { VincentNetworkContext } from '../../../NetworkContextManager';
import { createVincentContracts } from '../../../ContractDataManager';

type RawContractMethod = ReturnType<typeof createVincentContracts>['vincentAppViewFacetContract']['read']['getAuthorizedRedirectUrisByAppId'];
type RawContractParams = Parameters<RawContractMethod>[0];
type RawContractResponse = Awaited<ReturnType<RawContractMethod>>;

// Validate at runtime that our transformation matches contract params
const ExpectedParams = z.object({
  appId: z.union([z.number(), z.bigint()]),
}).transform((obj): RawContractParams => [BigInt(obj.appId)]);

type ExpectedParams = z.input<typeof ExpectedParams>;

/**
 * Retrieves all authorized redirect URIs for a specific app
 * @param request Object containing the appId
 * @param ctx Vincent network context
 * @returns Array of redirect URI strings
 */
export async function getAuthorizedRedirectUrisByAppId(request: ExpectedParams, ctx: VincentNetworkContext): Promise<RawContractResponse> {
  const contractParams = ExpectedParams.parse(request);
  const { vincentAppViewFacetContract } = createVincentContracts(ctx);
  return await vincentAppViewFacetContract.read.getAuthorizedRedirectUrisByAppId(contractParams);
} 