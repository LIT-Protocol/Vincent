// src/type-inference-verification/allow-deny-test-cases-tool.ts

/**
 * Tool Definition Type Checking
 *
 * This file validates that TypeScript correctly enforces type constraints
 * for tool definitions, focusing on success/failure responses.
 */
import { z } from 'zod';
import { createVincentTool } from '../lib/toolCore/vincentTool';
import { createVincentPolicy, createVincentToolPolicy } from '../lib/policyCore/vincentPolicy';
import { asBundledVincentPolicy } from '../lib/policyCore/bundledPolicy/bundledPolicy';
import { createPolicyMapFromToolPolicies } from '../lib/toolCore/helpers';

/* eslint-disable @typescript-eslint/no-unused-vars */
// Define a simple schema for our test cases
const testSchema = z.object({
  action: z.string(),
  target: z.string(),
  amount: z.number().optional(),
});

// Define result schemas for different test cases
const successSchema = z.object({
  message: z.string(),
});

const failSchema = z.object({
  error: z.string(),
  code: z.number(),
});

// Create a test policy
const baseTestPolicy = createVincentPolicy({
  packageName: '@lit-protocol/test-policy@1.0.0',
  toolParamsSchema: z.object({
    actionType: z.string(),
  }),
  evalAllowResultSchema: z.object({
    approved: z.boolean(),
  }),
  evaluate: async (params, { allow }) => {
    return allow({ approved: true });
  },
});
const testPolicy = createVincentToolPolicy({
  toolParamsSchema: testSchema,
  bundledVincentPolicy: asBundledVincentPolicy(baseTestPolicy, 'j298jhodf9024j4jfg' as const),
  toolParameterMappings: {
    action: 'actionType',
  },
});

/**
 * Test Case 1: Basic tool with no schemas
 * This validates the behavior when no explicit schemas are provided.
 */
export function testNoSchemas() {
  return createVincentTool({
    // packageName: '@lit-protocol/yestool@1.0.0',
    toolParamsSchema: testSchema,
    policyMap: createPolicyMapFromToolPolicies([testPolicy]),

    precheck: async (params, { succeed, fail }) => {
      // Should allow succeed() with no arguments
      succeed();

      // Should allow fail() with string error
      fail('Error message');

      // @ts-expect-error - Should not allow succeed() with arguments when no schema
      succeed({ message: 'test' });

      // @ts-expect-error - Should not allow fail() with object when no schema
      fail({ error: 'test' });

      return succeed();
    },

    execute: async (params, { succeed }) => {
      // Should allow succeed() with no arguments
      succeed();

      // @ts-expect-error - Should not allow succeed() with arguments when no schema
      return succeed({ data: 'test' });
    },
  });
}

/**
 * Test Case 2: Tool with explicit success/fail schemas
 * This validates that TypeScript enforces schema constraints.
 */
export function tesWithSchemas() {
  return createVincentTool({
    // packageName: '@lit-protocol/yestool2@1.0.0',
    toolParamsSchema: testSchema,
    policyMap: createPolicyMapFromToolPolicies([testPolicy]),
    executeSuccessSchema: successSchema,
    executeFailSchema: failSchema,

    precheck: async (params, { succeed }) => {
      return succeed();
    },

    execute: async (params, { succeed, fail }) => {
      // Should allow succeed() with valid schema
      succeed({
        message: 'Operation completed',
      });

      // Should allow fail() with valid schema
      fail({
        error: 'Something went wrong',
        code: 400,
      });

      // @ts-expect-error - Missing required fields
      succeed({});

      succeed({
        success: true,
        // @ts-expect-error - Wrong type for message
        message: 123,
      });

      succeed({
        message: 'test',
        // @ts-expect-error - Extra unexpected fields
        extra: 'field',
      });

      fail({
        error: 'Error message',
        // @ts-expect-error - Wrong type for error code
        code: '400',
      });

      return succeed({
        message: 'Success',
      });
    },
  });
}

/**
 * Test Case 3: Tool with different precheck and execute schemas
 * This validates that different schema types are correctly enforced.
 */
export function testDifferentSchemas() {
  const precheckSuccessSchema = z.object({
    valid: z.boolean(),
  });

  const precheckFailSchema = z.object({
    reason: z.string(),
  });

  const executeSuccessSchema = z.object({
    result: z.string(),
    timestamp: z.number(),
  });

  const executeFailSchema = z.object({
    errorCode: z.number(),
  });

  return createVincentTool({
    // packageName: '@lit-protocol/yestool3@1.0.0',
    toolParamsSchema: testSchema,
    policyMap: createPolicyMapFromToolPolicies([testPolicy]),
    precheckSuccessSchema,
    precheckFailSchema,
    executeSuccessSchema,
    executeFailSchema,

    precheck: async (params, { succeed, fail }) => {
      // Valid precheck schema
      succeed({ valid: true });

      // Valid precheck fail schema
      fail({ reason: 'Invalid parameters' });

      // @ts-expect-error - Using execute success schema in precheck
      succeed({ result: 'test', timestamp: 123 });

      // @ts-expect-error - Using execute fail schema in precheck
      fail({ errorCode: 400 });

      return succeed({ valid: true });
    },

    execute: async (params, { succeed, fail }) => {
      // Valid execute schema
      succeed({ result: 'success', timestamp: Date.now() });

      // Valid execute fail schema
      fail({ errorCode: 500 });

      // @ts-expect-error - Using precheck success schema in execute
      succeed({ valid: true });

      // @ts-expect-error - Using precheck fail schema in execute
      fail({ reason: 'Error' });

      return succeed({ result: 'data', timestamp: Date.now() });
    },
  });
}

/**
 * Test Case 4: Context type safety with policy results
 * This validates that policiesContext is correctly typed.
 */
export function testPolicyResultTypes() {
  // First test: Precheck with properly typed policiesContext
  return createVincentTool({
    // packageName: '@lit-protocol/yestool4@1.0.0',
    toolParamsSchema: testSchema,
    policyMap: createPolicyMapFromToolPolicies([testPolicy]),

    precheck: async (params, { policiesContext, succeed }) => {
      // Should be able to check if policy evaluation allowed
      if (policiesContext.allow) {
        // Should be able to access the policy result with the correct type
        const result = policiesContext.allowedPolicies['@lit-protocol/test-policy@1.0.0'];
        if (result) {
          const { approved } = result.result;
          console.log(approved);
        }

        const invalid =
          // @ts-expect-error - Property doesn't exist on the result type
          policiesContext.allowedPolicies.testPolicy?.result.invalid;
        console.log(invalid);
      } else {
        // Should be able to access deny result when not allowed
        const denyResult = policiesContext.deniedPolicy;
        console.log(denyResult.packageName);
      }

      return succeed();
    },

    execute: async (params, { succeed }) => {
      return succeed();
    },
  });
}

export function assertAllow<T extends { allow: true }>(obj: T): asserts obj is T {
  // This function just asserts that obj.allow is true
  // It doesn't actually need to do anything at runtime
  // TypeScript will use it for control flow analysis
}

// Separate test for execute-specific policy result typing
export function testExecutePolicyResultTyping() {
  return createVincentTool({
    // packageName: '@lit-protocol/yestool5@1.0.0',
    toolParamsSchema: testSchema,
    policyMap: createPolicyMapFromToolPolicies([testPolicy]),

    precheck: async (params, { succeed }) => {
      return succeed();
    },

    execute: async (params, { policiesContext, succeed }) => {
      assertAllow(policiesContext);

      // @ts-expect-error - Cannot negate a property known to be true
      const allowIsAlwaysTrue: false = !policiesContext.allow;

      // Should have access to test policy result
      const result = policiesContext.allowedPolicies['@lit-protocol/test-policy@1.0.0'];
      if (result) {
        // Should be able to access properties of the result
        const { approved } = result.result;
        console.log(approved);
      }

      // @ts-expect-error - denyPolicyResult should not exist in execute
      const denyResult = policiesContext.deniedPolicy[testPolicy];
      console.log(denyResult);

      return succeed();
    },
  });
}

// @ts-expect-error - Missing required execute function
export const missingExecute = createVincentTool({
  toolParamsSchema: testSchema,
  policyMap: createPolicyMapFromToolPolicies([testPolicy]),
  precheck: async (params, { succeed }) => {
    return succeed();
  },
});

// @ts-expect-error - Missing required toolParamsSchema
export const missingSchema = createVincentTool({
  policyMap: createPolicyMapFromToolPolicies([testPolicy]),
  precheck: async (params, { succeed }) => {
    return succeed();
  },
  execute: async (params, { succeed }) => {
    return succeed();
  },
});

/**
 * Test Case 6: Testing return types are enforced
 * Each sub-test has its own function to properly test at the function definition level.
 */

// Basic tools for tests
export const testReturnNoSchema = () => {
  // This is a good tool with proper returns
  return createVincentTool({
    // packageName: '@lit-protocol/yestool6@1.0.0',
    toolParamsSchema: testSchema,
    policyMap: createPolicyMapFromToolPolicies([testPolicy]),

    precheck: async (params, { succeed }) => {
      return succeed();
    },

    execute: async (params, { succeed }) => {
      return succeed();
    },
  });
};

// Test: Precheck with no return
export const testPrecheckNoReturn = () => {
  return createVincentTool({
    toolParamsSchema: testSchema,
    policyMap: createPolicyMapFromToolPolicies([testPolicy]),

    // @ts-expect-error - Function doesn't return anything
    precheck: async (params, { succeed }) => {
      // No return statement
    },

    execute: async (params, { succeed }) => {
      return succeed();
    },
  });
};

// Test: Execute with no return
export const testExecuteNoReturn = () => {
  return createVincentTool({
    toolParamsSchema: testSchema,
    policyMap: createPolicyMapFromToolPolicies([testPolicy]),

    precheck: async (params, { succeed }) => {
      return succeed();
    },

    // @ts-expect-error - Function doesn't return anything
    execute: async (params, { succeed }) => {
      // No return statement
    },
  });
};

// Test: Precheck returning raw value
export const testPrecheckRawReturn = () => {
  return createVincentTool({
    toolParamsSchema: testSchema,
    policyMap: createPolicyMapFromToolPolicies([testPolicy]),

    // @ts-expect-error - Returning raw value instead of ToolPrecheckResponse
    precheck: async (params, { succeed }) => {
      return true;
    },

    execute: async (params, { succeed }) => {
      return succeed();
    },
  });
};

// Test: Execute returning raw value
export const testExecuteRawReturn = () => {
  const executeSuccessSchema = z.object({
    success: z.boolean(),
    message: z.string(),
  });

  return createVincentTool({
    toolParamsSchema: testSchema,
    policyMap: createPolicyMapFromToolPolicies([testPolicy]),
    executeSuccessSchema,

    precheck: async (params, { succeed }) => {
      return succeed();
    },

    // @ts-expect-error - Returning raw object instead of ToolExecutionResponse
    execute: async (params, { succeed }) => {
      return { success: true, message: 'test' };
    },
  });
};

// Test: Execute returning wrong type object
export const testExecuteWrongTypeReturn = () => {
  const executeSuccessSchema = z.object({
    success: z.boolean(),
    message: z.string(),
  });

  return createVincentTool({
    // packageName: '@lit-protocol/yestool7@1.0.0',
    toolParamsSchema: testSchema,
    policyMap: createPolicyMapFromToolPolicies([testPolicy]),
    executeSuccessSchema,

    precheck: async (params, { succeed }) => {
      return succeed();
    },

    execute: async (params, { succeed }) => {
      // This is correct
      // return context.succeed({ success: true, message: "test" });

      // @ts-expect-error - Wrong type of return object
      return succeed({ wrongField: 'test' });
    },
  });
};

// Test: Precheck returning wrong schema
export const testPrecheckWrongSchema = () => {
  const precheckSuccessSchema = z.object({
    valid: z.boolean(),
  });

  const executeSuccessSchema = z.object({
    result: z.string(),
  });

  return createVincentTool({
    // packageName: '@lit-protocol/yestool7@1.0.0',
    toolParamsSchema: testSchema,
    policyMap: createPolicyMapFromToolPolicies([testPolicy]),
    precheckSuccessSchema,
    executeSuccessSchema,

    precheck: async (params, { succeed }) => {
      // This would be correct
      // return context.succeed({ valid: true });

      // @ts-expect-error - Using execute schema for precheck return
      return succeed({ result: 'test' });
    },

    execute: async (params, { succeed }) => {
      return succeed({ result: 'test' });
    },
  });
};

// Test: Execute returning precheck schema
export const testExecuteWrongSchema = () => {
  const precheckSuccessSchema = z.object({
    valid: z.boolean(),
  });

  const executeSuccessSchema = z.object({
    result: z.string(),
  });

  return createVincentTool({
    // packageName: '@lit-protocol/yestool8@1.0.0',
    toolParamsSchema: testSchema,
    policyMap: createPolicyMapFromToolPolicies([testPolicy]),
    precheckSuccessSchema,
    executeSuccessSchema,

    precheck: async (params, { succeed }) => {
      return succeed({ valid: true });
    },

    execute: async (params, { succeed }) => {
      // This would be correct
      // return context.succeed({ result: "test" });

      // @ts-expect-error - Using precheck schema for execute return
      return succeed({ valid: true });
    },
  });
};

// Test: Precheck returning fail from success schema
export const testPrecheckSuccessWithFailSchema = () => {
  const precheckSuccessSchema = z.object({
    valid: z.boolean(),
  });

  const precheckFailSchema = z.object({
    reason: z.string(),
    code: z.number(),
  });

  return createVincentTool({
    // packageName: '@lit-protocol/yestool9@1.0.0',
    toolParamsSchema: testSchema,
    policyMap: createPolicyMapFromToolPolicies([testPolicy]),
    precheckSuccessSchema,
    precheckFailSchema,

    precheck: async (params, { succeed, fail }) => {
      if (Math.random() > 0.5) {
        return succeed({ valid: true });
      } else {
        // This would be correct
        // return context.fail({ reason: "test", code: 400 });

        // @ts-expect-error - Using success schema for fail return
        return fail({ valid: false });
      }
    },

    execute: async (params, { succeed }) => {
      return succeed();
    },
  });
};

// Test: Execute returning fail with success schema
export const testExecuteFailWithSuccessSchema = () => {
  const executeSuccessSchema = z.object({
    result: z.string(),
  });

  const executeFailSchema = z.object({
    error: z.string(),
    code: z.number(),
  });

  return createVincentTool({
    // packageName: '@lit-protocol/yestool10@1.0.0',
    toolParamsSchema: testSchema,
    policyMap: createPolicyMapFromToolPolicies([testPolicy]),
    executeSuccessSchema,
    executeFailSchema,

    precheck: async (params, { succeed }) => {
      return succeed();
    },

    execute: async (params, { succeed, fail }) => {
      if (Math.random() > 0.5) {
        return succeed({ result: 'test' });
      } else {
        // This would be correct
        // return context.fail({ error: "test", code: 400 });

        // @ts-expect-error - Using success schema for fail return
        return fail({ result: 'error' });
      }
    },
  });
};

// Test: Tool with void-returning functions inside
export const testReturnWithInnerFunctions = () => {
  return createVincentTool({
    // packageName: '@lit-protocol/yestool11@1.0.0',
    toolParamsSchema: testSchema,
    policyMap: createPolicyMapFromToolPolicies([testPolicy]),

    precheck: async (params, { succeed }) => {
      // Internal function that doesn't return anything shouldn't affect the overall return type
      const logDetails = () => {
        console.log('Details:', params);
        // No return here is fine
      };

      logDetails();
      return succeed();
    },

    execute: async (params, { succeed }) => {
      // Internal async function with no return
      const processData = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        // No return here is fine
      };

      await processData();
      return succeed();
    },
  });
};

// Test: Conditional returns in precheck
export const testPrecheckConditionalReturns = () => {
  return createVincentTool({
    toolParamsSchema: testSchema,
    policyMap: createPolicyMapFromToolPolicies([testPolicy]),

    // @ts-expect-error - Missing return in one code path
    precheck: async ({ toolParams }, { succeed }) => {
      if (toolParams.action === 'test') {
        return succeed();
      }
      // Missing return in this path
    },

    execute: async (params, { succeed }) => {
      return succeed();
    },
  });
};

// Test: Conditional returns in execute
export const testExecuteConditionalReturns = () => {
  return createVincentTool({
    toolParamsSchema: testSchema,
    policyMap: createPolicyMapFromToolPolicies([testPolicy]),

    precheck: async (_, { succeed }) => {
      return succeed();
    },

    // @ts-expect-error - Missing return in one code path
    execute: async ({ toolParams }, { succeed }) => {
      if (toolParams.action === 'test') {
        return succeed();
      }
      // Missing return in this path
    },
  });
};

// Test: Async precheck without await or return
export const testPrecheckAsyncWithoutAwait = () => {
  return createVincentTool({
    toolParamsSchema: testSchema,
    policyMap: createPolicyMapFromToolPolicies([testPolicy]),

    // @ts-expect-error - Missing return from async function that calls other async functions
    precheck: async (params, { succeed }) => {
      // Call async function without await or using its result
      fetchData();

      async function fetchData() {
        return succeed();
      }

      // No return here
    },

    execute: async (params, { succeed }) => {
      return succeed();
    },
  });
};

// Test: Return from try-catch in execute
export const testExecuteTryCatchReturn = () => {
  return createVincentTool({
    toolParamsSchema: testSchema,
    policyMap: createPolicyMapFromToolPolicies([testPolicy]),

    precheck: async (params, { succeed }) => {
      return succeed();
    },

    // @ts-expect-error - Missing return in catch block
    execute: async (params, { succeed, fail }) => {
      try {
        // This is fine
        return succeed();
      } catch (error) {
        // Missing return here
        fail('Error occurred');
      }
    },
  });
};

/**
 * Test Case 7: Context destructuring maintains type safety
 */
export function testContextDestructuring() {
  const executeSuccessSchema = z.object({
    data: z.string(),
  });

  return createVincentTool({
    // packageName: '@lit-protocol/yestool12@1.0.0',
    toolParamsSchema: testSchema,
    policyMap: createPolicyMapFromToolPolicies([testPolicy]),
    executeSuccessSchema,

    precheck: async (params, { succeed }) => {
      // Destructuring should maintain type safety
      // This should all work
      succeed();

      // @ts-expect-error - Wrong parameter type for succeed
      succeed({ wrongField: true });

      return succeed();
    },

    execute: async (params, { succeed }) => {
      // Destructuring with type-specific functions
      // Should be type safe
      succeed({ data: 'result' });

      // @ts-expect-error - Wrong field name
      succeed({ wrongField: 'result' });

      // @ts-expect-error - Missing required field
      succeed({});

      return succeed({ data: 'final result' });
    },
  });
}
