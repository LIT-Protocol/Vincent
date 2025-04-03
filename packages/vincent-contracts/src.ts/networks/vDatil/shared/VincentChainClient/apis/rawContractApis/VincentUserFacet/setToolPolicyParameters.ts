import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../NetworkContextManager';
import { callWithAdjustedOverrides } from '../../utils/callWithAdjustedOverrides';
import { createVincentContracts } from '../../../ContractDataManager';
import { decodeVincentLogs } from '../../utils/decodeVincentLogs';
import {
  hexEncodedParameterValueSchema,
  rawParameterValueSchema,
} from '../VincentAppFacet/schemas/ParameterType';

const SetToolPolicyParametersRequest = z.object({
  pkpTokenId: z.coerce.bigint(),
  appId: z.coerce.bigint(),
  appVersion: z.coerce.bigint(),
  toolIpfsCids: z.array(z.string()),
  policyIpfsCids: z.array(z.array(z.string())),
  policyParameterNames: z.array(z.array(z.array(z.string()))),
  policyParameterValues: rawParameterValueSchema,
});

type SetToolPolicyParametersRequest = z.input<
  typeof SetToolPolicyParametersRequest
>;

/**
 * Sets tool policy parameters for a specific PKP token, app, and version
 * @param request The request containing PKP token ID, app ID, app version, and policy details
 * @param ctx The Vincent network context
 * @returns Object containing transaction hash, receipt, and decoded logs
 */
export async function setToolPolicyParameters(
  request: SetToolPolicyParametersRequest,
  ctx: VincentNetworkContext,
) {
  const validatedRequest = SetToolPolicyParametersRequest.parse(request);
  logger.debug({ validatedRequest });

  const { vincentUserFacetContract, publicClient } =
    createVincentContracts(ctx);

  // Convert values to bytes format for parameter values
  const policyParameterValues = hexEncodedParameterValueSchema.parse(
    validatedRequest.policyParameterValues,
  );

  const hash = await callWithAdjustedOverrides(
    vincentUserFacetContract,
    'setToolPolicyParameters',
    [
      validatedRequest.pkpTokenId,
      validatedRequest.appId,
      validatedRequest.appVersion,
      validatedRequest.toolIpfsCids,
      validatedRequest.policyIpfsCids,
      validatedRequest.policyParameterNames,
      policyParameterValues,
    ],
  );

  logger.info({ hash });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const decodedLogs = await decodeVincentLogs(receipt.logs, ctx);

  return { hash, receipt, decodedLogs };
}
