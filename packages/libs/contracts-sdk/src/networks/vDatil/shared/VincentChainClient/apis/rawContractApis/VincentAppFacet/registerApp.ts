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
  deploymentStatus: z.number().default(0), // Default to 0 if not provided
  authorizedRedirectUris: z.array(z.string()),
  delegatees: z.array(z.string().transform((val) => val as `0x${string}`)),
  toolIpfsCids: z.array(z.string()),
  toolPolicies: z.array(z.array(z.string())),
  toolPolicyParameterNames: z.array(z.array(z.array(z.string()))),
  toolPolicyParameterTypes: z.array(z.array(z.array(parameterTypeSchema))),
});

type RegisterAppRequest = Omit<z.input<typeof RegisterAppRequest>, 'toolPolicyParameterTypes'> & {
  toolPolicyParameterTypes: ParameterTypeInput[][][];
};

export async function registerApp(request: RegisterAppRequest, ctx: VincentNetworkContext) {
  const validatedRequest = RegisterAppRequest.parse(request);
  logger.debug({ validatedRequest });

  const { vincentAppFacetContract, publicClient } = createVincentContracts(ctx);

  // Structure the parameters according to the expected ABI
  const appInfo = {
    name: validatedRequest.appName,
    description: validatedRequest.appDescription,
    deploymentStatus: validatedRequest.deploymentStatus,
    authorizedRedirectUris: validatedRequest.authorizedRedirectUris,
    delegatees: validatedRequest.delegatees,
  };

  const versionTools = {
    toolIpfsCids: validatedRequest.toolIpfsCids,
    toolPolicies: validatedRequest.toolPolicies,
    toolPolicyParameterNames: validatedRequest.toolPolicyParameterNames,
    toolPolicyParameterTypes: validatedRequest.toolPolicyParameterTypes,
  };

  const hash = await callWithAdjustedOverrides(vincentAppFacetContract, 'registerApp', [
    appInfo,
    versionTools,
  ]);

  logger.info({ hash });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const decodedLogs = await decodeVincentLogs(receipt.logs, ctx);

  return { hash, receipt, decodedLogs };
}
