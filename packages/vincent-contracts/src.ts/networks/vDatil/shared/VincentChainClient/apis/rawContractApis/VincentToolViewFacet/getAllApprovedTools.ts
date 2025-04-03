import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../NetworkContextManager';
import { createVincentContracts } from '../../../ContractDataManager';

// Define raw types from the contract
type RawContractMethod = ReturnType<
  typeof createVincentContracts
>['vincentToolViewFacetContract']['read']['getAllApprovedTools'];
// type RawContractParams = Parameters<RawContractMethod>[0];
type RawContractResponse = Awaited<ReturnType<RawContractMethod>>;

/**
 * Returns all approved tools from the Vincent network
 * @param ctx The Vincent network context
 * @returns Array of approved tool IPFS CIDs
 */
export async function getAllApprovedTools(
  ctx: VincentNetworkContext,
): Promise<{ toolIpfsCids: RawContractResponse }> {
  logger.debug('Getting all approved tools');

  const { vincentToolViewFacetContract } = createVincentContracts(ctx);

  const toolIpfsCids =
    await vincentToolViewFacetContract.read.getAllApprovedTools();

  logger.debug({ toolIpfsCids });

  return { toolIpfsCids };
}
