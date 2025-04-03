import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../NetworkContextManager';
import { callWithAdjustedOverrides } from '../../utils/callWithAdjustedOverrides';
import { createVincentContracts } from '../../../ContractDataManager';
import { decodeVincentLogs } from '../../utils/decodeVincentLogs';
import { parameterTypeSchema, ParameterTypeInput } from './schemas/ParameterType';

const RegisterAppRequest = z.object({
  appName: z.string(),
  appDescription: z.string(),
  authorizedRedirectUris: z.array(z.string()),
  delegatees: z.array(z.string().transform((val) => val as `0x${string}`)),
  toolIpfsCids: z.array(z.string()),
  toolPolicies: z.array(z.array(z.string())),
  toolPolicyParameterNames: z.array(z.array(z.array(z.string()))),
  toolPolicyParameterTypes: z.array(z.array(z.array(parameterTypeSchema)))
});

type RegisterAppRequest = Omit<z.input<typeof RegisterAppRequest>, 'toolPolicyParameterTypes'> & {
  toolPolicyParameterTypes: ParameterTypeInput[][][];
};

export async function registerApp(request: RegisterAppRequest, ctx: VincentNetworkContext) {
  const validatedRequest = RegisterAppRequest.parse(request);
  logger.debug({ validatedRequest });

  const {
    vincentAppFacetContract,
    publicClient,
  } = createVincentContracts(ctx);

  const hash = await callWithAdjustedOverrides(
    vincentAppFacetContract,
    "registerApp",
    [
      validatedRequest.appName,
      validatedRequest.appDescription,
      validatedRequest.authorizedRedirectUris,
      validatedRequest.delegatees,
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
