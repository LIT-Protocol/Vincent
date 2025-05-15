/**
 * Schema Test File
 *
 * This file contains minimal test cases to verify that type checking
 * is working correctly for the allow() and deny() methods with various
 * schema configurations.
 */
import { z } from 'zod';
import { createVincentToolPolicy } from '../lib/policyCore/vincentPolicy';
import { PolicyContext } from '../lib/policyCore/policyContext/types';

// Base tool schema for all tests
const baseToolSchema = z.object({
  action: z.string(),
  target: z.string(),
  amount: z.number(),
});

/**
 * Test 1: With Schema
 *
 * This test verifies that TypeScript properly enforces schema constraints
 * when schemas are provided.
 */
const objSchema = z.object({ id: z.string() });

// Function signature to test types on a PolicyContext
export function testContextSignature(context: PolicyContext<typeof objSchema, undefined>) {
  // @ts-expect-error Should error - no args with schema
  context.allow();

  // @ts-expect-error Should error - wrong type
  context.allow('not an object');

  // @ts-expect-error Should error - wrong shape
  context.allow({ notId: 'wrong property' });

  // Valid - matches schema
  return context.allow({ id: 'valid-id' });
}

// Test in a real policy
export const testRealPolicy = createVincentToolPolicy({
  toolParamsSchema: baseToolSchema,
  policyDef: {
    ipfsCid: 'test1',
    packageName: '@lit-protocol/schema-test-policy@1.0.0',
    toolParamsSchema: z.object({ actionType: z.string() }),
    evalAllowResultSchema: objSchema,

    evaluate: async (params, { allow }) => {
      // These cause TypeScript errors:
      // @ts-expect-error - No args when schema exists
      allow();

      // @ts-expect-error - Wrong type
      allow(123);

      // @ts-expect-error - Wrong shape
      allow({ wrong: 'field' });

      // Valid case:
      return allow({ id: 'test-id' });
    },
  },
  toolParameterMappings: {
    action: 'actionType',
  },
});

/**
 * Test 2: Without Schema
 *
 * This test verifies that TypeScript properly enforces constraints
 * when no schemas are provided (no args for allow, string or no args for deny).
 */
export function testWithoutSchema() {
  // Function signature to test types on a PolicyContext
  function testContextSignature(context: PolicyContext<undefined, undefined>) {
    // Valid - no schema means no args
    context.allow();

    // @ts-expect-error Should error - no schema means no args allowed
    context.allow('no schema');

    // @ts-expect-error Should error - no schema means no args allowed
    context.allow({ no: 'schema' });

    // Valid - string error is allowed with no schema
    context.deny('Error message');

    // Valid - no args is allowed
    return context.deny();
  }
  testContextSignature.touch = true; // Avoid 'function is never referenced ts error breaking our inference test

  // Test in a real policy
  return createVincentToolPolicy({
    toolParamsSchema: baseToolSchema,
    policyDef: {
      ipfsCid: 'test2',
      packageName: '@lit-protocol/schema-test-policy@1.0.0',
      toolParamsSchema: z.object({ actionType: z.string() }),
      // No schemas defined

      evaluate: async (params, { allow, deny }) => {
        // These cause TypeScript errors:
        // @ts-expect-error - Cannot accept arguments when no schema
        allow('not allowed');

        // @ts-expect-error - Cannot accept arguments when no schema
        allow(123);

        // @ts-expect-error - Cannot accept object when no schema
        allow({ not: 'allowed' });

        // @ts-expect-error - Object not allowed for deny without schema
        deny({ not: 'allowed' });

        // Valid cases - only one will be returned
        if (Math.random() > 0.5) {
          return allow();
        } else {
          return deny('Error message');
        }
      },
    },
    toolParameterMappings: {
      action: 'actionType',
    },
  });
}

/**
 * Test 3: String Schema
 *
 * This test verifies handling of string schemas, which are a special case.
 */
export function testStringSchema() {
  // Test in a real policy
  return createVincentToolPolicy({
    toolParamsSchema: baseToolSchema,
    policyDef: {
      ipfsCid: 'test3',
      packageName: '@lit-protocol/schema-test-policy@1.0.0',
      toolParamsSchema: z.object({ actionType: z.string() }),
      evalAllowResultSchema: z.string(),
      evalDenyResultSchema: z.string(),

      evaluate: async (params, { allow, deny }) => {
        // These cause TypeScript errors:
        // @ts-expect-error - No args when schema exists
        allow();

        // @ts-expect-error - Wrong type (number not string)
        allow(123);

        // @ts-expect-error - Wrong type (object not string)
        allow({ not: 'a string' });

        // @ts-expect-error - No args when schema exists
        deny();

        // @ts-expect-error - Wrong type (object not string)
        deny({ not: 'a string' });

        // Valid cases - only one will be returned
        if (Math.random() > 0.5) {
          return allow('Success message');
        } else {
          return deny('Error message');
        }
      },
    },
    toolParameterMappings: {
      action: 'actionType',
    },
  });
}

/**
 * Test 4: Different Contexts
 *
 * This test verifies that different schemas are enforced correctly
 * in different contexts (precheck, evaluate, commit).
 */
export function testDifferentContexts() {
  // Different schemas for different contexts
  const precheckSchema = z.object({ validCheck: z.boolean() });
  const evalSchema = z.object({ status: z.string() });
  const commitSchema = z.object({ txId: z.string() });

  return createVincentToolPolicy({
    toolParamsSchema: baseToolSchema,
    policyDef: {
      ipfsCid: 'test4',
      packageName: '@lit-protocol/schema-test-policy@1.0.0',
      toolParamsSchema: z.object({ actionType: z.string() }),

      // Define different schemas for different contexts
      precheckAllowResultSchema: precheckSchema,
      evalAllowResultSchema: evalSchema,

      commitParamsSchema: z.object({ confirmation: z.string() }),
      commitAllowResultSchema: commitSchema,

      precheck: async (params, { allow }) => {
        // These cause TypeScript errors:
        // @ts-expect-error - Wrong schema (using evaluate schema)
        allow({ status: 'wrong context' });

        // @ts-expect-error - Wrong schema (using commit schema)
        allow({ txId: 'wrong context' });

        // Valid for precheck
        return allow({ validCheck: true });
      },

      evaluate: async (params, { allow }) => {
        // These cause TypeScript errors:
        // @ts-expect-error - Wrong schema (using precheck schema)
        allow({ validCheck: true });

        // @ts-expect-error - Wrong schema (using commit schema)
        allow({ txId: 'wrong context' });

        // Valid for evaluate
        return allow({ status: 'approved' });
      },

      commit: async (params, { allow }) => {
        // Should have the right parameter type
        const confirmation = params.confirmation;

        // These cause TypeScript errors:
        // @ts-expect-error - Wrong schema (using precheck schema)
        allow({ validCheck: true });

        // @ts-expect-error - Wrong schema (using evaluate schema)
        allow({ status: 'wrong context' });

        // Valid for commit
        return allow({ txId: `tx-${confirmation}` });
      },
    },
    toolParameterMappings: {
      action: 'actionType',
    },
  });
}

/**
 * Test 5: Number and Boolean Schemas
 *
 * This test verifies that number and boolean schemas work correctly.
 */
export function testPrimitiveSchemas() {
  // Test in a real policy
  return createVincentToolPolicy({
    toolParamsSchema: baseToolSchema,
    policyDef: {
      ipfsCid: 'test5',
      packageName: '@lit-protocol/schema-test-policy@1.0.0',
      toolParamsSchema: z.object({ actionType: z.string() }),
      evalAllowResultSchema: z.number(),
      evalDenyResultSchema: z.boolean(),

      evaluate: async (params, { allow, deny }) => {
        // These cause TypeScript errors:
        // @ts-expect-error - No args when schema exists
        allow();

        // @ts-expect-error - Wrong type (string not number)
        allow('not a number');

        // @ts-expect-error - Wrong type (object not number)
        allow({ value: 123 });

        // @ts-expect-error - No args when schema exists (except string error)
        deny();

        // @ts-expect-error - Wrong type (number not boolean)
        deny(123);

        // Valid cases - only one will be executed
        if (Math.random() > 0.5) {
          return allow(123);
        } else {
          return deny(false, 'Operation failed');
        }
      },
    },
    toolParameterMappings: {
      action: 'actionType',
    },
  });
}
