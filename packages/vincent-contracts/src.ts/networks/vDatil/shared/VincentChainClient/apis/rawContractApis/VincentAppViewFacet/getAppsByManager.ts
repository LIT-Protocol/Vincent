import { z } from 'zod';
import { VincentNetworkContext } from '../../../NetworkContextManager';
import { createVincentContracts } from '../../../ContractDataManager';
import { toEthAddress } from '../../../../../../shared/utils/z-transformers';

type RawContractMethod = ReturnType<typeof createVincentContracts>['vincentAppViewFacetContract']['read']['getAppsByManager'];
type RawContractParams = Parameters<RawContractMethod>[0];
type RawContractResponse = Awaited<ReturnType<RawContractMethod>>;

// Validate at runtime that our transformation matches contract params
const ExpectedParams = z.object({
  manager: toEthAddress,
}).transform((obj): RawContractParams => [obj.manager]);

type ExpectedParams = z.input<typeof ExpectedParams>;

export async function getAppsByManager(request: ExpectedParams, ctx: VincentNetworkContext): Promise<RawContractResponse> {
  const contractParams = ExpectedParams.parse(request);
  const { vincentAppViewFacetContract } = createVincentContracts(ctx);
  const res = await vincentAppViewFacetContract.read.getAppsByManager(contractParams);
  return res;
} 