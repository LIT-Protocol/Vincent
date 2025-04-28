import { VersionParameter, VersionInfo } from '../types';
import {
  isEmptyParameterValue,
  decodeParameterValue,
} from './parameterDecoding';
import { encodeParameterValue } from '../../../utils/parameterEncoding';

/**
 * Prepares parameter removal data for contract calls
 * Creates the required array structure for removeToolPolicyParameters
 */
export const prepareParameterRemovalData = (
  parametersToRemove: VersionParameter[],
  versionInfo: VersionInfo,
) => {
  const removalToolIpfsCids: string[] = [];
  const removalPolicyIpfsCids: string[][] = [];
  const removalParameterNames: string[][][] = [];

  parametersToRemove.forEach((param) => {
    const { toolIndex, policyIndex, name: paramName } = param;

    // Ensure arrays exist at this level
    while (removalToolIpfsCids.length <= toolIndex) {
      removalToolIpfsCids.push('');
      removalPolicyIpfsCids.push([]);
      removalParameterNames.push([]);
    }

    // Set the tool IPFS CID if not already set
    if (!removalToolIpfsCids[toolIndex] && versionInfo) {
      const toolsData = versionInfo.appVersion.tools;
      if (toolsData && toolsData[toolIndex]) {
        removalToolIpfsCids[toolIndex] = toolsData[toolIndex].toolIpfsCid;
      }
    }

    // Ensure policy arrays exist
    while (removalPolicyIpfsCids[toolIndex].length <= policyIndex) {
      removalPolicyIpfsCids[toolIndex].push('');
      removalParameterNames[toolIndex].push([]);
    }

    // Set the policy IPFS CID
    if (!removalPolicyIpfsCids[toolIndex][policyIndex] && versionInfo) {
      const toolsData = versionInfo.appVersion.tools;
      if (
        toolsData &&
        toolsData[toolIndex] &&
        toolsData[toolIndex].policies &&
        toolsData[toolIndex].policies[policyIndex]
      ) {
        removalPolicyIpfsCids[toolIndex][policyIndex] =
          toolsData[toolIndex].policies[policyIndex].policyIpfsCid;
      }
    }

    // Add the parameter name
    if (removalPolicyIpfsCids[toolIndex][policyIndex]) {
      removalParameterNames[toolIndex][policyIndex].push(paramName);
    }
  });

  // Filter out empty tool entries
  const filteredToolIndices = removalToolIpfsCids
    .map((_, i) => i)
    .filter((i) => removalToolIpfsCids[i] !== '');

  // Create final arrays for the contract call
  const filteredTools: string[] = [];
  const filteredPolicies: string[][] = [];
  const filteredParams: string[][][] = [];

  // Process each valid tool
  filteredToolIndices.forEach((toolIndex) => {
    // Find valid policies for this tool
    const validPolicyIndices = removalPolicyIpfsCids[toolIndex]
      .map((_, i) => i)
      .filter(
        (i) =>
          removalPolicyIpfsCids[toolIndex][i] !== '' &&
          removalParameterNames[toolIndex][i].length > 0,
      );

    if (validPolicyIndices.length > 0) {
      filteredTools.push(removalToolIpfsCids[toolIndex]);

      // Gather policies and params
      const toolPolicies: string[] = [];
      const toolParams: string[][] = [];

      validPolicyIndices.forEach((policyIndex) => {
        toolPolicies.push(removalPolicyIpfsCids[toolIndex][policyIndex]);
        toolParams.push(removalParameterNames[toolIndex][policyIndex]);
      });

      filteredPolicies.push(toolPolicies);
      filteredParams.push(toolParams);
    }
  });

  return {
    filteredTools,
    filteredPolicies,
    filteredParams,
  };
};

/**
 * Prepares parameter update data for contract calls
 * Creates the required array structure for setToolPolicyParameters
 */
export const prepareParameterUpdateData = (
  parameters: VersionParameter[],
  versionInfo: VersionInfo,
) => {
  const toolIpfsCids: string[] = [];
  const policyIpfsCids: string[][] = [];
  const policyParameterNames: string[][][] = [];
  const policyParameterValues: Uint8Array[][][] = [];

  if (!versionInfo) {
    return {
      toolIpfsCids,
      policyIpfsCids,
      policyParameterNames,
      policyParameterValues,
      hasParametersToSet: false,
    };
  }

  const toolsData = versionInfo.appVersion.tools;

  if (toolsData && Array.isArray(toolsData)) {
    toolsData.forEach((tool, toolIndex) => {
      if (!tool) return;

      const toolIpfsCid = tool.toolIpfsCid;
      if (toolIpfsCid) {
        toolIpfsCids[toolIndex] = toolIpfsCid;
        policyIpfsCids[toolIndex] = [];
        policyParameterNames[toolIndex] = [];
        policyParameterValues[toolIndex] = [];

        const policies = tool.policies;
        if (Array.isArray(policies)) {
          policies.forEach((policy, policyIndex) => {
            if (!policy) return;

            const policyIpfsCid = policy.policyIpfsCid;
            policyIpfsCids[toolIndex][policyIndex] = policyIpfsCid;
            policyParameterNames[toolIndex][policyIndex] = [];
            policyParameterValues[toolIndex][policyIndex] = [];

            const paramNames = policy.parameterNames;

            if (Array.isArray(paramNames)) {
              // Filter parameters that have user-provided values
              paramNames.forEach((name, paramIndex) => {
                // Find matching parameter value from user input
                const param = parameters.find(
                  (p) =>
                    p.toolIndex === toolIndex &&
                    p.policyIndex === policyIndex &&
                    p.paramIndex === paramIndex,
                );

                // Only add parameters that have user-provided values and aren't empty
                if (param && param.value !== undefined) {
                  // Check if parameter is empty using the shared utility
                  const isEmpty = isEmptyParameterValue(
                    param.value,
                    param.type,
                  );

                  // Skip if parameter is empty
                  if (isEmpty) return;

                  const paramName =
                    typeof name === 'string' && name.trim() !== ''
                      ? name.trim()
                      : `param_${paramIndex}`;

                  policyParameterNames[toolIndex][policyIndex].push(paramName);
                  policyParameterValues[toolIndex][policyIndex].push(
                    encodeParameterValue(param.type, param.value, paramName),
                  );
                }
              });
            }
          });
        }
      }
    });
  }

  // Check if there are any parameters to set
  const hasParametersToSet = toolIpfsCids.some((_toolCid, toolIndex) => {
    if (policyIpfsCids[toolIndex]) {
      return policyIpfsCids[toolIndex].some((_policyCid, policyIndex) => {
        if (
          policyParameterNames[toolIndex] &&
          policyParameterNames[toolIndex][policyIndex]
        ) {
          return policyParameterNames[toolIndex][policyIndex].length > 0;
        }
        return false;
      });
    }
    return false;
  });

  return {
    toolIpfsCids,
    policyIpfsCids,
    policyParameterNames,
    policyParameterValues,
    hasParametersToSet,
  };
};

/**
 * Identify parameters that need to be removed based on empty values
 */
export const identifyParametersToRemove = (
  existingParameters: VersionParameter[],
  parameters: VersionParameter[],
) => {
  const parametersToRemove: VersionParameter[] = [];

  existingParameters.forEach((existingParam) => {
    try {
      // Make sure we have a decoded value for comparison
      if (typeof existingParam.value === 'string' && existingParam.type) {
        existingParam.value = decodeParameterValue(
          existingParam.value,
          existingParam.type,
        );
      }

      // Match by name - the most direct approach
      const formParam = parameters.find((p) => p.name === existingParam.name);

      // If no matching parameter in form, remove it
      if (!formParam) {
        parametersToRemove.push(existingParam);
      }
      // If parameter exists but is empty/default, remove if existing value is not empty
      else if (isEmptyParameterValue(formParam.value, formParam.type)) {
        // Only remove if the existing value wasn't also empty/zero
        if (!isEmptyParameterValue(existingParam.value, existingParam.type)) {
          parametersToRemove.push(existingParam);
        }
      }
    } catch (error) {
      console.error(
        `Error checking parameter ${existingParam.name} for removal:`,
        error,
      );
    }
  });

  return parametersToRemove;
};

/**
 * Prepares version permit data from versionInfo for consent approval
 *
 * @param versionInfo - The version information containing tools, policies, and parameters
 * @param parameters - User-provided parameter values
 * @returns Formatted arrays for contract call (toolIpfsCids, policyIpfsCids, toolPolicyParameterNames, toolPolicyParameterTypes)
 */
export const prepareVersionPermitData = (
  versionInfo: VersionInfo,
  parameters: VersionParameter[],
) => {
  const toolIpfsCids: string[] = [];
  const policyIpfsCids: string[][] = [];
  const toolPolicyParameterNames: string[][][] = [];
  const toolPolicyParameterTypes: number[][][] = [];

  if (versionInfo) {
    const toolsData = versionInfo.appVersion.tools;

    if (toolsData && Array.isArray(toolsData)) {
      toolsData.forEach((tool, toolIndex) => {
        if (!tool) return;

        const toolIpfsCid = tool.toolIpfsCid;
        if (toolIpfsCid) {
          toolIpfsCids[toolIndex] = toolIpfsCid;
        }

        policyIpfsCids[toolIndex] = [];
        toolPolicyParameterNames[toolIndex] = [];
        toolPolicyParameterTypes[toolIndex] = [];

        const policies = tool.policies;
        if (Array.isArray(policies)) {
          policies.forEach((policy, policyIndex) => {
            if (!policy) return;

            policyIpfsCids[toolIndex][policyIndex] = policy.policyIpfsCid;
            toolPolicyParameterNames[toolIndex][policyIndex] = [];
            toolPolicyParameterTypes[toolIndex][policyIndex] = [];

            // Extract the actual parameter names and types from the policy
            const paramNames = policy.parameterNames;
            const paramTypes = policy.parameterTypes;

            if (Array.isArray(paramNames) && Array.isArray(paramTypes)) {
              // Use the actual parameter names from the version info
              paramNames.forEach((name, paramIndex: number) => {
                // Ensure parameter name is never empty by using a default if it's empty
                const paramName = name.trim() || `param_${paramIndex}`;

                toolPolicyParameterNames[toolIndex][policyIndex][paramIndex] =
                  paramName;

                // Set the parameter type if available
                if (paramTypes[paramIndex] !== undefined) {
                  toolPolicyParameterTypes[toolIndex][policyIndex][paramIndex] =
                    typeof paramTypes[paramIndex] === 'number'
                      ? paramTypes[paramIndex]
                      : 0;
                } else {
                  toolPolicyParameterTypes[toolIndex][policyIndex][paramIndex] =
                    0;
                }
              });
            }
          });
        }
      });
    }
  }

  // Apply user-provided parameter types
  if (parameters.length > 0) {
    parameters.forEach((param) => {
      if (
        toolPolicyParameterTypes[param.toolIndex] &&
        toolPolicyParameterTypes[param.toolIndex][param.policyIndex]
      ) {
        toolPolicyParameterTypes[param.toolIndex][param.policyIndex][
          param.paramIndex
        ] = param.type;
      }
    });
  }

  return {
    toolIpfsCids,
    policyIpfsCids,
    toolPolicyParameterNames,
    toolPolicyParameterTypes,
  };
};
