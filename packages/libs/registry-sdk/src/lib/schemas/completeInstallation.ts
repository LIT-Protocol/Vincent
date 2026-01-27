import { z } from './openApiZod';

const signedDataSchema = z
  .object({
    typedDataSignature: z.string().openapi({
      description: 'The signature of the typed data',
      example: '0x...',
    }),
    dataToSign: z.object({}).passthrough().openapi({
      description: 'The original data that was signed',
    }),
  })
  .strict();

export const completeInstallationRequest = z
  .object({
    appInstallation: signedDataSchema.openapi({
      description: 'Signed EIP2771 typed data for permitAppVersion transaction',
    }),
    agentSmartAccountDeployment: signedDataSchema.openapi({
      description: 'Signed UserOperation message for smart account deployment',
    }),
    sessionKeyApproval: signedDataSchema.openapi({
      description: 'Signed permission account data for session key approval',
    }),
  })
  .strict();

export const completeInstallationResponse = z
  .object({
    deployAgentSmartAccountTransactionHash: z.string().openapi({
      description: 'Transaction hash for smart account deployment',
      example: '0x9d260d1bbe075be0cda52a3271df062748f3182ede91b3aae5cd115f7b26552b',
    }),
    serializedPermissionAccount: z.string().openapi({
      description:
        'Serialized permission account that can be used by the PKP to sign transactions. The permission plugin will be automatically enabled on-chain when the PKP submits its first UserOperation.',
      example: '{"accountAddress":"0x...","permissionParams":{...}}',
    }),
    completeAppInstallationTransactionHash: z.string().openapi({
      description: 'Transaction hash for permitAppVersion (app installation completion)',
      example: '0x9d260d1bbe075be0cda52a3271df062748f3182ede91b3aae5cd115f7b26552b',
    }),
  })
  .strict();
