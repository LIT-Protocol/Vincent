interface PolicyContext {
  commit?: (params: any) => Promise<any>;
  result?: any;
}

interface PoliciesContext {
  allowedPolicies: Record<string, PolicyContext>;
}

/**
 * Executes commit functions for all allowed policies that support it
 * @param policiesContext - The policies context from the execute function
 * @param abilityName - The ability name for logging purposes
 */
export async function commitAllowedPolicies(
  policiesContext: PoliciesContext,
  abilityName = 'ability',
): Promise<Record<string, any>> {
  const commitResults: Record<string, any> = {};

  if (!policiesContext?.allowedPolicies) {
    console.log(`[${abilityName}] No allowed policies found`);
    return commitResults;
  }

  console.log(`[${abilityName}] Processing policy commits...`);

  for (const [policyName, policyContext] of Object.entries(policiesContext.allowedPolicies)) {
    try {
      if (policyContext?.commit && policyContext?.result) {
        console.log(`[${abilityName}] ✅ Committing policy: ${policyName}`);

        // Extract commit parameters from policy result
        const commitParams = policyContext.result;

        const commitResult = await policyContext.commit(commitParams);
        commitResults[policyName] = commitResult;

        console.log(`[${abilityName}] ✅ Policy ${policyName} commit successful:`, commitResult);
      } else {
        console.log(`[${abilityName}] ⚠️ Policy ${policyName} missing commit function or result`);
      }
    } catch (error) {
      console.error(`[${abilityName}] ❌ Error committing policy ${policyName}: ${error}`);
      commitResults[policyName] = { error: (error as Error).message };
    }
  }

  return commitResults;
}
