import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../NetworkContextManager';
import { createVincentContracts } from '../../../ContractDataManager';

type RawContractMethod = ReturnType<
  typeof createVincentContracts
>['vincentToolViewFacetContract']['read']['getApprovedToolsManager'];
// type RawContractParams = Parameters<RawContractMethod>;
type RawContractResponse = Awaited<ReturnType<RawContractMethod>>;

/**
 * Returns the current approved tools manager address from the Vincent network
 * @param request Optional empty request object
 * @param ctx The Vincent network context
 * @returns The address of the current approved tools manager
 */
export async function getApprovedToolsManager(
  ctx: VincentNetworkContext,
): Promise<{ manager: RawContractResponse }> {
  logger.debug('Getting approved tools manager');

  const { vincentToolViewFacetContract } = createVincentContracts(ctx);

  const manager =
    await vincentToolViewFacetContract.read.getApprovedToolsManager();

  logger.debug({ manager });

  return { manager };
}
