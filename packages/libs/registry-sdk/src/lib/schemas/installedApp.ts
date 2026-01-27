import { EXAMPLE_WALLET_ADDRESS } from '../constants';
import { z } from './openApiZod';

// EIP2771 Concurrent Sponsored Call schema (Gelato Relay)
const eip2771ConcurrentPayloadSchema = z
  .object({
    chainId: z.union([z.string(), z.number()]).openapi({
      description: 'Chain ID where the transaction will be executed',
      example: 84532,
    }),
    target: z.string().openapi({
      description: 'Target contract address',
      example: '0x1234567890123456789012345678901234567890',
    }),
    data: z.string().openapi({
      description: 'Encoded function call data',
      example: '0x...',
    }),
    user: z.string().openapi({
      description: 'User address that will sign the typed data',
      example: EXAMPLE_WALLET_ADDRESS,
    }),
    userNonce: z.union([z.string(), z.number()]).openapi({
      description: 'User nonce for replay protection',
      example: '0',
    }),
    userDeadline: z.union([z.string(), z.number()]).openapi({
      description: 'Deadline timestamp for the transaction',
      example: '1234567890',
    }),
  })
  .passthrough();

// UserOperation schema for ERC-4337 smart account deployment
const userOperationSchema = z
  .object({
    sender: z.string().openapi({
      description: 'Smart account address',
      example: EXAMPLE_WALLET_ADDRESS,
    }),
    nonce: z.string().openapi({
      description: 'Account nonce as string',
      example: '0',
    }),
    factory: z.string().optional().openapi({
      description: 'Factory address for account deployment',
      example: '0x1234567890123456789012345678901234567890',
    }),
    factoryData: z.string().optional().openapi({
      description: 'Factory calldata for deployment',
      example: '0x...',
    }),
    callData: z.string().openapi({
      description: 'Calldata for the account to execute',
      example: '0x...',
    }),
    callGasLimit: z.string().openapi({
      description: 'Gas limit for the call',
      example: '100000',
    }),
    verificationGasLimit: z.string().openapi({
      description: 'Gas limit for verification',
      example: '100000',
    }),
    preVerificationGas: z.string().openapi({
      description: 'Gas for pre-verification',
      example: '50000',
    }),
    maxFeePerGas: z.string().openapi({
      description: 'Maximum fee per gas',
      example: '1000000000',
    }),
    maxPriorityFeePerGas: z.string().openapi({
      description: 'Maximum priority fee per gas',
      example: '1000000000',
    }),
    paymaster: z.string().optional().openapi({
      description: 'Paymaster address',
      example: '0x1234567890123456789012345678901234567890',
    }),
    paymasterVerificationGasLimit: z.string().optional().openapi({
      description: 'Gas limit for paymaster verification',
      example: '100000',
    }),
    paymasterPostOpGasLimit: z.string().optional().openapi({
      description: 'Gas limit for paymaster post-op',
      example: '50000',
    }),
    paymasterData: z.string().optional().openapi({
      description: 'Paymaster-specific data',
      example: '0x',
    }),
    signature: z.string().optional().openapi({
      description: 'Signature placeholder',
      example: '0x',
    }),
  })
  .passthrough();

// Smart account deployment data schema
const agentSmartAccountDeploymentDataSchema = z.object({
  messageToSign: z.string().openapi({
    description: 'Hex-encoded message hash to sign for UserOperation',
    example: '0x1234...',
  }),
  userOperation: userOperationSchema.openapi({
    description: 'Complete UserOperation object that will be submitted with the signature',
  }),
});

// EIP-712 TypedData schema for session key approval
const typedDataDomainSchema = z
  .object({
    name: z.string().optional(),
    version: z.string().optional(),
    chainId: z.union([z.string(), z.number()]).optional(),
    verifyingContract: z.string().optional(),
    salt: z.string().optional(),
  })
  .passthrough();

const sessionKeyApprovalDataSchema = z
  .object({
    domain: typedDataDomainSchema.optional().openapi({
      description: 'EIP-712 domain',
    }),
    types: z
      .record(
        z.array(
          z
            .object({
              name: z.string(),
              type: z.string(),
            })
            .passthrough(),
        ),
      )
      .openapi({
        description: 'EIP-712 type definitions',
      }),
    primaryType: z.string().optional().openapi({
      description: 'Primary type name',
    }),
    message: z.string().openapi({
      description: 'Message to sign',
    }),
  })
  .passthrough();

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
    appInstallationDataToSign: eip2771ConcurrentPayloadSchema.optional().openapi({
      description:
        'The EIP2771 TypedData to sign for permitAppVersion via Gelato relay (gas-sponsored). Contains the transaction details for permitting the app version on the Vincent registry.',
    }),
    agentSmartAccountDeploymentDataToSign: agentSmartAccountDeploymentDataSchema
      .optional()
      .openapi({
        description:
          'Data for signing the smart account deployment UserOperation. Contains messageToSign (hex hash) and the complete userOperation object that will be submitted with the signature.',
      }),
    sessionKeyApprovalDataToSign: sessionKeyApprovalDataSchema.optional().openapi({
      description:
        'EIP-712 TypedData for session key approval. This enables the PKP signer to act on behalf of the smart account by granting it permission to execute transactions.',
    }),
    alreadyInstalled: z.boolean().optional().openapi({
      description:
        'True if the app is already installed for this user. If true, the typed data fields will be undefined.',
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
