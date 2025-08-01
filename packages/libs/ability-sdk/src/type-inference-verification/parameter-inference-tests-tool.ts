// src/type-inference-verification/parameter-inference-tests-ability.ts

/**
 * Ability Parameter Type Inference Testing
 *
 * This file tests the TypeScript type inference for ability parameters,
 * policy results, and context manipulation.
 */
import { z } from 'zod';

import { supportedPoliciesForAbility } from '../lib/abilityCore/helpers';
import { createVincentAbility } from '../lib/abilityCore/vincentAbility';
import { asBundledVincentPolicy } from '../lib/policyCore/bundledPolicy/bundledPolicy';
import { createVincentPolicy, createVincentAbilityPolicy } from '../lib/policyCore/vincentPolicy';

// Define a schema for our test cases
const testSchema = z.object({
  action: z.string(),
  target: z.string(),
  options: z
    .object({
      priority: z.number().optional(),
      dryRun: z.boolean().optional(),
    })
    .optional(),
});
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Test Case 1: Basic parameter type inference
 */
function testBasicParameterInference() {
  // Create a simple policy for testing
  const basicParamInferPolicy = createVincentPolicy({
    packageName: '@lit-protocol/test-policy@1.0.0',
    abilityParamsSchema: z.object({
      operation: z.string(),
    }),
    evalAllowResultSchema: z.object({
      allowed: z.boolean(),
    }),
    evaluate: async (_, { allow }) => {
      return allow({ allowed: true });
    },
  });
  const testPolicy = createVincentAbilityPolicy({
    abilityParamsSchema: testSchema,
    bundledVincentPolicy: asBundledVincentPolicy(basicParamInferPolicy, '209oifusfdj' as const),
    abilityParameterMappings: {
      action: 'operation',
    },
  });

  return createVincentAbility({
    packageName: '@lit-protocol/yesability3@1.0.0',
    abilityDescription: 'Yes Ability',
    abilityParamsSchema: testSchema,
    supportedPolicies: supportedPoliciesForAbility([testPolicy]),

    precheck: async ({ abilityParams }, { succeed }) => {
      // Params should have the correct types
      const { action, target, options } = abilityParams;

      // String operations should work on string fields
      action.toUpperCase();
      target.toLowerCase();

      // @ts-expect-error - Using number methods on string
      action.toFixed(2);

      // Optional field access should work
      if (options) {
        const { priority, dryRun } = options;

        // Number operations should work if present
        if (priority !== undefined) {
          priority.toFixed(2);

          // @ts-expect-error - Using string methods on number
          priority.toUpperCase();
        }

        // Boolean operations should work if present
        if (dryRun !== undefined) {
          const isDry = dryRun === true;
          console.log(isDry);

          // @ts-expect-error - Using string methods on boolean
          dryRun.toUpperCase();
        }
      }

      return succeed();
    },

    execute: async ({ abilityParams }, { succeed }) => {
      // Same parameter validation in execute
      const { action, target, options } = abilityParams;
      console.log(target);

      // String operations should work
      action.toUpperCase();

      // @ts-expect-error - Using array methods on string
      action.push('new');

      // Optional fields with correct types
      if (options?.priority) {
        options.priority.toFixed(2);
      }

      return succeed();
    },
  });
}

/**
 * Test Case 2: Policy result type inference
 */
function testPolicyResultInference() {
  // Create a policy with complex result type
  const resultInferPolicy = createVincentPolicy({
    packageName: '@lit-protocol/complex-policy@1.0.0',
    abilityParamsSchema: z.object({
      command: z.string(),
    }),
    evalAllowResultSchema: z.object({
      level: z.enum(['low', 'medium', 'high']),
      metadata: z.object({
        timestamp: z.number(),
        signature: z.string(),
      }),
      flags: z.array(z.string()),
    }),
    evaluate: async (params, { allow }) => {
      return allow({
        level: 'medium',
        metadata: {
          timestamp: Date.now(),
          signature: 'sig123',
        },
        flags: ['verbose', 'secure'],
      });
    },
  });
  const complexPolicy = createVincentAbilityPolicy({
    abilityParamsSchema: testSchema,
    bundledVincentPolicy: asBundledVincentPolicy(resultInferPolicy, '-0932i0fjs0jfd' as const),
    abilityParameterMappings: {
      action: 'command',
    },
  });

  // Create policy with commit function
  const commitResultPolicy = createVincentPolicy({
    packageName: '@lit-protocol/commit-policy@1.0.0',
    abilityParamsSchema: z.object({
      resource: z.string(),
    }),
    evalAllowResultSchema: z.object({
      transactionId: z.string(),
    }),
    commitParamsSchema: z.object({
      transactionId: z.string(),
      status: z.enum(['complete', 'abort']),
    }),
    commitAllowResultSchema: z.object({
      success: z.boolean(),
      timestamp: z.number(),
    }),
    evaluate: async (params, { allow }) => {
      return allow({
        transactionId: 'tx123',
      });
    },
    commit: async (params, { allow }) => {
      return allow({
        success: params.status === 'complete',
        timestamp: Date.now(),
      });
    },
  });
  const commitPolicy = createVincentAbilityPolicy({
    abilityParamsSchema: testSchema,
    bundledVincentPolicy: asBundledVincentPolicy(commitResultPolicy, '1098u2098qjfn' as const),
    abilityParameterMappings: {
      target: 'resource',
    },
  });

  return createVincentAbility({
    packageName: '@lit-protocol/abilityPlusPlus@1.0.0',
    abilityDescription: 'Plus Plus Ability',
    abilityParamsSchema: testSchema,
    supportedPolicies: supportedPoliciesForAbility([complexPolicy, commitPolicy]),

    precheck: async (params, { policiesContext, succeed }) => {
      // Testing allow/deny branch type inference
      if (policiesContext.allow) {
        // When allowed, policy results should be accessible
        if (policiesContext.allowedPolicies['@lit-protocol/complex-policy@1.0.0']) {
          const { level, metadata, flags } =
            policiesContext.allowedPolicies['@lit-protocol/complex-policy@1.0.0'].result;

          // Enum type should be correctly inferred
          switch (level) {
            case 'low':
            case 'medium':
            case 'high':
              break;
            // @ts-expect-error - Invalid enum value
            case 'invalid':
              break;
          }

          // Nested objects should be correctly typed
          const { timestamp, signature } = metadata;
          timestamp.toFixed(0);
          signature.toUpperCase();

          // @ts-expect-error - Using wrong method type
          timestamp.toUpperCase();

          // Arrays should be correctly typed
          flags.forEach((flag) => {
            flag.toUpperCase();
          });

          // @ts-expect-error - flags is string[], not number[]
          flags.map((flag) => flag.toFixed(2));
        }

        // @ts-expect-error - denyPolicyResult shouldn't exist when allowed
        const denyResult = policiesContext.deniedPolicy;
      } else {
        // When denied, denyPolicyResult should exist
        const { packageName, result } = policiesContext.deniedPolicy;
        console.log(packageName, result);
      }

      return succeed();
    },

    execute: async (params, { policiesContext, succeed }) => {
      // Testing commit function type inference
      if (policiesContext.allowedPolicies['@lit-protocol/commit-policy@1.0.0']) {
        const { transactionId } =
          policiesContext.allowedPolicies['@lit-protocol/commit-policy@1.0.0'].result;

        // Commit function should be correctly typed
        const commitFn =
          policiesContext.allowedPolicies['@lit-protocol/commit-policy@1.0.0']?.commit;

        // Valid commit parameters
        const commitResult = await commitFn({
          transactionId,
          status: 'complete',
        });

        await commitFn({
          transactionId,
          // @ts-expect-error - Invalid enum value
          status: 'invalid',
        });

        // @ts-expect-error - Missing required parameter
        await commitFn({
          transactionId,
        });

        // Result type checking
        if (commitResult.allow) {
          const { success, timestamp } = commitResult.result;

          // Boolean operations
          const isSuccess = success === true;
          console.log(isSuccess);

          // Number operations
          timestamp.toFixed(0);

          // @ts-expect-error - Using wrong method
          success.toFixed(0);
        }
      }

      return succeed();
    },
  });
}

/**
 * Test Case 3: Complex destructuring and inference
 */
function testComplexDestructuring() {
  // Create a simple policy
  const complexDestructurePolicy = createVincentPolicy({
    packageName: '@lit-protocol/test-policy@1.0.0',
    abilityParamsSchema: z.object({
      action: z.string(),
    }),
    evalAllowResultSchema: z.object({
      data: z.any(),
    }),
    evaluate: async (params, { allow }) => {
      return allow({ data: {} });
    },
  });
  const testPolicy = createVincentAbilityPolicy({
    abilityParamsSchema: testSchema,
    bundledVincentPolicy: asBundledVincentPolicy(
      complexDestructurePolicy,
      '1-093iofijn209j' as const,
    ),
    abilityParameterMappings: {
      action: 'action',
    },
  });

  // Define success and failure schemas
  const successSchema = z.object({
    result: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
    metadata: z.record(z.string()),
  });

  const failSchema = z.object({
    error: z.object({
      code: z.number(),
      message: z.string(),
    }),
  });

  return createVincentAbility({
    packageName: '@lit-protocol/abilityPlus@1.0.0',
    abilityDescription: 'Plus Ability',
    abilityParamsSchema: testSchema,
    supportedPolicies: supportedPoliciesForAbility([testPolicy]),
    executeSuccessSchema: successSchema,
    executeFailSchema: failSchema,

    precheck: async (params, { succeed }) => {
      return succeed();
    },

    execute: async (params, { succeed, fail }) => {
      // Validate that types are preserved through destructuring

      // Check complex union type handling
      succeed({
        // String is valid in the union
        result: 'string result',
        metadata: { source: 'test' },
      });

      succeed({
        // Number is valid in the union
        result: 123,
        metadata: { source: 'test' },
      });

      succeed({
        // Array of strings is valid in the union
        result: ['one', 'two', 'three'],
        metadata: { source: 'test' },
      });

      succeed({
        // @ts-expect-error - Object is not in the union
        result: { key: 'value' },
        metadata: { source: 'test' },
      });

      succeed({
        // @ts-expect-error - Array of numbers is not in the union
        result: [1, 2, 3],
        metadata: { source: 'test' },
      });

      // Test complex nested object validation
      fail({
        error: {
          code: 500,
          message: 'Internal error',
        },
      });

      fail({
        error: {
          code: 400,
          message: 'Bad request',
        },
      });

      fail({
        error: {
          // @ts-expect-error - Wrong type for code
          code: '400', // Should be number
          message: 'Bad request',
        },
      });

      fail({
        // @ts-expect-error - Missing required message
        error: {
          code: 400,
        },
      });

      return succeed({
        result: 'final result',
        metadata: { status: 'complete' },
      });
    },
  });
}

/**
 * Test Case 4: Advanced parameter validation
 */
function testAdvancedParameterValidation() {
  // Create a schema with complex types
  const advancedSchema = z.object({
    action: z.enum(['create', 'read', 'update', 'delete']),
    target: z.string().regex(/^[a-z0-9-]+$/),
    data: z
      .union([
        z.object({ type: z.literal('string'), value: z.string() }),
        z.object({ type: z.literal('number'), value: z.number() }),
        z.object({ type: z.literal('boolean'), value: z.boolean() }),
      ])
      .optional(),
    metadata: z.record(z.string()).optional(),
  });

  // Create a policy
  const advancedParamPolicy = createVincentPolicy({
    packageName: '@lit-protocol/test-policy@1.0.0',
    abilityParamsSchema: z.object({
      op: z.string(),
    }),
    evalAllowResultSchema: z.boolean(),
    evaluate: async (params, { allow }) => {
      return allow(true);
    },
  });
  const testPolicy = createVincentAbilityPolicy({
    abilityParamsSchema: advancedSchema,
    bundledVincentPolicy: asBundledVincentPolicy(advancedParamPolicy, '1-093iofijn209j' as const),
    abilityParameterMappings: {
      action: 'op',
    },
  });

  return createVincentAbility({
    packageName: '@lit-protocol/plusplusability@1.0.0',
    abilityDescription: 'Plus Plus Ability',
    abilityParamsSchema: advancedSchema,
    supportedPolicies: supportedPoliciesForAbility([testPolicy]),

    precheck: async ({ abilityParams }, { succeed }) => {
      // Test enum type inference
      const { action } = abilityParams;

      // Valid enum values should be allowed
      switch (action) {
        case 'create':
        case 'read':
        case 'update':
        case 'delete':
          break;
        // @ts-expect-error - Invalid enum value
        case 'invalid':
          break;
      }

      // Test discriminated union type inference
      if (abilityParams.data) {
        // TypeScript should narrow based on the 'type' field
        switch (abilityParams.data.type) {
          case 'string':
            // Value should be a string when type is 'string'
            abilityParams.data.value.toUpperCase();
            // @ts-expect-error - Not a number operation
            abilityParams.data.value.toFixed(2);
            break;

          case 'number':
            // Value should be a number when type is 'number'
            abilityParams.data.value.toFixed(2);
            // @ts-expect-error - Not a string operation
            abilityParams.data.value.toUpperCase();
            break;

          case 'boolean': {
            // Value should be a boolean when type is 'boolean'
            const isTrue = abilityParams.data.value === true;
            console.log(isTrue);
            // @ts-expect-error - Not a string operation
            params.data.value.toUpperCase();
            break;
          }
        }
      }

      return succeed();
    },

    execute: async ({ abilityParams }, { succeed }) => {
      // Further test discriminated union handling
      if (abilityParams.data) {
        const { type, value } = abilityParams.data;

        if (type === 'string') {
          // String operations
          value.includes('test');
        } else if (type === 'number') {
          // Number operations
          value.toFixed(2);
          // @ts-expect-error - Not available on number
          value.includes('test');
        } else if (type === 'boolean') {
          // Boolean operations
          const isFalse = !value;
          console.log(isFalse);
          // @ts-expect-error - Not available on boolean
          value.toFixed(2);
        }
      }

      return succeed();
    },
  });
}

/**
 * Test Case 5: Validating missing types cause errors
 */
function testMissingTypes() {
  // Create a policy
  const missingTypesPolicy = createVincentPolicy({
    packageName: '@lit-protocol/test-policy@1.0.0',
    abilityParamsSchema: z.object({ op: z.string() }),
    evalAllowResultSchema: z.object({ data: z.string() }),
    evaluate: async (_, { allow }) => {
      return allow({ data: 'test' });
    },
  });
  const testPolicy = createVincentAbilityPolicy({
    abilityParamsSchema: testSchema,
    bundledVincentPolicy: asBundledVincentPolicy(missingTypesPolicy, '20198jfgnfj' as const),
    abilityParameterMappings: { action: 'op' },
  });

  // Define result schema
  const successSchema = z.object({
    result: z.string(),
  });

  // Case where success schema is defined but fail schema is not
  const abilityWithOnlySuccessSchema = createVincentAbility({
    packageName: '@lit-protocol/abilityofglory@1.0.0',
    abilityDescription: 'Glory Ability',
    abilityParamsSchema: testSchema,
    supportedPolicies: supportedPoliciesForAbility([testPolicy]),
    executeSuccessSchema: successSchema,

    precheck: async (_, { succeed }) => {
      return succeed();
    },

    execute: async (_, { succeed, fail }) => {
      // Should be able to succeed with schema
      succeed({ result: 'test' });

      // @ts-expect-error Can't return a string when no schema defined
      fail('Error message');

      // @ts-expect-error - Can't fail with an object when no fail schema defined
      fail({ error: 'message' });

      return succeed({ result: 'final' });
    },
  });

  // Case with failSchema but no successSchema
  const failSchema = z.object({
    error: z.string(),
  });

  const abilityWithOnlyFailSchema = createVincentAbility({
    packageName: '@lit-protocol/lets-ability-this@1.0.0',
    abilityDescription: "Let's Ability This",
    abilityParamsSchema: testSchema,
    supportedPolicies: supportedPoliciesForAbility([testPolicy]),
    executeFailSchema: failSchema,

    precheck: async (params, { succeed }) => {
      return succeed();
    },

    execute: async (params, { succeed, fail }) => {
      // Should be able to succeed with no args since no success schema
      succeed();

      // Should be able to fail with schema
      fail({ error: 'test error' });

      // @ts-expect-error - Can't succeed with an object when no success schema defined
      succeed({ result: 'success' });

      return succeed();
    },
  });

  return { abilityWithOnlySuccessSchema, abilityWithOnlyFailSchema };
}

// Export all test cases
export {
  testBasicParameterInference,
  testPolicyResultInference,
  testComplexDestructuring,
  testAdvancedParameterValidation,
  testMissingTypes,
};
