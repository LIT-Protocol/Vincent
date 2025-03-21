import { z } from 'zod';
import { vincentNetworkContext, VincentNetworkContext } from '../../../_vincentConfig';
import { createVincentContracts } from '../../utils/createVincentContracts';

type ContractParams = Parameters<ReturnType<typeof createVincentContracts>['vincentAppViewFacetContract']['read']['getAppById']>[0];

// Ensure our request maps to what the contract expects
type GetAppByIdRequest = {
  appId: number;
};

// Validate at runtime that our transformation matches contract params
const GetAppByIdRequest = z.object({
  appId: z.number().transform(n => BigInt(n))
}).transform(({ appId }): ContractParams => [appId]);

type RawResponse = Awaited<ReturnType<ReturnType<typeof createVincentContracts>['vincentAppViewFacetContract']['read']['getAppById']>>;

export async function getAppById(request: GetAppByIdRequest, ctx: VincentNetworkContext): Promise<RawResponse> {
  const contractParams = GetAppByIdRequest.parse(request);
  const { vincentAppViewFacetContract } = createVincentContracts(ctx);
  const res = await vincentAppViewFacetContract.read.getAppById(contractParams);
  return res;
}

if (import.meta.main) {
  const appId = 1;
  const ctx = vincentNetworkContext;
  const result = await getAppById({ appId }, ctx);
  console.log(result);
}
