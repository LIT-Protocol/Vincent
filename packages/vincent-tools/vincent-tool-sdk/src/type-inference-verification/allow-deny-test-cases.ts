/**
 * Allow/Deny Test Cases
 *
 * This file contains test cases specifically for testing the allow() and deny() functions
 * in different policy contexts. Each function directly calls these methods with various
 * arguments to verify TypeScript correctly enforces the type constraints.
 */
import { z } from 'zod';
import {
  createVincentPolicy,
  createVincentToolPolicy,
} from '../lib/vincentPolicy';

// Base tool schema for all tests
const baseToolSchema = z.object({
  action: z.string(),
  target: z.string(),
  amount: z.number(),
});
/**
 * Test Case 1: Testing allow() with different result types
 */
function testAllowFunctionWithDifferentTypes() {
  // Test with object schema
  const objSchema = z.object({ id: z.string(), success: z.boolean() });

  const test1 = createVincentToolPolicy({
    toolParamsSchema: baseToolSchema,
    policyDef: {
      ipfsCid: 'allowTest1',
      package: '@lit-protocol/test-policy-allow@1.0.0',
      toolParamsSchema: z.object({ actionType: z.string() }),
      evalAllowResultSchema: objSchema,

      evaluate: async (params, { allow }) => {
        // These calls demonstrate TypeScript errors for testing type constraints

        // @ts-expect-error - No arguments when schema exists
        allow();

        // @ts-expect-error - Wrong type (number instead of object)
        allow(123);

        // @ts-expect-error - Wrong type (string instead of object)
        allow('not an object');

        // @ts-expect-error - Wrong shape (missing required fields)
        allow({});

        // @ts-expect-error - Wrong shape (extra fields)
        allow({ id: 'test', success: true, extra: 'field' });

        // Valid - matches schema
        return allow({ id: 'test-id', success: true });
      },
    },
    toolParameterMappings: {
      action: 'actionType',
    },
  });

  // Test with string schema
  const test2 = createVincentToolPolicy({
    toolParamsSchema: baseToolSchema,
    policyDef: {
      ipfsCid: 'allowTest2',
      package: '@lit-protocol/test-policy-allow-string@1.0.0',
      toolParamsSchema: z.object({ actionType: z.string() }),
      evalAllowResultSchema: z.string(),

      evaluate: async (params, { allow }) => {
        // @ts-expect-error - No arguments when schema exists
        allow();

        // @ts-expect-error - Wrong type (number instead of string)
        allow(123);

        // @ts-expect-error - Wrong type (object instead of string)
        allow({ some: 'object' });

        // Valid - matches string schema
        return allow('success');
      },
    },
    toolParameterMappings: {
      action: 'actionType',
    },
  });

  // Test with number schema
  const test3 = createVincentToolPolicy({
    toolParamsSchema: baseToolSchema,
    policyDef: {
      ipfsCid: 'allowTest3',
      package: '@lit-protocol/test-policy-allow-number@1.0.0',
      toolParamsSchema: z.object({ actionType: z.string() }),
      evalAllowResultSchema: z.number(),

      evaluate: async (params, { allow }) => {
        // @ts-expect-error - No arguments when schema exists
        allow();

        // @ts-expect-error - Wrong type (string instead of number)
        allow('not a number');

        // @ts-expect-error - Wrong type (object instead of number)
        allow({ value: 123 });

        // Valid - matches number schema
        return allow(123);
      },
    },
    toolParameterMappings: {
      action: 'actionType',
    },
  });

  // Test with no schema
  const test4 = createVincentToolPolicy({
    toolParamsSchema: baseToolSchema,
    policyDef: {
      ipfsCid: 'allowTest4',
      package: '@lit-protocol/test-policy-no-schema@1.0.0',
      toolParamsSchema: z.object({ actionType: z.string() }),
      // No schema defined

      evaluate: async (params, { allow }) => {
        // Valid - no schema means no args
        allow();

        // @ts-expect-error - Any arg should error when no schema
        allow('should error');

        // @ts-expect-error - Any arg should error when no schema
        allow(123);

        // @ts-expect-error - Any arg should error when no schema
        allow({ should: 'error' });

        // Valid case to return
        return allow();
      },
    },
    toolParameterMappings: {
      action: 'actionType',
    },
  });

  return { test1, test2, test3, test4 };
}
/**
 * Test Case 2: Testing deny() with different result types
 */
function testDenyFunctionWithDifferentTypes() {
  // Test with object schema
  const objSchema = z.object({ code: z.number(), message: z.string() });

  const testPolicyDef = createVincentPolicy({
    ipfsCid: 'denyTest1',
    package: '@lit-protocol/test-policy-deny@1.0.0',
    toolParamsSchema: z.object({ actionType: z.string() }),
    evalDenyResultSchema: objSchema,

    evaluate: async (params, { deny }) => {
      // Direct calls to deny with various arguments

      // @ts-expect-error - No object when schema exists
      deny('string only error');

      // @ts-expect-error - Wrong type (number instead of object)
      deny(123);

      // @ts-expect-error - Wrong shape (missing required fields)
      deny({});

      // @ts-expect-error - Wrong shape (missing message field)
      deny({ code: 400 });

      // @ts-expect-error - Wrong shape (missing code field)
      deny({ message: 'Error message' });

      // Valid - matches schema, with additional error message
      deny({ code: 400, message: 'Bad request' }, 'Additional context');

      // Valid - matches schema, without additional error message
      return deny({ code: 403, message: 'Forbidden' });
    },
  });

  const test1 = createVincentToolPolicy({
    toolParamsSchema: baseToolSchema,
    policyDef: testPolicyDef,
    toolParameterMappings: {
      action: 'actionType',
    },
  });

  // Test with string schema
  const test2 = createVincentToolPolicy({
    toolParamsSchema: baseToolSchema,
    policyDef: {
      ipfsCid: 'denyTest2',
      package: '@lit-protocol/test-policy-deny-string@1.0.0',
      toolParamsSchema: z.object({ actionType: z.string() }),
      evalDenyResultSchema: z.string(),

      evaluate: async (params, { deny }) => {
        // @ts-expect-error - Wrong type (number instead of string)
        deny(123);

        // @ts-expect-error - Wrong type (object instead of string)
        deny({ some: 'object' });

        // String is valid both for schema and error message
        // Should not error when it's a string only
        deny('This is both result and error');

        // Valid with a result and additional error
        return deny('Result string', 'Additional error context');
      },
    },
    toolParameterMappings: {
      action: 'actionType',
    },
  });

  // Test with no schema
  const test3 = createVincentToolPolicy({
    toolParamsSchema: baseToolSchema,
    policyDef: {
      ipfsCid: 'denyTest3',
      package: '@lit-protocol/test-policy-deny-no-schema@1.0.0',
      toolParamsSchema: z.object({ actionType: z.string() }),
      // No schema defined

      evaluate: async (params, { deny }) => {
        // Valid - string error is allowed with no schema
        deny('Error message');

        // Valid - undefined is allowed (no error message)
        deny();

        // @ts-expect-error - Object not allowed when no schema
        deny({ code: 400 });

        // @ts-expect-error - Number not allowed when no schema
        deny(123);

        // Valid case to return
        return deny('Access denied');
      },
    },
    toolParameterMappings: {
      action: 'actionType',
    },
  });

  return { test1, test2, test3 };
}

/**
 * Test Case 3: Test allow/deny in commit function specifically
 */
function testCommitAllowDeny() {
  const policy = createVincentToolPolicy({
    toolParamsSchema: baseToolSchema,
    policyDef: {
      ipfsCid: 'commitTest',
      package: '@lit-protocol/test-policy-commit@1.0.0',
      toolParamsSchema: z.object({ actionType: z.string() }),

      // Commit requires a params schema
      commitParamsSchema: z.object({ confirmationId: z.string() }),
      commitAllowResultSchema: z.object({ txId: z.string() }),
      commitDenyResultSchema: z.object({ errorCode: z.number() }),

      // Basic evaluate
      evaluate: async (params, { allow }) => {
        return allow();
      },

      // Test commit allow/deny
      commit: async (params, { allow, deny }) => {
        // Type inference for params should work
        const id = params.confirmationId;

        if (id.startsWith('valid')) {
          // Example of what would cause a TypeScript error:
          // @ts-expect-error - Wrong type
          allow('not an object');

          // @ts-expect-error - missing response
          allow();

          // Valid - matches schema
          return allow({ txId: `tx-${id}` });
        } else {
          // Example of what would cause a TypeScript error:
          // @ts-expect-error - Wrong shape
          deny({ wrong: 'shape' });

          // Valid - matches schema
          return deny({ errorCode: 500 }, 'Invalid confirmation ID');
        }
      },
    },
    toolParameterMappings: {
      action: 'actionType',
    },
  });

  return policy;
}

// Export test functions
export {
  testAllowFunctionWithDifferentTypes,
  testDenyFunctionWithDifferentTypes,
  testCommitAllowDeny,
};
