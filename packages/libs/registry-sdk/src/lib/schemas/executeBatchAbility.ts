import { z } from './openApiZod';

/**
 * Default parameters that can be overridden per delegator
 */
export const executeBatchDefaults = z.record(z.any()).openapi({
  description:
    'Default parameters for the ability execution that apply to all delegators unless overridden',
  example: {
    ORIGIN_CHAIN_ID: 8453,
    DESTINATION_CHAIN_ID: 8453,
    ORIGIN_CURRENCY: '0x0000000000000000000000000000000000000000',
    DESTINATION_CURRENCY: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    TRADE_TYPE: 'EXACT_INPUT',
  },
});

/**
 * Ability parameters for a single delegator's execution
 */
export const delegatorAbilityParams = z.record(z.any()).openapi({
  description: 'Ability-specific parameters for this delegator, which override the defaults',
  example: {
    AMOUNT: '1000000000000000000', // 1 ETH
  },
});

/**
 * A single delegator in the batch execution request
 */
export const batchDelegator = z
  .object({
    delegatorAddress: z.string().openapi({
      description: 'Ethereum address of the delegator (user who delegated ability to the app)',
      example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    }),
    abilityParams: delegatorAbilityParams,
  })
  .openapi('BatchDelegator');

/**
 * Request for batch ability execution
 */
export const executeBatchAbilityRequest = z
  .object({
    delegateePrivateKey: z.string().openapi({
      description:
        'Private key of the delegatee (app PKP). Used to derive the app ID automatically.',
      example: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    }),
    defaults: executeBatchDefaults.optional(),
    delegators: z.array(batchDelegator).openapi({
      description: 'Array of delegators to execute the ability for',
      minItems: 1,
    }),
  })
  .openapi('ExecuteBatchAbilityRequest');

/**
 * Successful execution result for a delegator
 */
export const delegatorExecutionResultSuccess = z
  .object({
    success: z.literal(true),
    transactionHash: z.string().openapi({
      description: 'Transaction hash of the executed UserOperation',
      example: '0xabc123...',
    }),
    userOpHash: z.string().openapi({
      description: 'UserOperation hash',
      example: '0xdef456...',
    }),
  })
  .openapi('DelegatorExecutionResultSuccess');

/**
 * Failed execution result for a delegator
 */
export const delegatorExecutionResultFailure = z
  .object({
    success: z.literal(false),
    error: z.string().openapi({
      description: 'Error message describing why the execution failed',
      example: 'Precheck failed: Insufficient balance',
    }),
  })
  .openapi('DelegatorExecutionResultFailure');

/**
 * Result for a single delegator execution (union type)
 */
export const delegatorExecutionResult = z
  .union([delegatorExecutionResultSuccess, delegatorExecutionResultFailure])
  .openapi('DelegatorExecutionResult');

/**
 * Response for batch ability execution
 */
export const executeBatchAbilityResponse = z
  .object({
    results: z.record(delegatorExecutionResult).openapi({
      description: 'Map of delegator addresses to their execution results',
      example: {
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb': {
          success: true,
          transactionHash: '0xabc123...',
          userOpHash: '0xdef456...',
        },
        '0x1234567890123456789012345678901234567890': {
          success: false,
          error: 'Precheck failed: Insufficient balance',
        },
      },
    }),
  })
  .openapi('ExecuteBatchAbilityResponse');
