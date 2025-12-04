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

interface VincentGatedSignerAbilityConfig
  extends Omit<
      VincentAbilityConfig<
        typeof abilityParamsSchema,
        string,
        AbilityPolicyMap<any[], string>, // Ignored by omitting supportedPolicies
        any, // Ignored by omitting precheck and execute functions
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
