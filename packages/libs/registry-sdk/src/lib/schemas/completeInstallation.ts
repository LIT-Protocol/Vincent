import { EXAMPLE_WALLET_ADDRESS } from '../constants';
import { z } from './openApiZod';

const appInstallationSignedDataSchema = z
  .object({
    typedDataSignature: z.string().openapi({
      description: 'The signature of the EIP2771 typed data',
      example: '0x...',
    }),
    dataToSign: z.object({}).passthrough().openapi({
      description: 'The original EIP2771 typed data that was signed',
    }),
  })
  .strict();

const agentSmartAccountDeploymentSignedDataSchema = z
  .object({
    typedDataSignature: z.string().openapi({
      description: 'The signature of the UserOperation message hash',
      example: '0x...',
    }),
    userOperation: z.object({}).passthrough().openapi({
      description: 'The UserOperation that was signed for smart account deployment',
    }),
  })
  .strict();

const sessionKeyApprovalSignedDataSchema = z
  .object({
    typedDataSignature: z.string().openapi({
      description: 'The signature of the session key approval EIP-712 typed data',
      example: '0x...',
    }),
  })
  .strict();

export const completeInstallationRequest = z
  .object({
    userControllerAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/)
      .openapi({
        description: 'EOA address that controls the user smart wallet',
        example: EXAMPLE_WALLET_ADDRESS,
      }),
    appId: z.number().openapi({
      description: 'The Vincent app ID',
      example: 1,
    }),
    agentSignerAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/)
      .openapi({
        description: 'The PKP address that will be used as the agent signer',
        example: EXAMPLE_WALLET_ADDRESS,
      }),
    appInstallation: appInstallationSignedDataSchema.openapi({
      description: 'Signed EIP2771 typed data for permitAppVersion transaction',
    }),
    agentSmartAccountDeployment: agentSmartAccountDeploymentSignedDataSchema.openapi({
      description: 'Signed UserOperation for smart account deployment',
    }),
    sessionKeyApproval: sessionKeyApprovalSignedDataSchema.openapi({
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
