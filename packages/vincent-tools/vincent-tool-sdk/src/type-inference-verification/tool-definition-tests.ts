/**
 * Tool Definition Tests
 *
 * A focused test file to verify that VincentPolicyEvaluationResults inference works correctly,
 * using a tool with two policies - one simple and one with commit functionality.
 */
import { z } from 'zod';
import { createVincentTool } from '../lib/vincentTool';
import { createVincentToolPolicy } from '../lib/vincentPolicy';

// Base tool schema
const baseToolSchema = z.object({
  action: z.string(),
  target: z.string(),
  amount: z.number(),
});

/**
 * Simple test to verify inference of policy evaluation results
 * with a focus on the commit function type inference.
 */
function testPolicyEvaluationResults() {
  // Policy 1: Simple policy with object result schema
  const simplePolicy = createVincentToolPolicy({
    toolParamsSchema: baseToolSchema,
    policyDef: {
      ipfsCid: 'simple-policy',
      package: '@lit-protocol/simple-policy@1.0.0',
      toolParamsSchema: z.object({
        actionType: z.string(),
        targetId: z.string(),
      }),
      evalAllowResultSchema: z.object({
        approved: z.boolean(),
        reason: z.string(),
      }),

      evaluate: async (params, { allow }) => {
        return allow({
          approved: true,
          reason: `Action ${params.toolParams.actionType} approved`,
        });
      },
    },
    toolParameterMappings: {
      action: 'actionType',
      target: 'targetId',
    },
  });

  // Policy 2: Policy with commit function
  const commitPolicy = createVincentToolPolicy({
    toolParamsSchema: baseToolSchema,
    policyDef: {
      ipfsCid: 'commit-policy',
      package: '@lit-protocol/commit-policy@1.0.0',
      toolParamsSchema: z.object({
        operation: z.string(),
        resource: z.string(),
        value: z.number(),
      }),

      // Evaluation schema
      evalAllowResultSchema: z.object({
        transactionId: z.string(),
        status: z.string(),
      }),

      // Commit phase schemas
      commitParamsSchema: z.object({
        transactionId: z.string(),
        status: z.enum(['complete', 'reject']),
      }),
      commitAllowResultSchema: z.object({
        confirmed: z.boolean(),
        timestamp: z.number(),
      }),

      evaluate: async (params, { allow }) => {
        const txId = `tx-${Date.now()}`;
        return allow({
          transactionId: txId,
          status: 'pending',
        });
      },

      commit: async (params, { allow }) => {
        // Access commit parameters
        const { transactionId, status } = params;

        console.log(transactionId);
        return allow({
          confirmed: status === 'complete',
          timestamp: Date.now(),
        });
      },
    },
    toolParameterMappings: {
      action: 'operation',
      target: 'resource',
      amount: 'value',
    },
  });

  // Define tool result schemas
  const executeSuccessSchema = z.object({
    success: z.boolean(),
    confirmed: z.boolean().optional(),
    timestamp: z.number().optional(),
    message: z.string(),
  });

  const executeFailSchema = z.object({
    errorCode: z.number(),
    errorMessage: z.string(),
  });

  const precheckSuccessSchema = z.object({
    valid: z.boolean(),
    validationMessage: z.string().optional(),
  });

  const precheckFailSchema = z.object({
    valid: z.boolean(),
    issues: z.array(z.string()),
  });

  // Create tool with both policies
  const tool = createVincentTool({
    toolParamsSchema: baseToolSchema,
    supportedPolicies: [simplePolicy, commitPolicy],

    // Add schemas for tool results
    precheckSuccessSchema,
    precheckFailSchema,
    executeSuccessSchema,
    executeFailSchema,

    precheck: async (params, { fail, succeed, policiesContext }) => {
      // Perform basic validation
      if (!params.action || !params.target || params.amount <= 0) {
        const issues = [];

        if (!params.action) issues.push('Missing action');
        if (!params.target) issues.push('Missing target');
        if (params.amount <= 0) issues.push('Amount must be positive');

        return fail({
          valid: false,
          issues,
        });
      }

      return succeed({
        valid: true,
        validationMessage: 'All parameters are valid',
      });
    },

    // Execute function to demonstrate result type inference
    execute: async (params, { fail, succeed, policiesContext }) => {
      try {
        // Verify type inference works correctly when results.allow is true
        // Access specific policy results - now TypeScript knows this is defined
        if (
          policiesContext.allowedPolicies['@lit-protocol/simple-policy@1.0.0']
        ) {
          const simpleResult =
            policiesContext.allowedPolicies['@lit-protocol/simple-policy@1.0.0']
              .result;

          // TypeScript should now correctly infer the result type
          const { approved, reason } = simpleResult;

          console.log(approved, reason);
        }

        // Type inference should work for the commit policy result
        if (
          policiesContext.allowedPolicies['@lit-protocol/commit-policy@1.0.0']
        ) {
          const commitPolicyResult =
            policiesContext.allowedPolicies['@lit-protocol/commit-policy@1.0.0']
              .result;

          // No need for type guards anymore
          const { transactionId, status } = commitPolicyResult;
          console.log(status);

          // The commit function should be available and properly typed
          const commitFn =
            policiesContext.allowedPolicies['@lit-protocol/commit-policy@1.0.0']
              .commit;

          // Call commit with properly typed parameters
          const commitResult = await commitFn({
            transactionId,
            status: 'complete',
          });

          // Type inference should work for commit result
          if (commitResult.allow) {
            const { confirmed, timestamp } = commitResult.result;

            return succeed({
              success: true,
              confirmed,
              timestamp,
              message: 'Operation executed successfully',
            });
          }
        }

        // If we reach here, something went wrong with the commit
        return fail({
          errorCode: 400,
          errorMessage: 'Failed to complete the transaction commit process',
        });
      } catch (error) {
        // Handle any unexpected errors

        return fail({
          errorCode: 500,
          errorMessage: 'Internal execution error',
        });
      }
    },
  });

  return tool;
}

// Export the test function
console.log(testPolicyEvaluationResults);
