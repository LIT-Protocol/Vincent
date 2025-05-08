/**
 * Parameter Inference Tests
 *
 * Tests to verify TypeScript correctly enforces type constraints
 * on parameters passed to allow() and deny() methods.
 */
import z from 'zod';
import { validateVincentPolicyDef } from './vincentPolicy';

// Base tool schema for all tests
const baseToolSchema = z.object({
  action: z.string(),
  target: z.string(),
  amount: z.number(),
});

/**
 * Test 1: Basic schema validation for allow/deny
 */
function testBasicSchemaValidation() {
  const policy = validateVincentPolicyDef({
    toolParamsSchema: baseToolSchema,
    policyDef: {
      ipfsCid: 'basicSchemaTest',
      toolParamsSchema: z.object({ actionType: z.string() }),

      // Define schemas
      evalAllowResultSchema: z.object({ success: z.boolean() }),
      evalDenyResultSchema: z.object({ errorCode: z.number() }),

      evaluate: async (params, context) => {
        // Test TypeScript errors first
        // @ts-expect-error - No arguments when schema exists
        context.allow();

        // @ts-expect-error - Wrong type (string not matching schema)
        context.allow('not an object');

        // @ts-expect-error - Wrong shape (missing required field)
        context.allow({});

        // Valid call - matches schema
        return context.allow({ success: true });
      },
    },
    toolParameterMappings: {
      action: 'actionType',
    },
  });

  return policy;
}

/**
 * Test 2: No schema case validation
 */
function testNoSchemaValidation() {
  const policy = validateVincentPolicyDef({
    toolParamsSchema: baseToolSchema,
    policyDef: {
      ipfsCid: 'noSchemaTest',
      toolParamsSchema: z.object({ actionType: z.string() }),

      // No schemas defined
      evaluate: async (params, context) => {
        // Test TypeScript errors first
        // @ts-expect-error - No schema means no args allowed
        context.allow('should error');

        // @ts-expect-error - No schema means no object allowed
        context.allow({ shouldError: true });

        // Valid calls - no args for allow with no schema
        // And string error for deny with no schema
        if (Math.random() > 0.5) {
          return context.allow();
        } else {
          return context.deny('Error message');
        }
      },
    },
    toolParameterMappings: {
      action: 'actionType',
    },
  });

  return policy;
}

/**
 * Test 3: String schema validation
 */
function testStringSchemaValidation() {
  const policy = validateVincentPolicyDef({
    toolParamsSchema: baseToolSchema,
    policyDef: {
      ipfsCid: 'stringSchemaTest',
      toolParamsSchema: z.object({ actionType: z.string() }),

      // String schema
      evalAllowResultSchema: z.string(),

      evaluate: async (params, context) => {
        // Test TypeScript errors first
        // @ts-expect-error - No arguments when schema exists
        context.allow();

        // @ts-expect-error - Wrong type (number not matching string schema)
        context.allow(123);

        // @ts-expect-error - Wrong type (object not matching string schema)
        context.allow({ notAString: true });

        // Valid - matches string schema
        return context.allow('Success message');
      },
    },
    toolParameterMappings: {
      action: 'actionType',
    },
  });

  return policy;
}

/**
 * Test 4: Deny parameter validation
 */
function testDenyValidation() {
  const policy = validateVincentPolicyDef({
    toolParamsSchema: baseToolSchema,
    policyDef: {
      ipfsCid: 'denyTest',
      toolParamsSchema: z.object({ actionType: z.string() }),

      // Define deny schema
      evalDenyResultSchema: z.object({ code: z.number(), message: z.string() }),

      evaluate: async (params, context) => {
        // Test TypeScript errors first
        // @ts-expect-error - String only when schema exists
        context.deny('string only error');

        // @ts-expect-error - Wrong shape (missing required field)
        context.deny({ code: 400 });

        // @ts-expect-error - Wrong shape (missing required field)
        context.deny({ message: 'Error message' });

        // Valid - matches schema
        return context.deny({ code: 403, message: 'Forbidden' });
      },
    },
    toolParameterMappings: {
      action: 'actionType',
    },
  });

  return policy;
}

/**
 * Test 5: Different schemas for different contexts
 */
function testContextSchemas() {
  const policy = validateVincentPolicyDef({
    toolParamsSchema: baseToolSchema,
    policyDef: {
      ipfsCid: 'contextTest',
      toolParamsSchema: z.object({ actionType: z.string() }),

      // Different schemas for precheck and evaluate
      precheckAllowResultSchema: z.object({ valid: z.boolean() }),
      evalAllowResultSchema: z.object({ approved: z.boolean() }),

      precheck: async (params, context) => {
        // TypeScript error test
        // @ts-expect-error - Using eval schema in precheck
        context.allow({ approved: true });

        // Valid for precheck
        return context.allow({ valid: true });
      },

      evaluate: async (params, context) => {
        // TypeScript error test
        // @ts-expect-error - Using precheck schema in eval
        context.allow({ valid: true });

        // Valid for evaluate
        return context.allow({ approved: true });
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
  testBasicSchemaValidation,
  testNoSchemaValidation,
  testStringSchemaValidation,
  testDenyValidation,
  testContextSchemas,
};
