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
  ToolWithPolicies,
  ContractVersionResult
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
  // parameters holds the user's form input values
  const [parameters, setParameters] = useState<VersionParameter[]>([]);
  // existingParameters holds the values from the contract
  const [existingParameters, setExistingParameters] = useState<VersionParameter[]>([]);
  const [isLoadingParameters, setIsLoadingParameters] = useState<boolean>(false);
  const [versionInfo, setVersionInfo] = useState<ContractVersionResult | null>(null);

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
      throw new Error('Missing appId in fetchExistingParameters');
    }
    
    if (!agentPKP) {
      throw new Error('Missing agentPKP in fetchExistingParameters');
    }
    
    // Skip if we're already loading parameters
    if (isLoadingParameters) {
      console.log('Already loading parameters, skipping');
      return;
    }
    
    // Set loading state
    setIsLoadingParameters(true);
    onStatusChange?.('Loading your existing app parameters...', 'info');
    
    try {
      const userViewContract = getUserViewRegistryContract();
      const appIdNum = Number(appId);
      
      const toolsAndPolicies = await userViewContract.getAllToolsAndPoliciesForApp(
        agentPKP.tokenId,
        appIdNum
      );
      
      console.log('Fetched parameters from contract:', toolsAndPolicies);
      
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
    
      // Update the existingParameters state - these are values from contract
      setExistingParameters(existingParams);
      
      // Also initialize the form parameters if they haven't been set yet
      if (parameters.length === 0) {
        setParameters(existingParams);
      }
      
      parametersFetchedRef.current = true;
      onStatusChange?.('Successfully loaded your existing parameters', 'success');
    } catch (error) {
      console.error('Error fetching existing parameters:', error);
      onStatusChange?.('Failed to load your existing parameters', 'error');
      throw new Error(`Failed to fetch existing parameters: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoadingParameters(false);
    }
  }, [appId, agentPKP, isLoadingParameters, parameters.length, onStatusChange]);
  
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
      setParameters(newParameters);
    }
  }, [parameters]);

  /**
   * Fetches version information for the specified app.
   * This provides details about the latest version of the app, including
   * tools, policies, and parameters that can be configured.
   * @param versionNumber Optional specific version to fetch. If not provided, uses the latest version.
   * @throws Error if appId or appInfo is missing, or if the contract call fails
   */
  const fetchVersionInfo = useCallback(async (versionNumber?: number): Promise<ContractVersionResult> => {
    if (!appId || !appInfo) {
      throw new Error('Missing appId or appInfo in fetchVersionInfo');
    }
    
    try {
      const versionToFetch = versionNumber !== undefined ? versionNumber : Number(appInfo.latestVersion);
      onStatusChange?.(`Loading app version information for v${versionToFetch}...`, 'info');
      const contract = getAppViewRegistryContract();
      const versionData = await contract.getAppVersion(Number(appId), versionToFetch);
      
      setVersionInfo(versionData);
      onStatusChange?.('', 'info')
      return versionData;
    } catch (err) {
      console.error('Error fetching version info:', err);
      onStatusChange?.('Failed to load app information', 'error');
      throw new Error(`Failed to fetch version info: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [appId, appInfo, onStatusChange]);

  return {
    parameters,
    setParameters,
    existingParameters,
    isLoadingParameters,
    versionInfo,
    fetchVersionInfo,
    fetchExistingParameters,
    handleParametersChange
  };
}; 