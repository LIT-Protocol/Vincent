import z from 'zod';
import { validateVincentPolicyDef } from './vincent-policy';
import { validateVincentToolDef } from './vincent-tool';

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
const policy1EvalDenyResult = z.object({ reason: z.string() }); // Result when denied
const policy1CommitAllowResult = z.object({ success: z.boolean() });
const policy1CommitDenyResult = z.object({ errorCode: z.number() });

// Create policies with full type inference
const policy1 = validateVincentPolicyDef({
  toolParamsSchema: myToolSchema,
  policyDef: {
    ipfsCid: 'policy1',
    toolParamsSchema: policy1Schema,
    userParamsSchema: userParams1Schema,
    commitParamsSchema: commitParams1Schema,

    // Define schema types explicitly (optional but helpful for validation)
    evalAllowResultSchema: policy1EvalAllowResult,
    evalDenyResultSchema: policy1EvalDenyResult,
    commitAllowResultSchema: policy1CommitAllowResult,
    commitDenyResultSchema: policy1CommitDenyResult,

    precheck: async ({ toolParams, userParams }) => {
      if (toolParams.targetAllowed) {
        return {
          ipfsCid: 'policy1',
          allow: true,
          details: ['Target is allowed for this action'],
        };
      } else {
        return {
          ipfsCid: 'policy1',
          allow: false,
          details: ['Target is not allowed for this action'],
        };
      }
    },

    evaluate: async ({ toolParams, userParams }) => {
      const targetIsAllowed = userParams.allowedTargets.includes('example');

      if (targetIsAllowed && toolParams.targetAllowed) {
        return {
          ipfsCid: 'policy1',
          allow: true,
          details: ['Target is in the allowed targets list'],
          result: 'APPROVED',
        };
      } else {
        return {
          ipfsCid: 'policy1',
          allow: false,
          details: ['Target is not in the allowed targets list'],
          result: { reason: 'Target not in allowed list' },
        };
      }
    },

    commit: async (params) => {
      if (params.confirmation) {
        return {
          ipfsCid: 'policy1',
          allow: true,
          details: ['Commit successful'],
          result: { success: true },
        };
      } else {
        return {
          ipfsCid: 'policy1',
          allow: false,
          details: ['Commit failed due to missing confirmation'],
          result: { errorCode: 400 },
        };
      }
    },
  },
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

const policy2 = validateVincentPolicyDef({
  toolParamsSchema: myToolSchema,
  policyDef: {
    ipfsCid: 'policy2',
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

    precheck: async ({ toolParams, userParams }) => {
      const isWithinLimit = toolParams.maxAmount <= userParams.limit;

      if (isWithinLimit) {
        return {
          ipfsCid: 'policy2',
          allow: true,
          details: [
            `Amount ${toolParams.maxAmount} is within limit ${userParams.limit}`,
          ],
          result: { validatedAmount: 1983 },
          // result: { beef: 'meow', quake: 1 },
        };
      } else {
        return {
          ipfsCid: 'policy2',
          allow: false,
          details: [
            `Amount ${toolParams.maxAmount} exceeds limit ${userParams.limit}`,
          ],
          result: { limitExceeded: true },
        };
      }
    },

    evaluate: async ({ toolParams, userParams }) => {
      const isValidCurrency = ['USD', 'EUR', 'GBP'].includes(
        toolParams.currency,
      );
      const isWithinLimit = toolParams.maxAmount <= userParams.limit;

      if (isValidCurrency && isWithinLimit) {
        return {
          ipfsCid: 'policy2',
          allow: true,
          details: [`Currency ${toolParams.currency} is supported`],
          result: { approvedCurrency: toolParams.currency },
        };
      } else {
        const reason = !isValidCurrency
          ? `Currency ${toolParams.currency} is not supported`
          : `Amount ${toolParams.maxAmount} exceeds limit ${userParams.limit}`;

        return {
          ipfsCid: 'policy2',
          allow: false,
          details: [reason],
          result: {
            reason: reason,
            code: !isValidCurrency ? 415 : 400,
          },
        };
      }
    },

    commit: async (params) => {
      // For demo purposes, let's say transactions with "fail" in the ID will be denied
      if (!params.transactionId.includes('fail')) {
        return {
          ipfsCid: 'policy2',
          ipfsCid2: 'policy2',
          allow: true,
          details: ['Transaction processed successfully'],
          result: {
            transaction: `completed-${params.transactionId}`,
            timestamp: Date.now(),
          },
        };
      } else {
        return {
          ipfsCid: 'policy2',
          allow: false,
          details: ['Transaction failed'],
          result: {
            failureReason: 'Invalid transaction ID format',
          },
        };
      }
    },
  },
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
  suggestedAccessLevel: z.enum(['basic', 'premium', 'admin']).optional(),
});

// Create policy3 without a commit function
const policy3 = validateVincentPolicyDef({
  toolParamsSchema: myToolSchema,
  policyDef: {
    ipfsCid: 'policy3ipfscid123',
    toolParamsSchema: policy3ToolParams,
    userParamsSchema: policy3UserParams,
    evalAllowResultSchema: policy3EvalAllowResult,
    evalDenyResultSchema: policy3EvalDenyResult,

    // Only has evaluate, no precheck or commit
    evaluate: async ({ toolParams, userParams }) => {
      // Policy logic: Allow only premium and admin users
      if (userParams.accessLevel === 'basic') {
        return {
          ipfsCid: 'policy3ipfscid123',
          allow: false,
          result: {
            reason: 'Basic users cannot access this tool',
            suggestedAccessLevel: 'premium' as const,
          },
        };
      }

      return {
        ipfsCid: 'policy3ipfscid123',
        allow: true,
        result: {
          message: `Access granted to ${toolParams.toolName}`,
          timedate: new Date(),
        },
      };
    },
    // No commit method!
  },
  toolParameterMappings: {
    amount: 'toolName',
  },
});

// const watTestFunction = async () => {
//   const wat1 = await policy1.policyDef.commit({
//     beef: false,
//   });
//   const wat2 = await policy2.policyDef.commit({ transactionId: 'test-id' });
// const wat3 = await policy3.policyDef.commit({ beefcake: 'test-id' });
// };
//
// Create your tool with fully typed policies
// @ts-expect-error myTool is intentionally never used
const myTool = validateVincentToolDef({
  toolParamsSchema: myToolSchema,
  supportedPolicies: {
    policy1,
    policy2,
    policy3,
  },
  precheck: async (params, policyResults) => {
    // Type-safe access to policies
    if (policyResults.allowPolicyResults.policy1) {
      await policyResults.allowPolicyResults.policy1.commit({
        ...params,
        confirmation: true,
      });
    }

    if (policyResults.allowPolicyResults.policy2) {
      const commitResult =
        await policyResults.allowPolicyResults.policy2.commit({
          ...params,
          transactionId: 'orhfjkjsdfslkjhdf',
        });

      if (commitResult.allow === true) {
        const { transaction, timestamp } = commitResult.result;
        console.log(`Transaction ${transaction} processed at ${timestamp}`);
      } else {
        console.log('failureReason', commitResult.result.failureReason);
      }
    }

    if (policyResults.allowPolicyResults.policy3) {
      // FIXME: This should be a type error
      // await policyResults.allowPolicyResults.policy3.commit({
      //   beefcake: 'orhfjkjsdfslkjhdf',
      // });
    }

    return true;
  },
  execute: async (params, policyResults) => {
    return {
      status: 'success',
      details: ['Tool executed successfully'],
    };
  },
});
