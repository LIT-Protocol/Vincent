import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../vincentNetworkContext';
import { createVincentContracts } from '../../utils/createVincentContracts';

type RawContractMethod = ReturnType<
  typeof createVincentContracts
>['vincentLitActionViewFacetContract']['read']['getApprovedLitActionsManager'];
// type RawContractParams = Parameters<RawContractMethod>;
type RawContractResponse = Awaited<ReturnType<RawContractMethod>>;

/**
 * Returns the current approved tools manager address from the Vincent network
 * @param request Optional empty request object
 * @param ctx The Vincent network context
 * @returns The address of the current approved tools manager
 */
export async function getApprovedLitActionsManager(
  ctx: VincentNetworkContext,
): Promise<{ manager: RawContractResponse }> {
  logger.debug('Getting approved lit actions manager');

  const { vincentLitActionViewFacetContract } = createVincentContracts(ctx);

  const manager =
    await vincentLitActionViewFacetContract.read.getApprovedLitActionsManager();

  logger.debug({ manager });

  return { manager };
}
