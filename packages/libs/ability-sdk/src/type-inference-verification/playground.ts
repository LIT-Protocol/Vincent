import { z } from 'zod';

import { supportedPoliciesForAbility } from '../lib/abilityCore/helpers';
import { createVincentAbility } from '../lib/abilityCore/vincentAbility';
import { asBundledVincentPolicy } from '../lib/policyCore/bundledPolicy/bundledPolicy';
import { createDenyResult } from '../lib/policyCore/helpers';
import { createAllowResult } from '../lib/policyCore/helpers/resultCreators';
import { createVincentPolicy, createVincentAbilityPolicy } from '../lib/policyCore/vincentPolicy';

// Define your ability schema
const myAbilitySchema = z.object({
  action: z.string(),
  target: z.string(),
  amount: z.number(),
});
/* eslint-disable @typescript-eslint/no-unused-vars */

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
const PolicyConfig1 = createVincentPolicy({
  packageName: 'extra-rate-limit' as const,
  abilityParamsSchema: policy1Schema,
  userParamsSchema: userParams1Schema,
  commitParamsSchema: commitParams1Schema,

  // Define schema types explicitly (optional but helpful for validation)
  evalAllowResultSchema: policy1EvalAllowResult,
  evalDenyResultSchema: policy1EvalDenyResult,
  commitAllowResultSchema: policy1CommitAllowResult,
  commitDenyResultSchema: policy1CommitDenyResult,

  precheck: async ({ abilityParams, userParams }, context) => {
    const wat = userParams.allowedTargets;
    console.log(wat);
    if (abilityParams.targetAllowed) {
      return context.allow();
    } else {
      return context.deny();
    }
  },

  evaluate: async ({ abilityParams, userParams }, context) => {
    const targetIsAllowed = userParams.allowedTargets.includes('example');

    if (targetIsAllowed && abilityParams.targetAllowed) {
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

const policy1 = createVincentAbilityPolicy({
  abilityParamsSchema: myAbilitySchema,
  bundledVincentPolicy: asBundledVincentPolicy(
    PolicyConfig1,
    'QmX7Dqn4zYhJVvXYwKr8cFX5Xp7gVpqK5r8QHwvF8zYjXa' as const,
  ),
  abilityParameterMappings: {
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

const PolicyConfig2 = createVincentPolicy({
  packageName: 'rate-limit' as const,
  abilityParamsSchema: policy2Schema,
  userParamsSchema: userParams2Schema,
  commitParamsSchema: commitParams2Schema,

  // Define schema types explicitly
  precheckAllowResultSchema: policy2PrecheckAllowResult,
  precheckDenyResultSchema: policy2PrecheckDenyResult,
  evalAllowResultSchema: policy2EvalAllowResult,
  evalDenyResultSchema: policy2EvalDenyResult,
  commitAllowResultSchema: policy2CommitAllowResult,
  commitDenyResultSchema: policy2CommitDenyResult,

  precheck: async ({ abilityParams, userParams }, context) => {
    const isWithinLimit = abilityParams.maxAmount <= userParams.limit;

    if (isWithinLimit) {
      return context.allow({ validatedAmount: 1983 });
    } else {
      return context.deny({ limitExceeded: true });
    }
  },

  evaluate: async ({ abilityParams, userParams }, context) => {
    const isValidCurrency = ['USD', 'EUR', 'GBP'].includes(abilityParams.currency);
    const isWithinLimit = abilityParams.maxAmount <= userParams.limit;

    if (isValidCurrency && isWithinLimit) {
      return context.allow({ approvedCurrency: abilityParams.currency });
    } else {
      const reason = !isValidCurrency
        ? `Currency ${abilityParams.currency} is not supported`
        : `Amount ${abilityParams.maxAmount} exceeds limit ${userParams.limit}`;

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

const policy2 = createVincentAbilityPolicy({
  abilityParamsSchema: myAbilitySchema,
  bundledVincentPolicy: asBundledVincentPolicy(
    PolicyConfig2,
    'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG' as const,
  ),
  abilityParameterMappings: {
    amount: 'maxAmount',
    action: 'currency',
  },
});

// Define schemas for policy3
const policy3AbilityParams = z.object({
  abilityName: z.string(),
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
const PolicyConfig3 = createVincentPolicy({
  packageName: 'vincent-ability-sdk' as const,
  abilityParamsSchema: policy3AbilityParams,
  userParamsSchema: policy3UserParams,
  evalAllowResultSchema: policy3EvalAllowResult,
  evalDenyResultSchema: policy3EvalDenyResult,

  commit: async (_, { deny, allow }) => {
    return allow();
  },

  // Only has evaluate, no precheck or commit
  evaluate: async ({ abilityParams, userParams }, context) => {
    // Policy logic: Allow only premium and admin users
    if (userParams.accessLevel === 'basic') {
      return context.deny({
        reason: 'Basic users cannot access this ability',
        suggestedAccessLevel: 'premium',
        numberOfTries: 1,
      });
    }

    return context.allow({
      message: `Access granted to ${abilityParams.abilityName}`,
      timedate: new Date(),
    });
  },
});

const policy3 = createVincentAbilityPolicy({
  abilityParamsSchema: myAbilitySchema,
  bundledVincentPolicy: asBundledVincentPolicy(
    PolicyConfig3,
    'QmYwAasdPJzv5CZA625s3Xf2nemtYgPpHdWEz79ojWnPbdG' as const,
  ),
  abilityParameterMappings: {
    amount: 'abilityName',
  },
});

const abilityExecuteSuccessSchema = z.object({
  executedAction: z.string(),
  targetAddress: z.string(),
  transactionAmount: z.number(),
  timestamp: z.number(),
  txHash: z.string(),
});

const abilityExecuteFailSchema = z.object({
  errorCode: z.number(),
  errorMessage: z.string(),
  suggestion: z.string().optional(),
});

const abilityPrecheckSuccessSchema = z.object({
  validatedParams: z.boolean(),
  message: z.string(),
});

const abilityPrecheckFailSchema = z.object({
  invalidField: z.string(),
  reason: z.string(),
});

// Create your ability with fully typed policies
export const myAbility = createVincentAbility({
  packageName: '@lit-protocol/awesome-ability@1.0.2',
  abilityDescription: 'Awesome Ability',
  abilityParamsSchema: myAbilitySchema,
  supportedPolicies: supportedPoliciesForAbility([policy1, policy2, policy3]),

  // Add schemas for ability results
  executeSuccessSchema: abilityExecuteSuccessSchema,
  executeFailSchema: abilityExecuteFailSchema,
  precheckSuccessSchema: abilityPrecheckSuccessSchema,
  precheckFailSchema: abilityPrecheckFailSchema,

  precheck: async (
    { abilityParams },
    { fail, policiesContext: { allow, allowedPolicies, deniedPolicy }, succeed },
  ) => {
    // Basic validation
    if (!abilityParams.action || !abilityParams.target) {
      return fail({
        invalidField: !abilityParams.action ? 'action' : 'target',
        reason: 'Required field is empty or missing',
      });
    }

    // Amount validation
    if (abilityParams.amount <= 0) {
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
      const abilitySdkResults = allowedPolicies['vincent-ability-sdk'];

      if (abilitySdkResults) {
        const policy3Result = abilitySdkResults.result;
        console.log(policy3Result);
      }

      // Return success result
      return succeed({
        validatedParams: true,
        message: `All parameters validated for ${abilityParams.action} on ${abilityParams.target}`,
      });
    } else {
      // Handle the denial case
      const denyReason = deniedPolicy.runtimeError || 'Policy check failed';

      return fail({
        invalidField: 'policy',
        reason: denyReason,
      });
    }
  },

  execute: async ({ abilityParams }, { policiesContext, fail, succeed }) => {
    try {
      // Simulate successful execution
      if (abilityParams.action === 'transfer' && abilityParams.amount > 0) {
        // Execute the transaction
        const txHash = `0x${Math.random().toString(16).substring(2, 10)}`;

        // Use commit functions from policies if available
        const extraRateLimitPolicyContext = policiesContext.allowedPolicies['extra-rate-limit'];
        if (extraRateLimitPolicyContext) {
          const commitResult = await extraRateLimitPolicyContext.commit({
            confirmation: true,
          });
          console.log(commitResult);
        }

        const rateLimitPolicyContext = policiesContext.allowedPolicies['rate-limit'];
        if (rateLimitPolicyContext) {
          const commitResult = await rateLimitPolicyContext.commit({
            transactionId: txHash,
          });
          console.log(commitResult);
        }
        const abilitySdkPolicyContext = policiesContext.allowedPolicies['vincent-ability-sdk'];
        if (abilitySdkPolicyContext) {
          const commitResult = await abilitySdkPolicyContext.commit();

          const wat: boolean = commitResult.allow;
          console.log(wat);
          if (commitResult.allow) {
            console.log(commitResult.result);
          }
        }

        // Return success with typed result
        return succeed({
          executedAction: abilityParams.action,
          targetAddress: abilityParams.target,
          transactionAmount: abilityParams.amount,
          timestamp: Date.now(),
          txHash,
        });
      } else {
        // Simulate a failure case
        return fail({
          errorCode: 400,
          errorMessage: `Cannot perform ${abilityParams.action} operation`,
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
  await policy3.vincentPolicy.evaluate(
    {
      abilityParams: {
        abilityName: 'wat',
        maxUsage: 2383,
      },
      userParams: { userAddress: 'meow', accessLevel: 'basic' },
    },
    {
      delegation: {
        delegateeAddress: 'meow',
        delegatorPkpInfo: {
          tokenId: '90128301832',
          ethAddress: '0x102398103981032',
          publicKey: '0398103810938ef987ef978fe987ef',
        },
      },
      abilityIpfsCid: 'oijskljfdj',
      appId: 123123,
      appVersion: 123,
    },
  );

  if (policy2.vincentPolicy.commit) {
    return policy2.vincentPolicy.commit(
      {
        transactionId: '10981328981279487',
      },
      {
        abilityIpfsCid: 'oijskljfdj',
        appId: 123123,
        appVersion: 123,
        delegation: {
          delegateeAddress: 'meow',
          delegatorPkpInfo: {
            tokenId: '90128301832',
            ethAddress: '0x102398103981032',
            publicKey: '0398103810938ef987ef978fe987ef',
          },
        },
      },
    );
  }
  return true;
};

export const gogo = async function () {
  const abilityExecuteResult = await myAbility.execute(
    { abilityParams: { action: 'wat', target: 'meow', amount: 23098123 } },
    {
      abilityIpfsCid: 'oijskljfdj',
      appId: 123123,
      appVersion: 123,
      delegation: {
        delegateeAddress: 'meow',
        delegatorPkpInfo: {
          tokenId: '90128301832',
          ethAddress: '0x102398103981032',
          publicKey: '0398103810938ef987ef978fe987ef',
        },
      },
      policiesContext: {
        allow: true,
        evaluatedPolicies: ['extra-rate-limit', 'rate-limit'],
        allowedPolicies: {
          'extra-rate-limit': {
            // @ts-expect-error result for this policy is a string
            result: { this_is_wrong: true },
          },
          'rate-limit': {
            result: {
              approvedCurrency: 'USD',
            },
            commit: async (params) => {
              if (!params.transactionId.includes('fail')) {
                return createAllowResult({
                  result: {
                    transaction: `completed-${params.transactionId}`,
                    timestamp: 1700000000000,
                  },
                });
              } else {
                return createDenyResult({
                  result: {
                    failureReason: 'Invalid transaction ID format',
                  },
                });
              }
            },
          },
        },
      },
    },
  );

  console.log(abilityExecuteResult);

  if (myAbility.precheck) {
    await myAbility.precheck(
      { abilityParams: { action: 'wat', target: 'meow', amount: 23098123 } },
      {
        abilityIpfsCid: 'oijskljfdj',
        appId: 123123,
        appVersion: 123,
        delegation: {
          delegateeAddress: 'meow',
          delegatorPkpInfo: {
            tokenId: '90128301832',
            ethAddress: '0x102398103981032',
            publicKey: '0398103810938ef987ef978fe987ef',
          },
        },
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
