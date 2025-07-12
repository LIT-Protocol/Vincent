import { z } from 'zod';
import { VincentNetworkContext } from '../../../NetworkContextManager';
import { createVincentContracts } from '../../../ContractDataManager';

type RawContractMethod = ReturnType<
  typeof createVincentContracts
>['vincentAppViewFacetContract']['read']['getAppVersion'];
type RawContractParams = Parameters<RawContractMethod>[0];
type RawContractResponse = Awaited<ReturnType<RawContractMethod>>;

// Validate at runtime that our transformation matches contract params
const ExpectedParams = z
  .object({
    appId: z.union([z.number(), z.bigint()]),
    version: z.union([z.number(), z.bigint()]),
  })
  .transform((obj): RawContractParams => [BigInt(obj.appId), BigInt(obj.version)]);

type ExpectedParams = z.input<typeof ExpectedParams>;

export async function getAppVersion(
  request: ExpectedParams,
  ctx: VincentNetworkContext,
): Promise<RawContractResponse> {
  const contractParams = ExpectedParams.parse(request);
  const { vincentAppViewFacetContract } = createVincentContracts(ctx);
  return await vincentAppViewFacetContract.read.getAppVersion(contractParams);
}
