import { ContractVersionResult } from "../types";

export const checkForDuplicates = (versionInfo: ContractVersionResult | undefined) => {
    if (!versionInfo) return { hasDuplicates: false };
    
    const tools = versionInfo.appVersion.tools;

    if (!Array.isArray(tools) || tools.length === 0) {
      return { hasDuplicates: false };
    }
    
    const toolCids = tools.map(tool => tool.toolIpfsCid);
    const uniqueToolCids = new Set(toolCids);
    const hasDuplicateTools = uniqueToolCids.size !== toolCids.length;
    
    let hasDuplicatePolicies = false;
    const policyMap = new Map();
    
    const allParamNames: string[] = [];
    
    tools.forEach(tool => {
      const policies = tool.policies;
      if (Array.isArray(policies)) {
        const policyCids = policies.map(p => p.policyIpfsCid);
        const uniquePolicyCids = new Set(policyCids);
        if (uniquePolicyCids.size !== policyCids.length) {
          hasDuplicatePolicies = true;
        }
        
        policyCids.forEach(cid => {
          policyMap.set(cid, (policyMap.get(cid) || 0) + 1);
        });
        
        policies.forEach(policy => {
          if (Array.isArray(policy.parameterNames)) {
            policy.parameterNames.forEach(name => {
              if (name) allParamNames.push(name);
            });
          }
        });
      }
    });
    
    const hasCrossDuplicatePolicies = Array.from(policyMap.values()).some(count => count > 1);
    
    const uniqueParamNames = new Set(allParamNames);
    const hasDuplicateParams = uniqueParamNames.size !== allParamNames.length;
    
    return {
      hasDuplicates: hasDuplicateTools || hasDuplicatePolicies || hasCrossDuplicatePolicies || hasDuplicateParams,
      hasDuplicateTools,
      hasDuplicatePolicies: hasDuplicatePolicies || hasCrossDuplicatePolicies,
      hasDuplicateParams
    };
  };