import type { VincentAbilityConfig } from '../abilityCore/abilityConfig/types';
import type { AbilityPolicyMap } from '../abilityCore/helpers/supportedPoliciesForAbility';
import type {
  AbilityExecutionPolicyEvaluationResult,
  PolicyEvaluationResultContext,
} from '../types';
import type { LifecycleFunctionSteps } from './helpers/lifecycleFunctions';

import { supportedPoliciesForAbility } from '../abilityCore/helpers';
import { createVincentAbility } from '../abilityCore/vincentAbility';
import { buildLifecycleFunctions } from './helpers/lifecycleFunctions';
import {
  abilityParamsSchema,
  executeFailSchema,
  executeSuccessSchema,
  precheckFailSchema,
  precheckSuccessSchema,
} from './helpers/schemas';

/**
 * Configuration interface for creating a Vincent Gated Signer Ability.
 *
 * A Gated Signer Ability is a specific type of ability that validates a transaction or user operation
 * received with the lifecycle functions (decode, validate simulation, validate transaction) and if
 * everything is valid, then uses the PKP to sign what it received.
 */
interface VincentGatedSignerAbilityConfig
  extends Omit<
      VincentAbilityConfig<
        typeof abilityParamsSchema,
        string,
        AbilityPolicyMap<any[], string>, // Not used by omitting supportedPolicies
        any, // Not used by omitting precheck and execute functions
        typeof precheckSuccessSchema,
        typeof precheckFailSchema,
        typeof executeSuccessSchema,
        typeof executeFailSchema
      >,
      // This function defines the following things
      | 'abilityParamsSchema'
      | 'supportedPolicies'
      | 'precheckSuccessSchema'
      | 'precheckFailSchema'
      | 'executeSuccessSchema'
      | 'executeFailSchema'
      | 'precheck'
      | 'execute'
    >,
    LifecycleFunctionSteps {}

// https://www.notion.so/litprotocol/Vincent-2-0-abilities-development-proposal-2b16f449b04180f4a01fe5088fd0a2b1
/**
 * Creates a Vincent Gated Signer Ability.
 *
 * @param AbilityConfig - The configuration for the ability.
 * @returns A Vincent Ability instance configured as a gated signer.
 *
 * @example
 * ```ts
 * export const myAbility = createVincentGatedSignerAbility({
 *   packageName: '@my-org/my-ability',
 *   abilityDescription: 'My ability description',
 *   decodeTransaction,
 *   validateSimulation,
 *   validateTransaction,
 * });
 * ```
 */
export function createVincentGatedSignerAbility(AbilityConfig: VincentGatedSignerAbilityConfig) {
  // TODO No policies for this type of abilities yet
  const supportedPolicies = supportedPoliciesForAbility([]);

  const {
    abilityDescription,
    decodeTransaction,
    packageName,
    validateSimulation,
    validateTransaction,
  } = AbilityConfig;

  const { precheck, execute } = buildLifecycleFunctions<
    typeof abilityParamsSchema,
    AbilityExecutionPolicyEvaluationResult<(typeof supportedPolicies)['policyByPackageName']>,
    PolicyEvaluationResultContext<(typeof supportedPolicies)['policyByPackageName']>,
    typeof executeSuccessSchema,
    typeof executeFailSchema,
    typeof precheckSuccessSchema,
    typeof precheckFailSchema
  >({
    decodeTransaction,
    validateSimulation,
    validateTransaction,
  });

  return createVincentAbility({
    packageName,
    abilityDescription,

    abilityParamsSchema,
    executeSuccessSchema,
    executeFailSchema,
    precheckSuccessSchema,
    precheckFailSchema,

    supportedPolicies,

    precheck,
    execute,
  });
}
