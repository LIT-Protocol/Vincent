import { EXAMPLE_WALLET_ADDRESS } from '../constants';
import { z } from './openApiZod';

export const installAppRequest = z
  .object({
    userControllerAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/)
      .openapi({
        description: 'EOA address that controls the user smart wallet',
        example: EXAMPLE_WALLET_ADDRESS,
      }),
  })
  .strict();

export const installAppResponse = z
  .object({
    agentSignerAddress: z.string().openapi({
      description: 'The PKP address that the app will use to sign things',
      example: EXAMPLE_WALLET_ADDRESS,
    }),
    agentSmartAccountAddress: z.string().openapi({
      description:
        'The smart account address calculated from the PKP address, used on the frontend to verify they get the same smart wallet address',
      example: EXAMPLE_WALLET_ADDRESS,
    }),
    appInstallationDataToSign: z.object({}).passthrough().openapi({
      description:
        'The EIP2771 TypedData to sign that will install the app into the Vincent contracts',
    }),
  })
  .strict();

export const getAgentAccountRequest = z
  .object({
    userControllerAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/)
      .openapi({
        description: 'EOA address that controls the user smart wallet',
        example: EXAMPLE_WALLET_ADDRESS,
      }),
  })
  .strict();

export const getAgentAccountResponse = z
  .object({
    agentAddress: z.string().nullable().openapi({
      description:
        'The agent smart account address if registered, or null if the agent does not exist',
      example: EXAMPLE_WALLET_ADDRESS,
    }),
  })
  .strict();
