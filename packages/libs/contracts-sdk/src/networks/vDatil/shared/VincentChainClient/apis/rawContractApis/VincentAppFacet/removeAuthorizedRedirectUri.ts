import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../NetworkContextManager';
import { callWithAdjustedOverrides } from '../../utils/callWithAdjustedOverrides';
import { createVincentContracts } from '../../../ContractDataManager';
import { decodeVincentLogs } from '../../utils/decodeVincentLogs';

const RemoveAuthorizedRedirectUriRequest = z.object({
  appId: z.bigint(),
  redirectUri: z.string(),
});

type RemoveAuthorizedRedirectUriRequest = z.input<typeof RemoveAuthorizedRedirectUriRequest>;

/**
 * Removes an authorized redirect URI from an existing app on the Vincent network
 * @param request The request containing appId and redirectUri to remove
 * @param ctx The Vincent network context
 * @returns Object containing transaction hash, receipt, and decoded logs
 */
export async function removeAuthorizedRedirectUri(
  request: RemoveAuthorizedRedirectUriRequest,
  ctx: VincentNetworkContext,
) {
  const validatedRequest = RemoveAuthorizedRedirectUriRequest.parse(request);
  logger.debug({ validatedRequest });

  const { vincentAppFacetContract, publicClient } = createVincentContracts(ctx);

  const hash = await callWithAdjustedOverrides(
    vincentAppFacetContract,
    'removeAuthorizedRedirectUri',
    [validatedRequest.appId, validatedRequest.redirectUri],
  );

  logger.info({ hash });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const decodedLogs = await decodeVincentLogs(receipt.logs, ctx);

  return { hash, receipt, decodedLogs };
}
