import { z } from 'zod';
import { vincentNetworkContext, VincentNetworkContext } from '../../../_vincentConfig';
import { createVincentContracts } from '../../utils/createVincentContracts';

type ContractParams = Parameters<ReturnType<typeof createVincentContracts>['vincentAppViewFacetContract']['read']['getAppVersion']>[0];

// Ensure our request maps to what the contract expects
type GetAppVersionRequest = {
  appId: number;
  version: number;
};

// Validate at runtime that our transformation matches contract params
const GetAppVersionRequest = z.object({
  appId: z.number().transform(n => BigInt(n)),
  version: z.number().transform(n => BigInt(n))
}).transform(({ appId, version }): ContractParams => [appId, version]);

type RawResponse = Awaited<ReturnType<ReturnType<typeof createVincentContracts>['vincentAppViewFacetContract']['read']['getAppVersion']>>;

export async function getAppVersion(request: GetAppVersionRequest, ctx: VincentNetworkContext): Promise<RawResponse> {
  const contractParams = GetAppVersionRequest.parse(request);
  const { vincentAppViewFacetContract } = createVincentContracts(ctx);
  const res = await vincentAppViewFacetContract.read.getAppVersion(contractParams);
  return res;
}

if (import.meta.main) {
  const appId = 1;
  const version = 1;
  const ctx = vincentNetworkContext;
  const result = await getAppVersion({ appId, version }, ctx);
}