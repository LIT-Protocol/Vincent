import { useState, useEffect, useRef } from 'react';
import ParameterInput from './ParameterInput';
import { VersionParameter, ContractVersionResult } from '../../types';

interface VersionParametersFormProps {
  versionInfo: ContractVersionResult;
  onChange: (parameters: VersionParameter[]) => void;
  existingParameters?: VersionParameter[];
}

// Interface for grouped structure
interface ToolData {
  toolIndex: number;
  toolIpfsCid: string;
  policies: PolicyData[];
}

interface PolicyData {
  policyIndex: number;
  policyIpfsCid: string;
  parameters: VersionParameter[];
}

export default function VersionParametersForm({
  versionInfo,
  onChange,
  existingParameters = [],
}: VersionParametersFormProps) {
  const [parameters, setParameters] = useState<VersionParameter[]>([]);
  const initializedRef = useRef(false);
  const processedVersionRef = useRef<string | null>(null);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const [expandedPolicies, setExpandedPolicies] = useState<Record<string, boolean>>({});
  const [toolsData, setToolsData] = useState<ToolData[]>([]);

  // Toggle tool expand/collapse
  const toggleTool = (toolId: string) => {
    setExpandedTools((prev) => ({
      ...prev,
      [toolId]: !prev[toolId],
    }));
  };

  // Toggle policy expand/collapse
  const togglePolicy = (policyId: string) => {
    setExpandedPolicies((prev) => ({
      ...prev,
      [policyId]: !prev[policyId],
    }));
  };

  useEffect(() => {
    // Generate a version key for tracking changes
    const versionKey = `${versionInfo.app.id.hex}:${versionInfo.appVersion.version.hex}`;

    const shouldInitialize =
      !initializedRef.current ||
      existingParameters.length > 0 ||
      versionKey !== processedVersionRef.current;

    if (!shouldInitialize && parameters.length > 0) return;

    processedVersionRef.current = versionKey;

    try {
      const tools = versionInfo.appVersion.tools;

      if (!Array.isArray(tools) || tools.length === 0) {
        console.warn('No tools array found or empty tools array');
        setParameters([]);
        initializedRef.current = true;
        return;
      }

      const extractedParams: VersionParameter[] = [];
      const toolsStructure: ToolData[] = [];

      // Initialize expansion state objects
      const toolExpansions: Record<string, boolean> = {};
      const policyExpansions: Record<string, boolean> = {};

      tools.forEach((tool, toolIndex) => {
        if (!tool) return;

        // Set tool as expanded by default
        const toolId = `tool-${toolIndex}`;
        toolExpansions[toolId] = true;

        const toolData: ToolData = {
          toolIndex,
          toolIpfsCid: tool.toolIpfsCid,
          policies: [],
        };

        const policies = tool.policies;

        if (!Array.isArray(policies) || policies.length === 0) {
          // Still add the tool to toolsStructure even if it has no policies
          toolsStructure.push(toolData);
          return;
        }

        policies.forEach((policy, policyIndex) => {
          if (!policy) return;

          // Set policy as expanded by default
          const policyId = `tool-${toolIndex}-policy-${policyIndex}`;
          policyExpansions[policyId] = true;

          const policyData: PolicyData = {
            policyIndex,
            policyIpfsCid: policy.policyIpfsCid,
            parameters: [],
          };

          const parameterNames = policy.parameterNames;
          const parameterTypes = policy.parameterTypes;

          if (!Array.isArray(parameterNames) || !Array.isArray(parameterTypes)) {
            return;
          }

          parameterNames.forEach((name, paramIndex) => {
            if (paramIndex < parameterTypes.length) {
              const paramType = parameterTypes[paramIndex];
              const paramName =
                typeof name === 'string' && name.trim() !== ''
                  ? name.trim()
                  : `param_${paramIndex}`;

              const existingParam = existingParameters.find(
                (p) =>
                  typeof p.name === 'string' &&
                  p.name.toLowerCase() === paramName.toLowerCase() &&
                  p.type === paramType,
              );

              const parameter = {
                toolIndex,
                policyIndex,
                paramIndex,
                name: paramName,
                type: paramType,
                value: existingParam ? existingParam.value : '',
              };

              extractedParams.push(parameter);
              policyData.parameters.push(parameter);
            }
          });

          if (policyData.parameters.length > 0) {
            toolData.policies.push(policyData);
          }
        });

        if (toolData.policies.length > 0) {
          toolsStructure.push(toolData);
        }
      });

      setParameters(extractedParams);
      setToolsData(toolsStructure);
      setExpandedTools(toolExpansions);
      setExpandedPolicies(policyExpansions);
      initializedRef.current = true;
    } catch (error) {
      console.error('Error parsing version data:', error);
      setParameters([]);
      setToolsData([]);
      initializedRef.current = true;
    }
  }, [versionInfo, existingParameters]);

  useEffect(() => {
    if (initializedRef.current && parameters.length > 0) {
      // Use setTimeout to defer the update to the next tick
      const timeoutId = setTimeout(() => {
        onChange(parameters);
      }, 0);

      return () => clearTimeout(timeoutId);
    }

    return undefined;
  }, [parameters, onChange]);

  // Add debugging to track parameter changes
  const handleParameterChange = (updatedParam: VersionParameter) => {
    // Update the parameters state by replacing the matching parameter
    setParameters((prevParams) => {
      const updatedParams = prevParams.map((param) => {
        if (
          param.toolIndex === updatedParam.toolIndex &&
          param.policyIndex === updatedParam.policyIndex &&
          param.paramIndex === updatedParam.paramIndex
        ) {
          return updatedParam;
        }
        return param;
      });

      return updatedParams;
    });
  };

  // Add a specific useEffect to handle applying existingParameters to the form
  useEffect(() => {
    // Only apply if we have both existing parameters and the form is already initialized
    if (existingParameters.length > 0 && initializedRef.current && parameters.length > 0) {
      // Use a ref to prevent multiple updates for the same set of parameters
      const existingParamsKey = existingParameters.map((p) => `${p.name}:${p.value}`).join('|');
      const currentParamsKey = parameters.map((p) => `${p.name}:${p.value}`).join('|');

      // Skip if the parameters haven't actually changed (prevents loops)
      if (existingParamsKey === currentParamsKey) {
        return;
      }
      // Create a copy of the current parameters
      const updatedParams = [...parameters];
      let hasChanges = false;

      // Apply each existing parameter value to the matching form field
      existingParameters.forEach((existingParam) => {
        // Find the matching parameter in our form
        const formParamIndex = updatedParams.findIndex(
          (p) =>
            // Match by name AND type to avoid type mismatches
            (p.name === existingParam.name && p.type === existingParam.type) ||
            // Match by position AND type
            (p.toolIndex === existingParam.toolIndex &&
              p.policyIndex === existingParam.policyIndex &&
              p.paramIndex === existingParam.paramIndex &&
              p.type === existingParam.type), // Ensure type matches
        );

        if (formParamIndex !== -1) {
          // Only update if value is different (prevents needless rerenders)
          if (updatedParams[formParamIndex].value !== existingParam.value) {
            // Update the form parameter with the existing value
            updatedParams[formParamIndex] = {
              ...updatedParams[formParamIndex],
              value: existingParam.value,
            };
            hasChanges = true;
          }
        }
      });

      // Only update the parameters state if something actually changed
      if (hasChanges) {
        setParameters(updatedParams);
      }
    }
    // Remove parameters from dependency array to break the loop
  }, [existingParameters]);

  // Helper functions to abbreviate long strings
  const abbreviateIpfs = (cid: string) => {
    if (!cid) return '';
    return cid.length > 12 ? `${cid.substring(0, 6)}...${cid.substring(cid.length - 6)}` : cid;
  };

  // Function to categorize what a tool might be based on its name or IPFS
  const getToolFriendlyName = (_toolCid: string, toolIndex: number) => {
    // This is a placeholder - in a real implementation, you might map known CIDs
    // to friendly names or fetch metadata about the tool
    return `Tool ${toolIndex + 1}`;
  };

  const getPolicyFriendlyName = (_policyCid: string, policyIndex: number) => {
    // Similar placeholder for policy naming
    return `Policy ${policyIndex + 1}`;
  };

  if (parameters.length === 0) {
    return (
      <div className="mb-6">
        <div className="text-sm font-medium text-gray-700 mb-3">Parameters</div>
        <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-500">
          No parameter inputs found for this application version.
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="text-sm font-medium text-gray-700 mb-3">Application Parameters</div>
      <div className="space-y-3">
        {toolsData.map((tool) => {
          const toolId = `tool-${tool.toolIndex}`;
          const isToolExpanded = expandedTools[toolId] === true;

          const toolName = getToolFriendlyName(tool.toolIpfsCid, tool.toolIndex);

          return (
            <div
              key={toolId}
              className="border border-gray-200 rounded-lg overflow-hidden bg-white"
            >
              {/* Tool Header */}
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleTool(toolId)}
              >
                <div className="flex items-center">
                  <div className="font-medium text-sm">{toolName}</div>
                  {/*
                  <div className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Verified
                  </div>
                  */}
                </div>
                <div className="flex items-center">
                  <a
                    href={`https://ipfs.io/ipfs/${tool.toolIpfsCid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-500 mr-2 font-mono hover:text-blue-500"
                    title={`View on IPFS: ${tool.toolIpfsCid}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {abbreviateIpfs(tool.toolIpfsCid)}
                  </a>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`transform transition-transform duration-300 ease-in-out ${isToolExpanded ? 'rotate-180' : ''}`}
                  >
                    <path
                      d="M6 9L12 15L18 9"
                      stroke="#6B7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Tool Body - Contains Policies */}
              <div
                className={`border-t border-gray-100 transition-all duration-300 ease-in-out overflow-hidden ${isToolExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}
              >
                {tool.policies.length === 0 ? (
                  <div className="p-3 pt-2 pl-8 pr-4 text-sm text-gray-500 italic">
                    No policies found for this tool
                  </div>
                ) : (
                  tool.policies.map((policy) => {
                    const policyId = `tool-${tool.toolIndex}-policy-${policy.policyIndex}`;
                    const isPolicyExpanded = expandedPolicies[policyId] === true;

                    const policyName = getPolicyFriendlyName(
                      policy.policyIpfsCid,
                      policy.policyIndex,
                    );

                    return (
                      <div key={policyId} className="border-b border-gray-100 last:border-b-0">
                        {/* Policy Header */}
                        <div
                          className="flex items-center justify-between p-3 pl-6 cursor-pointer hover:bg-gray-50"
                          onClick={() => togglePolicy(policyId)}
                        >
                          <div className="flex items-center">
                            <div className="font-medium text-sm">{policyName}</div>
                            {/*
                            <div className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                              </svg>
                              Verified
                            </div>
                            */}
                          </div>
                          <div className="flex items-center">
                            <a
                              href={`https://ipfs.io/ipfs/${policy.policyIpfsCid}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-gray-500 mr-2 font-mono hover:text-blue-500"
                              title={`View on IPFS: ${policy.policyIpfsCid}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {abbreviateIpfs(policy.policyIpfsCid)}
                            </a>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className={`transform transition-transform duration-300 ease-in-out ${isPolicyExpanded ? 'rotate-180' : ''}`}
                            >
                              <path
                                d="M6 9L12 15L18 9"
                                stroke="#6B7280"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        </div>

                        {/* Policy Body - Contains Parameters */}
                        <div
                          className={`bg-gray-50 transition-all duration-300 ease-in-out overflow-hidden ${isPolicyExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}
                        >
                          <div className="p-3 pt-2 pl-8 pr-4">
                            {policy.parameters.length === 0 ? (
                              <div className="text-sm text-gray-500 italic">
                                No parameters for this policy
                              </div>
                            ) : (
                              policy.parameters.map((param) => (
                                <div
                                  key={`${param.toolIndex}-${param.policyIndex}-${param.paramIndex}`}
                                >
                                  <ParameterInput
                                    name={param.name}
                                    type={param.type}
                                    value={param.value}
                                    onChange={(value) =>
                                      handleParameterChange({
                                        ...param,
                                        value,
                                      })
                                    }
                                  />
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
