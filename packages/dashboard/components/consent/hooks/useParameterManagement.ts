import { useCallback, useState, useRef } from 'react';
import { IRelayPKP } from '@lit-protocol/types';

import { 
  getAppViewRegistryContract, 
  getUserViewRegistryContract 
} from '../utils/contracts';
import { 
  AppView, 
  VersionParameter, 
  PolicyParameter, 
  PolicyWithParameters, 
  ToolWithPolicies 
} from '../types';
import { decodeParameterValue } from '../utils/parameterDecoding';

interface UseParameterManagementProps {
  appId: string | null;
  agentPKP?: IRelayPKP;
  appInfo: AppView | null;
  onStatusChange?: (message: string, type?: 'info' | 'warning' | 'success' | 'error') => void;
}

/**
 * This hook manages the parameters for an app version.
 * It handles loading, decoding, and updating parameters, as well as fetching version information.
 * Parameters are used to customize how an app interacts with tools and policies.
 */
export const useParameterManagement = ({
  appId,
  agentPKP,
  appInfo,
  onStatusChange
}: UseParameterManagementProps) => {
  const [parameters, setParameters] = useState<VersionParameter[]>([]);
  const [existingParameters, setExistingParameters] = useState<VersionParameter[]>([]);
  const [isLoadingParameters, setIsLoadingParameters] = useState<boolean>(false);
  const [versionInfo, setVersionInfo] = useState<any>(null);

  // Ref to track if we've already fetched parameters
  const parametersFetchedRef = useRef(false);
  
  /**
   * Fetches existing parameters for the app from the smart contract.
   * This retrieves the current parameter values that were previously set for this PKP and app.
   * The parameters are then decoded and transformed into a user-friendly format.
   */
  const fetchExistingParameters = useCallback(async () => {
    // Safety check to ensure required values are present
    if (!appId) {
      console.error('Missing appId in fetchExistingParameters');
      return;
    }
    
    if (!agentPKP) {
      console.error('Missing agentPKP in fetchExistingParameters');
      return;
    }
    
    if (isLoadingParameters || existingParameters.length > 0 || parametersFetchedRef.current) {
      return;
    }
    
    parametersFetchedRef.current = true;
    setIsLoadingParameters(true);
    onStatusChange?.('Loading your existing app parameters...', 'info');
    
    try {
      console.log('Fetching parameters with:', { appId, tokenId: agentPKP.tokenId });
      const userViewContract = getUserViewRegistryContract();
      const appIdNum = Number(appId);
      
      const toolsAndPolicies = await userViewContract.getAllToolsAndPoliciesForApp(
        agentPKP.tokenId,
        appIdNum
      );
      
      console.log('Existing tools and policies:', toolsAndPolicies);
      
      // Transform the contract data into the VersionParameter format
      const existingParams: VersionParameter[] = [];
      
      // Process each tool
      toolsAndPolicies.forEach((tool: ToolWithPolicies, toolIndex: number) => {
        // Process each policy in the tool
        tool.policies.forEach((policy: PolicyWithParameters, policyIndex: number) => {
          // Process each parameter in the policy
          policy.parameters.forEach((param: PolicyParameter, paramIndex: number) => {
            // Use the shared utility to decode the parameter value
            const decodedValue = decodeParameterValue(param.value, param.paramType);
            
            existingParams.push({
              toolIndex,
              policyIndex,
              paramIndex,
              name: param.name,
              type: param.paramType,
              value: decodedValue
            });
          });
        });
      });
      
      console.log('Transformed parameters with decoded values:', existingParams);
      setExistingParameters(existingParams);
      onStatusChange?.('Successfully loaded your existing parameters', 'success');
      
      // Also try to fetch version info to match parameter names if not already loaded
      if (!versionInfo && appInfo) {
        try {
          const contract = getAppViewRegistryContract();
          const versionData = await contract.getAppVersion(Number(appId), Number(appInfo.latestVersion));
          console.log('Fetched version info for parameter matching:', versionData);
          setVersionInfo(versionData);
        } catch (err) {
          console.error('Error fetching version info for parameter matching:', err);
        }
      }
      
    } catch (error) {
      console.error('Error fetching existing parameters:', error);
      onStatusChange?.('Failed to load your existing parameters', 'error');
    } finally {
      setIsLoadingParameters(false);
    }
  }, [appId, agentPKP, versionInfo, appInfo, isLoadingParameters, existingParameters, onStatusChange]);
  
  /**
   * Handles changes to the parameters in the form.
   * Updates the parameters state when user modifies values in the UI.
   */
  const handleParametersChange = useCallback((newParameters: VersionParameter[]) => {
    // Check if the parameters actually changed to avoid unnecessary state updates
    if (
      parameters.length !== newParameters.length ||
      JSON.stringify(parameters) !== JSON.stringify(newParameters)
    ) {
      console.log('Parameters updated:', newParameters);
      setParameters(newParameters);
    }
  }, [parameters]);

  /**
   * Fetches version information for the specified app.
   * This provides details about the latest version of the app, including
   * tools, policies, and parameters that can be configured.
   * @param versionNumber Optional specific version to fetch. If not provided, uses the latest version.
   */
  const fetchVersionInfo = useCallback(async (versionNumber?: number) => {
    if (!appId || !appInfo) {
      console.error('Missing appId or appInfo in fetchVersionInfo');
      return null;
    }

    try {
      const versionToFetch = versionNumber !== undefined ? versionNumber : Number(appInfo.latestVersion);
      onStatusChange?.(`Loading app version information for v${versionToFetch}...`, 'info');
      const contract = getAppViewRegistryContract();
      const versionData = await contract.getAppVersion(Number(appId), versionToFetch);
      console.log('Version info:', versionData);
      
      setVersionInfo(versionData);
      onStatusChange?.('Successfully loaded app version information', 'success');
      return versionData;
    } catch (err) {
      console.error('Error fetching version info:', err);
      onStatusChange?.('Failed to load app information', 'error');
      return null;
    }
  }, [appId, appInfo, onStatusChange]);

  return {
    parameters,
    setParameters,
    existingParameters,
    isLoadingParameters,
    versionInfo,
    fetchVersionInfo,
    decodeParameterValue,
    fetchExistingParameters,
    handleParametersChange
  };
}; 