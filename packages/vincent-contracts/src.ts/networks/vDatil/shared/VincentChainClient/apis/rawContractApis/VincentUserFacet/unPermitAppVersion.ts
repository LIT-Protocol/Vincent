import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../NetworkContextManager';
import { callWithAdjustedOverrides } from '../../utils/callWithAdjustedOverrides';
import { createVincentContracts } from '../../../ContractDataManager';
import { decodeVincentLogs } from '../../utils/decodeVincentLogs';

const UnPermitAppVersionRequest = z.object({
  pkpTokenId: z.coerce.bigint(),
  appId: z.coerce.bigint(),
  appVersion: z.coerce.bigint(),
});

type UnPermitAppVersionRequest = z.input<typeof UnPermitAppVersionRequest>;

/**
 * Removes permission for a specific application version from a PKP token
 * @param request The request containing PKP token ID, app ID, and app version
 * @param ctx The Vincent network context
 * @returns Object containing transaction hash, receipt, and decoded logs
 */
export async function unPermitAppVersion(
  request: UnPermitAppVersionRequest,
  ctx: VincentNetworkContext,
) {
  const validatedRequest = UnPermitAppVersionRequest.parse(request);
  logger.debug({ validatedRequest });

  const { vincentUserFacetContract, publicClient } = createVincentContracts(ctx);

  const hash = await callWithAdjustedOverrides(
    vincentUserFacetContract,
    'unPermitAppVersion',
    [
      validatedRequest.pkpTokenId,
      validatedRequest.appId,
      validatedRequest.appVersion,
    ],
  );

  logger.info({ hash });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const decodedLogs = await decodeVincentLogs(receipt.logs, ctx);

  return { hash, receipt, decodedLogs };
} 