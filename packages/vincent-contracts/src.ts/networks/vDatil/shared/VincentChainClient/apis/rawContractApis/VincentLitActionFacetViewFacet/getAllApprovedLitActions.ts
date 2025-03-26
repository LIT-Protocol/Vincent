import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../vincentNetworkContext';
import { createVincentContracts } from '../../utils/createVincentContracts';

// Define raw types from the contract
type RawContractMethod = ReturnType<
  typeof createVincentContracts
>['vincentLitActionViewFacetContract']['read']['getAllApprovedLitActions'];
// type RawContractParams = Parameters<RawContractMethod>[0];
type RawContractResponse = Awaited<ReturnType<RawContractMethod>>;

/**
 * Returns all approved tools from the Vincent network
 * @param ctx The Vincent network context
 * @returns Array of approved tool IPFS CIDs
 */
export async function getAllApprovedLitActions(
  ctx: VincentNetworkContext,
): Promise<{ litActionIpfsCids: RawContractResponse }> {
  logger.debug('Getting all approved lit actions');

  const { vincentLitActionViewFacetContract } = createVincentContracts(ctx);

  const litActionIpfsCids =
    await vincentLitActionViewFacetContract.read.getAllApprovedLitActions();

  logger.debug({ litActionIpfsCids });

  return { litActionIpfsCids };
}
