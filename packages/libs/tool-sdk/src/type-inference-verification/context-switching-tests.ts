// src/type-inference-verification/context-switching-tests.ts

/**
 * Context Switching Tests
 *
 * This file contains test cases for verifying that the type constraints are
 * properly enforced when switching between different policy function contexts
 * (precheck, evaluate, commit) which may have different schemas.
 */
import { z } from 'zod';

import { asBundledVincentPolicy } from '../lib/policyCore/bundledPolicy/bundledPolicy';
import { createVincentPolicy, createVincentToolPolicy } from '../lib/policyCore/vincentPolicy';

// Base tool schema for all tests
const baseToolSchema = z.object({
  action: z.string(),
  target: z.string(),
  amount: z.number(),
});

/**
 * Test Case 1: Verify different schemas between precheck and evaluate
 */
function testPrecheckEvaluateContextSwitching() {
  // Different schemas for precheck and evaluate
  const precheckAllowSchema = z.object({ prelimStatus: z.string() });
  const precheckDenySchema = z.object({ prelimReason: z.string() });

  const evalAllowSchema = z.object({ finalStatus: z.string() });
  const evalDenySchema = z.object({ finalReason: z.string() });

  const precheckEvalContextSwitchPolicy = createVincentPolicy({
    packageName: '@lit-protocol/test-policy@1.2.3',
    toolParamsSchema: z.object({ actionType: z.string() }),

    // Different schemas for each context
    precheckAllowResultSchema: precheckAllowSchema,
    precheckDenyResultSchema: precheckDenySchema,
    evalAllowResultSchema: evalAllowSchema,
    evalDenyResultSchema: evalDenySchema,

    precheck: async (params, context) => {
      // Test TypeScript errors first
      // @ts-expect-error - Using eval schema in precheck context
      context.allow({ finalStatus: 'wrong-context' });

      // @ts-expect-error - Using eval schema in precheck context
      context.deny({ finalReason: 'wrong-context' });

      // Valid for precheck context
      if (Math.random() > 0.5) {
        return context.allow({ prelimStatus: 'valid' });
      } else {
        return context.deny({ prelimReason: 'invalid-prelim' });
      }
    },

    evaluate: async (params, context) => {
      // Test TypeScript errors first
      // @ts-expect-error - Using precheck schema in evaluate context
      context.allow({ prelimStatus: 'wrong-context' });

      // @ts-expect-error - Using precheck schema in evaluate context
      context.deny({ prelimReason: 'wrong-context' });

      // Valid for evaluate context
      if (Math.random() > 0.5) {
        return context.allow({ finalStatus: 'approved' });
      } else {
        return context.deny({ finalReason: 'denied-final' });
      }
    },
  });
  return createVincentToolPolicy({
    toolParamsSchema: baseToolSchema,
    bundledVincentPolicy: asBundledVincentPolicy(
      precheckEvalContextSwitchPolicy,
      '02u3kjwdsnfs2890hf' as const,
    ),
    toolParameterMappings: {
      action: 'actionType',
    },
  });
}

/**
 * Test Case 2: Verify different schemas between evaluate and commit
 */
function testEvaluateCommitContextSwitching() {
  // Different schemas for evaluate and commit
  const evalAllowSchema = z.object({ approvalId: z.string() });
  const evalDenySchema = z.object({ rejectionReason: z.string() });

  const commitParamsSchema = z.object({ confirmationId: z.string() });
  const commitAllowSchema = z.object({ transactionHash: z.string() });
  const commitDenySchema = z.object({ failureCode: z.number() });

  const evalCommitContextSwitchPolicy = createVincentPolicy({
    packageName: '@lit-protocol/test-policy@1.23.1',
    toolParamsSchema: z.object({ actionType: z.string() }),

    // Different schemas for each context
    evalAllowResultSchema: evalAllowSchema,
    evalDenyResultSchema: evalDenySchema,

    commitParamsSchema: commitParamsSchema,
    commitAllowResultSchema: commitAllowSchema,
    commitDenyResultSchema: commitDenySchema,

    evaluate: async (params, context) => {
      // Test TypeScript errors first
      // @ts-expect-error - Using commit schema in evaluate context
      context.allow({ transactionHash: 'wrong-context' });

      // @ts-expect-error - Using commit schema in evaluate context
      context.deny({ failureCode: 400 });

      // Valid for evaluate context
      if (Math.random() > 0.5) {
        return context.allow({ approvalId: 'approved-123' });
      } else {
        return context.deny({ rejectionReason: 'policy-violation' });
      }
    },

    commit: async (params, context) => {
      // Confirm params inference works
      const confId = params.confirmationId;

      // Test TypeScript errors first
      // @ts-expect-error - Using evaluate schema in commit context
      context.allow({ approvalId: 'wrong-context' });

      // @ts-expect-error - Using evaluate schema in commit context
      context.deny({ rejectionReason: 'wrong-context' });

      // Valid for commit context
      if (confId.startsWith('valid')) {
        return context.allow({ transactionHash: `hash-${confId}` });
      } else {
        return context.deny({ failureCode: 500 }, 'Transaction failed');
      }
    },
  });
  return createVincentToolPolicy({
    toolParamsSchema: baseToolSchema,
    bundledVincentPolicy: asBundledVincentPolicy(
      evalCommitContextSwitchPolicy,
      '048oifjnwfoij3208h' as const,
    ),
    toolParameterMappings: {
      action: 'actionType',
    },
  });
}

/**
 * Test Case 3: Full policy with all three contexts having different schemas
 */
function testFullPolicyContextSwitching() {
  // Different schemas for each context
  const precheckAllowSchema = z.object({ check: z.boolean() });
  const precheckDenySchema = z.object({ checkFailed: z.boolean() });

  const evalAllowSchema = z.object({ granted: z.boolean() });
  const evalDenySchema = z.object({ denied: z.boolean() });

  const commitParamsSchema = z.object({ txId: z.string() });
  const commitAllowSchema = z.object({ completed: z.boolean() });
  const commitDenySchema = z.object({ aborted: z.boolean() });

  const fullPolicyContext = createVincentPolicy({
    packageName: '@lit-protocol/testpolicyawesome@12.1.10',
    toolParamsSchema: z.object({
      actionType: z.string(),
      amount: z.number(),
    }),
    userParamsSchema: z.object({
      limit: z.number(),
    }),

    // All different schemas
    precheckAllowResultSchema: precheckAllowSchema,
    precheckDenyResultSchema: precheckDenySchema,

    evalAllowResultSchema: evalAllowSchema,
    evalDenyResultSchema: evalDenySchema,

    commitParamsSchema: commitParamsSchema,
    commitAllowResultSchema: commitAllowSchema,
    commitDenyResultSchema: commitDenySchema,

    precheck: async ({ toolParams, userParams }, context) => {
      // Test TypeScript errors first
      // @ts-expect-error - Using eval schema in precheck
      context.allow({ granted: true });

      // @ts-expect-error - Using commit schema in precheck
      context.allow({ completed: true });

      // @ts-expect-error - Using eval schema in precheck
      context.deny({ denied: true });

      // @ts-expect-error - Using commit schema in precheck
      context.deny({ aborted: true });

      // Valid for precheck
      if (toolParams.amount <= userParams.limit) {
        return context.allow({ check: true });
      } else {
        return context.deny({ checkFailed: true });
      }
    },

    evaluate: async ({ toolParams, userParams }, context) => {
      // Test TypeScript errors first
      // @ts-expect-error - Using precheck schema in eval
      context.allow({ check: true });

      // @ts-expect-error - Using commit schema in eval
      context.allow({ completed: true });

      // @ts-expect-error - Using precheck schema in eval
      context.deny({ checkFailed: true });

      // @ts-expect-error - Using commit schema in eval
      context.deny({ aborted: true });

      // Valid for eval
      if (toolParams.amount <= userParams.limit) {
        return context.allow({ granted: true });
      } else {
        return context.deny({ denied: true });
      }
    },

    commit: async (params, context) => {
      const id = params.txId;

      // Test TypeScript errors first
      // @ts-expect-error - Using precheck schema in commit
      context.allow({ check: true });

      // @ts-expect-error - Using eval schema in commit
      context.allow({ granted: true });

      // @ts-expect-error - Using precheck schema in commit
      context.deny({ checkFailed: true });

      // @ts-expect-error - Using eval schema in commit
      context.deny({ denied: true });

      // Valid for commit
      if (id.startsWith('valid')) {
        return context.allow({ completed: true });
      } else {
        return context.deny({ aborted: true });
      }
    },
  });
  return createVincentToolPolicy({
    toolParamsSchema: baseToolSchema,
    bundledVincentPolicy: asBundledVincentPolicy(
      fullPolicyContext,
      '908joiun2f928q1hjbfn' as const,
    ),
    toolParameterMappings: {
      action: 'actionType',
      amount: 'amount',
    },
  });
}

// Export test functions
export {
  testPrecheckEvaluateContextSwitching,
  testEvaluateCommitContextSwitching,
  testFullPolicyContextSwitching,
};
