// src/lib/toolCore/helpers/getMappedToolPolicyParams.ts
export function getMappedToolPolicyParams({
  toolParameterMappings,
  parsedToolParams,
}: {
  toolParameterMappings: Partial<Record<string, string>>;
  parsedToolParams: Record<string, unknown>;
}): Record<string, unknown> {
  const mappedToolParams: Record<string, unknown> = {};

  for (const [toolParamKey, policyParamKey] of Object.entries(toolParameterMappings)) {
    if (!policyParamKey) {
      throw new Error(
        `Missing policy param key for tool param "${toolParamKey}" (evaluateSupportedPolicies)`,
      );
    }

    if (!(toolParamKey in parsedToolParams)) {
      throw new Error(`Tool param "${toolParamKey}" expected in toolParams but was not provided`);
    }

    mappedToolParams[policyParamKey] = parsedToolParams[toolParamKey];
  }

  return mappedToolParams;
}
