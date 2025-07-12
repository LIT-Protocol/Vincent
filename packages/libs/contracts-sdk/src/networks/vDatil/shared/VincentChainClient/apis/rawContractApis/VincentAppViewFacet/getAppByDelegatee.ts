import { z } from 'zod';
import { VincentNetworkContext } from '../../../NetworkContextManager';
import { createVincentContracts } from '../../../ContractDataManager';
import { toEthAddress } from '../../../../../../shared/utils/z-transformers';

type RawContractMethod = ReturnType<
  typeof createVincentContracts
>['vincentAppViewFacetContract']['read']['getAppByDelegatee'];
type RawContractParams = Parameters<RawContractMethod>[0];
type RawContractResponse = Awaited<ReturnType<RawContractMethod>>;

// Validate at runtime that our transformation matches contract params
const ExpectedParams = z
  .object({
    delegatee: toEthAddress,
  })
  .transform((obj): RawContractParams => [obj.delegatee]);

type ExpectedParams = z.input<typeof ExpectedParams>;

export async function getAppByDelegatee(
  request: ExpectedParams,
  ctx: VincentNetworkContext,
): Promise<RawContractResponse> {
  const contractParams = ExpectedParams.parse(request);
  const { vincentAppViewFacetContract } = createVincentContracts(ctx);
  const res = await vincentAppViewFacetContract.read.getAppByDelegatee(contractParams);
  return res;
}
