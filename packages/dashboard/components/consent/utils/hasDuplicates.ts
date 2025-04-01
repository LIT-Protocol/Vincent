export const checkForDuplicates = (versionInfo: any) => {
    if (!versionInfo) return { hasDuplicates: false };
    
    const toolsData = versionInfo.appVersion?.tools || versionInfo[1]?.[3];
    if (!toolsData || !Array.isArray(toolsData) || toolsData.length === 0) {
      return { hasDuplicates: false };
    }
    
    const toolCids = toolsData.map((tool: any) => tool[0]);
    const uniqueToolCids = new Set(toolCids);
    const hasDuplicateTools = uniqueToolCids.size !== toolCids.length;
    
    let hasDuplicatePolicies = false;
    const policyMap = new Map();
    
    const allParamNames: string[] = [];
    
    toolsData.forEach((tool: any) => {
      if (!tool || !Array.isArray(tool)) return;
      
      const policies = tool[1];
      if (Array.isArray(policies)) {
        const policyCids = policies.map((p: any) => p[0]);
        const uniquePolicyCids = new Set(policyCids);
        if (uniquePolicyCids.size !== policyCids.length) {
          hasDuplicatePolicies = true;
        }
        
        policyCids.forEach((cid: string) => {
          policyMap.set(cid, (policyMap.get(cid) || 0) + 1);
        });
        
        policies.forEach((policy: any) => {
          if (!policy || !Array.isArray(policy)) return;
          
          if (Array.isArray(policy[3])) {
            policy[3].forEach((name: string) => {
              if (name) allParamNames.push(name);
            });
          }
          else if (typeof policy === 'object' && policy !== null && 'parameterNames' in policy) {
            const params = (policy as any).parameterNames;
            if (Array.isArray(params)) {
              params.forEach((name: string) => {
                if (name) allParamNames.push(name);
              });
            }
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