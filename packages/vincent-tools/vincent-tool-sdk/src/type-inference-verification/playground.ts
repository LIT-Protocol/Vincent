import { z } from 'zod';
import {
  createVincentPolicy,
  createVincentToolPolicy,
} from '../lib/vincentPolicy';
import { createVincentTool } from '../lib/vincentTool';

// Define your tool schema
const myToolSchema = z.object({
  action: z.string(),
  target: z.string(),
  amount: z.number(),
});

// Define policy schemas
const policy1Schema = z.object({
  targetAllowed: z.boolean(),
  actionType: z.string(),
});
const userParams1Schema = z.object({ allowedTargets: z.array(z.string()) });
const commitParams1Schema = z.object({ confirmation: z.boolean() });

// Define the result schemas for policy1
const policy1EvalAllowResult = z.string(); // Result when allowed
const policy1EvalDenyResult = z.object({
  reason: z.string(),
  numTries: z.number(),
}); // Result when denied
const policy1CommitAllowResult = z.object({ success: z.boolean() });
const policy1CommitDenyResult = z.object({ errorCode: z.number() });

// Create policies with full type inference
const policyDef1 = createVincentPolicy({
  ipfsCid: 'policy1',
  packageName: 'extra-rate-limit' as const,
  toolParamsSchema: policy1Schema,
  userParamsSchema: userParams1Schema,
  commitParamsSchema: commitParams1Schema,

  // Define schema types explicitly (optional but helpful for validation)
  evalAllowResultSchema: policy1EvalAllowResult,
  evalDenyResultSchema: policy1EvalDenyResult,
  commitAllowResultSchema: policy1CommitAllowResult,
  commitDenyResultSchema: policy1CommitDenyResult,

  precheck: async ({ toolParams, userParams }, context) => {
    if (toolParams.targetAllowed) {
      return context.allow();
    } else {
      return context.deny();
    }
  },

  evaluate: async ({ toolParams, userParams }, context) => {
    const targetIsAllowed = userParams.allowedTargets.includes('example');

    if (targetIsAllowed && toolParams.targetAllowed) {
      return context.allow('APPROVED');
    } else {
      return context.deny({
        reason: 'Target not in allowed list',
        numTries: 1,
      });
    }
  },

  commit: async (params, context) => {
    if (params.confirmation) {
      return context.allow({ success: true });
    } else {
      return context.deny({ errorCode: 400 });
    }
  },
});

const policy1 = createVincentToolPolicy({
  toolParamsSchema: myToolSchema,
  policyDef: policyDef1,
  toolParameterMappings: {
    target: 'targetAllowed',
    action: 'actionType',
  },
});

// Define the result schemas for policy2
const policy2Schema = z.object({
  maxAmount: z.number(),
  currency: z.string(),
});
const userParams2Schema = z.object({ limit: z.number() });
const commitParams2Schema = z.object({ transactionId: z.string() });

// For policy2, let's use different result types
const policy2PrecheckAllowResult = z.object({ validatedAmount: z.number() });
const policy2PrecheckDenyResult = z.object({ limitExceeded: z.boolean() });
const policy2EvalAllowResult = z.object({ approvedCurrency: z.string() });
const policy2EvalDenyResult = z.object({
  reason: z.string(),
  code: z.number(),
});
const policy2CommitAllowResult = z.object({
  transaction: z.string(),
  timestamp: z.number(),
});
const policy2CommitDenyResult = z.object({ failureReason: z.string() });

const policyDef2 = createVincentPolicy({
  ipfsCid: 'policy2',
  packageName: 'rate-limit' as const,
  toolParamsSchema: policy2Schema,
  userParamsSchema: userParams2Schema,
  commitParamsSchema: commitParams2Schema,

  // Define schema types explicitly
  precheckAllowResultSchema: policy2PrecheckAllowResult,
  precheckDenyResultSchema: policy2PrecheckDenyResult,
  evalAllowResultSchema: policy2EvalAllowResult,
  evalDenyResultSchema: policy2EvalDenyResult,
  commitAllowResultSchema: policy2CommitAllowResult,
  commitDenyResultSchema: policy2CommitDenyResult,

  precheck: async ({ toolParams, userParams }, context) => {
    const isWithinLimit = toolParams.maxAmount <= userParams.limit;

    if (isWithinLimit) {
      return context.allow({ validatedAmount: 1983 });
    } else {
      return context.deny({ limitExceeded: true });
    }
  },

  evaluate: async ({ toolParams, userParams }, context) => {
    const isValidCurrency = ['USD', 'EUR', 'GBP'].includes(toolParams.currency);
    const isWithinLimit = toolParams.maxAmount <= userParams.limit;

    if (isValidCurrency && isWithinLimit) {
      return context.allow({ approvedCurrency: toolParams.currency });
    } else {
      const reason = !isValidCurrency
        ? `Currency ${toolParams.currency} is not supported`
        : `Amount ${toolParams.maxAmount} exceeds limit ${userParams.limit}`;

      return context.deny({
        reason: reason,
        code: !isValidCurrency ? 415 : 400,
      });
    }
  },

  commit: async (params, context) => {
    // For demo purposes, let's say transactions with "fail" in the ID will be denied
    if (!params.transactionId.includes('fail')) {
      return context.allow({
        transaction: `completed-${params.transactionId}`,
        timestamp: Date.now(),
      });
    } else {
      return context.deny({
        failureReason: 'Invalid transaction ID format',
      });
    }
  },
});

const policy2 = createVincentToolPolicy({
  toolParamsSchema: myToolSchema,
  policyDef: policyDef2,
  toolParameterMappings: {
    amount: 'maxAmount',
    action: 'currency',
  },
});

// Define schemas for policy3
const policy3ToolParams = z.object({
  toolName: z.string(),
  maxUsage: z.number(),
});

const policy3UserParams = z.object({
  userAddress: z.string(),
  accessLevel: z.enum(['basic', 'premium', 'admin']),
});

const policy3EvalAllowResult = z.object({
  message: z.string(),
  timedate: z.date(),
});

const policy3EvalDenyResult = z.object({
  reason: z.string(),
  numberOfTries: z.number(),
  suggestedAccessLevel: z.enum(['basic', 'premium', 'admin']).optional(),
});

// Create policy3 without a commit function
const policyDef3 = createVincentPolicy({
  ipfsCid: 'policy3ipfscid123',
  packageName: 'vincent-tool-sdk' as const,
  toolParamsSchema: policy3ToolParams,
  userParamsSchema: policy3UserParams,
  evalAllowResultSchema: policy3EvalAllowResult,
  evalDenyResultSchema: policy3EvalDenyResult,

  commit: async (_, { deny, allow }) => {
    return allow();
  },

  // Only has evaluate, no precheck or commit
  evaluate: async ({ toolParams, userParams }, context) => {
    // Policy logic: Allow only premium and admin users
    if (userParams.accessLevel === 'basic') {
      return context.deny({
        reason: 'Basic users cannot access this tool',
        suggestedAccessLevel: 'premium',
        numberOfTries: 1,
      });
    }

    return context.allow({
      message: `Access granted to ${toolParams.toolName}`,
      timedate: new Date(),
    });
  },
});

const policy3 = createVincentToolPolicy({
  toolParamsSchema: myToolSchema,
  policyDef: policyDef3,
  toolParameterMappings: {
    amount: 'toolName',
  },
});

const toolExecuteSuccessSchema = z.object({
  executedAction: z.string(),
  targetAddress: z.string(),
  transactionAmount: z.number(),
  timestamp: z.number(),
  txHash: z.string(),
});

const toolExecuteFailSchema = z.object({
  errorCode: z.number(),
  errorMessage: z.string(),
  suggestion: z.string().optional(),
});

const toolPrecheckSuccessSchema = z.object({
  validatedParams: z.boolean(),
  message: z.string(),
});

const toolPrecheckFailSchema = z.object({
  invalidField: z.string(),
  reason: z.string(),
});

// Create your tool with fully typed policies
export const myTool = createVincentTool({
  toolParamsSchema: myToolSchema,
  supportedPolicies: [policy1, policy2, policy3] as const,

  // Add schemas for tool results
  executeSuccessSchema: toolExecuteSuccessSchema,
  executeFailSchema: toolExecuteFailSchema,
  precheckSuccessSchema: toolPrecheckSuccessSchema,
  precheckFailSchema: toolPrecheckFailSchema,

  precheck: async (
    { toolParams },
    {
      fail,
      policiesContext: { allow, allowedPolicies, deniedPolicy },
      succeed,
    },
  ) => {
    // Basic validation
    if (!toolParams.action || !toolParams.target) {
      return fail({
        invalidField: !toolParams.action ? 'action' : 'target',
        reason: 'Required field is empty or missing',
      });
    }

    // Amount validation
    if (toolParams.amount <= 0) {
      return fail({
        invalidField: 'amount',
        reason: 'Amount must be greater than zero',
      });
    }

    // Process policy results if needed
    if (allow) {
      // Type-safe access to policies
      const extraRateLimitResults = allowedPolicies['extra-rate-limit'];
      if (extraRateLimitResults) {
        const policy1Result = extraRateLimitResults.result;
        console.log('policy1Result', policy1Result);
      }

      const rateLimitResults = allowedPolicies['rate-limit'];
      if (rateLimitResults) {
        const policy2Result = rateLimitResults.result;
        console.log(policy2Result);
      }
      const toolSdkResults = allowedPolicies['vincent-tool-sdk'];

      if (toolSdkResults) {
        const policy3Result = toolSdkResults.result;
        console.log(policy3Result);
      }

      // Return success result
      return succeed({
        validatedParams: true,
        message: `All parameters validated for ${toolParams.action} on ${toolParams.target}`,
      });
    } else {
      // Handle the denial case
      const denyReason = deniedPolicy.result.error || 'Policy check failed';

      return fail({
        invalidField: 'policy',
        reason: denyReason,
      });
    }
  },

  execute: async ({ toolParams }, { policiesContext, fail, succeed }) => {
    try {
      // Simulate successful execution
      if (toolParams.action === 'transfer' && toolParams.amount > 0) {
        // Execute the transaction
        const txHash = `0x${Math.random().toString(16).substring(2, 10)}`;

        // Use commit functions from policies if available
        const extraRateLimitPolicyContext =
          policiesContext.allowedPolicies['extra-rate-limit'];
        if (extraRateLimitPolicyContext) {
          const commitResult = await extraRateLimitPolicyContext.commit({
            confirmation: true,
          });

          if (commitResult.allow) {
          } else {
            // If policy commit fails, we can still decide to continue or fail the tool execution
          }
        }

        const rateLimitPolicyContext =
          policiesContext.allowedPolicies['rate-limit'];
        if (rateLimitPolicyContext) {
          const commitResult = await rateLimitPolicyContext.commit({
            transactionId: txHash,
          });

          if (commitResult.allow) {
          }
        }
        const toolSdkPolicyContext =
          policiesContext.allowedPolicies['vincent-tool-sdk'];
        if (toolSdkPolicyContext) {
          const commitResult = await toolSdkPolicyContext.commit();

          if (commitResult.allow) {
            console.log(commitResult.result);
          }
        }

        // Return success with typed result
        return succeed({
          executedAction: toolParams.action,
          targetAddress: toolParams.target,
          transactionAmount: toolParams.amount,
          timestamp: Date.now(),
          txHash,
        });
      } else {
        // Simulate a failure case
        return fail({
          errorCode: 400,
          errorMessage: `Cannot perform ${toolParams.action} operation`,
          suggestion: 'Try a "transfer" action instead',
        });
      }
    } catch (error) {
      // Handle any unexpected errors
      return fail({
        errorCode: 500,
        errorMessage: 'Internal execution error',
      });
    }
  },
});

export const gogoPolicy = async function () {
  await policy3.policyDef.evaluate(
    {
      toolParams: {
        toolName: 'wat',
        maxUsage: 2383,
      },
      userParams: { userAddress: 'meow', accessLevel: 'basic' },
    },
    {
      delegation: { delegatee: 'meow', delegator: 'meowmeow' },
    },
  );

  if (policy2.policyDef.commit) {
    return policy2.policyDef.commit(
      {
        transactionId: '10981328981279487',
      },
      {
        delegation: { delegatee: 'meow', delegator: 'meowmeow' },
      },
    );
  }
  return true;
};

export const gogo = async function () {
  const toolExecuteResult = await myTool.execute(
    { action: 'wat', target: 'meow', amount: 23098123 },
    {
      delegation: { delegatee: 'meow', delegator: 'meowmeow' },
      policiesContext: {
        evaluatedPolicies: [
          // 'extra-rate-limit',
          'rate-limit',
        ],
        allowedPolicies: {
          // 'extra-rate-limit': {
          //   result: { yes: true },
          // },
          'rate-limit': {
            result: {
              approvedCurrency: 'USD',
            },
          },
        },
      },
    },
  );

  console.log(toolExecuteResult);

  if (myTool.precheck) {
    return myTool.precheck(
      { action: 'wat', target: 'meow', amount: 23098123 },
      {
        delegation: { delegatee: 'meow', delegator: 'meowmeow' },
        policiesContext: {
          allow: false,
          deniedPolicy: {
            packageName: 'extra-rate-limit',
            result: { reason: 'wth', numTries: 1 },
          },
          evaluatedPolicies: ['extra-rate-limit', 'rate-limit'],
          allowedPolicies: {
            'extra-rate-limit': {
              result: 'wat',
            },
            'rate-limit': {
              result: {
                approvedCurrency: 'USD',
              },
            },
          },
        },
      },
    );
  }
  return true;
};
