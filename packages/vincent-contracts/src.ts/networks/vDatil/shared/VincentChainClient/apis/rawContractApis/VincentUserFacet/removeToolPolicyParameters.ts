import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../NetworkContextManager';
import { callWithAdjustedOverrides } from '../../utils/callWithAdjustedOverrides';
import { createVincentContracts } from '../../../ContractDataManager';
import { decodeVincentLogs } from '../../utils/decodeVincentLogs';

const RemoveToolPolicyParametersRequest = z.object({
  appId: z.coerce.bigint(),
  pkpTokenId: z.coerce.bigint(),
  appVersion: z.coerce.bigint(),
  toolIpfsCids: z.array(z.string()),
  policyIpfsCids: z.array(z.array(z.string())),
  policyParameterNames: z.array(z.array(z.array(z.string()))),
});

type RemoveToolPolicyParametersRequest = z.input<
  typeof RemoveToolPolicyParametersRequest
>;

/**
 * Removes tool policy parameters for a specific PKP token, app, and version
 * @param request The request containing PKP token ID, app ID, app version, and policy details
 * @param ctx The Vincent network context
 * @returns Object containing transaction hash, receipt, and decoded logs
 */
export async function removeToolPolicyParameters(
  request: RemoveToolPolicyParametersRequest,
  ctx: VincentNetworkContext,
) {
  const validatedRequest = RemoveToolPolicyParametersRequest.parse(request);
  logger.debug({ validatedRequest });

  const { vincentUserFacetContract, publicClient } = createVincentContracts(ctx);

  const hash = await callWithAdjustedOverrides(
    vincentUserFacetContract,
    'removeToolPolicyParameters',
    [
      validatedRequest.appId,
      validatedRequest.pkpTokenId,
      validatedRequest.appVersion,
      validatedRequest.toolIpfsCids,
      validatedRequest.policyIpfsCids,
      validatedRequest.policyParameterNames,
    ],
  );

  logger.info({ hash });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const decodedLogs = await decodeVincentLogs(receipt.logs, ctx);

  return { hash, receipt, decodedLogs };
} 