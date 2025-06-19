import { useCallback, useState, useRef, useEffect } from 'react';
import { IRelayPKP } from '@lit-protocol/types';

import {
  AppView,
  VersionParameter,
  PolicyWithParameters,
  ToolWithPolicies,
  ContractVersionResult,
  PolicyParameter,
} from '@/types';
import { decodeParameterValue } from '@/utils/shared/parameterDecoding';
import {
  getAppViewRegistryContract,
  getUserViewRegistryContract,
} from '@/utils/user-dashboard/contracts';

interface UseParameterManagementProps {
  appId: string | null;
  agentPKP?: IRelayPKP;
  appInfo: AppView | null;
  onStatusChange?: (message: string, type?: 'info' | 'warning' | 'success' | 'error') => void;
  updateState?: (state: any) => void;
  permittedVersion: number | null;
  useCurrentVersionOnly?: boolean;
  checkingPermissions?: boolean;
  stabilityDelayMs?: number;
}

/**
 * Hook to manage parameter fetching, updating, and version information
 * This hook centralizes all parameter and version related operations
 */
export const useParameterManagement = ({
  appId,
  agentPKP,
  appInfo,
  onStatusChange,
  updateState,
  permittedVersion,
  useCurrentVersionOnly,
  checkingPermissions = false,
  stabilityDelayMs = 100,
}: UseParameterManagementProps) => {
  const [parameters, setParameters] = useState<VersionParameter[]>([]);
  const [existingParameters, setExistingParameters] = useState<VersionParameter[]>([]);
  const [isLoadingParameters, setIsLoadingParameters] = useState<boolean>(false);
  const [versionInfo, setVersionInfo] = useState<ContractVersionResult | null>(null);
  const [stableReady, setStableReady] = useState(false);

  // Refs to track state for version and parameter fetching
  const fetchExistingParametersRef = useRef<(() => Promise<void>) | null>(null);
  const parametersFetchedRef = useRef<boolean>(false);

  /**
   * Fetches version information for the specified app.
   * This provides details about the latest version of the app, including
   * tools, policies, and parameters that can be configured.
   * @param versionNumber Optional specific version to fetch. If not provided, uses the latest version.
   * @throws Error if appId or appInfo is missing, or if the contract call fails
   */
  const fetchVersionInfo = useCallback(
    async (versionNumber?: number): Promise<ContractVersionResult> => {
      if (!appId || !appInfo) {
        throw new Error('Missing appId or appInfo in fetchVersionInfo');
      }

      try {
        const versionToFetch =
          versionNumber !== undefined ? versionNumber : Number(appInfo.latestVersion);
        onStatusChange?.(`Loading app version information for v${versionToFetch}...`, 'info');
        const contract = getAppViewRegistryContract();
        const versionData = await contract.getAppVersion(Number(appId), versionToFetch);

        setVersionInfo(versionData);
        onStatusChange?.('', 'info');
        return versionData;
      } catch (err) {
        console.error('Error fetching version info:', err);
        onStatusChange?.('Failed to load app information', 'error');
        throw new Error(
          `Failed to fetch version info: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
    [appId, appInfo, onStatusChange],
  );

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

    if (isLoadingParameters || existingParameters.length > 0 || parametersFetchedRef.current) {
      return;
    }

    parametersFetchedRef.current = true;
    setIsLoadingParameters(true);
    onStatusChange?.('Loading your existing app parameters...', 'info');

    try {
      const userViewContract = getUserViewRegistryContract();
      const appIdNum = Number(appId);

      const toolsAndPolicies = await userViewContract.getAllToolsAndPoliciesForApp(
        agentPKP.tokenId,
        appIdNum,
      );

      // Transform the contract data into the VersionParameter format
      const existingParams: VersionParameter[] = [];

      // Process each tool
      toolsAndPolicies.forEach((tool: ToolWithPolicies, toolIndex: number) => {
        // Process each policy in the tool
        tool.policies.forEach((policy: PolicyWithParameters, policyIndex: number) => {
          // Process each parameter in the policy
          policy.parameters.forEach((param: PolicyParameter, paramIndex: number) => {
            // Use the shared utility to decode the parameter value
            const decodedValue = decodeParameterValue(param.value!, Number(param.type));

            existingParams.push({
              toolIndex,
              policyIndex,
              paramIndex,
              name: param.name,
              type: Number(param.type),
              value: decodedValue,
            });
          });
        });
      });

      setExistingParameters(existingParams);
      onStatusChange?.('', 'info'); // Clear the loading message on success
    } catch (error) {
      console.error('Error fetching existing parameters:', error);
      onStatusChange?.('Failed to load your existing parameters', 'error');
      parametersFetchedRef.current = false; // Reset on error to allow retry
      throw new Error(
        `Failed to fetch existing parameters: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsLoadingParameters(false);
    }
  }, [appId, agentPKP, existingParameters.length, isLoadingParameters, onStatusChange]);

  useEffect(() => {
    const currentlyReady =
      !checkingPermissions &&
      !isLoadingParameters &&
      (versionInfo !== null || useCurrentVersionOnly);

    if (currentlyReady) {
      const timer = setTimeout(() => {
        setStableReady(true);
      }, stabilityDelayMs);
      return () => clearTimeout(timer);
    } else {
      setStableReady(false);
      return;
    }
  }, [
    checkingPermissions,
    isLoadingParameters,
    versionInfo,
    useCurrentVersionOnly,
    stabilityDelayMs,
  ]);

  useEffect(() => {
    fetchExistingParametersRef.current = fetchExistingParameters;
  }, [fetchExistingParameters]);

  useEffect(() => {
    if (permittedVersion !== null && appId && appInfo && !versionInfo && !useCurrentVersionOnly) {
      if (updateState) {
        updateState({ isLoading: true });
      }

      fetchVersionInfo(permittedVersion)
        .then(() => {
          if (updateState) {
            updateState({ isLoading: false });
          }

          if (existingParameters.length === 0 && !isLoadingParameters) {
            fetchExistingParameters();
          }
        })
        .catch((error) => {
          console.error(`Error fetching version ${permittedVersion} data:`, error);
          if (updateState) {
            updateState({ isLoading: false });
          }
          onStatusChange?.('Failed to load version data', 'error');
        });
    }
  }, [
    permittedVersion,
    appId,
    appInfo,
    versionInfo,
    fetchVersionInfo,
    fetchExistingParameters,
    existingParameters.length,
    isLoadingParameters,
    updateState,
    onStatusChange,
    useCurrentVersionOnly,
  ]);

  useEffect(() => {
    if (
      useCurrentVersionOnly &&
      existingParameters.length === 0 &&
      !isLoadingParameters &&
      appId &&
      agentPKP
    ) {
      fetchExistingParameters();
    }
  }, [
    useCurrentVersionOnly,
    existingParameters.length,
    isLoadingParameters,
    appId,
    agentPKP,
    fetchExistingParameters,
  ]);

  /**
   * Updates the parameters state when user modifies values in the UI.
   */
  const handleParametersChange = useCallback(
    (newParameters: VersionParameter[]) => {
      // Check if the parameters actually changed to avoid unnecessary state updates
      if (
        parameters.length !== newParameters.length ||
        JSON.stringify(parameters) !== JSON.stringify(newParameters)
      ) {
        setParameters(newParameters);
      }
    },
    [parameters],
  );

  return {
    parameters,
    setParameters,
    existingParameters,
    isLoadingParameters,
    versionInfo,
    fetchVersionInfo,
    fetchExistingParameters,
    handleParametersChange,
    fetchExistingParametersRef: fetchExistingParametersRef.current,
    stableReady,
  };
};
