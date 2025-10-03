export { createVincentPolicy, createVincentAbilityPolicy } from './lib/policyCore/vincentPolicy';
export { createVincentAbility } from './lib/abilityCore/vincentAbility';
export { VINCENT_TOOL_API_VERSION } from './lib/constants';

export { vincentPolicyHandler } from './lib/handlers/vincentPolicyHandler';
export { vincentAbilityHandler } from './lib/handlers/vincentAbilityHandler';

export { asBundledVincentAbility } from './lib/abilityCore/bundledAbility/bundledAbility';
export { asBundledVincentPolicy } from './lib/policyCore/bundledPolicy/bundledPolicy';
export { supportedPoliciesForAbility } from './lib/abilityCore/helpers/supportedPoliciesForAbility';

export type { BundledVincentPolicy } from './lib/policyCore/bundledPolicy/types';
export type { BundledVincentAbility } from './lib/abilityCore/bundledAbility/types';
export type {
  PolicyConfigLifecycleFunction,
  PolicyConfigCommitFunction,
} from './lib/policyCore/policyConfig/types';
export type { PolicyContext } from './lib/policyCore/policyConfig/context/types';

export type {
  VincentAbilityPolicy,
  BaseContext,
  PolicyEvaluationResultContext,
  VincentAbility,
  AbilityConsumerContext,
  PolicyConsumerContext,
  SchemaValidationError,
} from './lib/types';

export type { BaseAbilityContext } from './lib/abilityCore/abilityConfig/context/types';

export {
  populateTransaction,
  sponsoredGasRawTransaction,
  sponsoredGasContractCall,
} from './lib/abilityHelpers';
