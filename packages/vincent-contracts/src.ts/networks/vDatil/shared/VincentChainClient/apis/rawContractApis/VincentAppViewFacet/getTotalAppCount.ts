import { VincentNetworkContext } from '../../../NetworkContextManager';
import { createVincentContracts } from '../../../ContractDataManager';

type RawContractMethod = ReturnType<typeof createVincentContracts>['vincentAppViewFacetContract']['read']['getTotalAppCount'];
type RawContractResponse = Awaited<ReturnType<RawContractMethod>>;

// No parameters are needed for this function

/**
 * Retrieves the total number of registered apps
 * @param _ Empty object (no parameters required)
 * @param ctx Vincent network context
 * @returns The total number of apps as a BigInt
 */
export async function getTotalAppCount(ctx: VincentNetworkContext): Promise<RawContractResponse> {
  const { vincentAppViewFacetContract } = createVincentContracts(ctx);
  return await vincentAppViewFacetContract.read.getTotalAppCount();
} 