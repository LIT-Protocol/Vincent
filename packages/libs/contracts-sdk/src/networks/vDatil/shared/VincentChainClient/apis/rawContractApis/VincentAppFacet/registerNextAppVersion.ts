import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../NetworkContextManager';
import { callWithAdjustedOverrides } from '../../utils/callWithAdjustedOverrides';
import { createVincentContracts } from '../../../ContractDataManager';
import { decodeVincentLogs } from '../../utils/decodeVincentLogs';
import { ParameterTypeInput, parameterTypeSchema } from './schemas/ParameterType';

const RegisterNextAppVersionRequest = z.object({
  appId: z.bigint(),
  toolIpfsCids: z.array(z.string()),
  toolPolicies: z.array(z.array(z.string())),
  toolPolicyParameterNames: z.array(z.array(z.array(z.string()))),
  toolPolicyParameterTypes: z.array(z.array(z.array(parameterTypeSchema))),
});

type RegisterNextAppVersionRequest = Omit<
  z.input<typeof RegisterNextAppVersionRequest>,
  'toolPolicyParameterTypes'
> & {
  toolPolicyParameterTypes: ParameterTypeInput[][][];
};

/**
 * Registers a new version of an existing app on the Vincent network
 * @param request The registration request containing app version details
 * @param ctx The Vincent network context
 * @returns Object containing transaction hash, receipt, and decoded logs
 */
export async function registerNextAppVersion(
  request: RegisterNextAppVersionRequest,
  ctx: VincentNetworkContext,
) {
  const validatedRequest = RegisterNextAppVersionRequest.parse(request);
  logger.debug({ validatedRequest });

  const { vincentAppFacetContract, publicClient } = createVincentContracts(ctx);

  // Structure the parameters according to the expected ABI
  const versionTools = {
    toolIpfsCids: validatedRequest.toolIpfsCids,
    toolPolicies: validatedRequest.toolPolicies,
    toolPolicyParameterNames: validatedRequest.toolPolicyParameterNames,
    toolPolicyParameterTypes: validatedRequest.toolPolicyParameterTypes,
  };

  const hash = await callWithAdjustedOverrides(vincentAppFacetContract, 'registerNextAppVersion', [
    validatedRequest.appId,
    versionTools,
  ]);

  logger.info({ hash });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const decodedLogs = await decodeVincentLogs(receipt.logs, ctx);

  return { hash, receipt, decodedLogs };
}
