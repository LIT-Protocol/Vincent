// src/lib/abilityClient/types.ts

import type { z } from 'zod';

import type { BaseAbilityContext } from '@lit-protocol/vincent-ability-sdk';

import type { AbilityExecuteResponse } from './execute/types';
import type { AbilityPrecheckResponse } from './precheck/types';

export { type BaseAbilityContext };

/**
 * The Vincent Ability Client is used to interact with Vincent abilities.
 *
 * - Precheck ability parameters and policies
 * - Execute abilities remotely
 *
 * @typeParam AbilityParamsSchema {@removeTypeParameterCompletely}
 * @typeParam PoliciesByPackageName {@removeTypeParameterCompletely}
 * @typeParam ExecuteSuccessSchema {@removeTypeParameterCompletely}
 * @typeParam ExecuteFailSchema {@removeTypeParameterCompletely}
 * @typeParam PrecheckSuccessSchema {@removeTypeParameterCompletely}
 * @typeParam PrecheckFailSchema {@removeTypeParameterCompletely}
 *
 * @category Interfaces
 */
export interface VincentAbilityClient<
  AbilityParamsSchema extends z.ZodType,
  PoliciesByPackageName extends Record<string, any>,
  ExecuteSuccessSchema extends z.ZodType = z.ZodUndefined,
  ExecuteFailSchema extends z.ZodType = z.ZodUndefined,
  PrecheckSuccessSchema extends z.ZodType = z.ZodUndefined,
  PrecheckFailSchema extends z.ZodType = z.ZodUndefined,
> {
  /**
   * Performs a precheck of the ability parameters and policies.
   *
   * This method validates the ability parameters and checks if the policies allow the ability to be executed.
   *
   * @param rawAbilityParams - The parameters to be passed to the ability
   * @param context - The context for the ability execution, including the delegator PKP Ethereum address
   * @returns A promise that resolves to a AbilityResponse containing the precheck result
   */
  precheck(
    rawAbilityParams: z.infer<AbilityParamsSchema>,
    context: AbilityClientContext & {
      rpcUrl?: string;
    }
  ): Promise<
    AbilityPrecheckResponse<PrecheckSuccessSchema, PrecheckFailSchema, PoliciesByPackageName>
  >;

  /**
   * Executes the ability with the given parameters.
   *
   * This method validates the ability parameters, executes the ability remotely, and returns the result.
   *
   * @param rawAbilityParams - The parameters to be passed to the ability
   * @param context - The context for the ability execution, including the delegator PKP Ethereum address
   * @returns A promise that resolves to a AbilityResponse containing the execution result
   *
   */
  execute(
    rawAbilityParams: z.infer<AbilityParamsSchema>,
    context: AbilityClientContext
  ): Promise<
    AbilityExecuteResponse<ExecuteSuccessSchema, ExecuteFailSchema, PoliciesByPackageName>
  >;
}

/** @category Interfaces */
export interface AbilityClientContext {
  delegatorPkpEthAddress: string;
}
