// src/lib/abilityCore/helpers/getMappedAbilityPolicyParams.ts

export function getMappedAbilityPolicyParams({
  abilityParameterMappings,
  parsedAbilityParams,
}: {
  abilityParameterMappings: Partial<Record<string, string>>;
  parsedAbilityParams: Record<string, unknown>;
}): Record<string, unknown> {
  const mappedAbilityParams: Record<string, unknown> = {};

  for (const [abilityParamKey, policyParamKey] of Object.entries(abilityParameterMappings)) {
    if (!policyParamKey) {
      throw new Error(
        `Missing policy param key for ability param "${abilityParamKey}" (evaluateSupportedPolicies)`,
      );
    }

    if (!(abilityParamKey in parsedAbilityParams)) {
      throw new Error(
        `Ability param "${abilityParamKey}" expected in abilityParams but was not provided`,
      );
    }

    mappedAbilityParams[policyParamKey] = parsedAbilityParams[abilityParamKey];
  }

  return mappedAbilityParams;
}
