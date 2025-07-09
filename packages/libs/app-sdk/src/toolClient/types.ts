// src/lib/toolClient/types.ts

import type { z } from 'zod';

import type { BaseToolContext } from '@lit-protocol/vincent-tool-sdk';
import type { ToolExecuteResponse } from './execute/types';
import type { ToolPrecheckResponse } from './precheck/types';

export { type BaseToolContext };

/**
 * The Vincent Tool Client is used to interact with Vincent tools.
 *
 * - Precheck tool parameters and policies
 * - Execute tools remotely
 *
 * @typeParam ToolParamsSchema {@removeTypeParameterCompletely}
 * @typeParam PoliciesByPackageName {@removeTypeParameterCompletely}
 * @typeParam ExecuteSuccessSchema {@removeTypeParameterCompletely}
 * @typeParam ExecuteFailSchema {@removeTypeParameterCompletely}
 * @typeParam PrecheckSuccessSchema {@removeTypeParameterCompletely}
 * @typeParam PrecheckFailSchema {@removeTypeParameterCompletely}
 *
 * @category Interfaces
 */
export interface VincentToolClient<
  ToolParamsSchema extends z.ZodType,
  PoliciesByPackageName extends Record<string, any>,
  ExecuteSuccessSchema extends z.ZodType = z.ZodUndefined,
  ExecuteFailSchema extends z.ZodType = z.ZodUndefined,
  PrecheckSuccessSchema extends z.ZodType = z.ZodUndefined,
  PrecheckFailSchema extends z.ZodType = z.ZodUndefined,
> {
  /**
   * Performs a precheck of the tool parameters and policies.
   *
   * This method validates the tool parameters and checks if the policies allow the tool to be executed.
   *
   * @param rawToolParams - The parameters to be passed to the tool
   * @param context - The context for the tool execution, including the delegator PKP Ethereum address
   * @returns A promise that resolves to a ToolResponse containing the precheck result
   */
  precheck(
    rawToolParams: z.infer<ToolParamsSchema>,
    context: ToolClientContext & {
      rpcUrl?: string;
    }
  ): Promise<
    ToolPrecheckResponse<PrecheckSuccessSchema, PrecheckFailSchema, PoliciesByPackageName>
  >;

  /**
   * Executes the tool with the given parameters.
   *
   * This method validates the tool parameters, executes the tool remotely, and returns the result.
   *
   * @param rawToolParams - The parameters to be passed to the tool
   * @param context - The context for the tool execution, including the delegator PKP Ethereum address
   * @returns A promise that resolves to a ToolResponse containing the execution result
   *
   */
  execute(
    rawToolParams: z.infer<ToolParamsSchema>,
    context: ToolClientContext
  ): Promise<ToolExecuteResponse<ExecuteSuccessSchema, ExecuteFailSchema, PoliciesByPackageName>>;
}

/** @category Interfaces */
export interface ToolClientContext {
  delegatorPkpEthAddress: string;
}
