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
    sponsorGas: z.boolean().optional().openapi({
      description:
        'If true (default), returns EIP2771 typed data for sponsored gas relay. If false, returns raw transaction data for direct EOA submission (user pays gas).',
      example: true,
    }),
  })
  .strict();

export const rawTransactionSchema = z
  .object({
    to: z.string().openapi({
      description: 'The target contract address',
      example: '0x1234567890123456789012345678901234567890',
    }),
    data: z.string().openapi({
      description: 'The encoded transaction data',
      example: '0x...',
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
    rawTransaction: rawTransactionSchema.optional().openapi({
      description: 'Raw transaction data for direct EOA submission. Present when sponsorGas=false.',
    }),
    appInstallationDataToSign: z.object({}).passthrough().optional().openapi({
      description:
        'The EIP2771 TypedData to sign for sponsored gas relay. Present when sponsorGas=true (default).',
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
