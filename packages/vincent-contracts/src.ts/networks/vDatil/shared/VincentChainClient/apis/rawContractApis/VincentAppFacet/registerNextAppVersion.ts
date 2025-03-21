import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../_vincentConfig';
import { callWithAdjustedOverrides } from '../../utils/callWithAdjustedOverrides';
import { createVincentContracts } from '../../utils/createVincentContracts';
import { decodeVincentLogs } from '../../utils/decodeVincentLogs';
import { ParameterTypeInput, parameterTypeSchema } from './schemas/ParameterType';

const RegisterNextAppVersionRequest = z.object({
  appId: z.bigint(),
  toolIpfsCids: z.array(z.string()),
  toolPolicies: z.array(z.array(z.string())),
  toolPolicyParameterNames: z.array(z.array(z.array(z.string()))),
  toolPolicyParameterTypes: z.array(z.array(z.array(parameterTypeSchema)))
});

type RegisterNextAppVersionRequest = Omit<z.input<typeof RegisterNextAppVersionRequest>, 'toolPolicyParameterTypes'> & {
  toolPolicyParameterTypes: ParameterTypeInput[][][];
};

/**
 * Registers a new version of an existing app on the Vincent network
 * @param request The registration request containing app version details
 * @param ctx The Vincent network context
 * @returns Object containing transaction hash, receipt, and decoded logs
 */
export async function registerNextAppVersion(request: RegisterNextAppVersionRequest, ctx: VincentNetworkContext) {
  const validatedRequest = RegisterNextAppVersionRequest.parse(request);
  logger.debug({ validatedRequest });

  const {
    vincentAppFacetContract,
    publicClient,
  } = createVincentContracts(ctx);

  const hash = await callWithAdjustedOverrides(
    vincentAppFacetContract,
    "registerNextAppVersion",
    [
      validatedRequest.appId,
      validatedRequest.toolIpfsCids,
      validatedRequest.toolPolicies,
      validatedRequest.toolPolicyParameterNames,
      validatedRequest.toolPolicyParameterTypes,
    ]
  );

  logger.info({ hash });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const decodedLogs = await decodeVincentLogs(receipt.logs, ctx);

  return { hash, receipt, decodedLogs };
}
