import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../NetworkContextManager';
import { callWithAdjustedOverrides } from '../../utils/callWithAdjustedOverrides';
import { createVincentContracts } from '../../../ContractDataManager';
// '../../../ContractDataManager'
import { decodeVincentLogs } from '../../utils/decodeVincentLogs';

const AddAuthorizedRedirectUriRequest = z.object({
  appId: z.bigint(),
  redirectUri: z.string()
});

type AddAuthorizedRedirectUriRequest = z.input<typeof AddAuthorizedRedirectUriRequest>;

/**
 * Adds an authorized redirect URI to an existing app on the Vincent network
 * @param request The request containing appId and redirectUri
 * @param ctx The Vincent network context
 * @returns Object containing transaction hash, receipt, and decoded logs
 */
export async function addAuthorizedRedirectUri(request: AddAuthorizedRedirectUriRequest, ctx: VincentNetworkContext) {
  const validatedRequest = AddAuthorizedRedirectUriRequest.parse(request);
  logger.debug({ validatedRequest });

  const {
    vincentAppFacetContract,
    publicClient,
  } = createVincentContracts(ctx);

  const hash = await callWithAdjustedOverrides(
    vincentAppFacetContract,
    "addAuthorizedRedirectUri",
    [
      validatedRequest.appId,
      validatedRequest.redirectUri
    ]
  );

  logger.info({ hash });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const decodedLogs = await decodeVincentLogs(receipt.logs, ctx);

  return { hash, receipt, decodedLogs };
} 