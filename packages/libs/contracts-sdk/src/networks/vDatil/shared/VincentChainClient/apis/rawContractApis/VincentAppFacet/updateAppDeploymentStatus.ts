import { z } from 'zod';
import { logger } from '../../../../../../shared/logger';
import { VincentNetworkContext } from '../../../NetworkContextManager';
import { callWithAdjustedOverrides } from '../../utils/callWithAdjustedOverrides';
import { createVincentContracts } from '../../../ContractDataManager';
import { decodeVincentLogs } from '../../utils/decodeVincentLogs';

enum DeploymentStatus {
  DEVELOPMENT = 0,
  STAGING = 1,
  PROD = 2,
}

// String literal type for user-friendly API
export type DeploymentStatusString = 'development' | 'staging' | 'prod';

const UpdateAppDeploymentStatusRequest = z.object({
  appId: z.bigint(),
  deploymentStatus: z.enum(['development', 'staging', 'prod']).transform((val) => {
    // Transform string value to numeric enum value
    switch (val.toLowerCase()) {
      case 'development':
        return DeploymentStatus.DEVELOPMENT;
      case 'staging':
        return DeploymentStatus.STAGING;
      case 'prod':
        return DeploymentStatus.PROD;
      default:
        throw new Error(`Invalid deployment status: ${val}`);
    }
  }),
});

type UpdateAppDeploymentStatusRequest = z.input<typeof UpdateAppDeploymentStatusRequest>;

/**
 * Updates the deployment status of an existing app on the Vincent network
 * @param request The request containing appId and deploymentStatus ('development', 'staging', 'prod')
 * @param ctx The Vincent network context
 * @returns Object containing transaction hash, receipt, and decoded logs
 */
export async function updateAppDeploymentStatus(
  request: UpdateAppDeploymentStatusRequest,
  ctx: VincentNetworkContext,
) {
  const validatedRequest = UpdateAppDeploymentStatusRequest.parse(request);
  logger.debug({ validatedRequest });

  const { vincentAppFacetContract, publicClient } = createVincentContracts(ctx);

  const hash = await callWithAdjustedOverrides(
    vincentAppFacetContract,
    'updateAppDeploymentStatus',
    [validatedRequest.appId, validatedRequest.deploymentStatus],
  );

  logger.info({ hash });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const decodedLogs = await decodeVincentLogs(receipt.logs, ctx);

  return { hash, receipt, decodedLogs };
}
