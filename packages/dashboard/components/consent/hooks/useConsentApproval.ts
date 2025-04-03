import { useCallback } from 'react';
import { IRelayPKP } from '@lit-protocol/types';
import { LitContracts } from '@lit-protocol/contracts-sdk';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import * as ethers from 'ethers';
import { encodeParameterValue } from '../../../utils/parameterEncoding';
import {
  getUserViewRegistryContract,
  getUserRegistryContract,
} from '../utils/contracts';
import { estimateGasWithBuffer } from '@/services/contract/config';
import { AppView, VersionParameter } from '../types';
import { AUTH_METHOD_SCOPE } from '@lit-protocol/constants';
import { litNodeClient, SELECTED_LIT_NETWORK } from '../utils/lit';
import { ParameterType } from '@/services/types/parameterTypes';
import {
  decodeParameterValue,
  isEmptyParameterValue,
} from '../utils/parameterDecoding';

interface UseConsentApprovalProps {
  appId: string | null;
  appInfo: AppView | null;
  versionInfo: any;
  parameters: VersionParameter[];
  agentPKP?: IRelayPKP;
  userPKP: IRelayPKP;
  sessionSigs: any;
  onStatusChange?: (
    message: string,
    type: 'info' | 'warning' | 'success' | 'error',
  ) => void;
  onError?: (error: any, title?: string, details?: string) => void;
}

export const useConsentApproval = ({
  appId,
  appInfo,
  versionInfo,
  parameters,
  agentPKP,
  userPKP,
  sessionSigs,
  onStatusChange,
  onError,
}: UseConsentApprovalProps) => {
  const updateParameters = useCallback(async () => {
    if (!agentPKP || !appId || !appInfo) {
      console.error('Missing required data for parameter update');
      throw new Error('Missing required data for parameter update');
    }

    onStatusChange?.('Preparing to update parameters...', 'info');

    const userRegistryContract = getUserRegistryContract();

    onStatusChange?.('Initializing your PKP wallet...', 'info');
    const userPkpWallet = new PKPEthersWallet({
      controllerSessionSigs: sessionSigs,
      pkpPubKey: userPKP.publicKey,
      litNodeClient: litNodeClient,
    });
    await userPkpWallet.init();
    const connectedContract = userRegistryContract.connect(userPkpWallet);

    // Fetch existing parameters to identify which ones need to be removed
    let existingParameters: VersionParameter[] = [];
    try {
      const userViewContract = getUserViewRegistryContract();
      const appIdNum = Number(appId);

      const toolsAndPolicies =
        await userViewContract.getAllToolsAndPoliciesForApp(
          agentPKP.tokenId,
          appIdNum,
        );

      console.log('Existing tools and policies:', toolsAndPolicies);

      // Transform the contract data into the VersionParameter format
      toolsAndPolicies.forEach((tool: any, toolIndex: number) => {
        tool.policies.forEach((policy: any, policyIndex: number) => {
          policy.parameters.forEach((param: any, paramIndex: number) => {
            // Use the shared utility function to decode parameter values
            const decodedValue = decodeParameterValue(
              param.value,
              param.paramType,
            );

            existingParameters.push({
              toolIndex,
              policyIndex,
              paramIndex,
              name: param.name,
              type: param.paramType,
              value: decodedValue,
            });
          });
        });
      });

      console.log(
        'Existing parameters with decoded values:',
        existingParameters,
      );
    } catch (error) {
      console.error('Error fetching existing parameters:', error);
    }

    // Now check for parameters that need to be removed (form field is empty)
    const parametersToRemove: VersionParameter[] = [];

    // First create a map of form parameters for easy comparison
    const formParameterMap = new Map<string, VersionParameter>();
    // Create a name+type map for more reliable matching
    const formParameterNameTypeMap = new Map<string, VersionParameter>();

    parameters.forEach((param) => {
      // Position-based mapping (legacy approach)
      const posKey = `${param.toolIndex}-${param.policyIndex}-${param.paramIndex}`;
      formParameterMap.set(posKey, param);

      // Name+type based mapping (more reliable)
      const nameTypeKey = `${param.name}:${param.type}`;
      formParameterNameTypeMap.set(nameTypeKey, param);

      // Additional logging for form parameter values
      console.log(`Form parameter ${param.name} (type: ${param.type}): `, {
        value: param.value,
        valueType: typeof param.value,
        isEmptyString: param.value === '',
        isZero: param.value === '0' || param.value === 0,
        isArray: Array.isArray(param.value),
        hasHexPrefix:
          typeof param.value === 'string' && param.value.startsWith('0x'),
      });
    });

    console.log(
      'Checking existing parameters for removal:',
      existingParameters,
    );

    // Check each existing parameter
    existingParameters.forEach((existingParam) => {
      try {
        // Simply match by name - the most direct approach
        const formParam = parameters.find((p) => p.name === existingParam.name);

        // Log comparisons for debugging
        console.log(`Comparing parameter ${existingParam.name}:`, {
          existingValue: existingParam.value,
          formValue: formParam ? formParam.value : 'NOT FOUND',
          existingType: existingParam.type,
          formType: formParam ? formParam.type : 'N/A',
          isArray: [
            ParameterType.INT256_ARRAY,
            ParameterType.UINT256_ARRAY,
            ParameterType.BOOL_ARRAY,
            ParameterType.ADDRESS_ARRAY,
            ParameterType.STRING_ARRAY,
          ].includes(existingParam.type),
        });

        // If no matching parameter in form, remove it
        if (!formParam) {
          console.log(
            `Parameter ${existingParam.name} not found in form, will be removed`,
          );
          parametersToRemove.push(existingParam);
        }
        // Special case for array types: always remove if the array is empty or has only empty/default values
        else if (
          [
            ParameterType.INT256_ARRAY,
            ParameterType.UINT256_ARRAY,
            ParameterType.BOOL_ARRAY,
            ParameterType.ADDRESS_ARRAY,
            ParameterType.STRING_ARRAY,
          ].includes(formParam.type) &&
          isEmptyParameterValue(formParam.value, formParam.type)
        ) {
          console.log(
            `Array parameter ${existingParam.name} is empty and will be removed`,
          );
          parametersToRemove.push(existingParam);
        }
        // If there is a matching parameter, but its value is empty or placeholder, remove if values differ
        else if (isEmptyParameterValue(formParam.value, formParam.type)) {
          // Only remove if the existing value wasn't also empty/zero
          if (!isEmptyParameterValue(existingParam.value, existingParam.type)) {
            console.log(
              `Parameter ${existingParam.name} will be removed: value changed from '${existingParam.value}' to empty`,
            );
            parametersToRemove.push(existingParam);
          } else {
            console.log(
              `Parameter ${existingParam.name} has empty value but existing was also empty/zero, not removing`,
            );
          }
        } else {
          console.log(
            `Parameter ${existingParam.name} has non-empty value (${formParam.value}), not removing`,
          );
        }
      } catch (error) {
        console.error(
          `Error checking parameter ${existingParam.name} for removal:`,
          error,
        );
      }
    });

    // If we have parameters to remove, prepare and send the removal transaction
    if (parametersToRemove.length > 0) {
      console.log(`Found ${parametersToRemove.length} parameters to remove`);
      onStatusChange?.('Removing cleared parameters...', 'info');

      // Prepare data structure for the removal function
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
          const toolsData =
            versionInfo.appVersion?.tools || versionInfo[1]?.[3];
          if (toolsData && toolsData[toolIndex] && toolsData[toolIndex][0]) {
            removalToolIpfsCids[toolIndex] = toolsData[toolIndex][0];
          }
        }

        // Ensure policy arrays exist
        while (removalPolicyIpfsCids[toolIndex].length <= policyIndex) {
          removalPolicyIpfsCids[toolIndex].push('');
          removalParameterNames[toolIndex].push([]);
        }

        // Set the policy IPFS CID
        if (!removalPolicyIpfsCids[toolIndex][policyIndex] && versionInfo) {
          const toolsData =
            versionInfo.appVersion?.tools || versionInfo[1]?.[3];
          if (
            toolsData &&
            toolsData[toolIndex] &&
            toolsData[toolIndex][1] &&
            toolsData[toolIndex][1][policyIndex] &&
            toolsData[toolIndex][1][policyIndex][0]
          ) {
            removalPolicyIpfsCids[toolIndex][policyIndex] =
              toolsData[toolIndex][1][policyIndex][0];
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

      // Only proceed if we have valid data to remove
      if (
        filteredTools.length > 0 &&
        filteredPolicies.length > 0 &&
        filteredParams.length > 0
      ) {
        console.log('Calling removeToolPolicyParameters with:', {
          filteredTools,
          filteredPolicies,
          filteredParams,
        });

        try {
          const removeArgs = [
            appId,
            agentPKP.tokenId,
            Number(appInfo.latestVersion),
            filteredTools,
            filteredPolicies,
            filteredParams,
          ];

          const removeGasLimit = await estimateGasWithBuffer(
            connectedContract,
            'removeToolPolicyParameters',
            removeArgs,
          );

          onStatusChange?.(
            'Sending transaction to remove cleared parameters...',
            'info',
          );
          const removeTxResponse =
            await connectedContract.removeToolPolicyParameters(...removeArgs, {
              gasLimit: removeGasLimit,
            });

          console.log(
            'PARAMETER REMOVAL TRANSACTION SENT:',
            removeTxResponse.hash,
          );
          onStatusChange?.(
            `Parameter removal transaction submitted! Hash: ${removeTxResponse.hash.substring(0, 10)}...`,
            'info',
          );

          await removeTxResponse.wait();
          console.log('Parameter removal transaction confirmed!');
        } catch (error) {
          console.error('Parameter removal failed:', error);
          onStatusChange?.('Failed to remove cleared parameters', 'warning');
        }
      }
    }

    onStatusChange?.('Preparing parameter data for contract...', 'info');
    const toolIpfsCids: string[] = [];
    const policyIpfsCids: string[][] = [];
    const policyParameterNames: string[][][] = [];
    const policyParameterValues: Uint8Array[][][] = [];

    if (versionInfo) {
      const toolsData = versionInfo.appVersion?.tools || versionInfo[1]?.[3];

      if (toolsData && Array.isArray(toolsData)) {
        toolsData.forEach((tool: any, toolIndex: number) => {
          if (!tool || !Array.isArray(tool)) return;

          const toolIpfsCid = tool[0];
          if (toolIpfsCid) {
            toolIpfsCids[toolIndex] = toolIpfsCid;
            policyIpfsCids[toolIndex] = [];
            policyParameterNames[toolIndex] = [];
            policyParameterValues[toolIndex] = [];

            const policies = tool[1];
            if (Array.isArray(policies)) {
              policies.forEach((policy: any, policyIndex: number) => {
                if (!policy || !Array.isArray(policy)) return;

                const policyIpfsCid = policy[0];
                policyIpfsCids[toolIndex][policyIndex] = policyIpfsCid;
                policyParameterNames[toolIndex][policyIndex] = [];
                policyParameterValues[toolIndex][policyIndex] = [];

                const paramNames = policy[1];

                if (Array.isArray(paramNames)) {
                  // Filter parameters that have user-provided values
                  paramNames.forEach((name: any, paramIndex: number) => {
                    // Find matching parameter value from user input
                    const param = parameters.find(
                      (p) =>
                        p.toolIndex === toolIndex &&
                        p.policyIndex === policyIndex &&
                        p.paramIndex === paramIndex,
                    );

                    // Only add parameters that have user-provided values and aren't empty
                    if (param && param.value !== undefined) {
                      // Check if parameter is empty and should be skipped using the shared utility
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

                      policyParameterNames[toolIndex][policyIndex].push(
                        paramName,
                      );
                      policyParameterValues[toolIndex][policyIndex].push(
                        encodeParameterValue(
                          param.type,
                          param.value,
                          paramName,
                        ),
                      );
                    }
                  });
                }
              });
            }
          }
        });
      }
    }

    // Check if there are any parameters to set
    const hasParametersToSet = toolIpfsCids.some((toolCid, toolIndex) => {
      if (policyIpfsCids[toolIndex]) {
        return policyIpfsCids[toolIndex].some((policyCid, policyIndex) => {
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

    // Skip setToolPolicyParameters if there are no parameters to set
    if (!hasParametersToSet) {
      console.log(
        'No parameters to set, skipping setToolPolicyParameters call',
      );
      onStatusChange?.('Parameter updates complete', 'success');
      return { status: 1, hash: 'parameter-removal-only' };
    }

    try {
      const updateArgs = [
        agentPKP.tokenId,
        appId,
        Number(appInfo.latestVersion),
        toolIpfsCids,
        policyIpfsCids,
        policyParameterNames,
        policyParameterValues,
      ];

      onStatusChange?.('Estimating transaction gas fees...', 'info');
      const gasLimit = await estimateGasWithBuffer(
        connectedContract,
        'setToolPolicyParameters',
        updateArgs,
      );

      onStatusChange?.('Sending transaction to update parameters...', 'info');
      const txResponse = await connectedContract.setToolPolicyParameters(
        ...updateArgs,
        {
          gasLimit,
        },
      );

      console.log('PARAMETER UPDATE TRANSACTION SENT:', txResponse.hash);
      onStatusChange?.(
        `Transaction submitted! Hash: ${txResponse.hash.substring(0, 10)}...`,
        'info',
      );
      return txResponse;
    } catch (error) {
      console.error('PARAMETER UPDATE FAILED:', error);
      onStatusChange?.('Parameter update failed', 'error');
      throw error;
    }
  }, [
    agentPKP,
    appId,
    appInfo,
    sessionSigs,
    userPKP,
    parameters,
    versionInfo,
    onStatusChange,
  ]);

  // Main consent approval function
  const approveConsent = useCallback(async () => {
    if (!agentPKP || !appId || !appInfo) {
      console.error('Missing required data for consent approval');
      throw new Error('Missing required data for consent approval');
    }

    onStatusChange?.('Checking if app version is already permitted...', 'info');
    console.log('CHECKING IF APP VERSION IS ALREADY PERMITTED...');
    try {
      const userViewContract = getUserViewRegistryContract();
      const permittedAppIds =
        await userViewContract.getAllPermittedAppIdsForPkp(agentPKP.tokenId);

      const appIdNum = Number(appId);
      const isAppPermitted = permittedAppIds.some(
        (id: ethers.BigNumber) => id.toNumber() === appIdNum,
      );

      if (isAppPermitted) {
        try {
          const currentPermittedVersion =
            await userViewContract.getPermittedAppVersionForPkp(
              agentPKP.tokenId,
              appIdNum,
            );

          const currentVersion = currentPermittedVersion.toNumber();
          const newVersion = Number(appInfo.latestVersion);

          console.log(
            `FOUND PERMITTED VERSION: Current is v${currentVersion}, checking against v${newVersion}`,
          );

          // If trying to permit the same version, use updateParameters instead
          if (currentVersion === newVersion) {
            console.log(
              `VERSION MATCH: Using setToolPolicyParameters for version ${currentVersion} instead of permitAppVersion`,
            );
            return await updateParameters();
          }

          console.log(
            `VERSION UPGRADE: Attempting to permit v${newVersion} as upgrade from v${currentVersion}`,
          );
        } catch (e) {
          console.error('Error checking permitted version:', e);
        }
      } else {
        console.log('No currently permitted version found for this app');
      }
    } catch (e) {
      console.error('Error checking for permitted apps:', e);
    }

    // Now proceed with permitting the new version
    onStatusChange?.(
      `Permitting version ${Number(appInfo.latestVersion)}...`,
      'info',
    );
    console.log(
      `PERMITTING: Now permitting version ${Number(appInfo.latestVersion)}`,
    );

    const userRegistryContract = getUserRegistryContract();
    onStatusChange?.('Initializing your PKP wallet...', 'info');
    const userPkpWallet = new PKPEthersWallet({
      controllerSessionSigs: sessionSigs,
      pkpPubKey: userPKP.publicKey,
      litNodeClient: litNodeClient,
    });
    await userPkpWallet.init();
    const connectedContract = userRegistryContract.connect(userPkpWallet);

    const toolIpfsCids: string[] = [];
    const toolPolicies: string[][] = [];
    const toolPolicyParameterNames: string[][][] = [];
    const toolPolicyParameterTypes: number[][][] = [];

    if (versionInfo) {
      const toolsData = versionInfo.appVersion?.tools || versionInfo[1]?.[3];

      if (toolsData && Array.isArray(toolsData)) {
        toolsData.forEach((tool: any, toolIndex: number) => {
          if (!tool || !Array.isArray(tool)) return;

          const toolIpfsCid = tool[0];
          if (toolIpfsCid) {
            toolIpfsCids[toolIndex] = toolIpfsCid;
          }

          toolPolicies[toolIndex] = [];
          toolPolicyParameterNames[toolIndex] = [];
          toolPolicyParameterTypes[toolIndex] = [];

          const policies = tool[1];
          if (Array.isArray(policies)) {
            policies.forEach((policy: any, policyIndex: number) => {
              if (!policy || !Array.isArray(policy)) return;

              toolPolicies[toolIndex][policyIndex] = policy[0];
              toolPolicyParameterNames[toolIndex][policyIndex] = [];
              toolPolicyParameterTypes[toolIndex][policyIndex] = [];

              // Extract the actual parameter names and types from the policy
              const paramNames = policy[1];
              const paramTypes = policy[2];

              if (Array.isArray(paramNames) && Array.isArray(paramTypes)) {
                // Use the actual parameter names from the version info
                paramNames.forEach((name: any, paramIndex: number) => {
                  // Ensure parameter name is never empty by using a default if it's empty
                  const paramName =
                    typeof name === 'string' && name.trim() !== ''
                      ? name.trim()
                      : `param_${paramIndex}`;

                  toolPolicyParameterNames[toolIndex][policyIndex][paramIndex] =
                    paramName;

                  // Set the parameter type if available
                  if (paramTypes[paramIndex] !== undefined) {
                    toolPolicyParameterTypes[toolIndex][policyIndex][
                      paramIndex
                    ] =
                      typeof paramTypes[paramIndex] === 'number'
                        ? paramTypes[paramIndex]
                        : 0;
                  } else {
                    toolPolicyParameterTypes[toolIndex][policyIndex][
                      paramIndex
                    ] = 0;
                  }
                });
              }
            });
          }
        });
      }
    }

    // Don't override parameter names with user input - only update parameter values
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

    // Filter toolPolicyParameterNames and check for empty values
    const filteredToolPolicyParameterNames = toolPolicyParameterNames.map(
      (toolParams, toolIndex) =>
        toolParams.map((policyParams, policyIndex) =>
          policyParams.filter((paramName, paramIndex) => {
            const param = parameters.find(
              (p) =>
                p.toolIndex === toolIndex &&
                p.policyIndex === policyIndex &&
                p.paramIndex === paramIndex,
            );

            // Skip if param doesn't exist or value is undefined
            if (!param || param.value === undefined) return false;

            // Use shared utility to check if value is empty
            return !isEmptyParameterValue(param.value, param.type);
          }),
        ),
    );

    // Filter toolPolicyParameterTypes with the same logic
    const filteredToolPolicyParameterTypes = toolPolicyParameterTypes.map(
      (toolParams, toolIndex) =>
        toolParams.map((policyParams, policyIndex) =>
          policyParams.filter((_, paramIndex) => {
            const param = parameters.find(
              (p) =>
                p.toolIndex === toolIndex &&
                p.policyIndex === policyIndex &&
                p.paramIndex === paramIndex,
            );

            // Skip if param doesn't exist or value is undefined
            if (!param || param.value === undefined) return false;

            // Use shared utility to check if value is empty
            return !isEmptyParameterValue(param.value, param.type);
          }),
        ),
    );

    // Filter and encode parameter values with the same logic
    const policyParameterValues = toolPolicyParameterNames.map(
      (toolParams, toolIndex) =>
        toolParams.map((policyParams, policyIndex) => {
          // Only include parameters that have user-provided values and aren't empty
          const filteredParams = policyParams.filter(
            (paramName, paramIndex) => {
              const param = parameters.find(
                (p) =>
                  p.toolIndex === toolIndex &&
                  p.policyIndex === policyIndex &&
                  p.paramIndex === paramIndex,
              );

              // Skip if param doesn't exist or value is undefined
              if (!param || param.value === undefined) return false;

              // Use shared utility to check if value is empty
              return !isEmptyParameterValue(param.value, param.type);
            },
          );

          // For each filtered parameter, encode its value
          return filteredParams.map((paramName, filteredIndex) => {
            const originalIndex = policyParams.indexOf(paramName);
            const param = parameters.find(
              (p) =>
                p.toolIndex === toolIndex &&
                p.policyIndex === policyIndex &&
                p.paramIndex === originalIndex,
            );
            return encodeParameterValue(param!.type, param!.value, paramName);
          });
        }),
    );

    // After creating the filtered arrays, log the filtered parameters
    console.log('Sending transaction with filtered parameters:', {
      toolIpfsCids,
      toolPolicies,
      filteredToolPolicyParameterNames,
      filteredToolPolicyParameterTypes,
      policyParameterValues,
    });

    // Now check for parameters that need to be removed (were previously set but now cleared)
    const parametersToRemove: VersionParameter[] = [];
    if (parameters.length > 0) {
      console.log('Checking existing parameters for removal:', parameters);
      parameters.forEach((existingParam) => {
        // Find the matching parameter in the current parameters
        const currentParam = parameters.find(
          (p) =>
            p.toolIndex === existingParam.toolIndex &&
            p.policyIndex === existingParam.policyIndex &&
            p.paramIndex === existingParam.paramIndex,
        );

        console.log(`Checking parameter ${existingParam.name}: `, {
          existing: existingParam.value,
          current: currentParam?.value,
          type: existingParam.type,
        });

        // Parameter has been cleared if it existed before but now has empty value
        const isCleared =
          // If there is no current parameter
          !currentParam ||
          // Or the current value is empty string
          currentParam.value === '';
          // Or for address type, it's the default address or placeholder

        if (isCleared) {
          console.log(
            `Parameter ${existingParam.name} has been cleared and will be removed`,
          );
          parametersToRemove.push(existingParam);
        }
      });
    }

    // After parameter removal (or if none needed), continue with permitAppVersion
    onStatusChange?.('Sending transaction with filtered parameters:', 'info');
    console.log('Sending transaction with filtered parameters:', {
      toolIpfsCids,
      toolPolicies,
      filteredToolPolicyParameterNames,
      filteredToolPolicyParameterTypes,
      policyParameterValues,
    });

    // Create the args array for the permitAppVersion method
    const permitArgs = [
      agentPKP.tokenId,
      appId,
      Number(appInfo.latestVersion),
      toolIpfsCids,
      toolPolicies,
      filteredToolPolicyParameterNames,
      policyParameterValues,
    ];

    try {
      onStatusChange?.('Estimating transaction gas fees...', 'info');
      const gasLimit = await estimateGasWithBuffer(
        connectedContract,
        'permitAppVersion',
        permitArgs,
      );

      onStatusChange?.('Sending permission transaction...', 'info');
      const txResponse = await connectedContract.permitAppVersion(
        ...permitArgs,
        {
          gasLimit,
        },
      );

      console.log('PERMIT TRANSACTION SENT:', txResponse.hash);
      onStatusChange?.(
        `Transaction submitted! Hash: ${txResponse.hash.substring(0, 10)}...`,
        'info',
      );
    } catch (error) {
      console.error('TRANSACTION FAILED:', error);

      // Try to extract more specific error information
      const errorObj = error as any;
      const errorMessage = errorObj.message || '';
      const errorData = errorObj.data || '';
      const errorReason = errorObj.reason || '';

      console.error('Error details:', {
        message: errorMessage,
        data: errorData,
        reason: errorReason,
      });

      // Get the raw error message for display in details
      let rawErrorDetails = '';
      if (typeof errorMessage === 'string') {
        rawErrorDetails = errorMessage.substring(0, 500); // Get first 500 chars
      }

      // Format the raw error details for better readability
      if (rawErrorDetails.includes('execution reverted')) {
        const parts = rawErrorDetails.split('execution reverted');
        if (parts.length > 1) {
          rawErrorDetails = 'Execution reverted: ' + parts[1].trim();
        }
      }

      // Check for common contract errors
      let userFriendlyError: string;

      if (errorMessage.includes('AppNotRegistered')) {
        userFriendlyError = `App ID ${appId} is not registered in the contract`;
      } else if (
        errorMessage.includes('AppVersionNotRegistered') ||
        errorMessage.includes('AppVersionNotEnabled')
      ) {
        userFriendlyError = `App version ${appInfo.latestVersion} is not registered or not enabled`;
      } else if (
        errorMessage.includes('EmptyToolIpfsCid') ||
        errorMessage.includes('EmptyPolicyIpfsCid')
      ) {
        userFriendlyError = 'One of the tool or policy IPFS CIDs is empty';
      } else if (
        errorMessage.includes('EmptyParameterName') ||
        errorMessage.includes('EmptyParameterValue')
      ) {
        userFriendlyError = 'Parameter name or value cannot be empty';
      } else if (
        errorMessage.includes('PolicyParameterNameNotRegistered') ||
        errorMessage.includes('ToolNotRegistered') ||
        errorMessage.includes('ToolPolicyNotRegistered')
      ) {
        userFriendlyError =
          'Tool, policy, or parameter is not properly registered for this app version';
      } else if (errorMessage.includes('NotPkpOwner')) {
        userFriendlyError = 'You are not the owner of this PKP';
      } else if (errorMessage.includes('cannot estimate gas')) {
        userFriendlyError =
          'Transaction cannot be completed - the contract rejected it';
      } else {
        // Default error message
        userFriendlyError = `Transaction failed`;
      }

      // Show the error in the popup with detailed information
      onError?.(userFriendlyError, 'Contract Error', rawErrorDetails);

      // Rethrow the error with the user-friendly message
      throw new Error(userFriendlyError);
    }

    // Verify the permitted version after the transaction
    try {
      onStatusChange?.('Verifying permission grant...', 'info');
      console.log(
        'VERIFYING PERMIT: Checking if new version was properly registered...',
      );
      // Small delay to ensure the blockchain state has been updated
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const userViewContract = getUserViewRegistryContract();
      const verifiedVersion =
        await userViewContract.getPermittedAppVersionForPkp(
          agentPKP.tokenId,
          Number(appId),
        );

      const verifiedVersionNum = verifiedVersion.toNumber();
      console.log(
        `VERIFICATION RESULT: Current permitted version is now ${verifiedVersionNum}`,
      );

      if (verifiedVersionNum !== Number(appInfo.latestVersion)) {
        console.error(
          `VERSION MISMATCH: Expected version ${Number(appInfo.latestVersion)} but found ${verifiedVersionNum}`,
        );
        // Consider adding error handling here - the transaction succeeded but didn't update the state as expected
      } else {
        console.log('PERMIT SUCCESS: Version was successfully updated');
      }
    } catch (verifyError) {
      console.error(
        'Error verifying permitted version after update:',
        verifyError,
      );
      onStatusChange?.('Could not verify permission grant', 'warning');
    }


      // Initialize Lit Contracts
      const litContracts = new LitContracts({
        network: SELECTED_LIT_NETWORK,
        signer: userPkpWallet,
      });
      await litContracts.connect();
      
      console.log(`Adding permitted actions for ${toolIpfsCids.length} tools`);
      onStatusChange?.(
        `Adding permissions for ${toolIpfsCids.length} action(s)...`,
        'info',
      );
      
      for (const ipfsCid of toolIpfsCids) {
        try {
          // Check if this action is already permitted
          const isAlreadyPermitted = await litContracts.pkpPermissionsContractUtils.read.isPermittedAction(
            agentPKP.tokenId,
            ipfsCid
          );
          
          if (isAlreadyPermitted) {
            console.log(`Permission already exists for IPFS CID: ${ipfsCid}`);
            onStatusChange?.(
              `Permission already exists for ${ipfsCid.substring(0, 8)}...`,
              'info'
            );
            await new Promise((resolve) => setTimeout(resolve, 10000));
            continue;

          }
          
          // Permission doesn't exist, add it
          onStatusChange?.(
            `Adding permission for ${ipfsCid.substring(0, 8)}...`,
            'info',
          );

          const tx = await litContracts.addPermittedAction({
            ipfsId: ipfsCid,
            pkpTokenId: agentPKP.tokenId,
            authMethodScopes: [AUTH_METHOD_SCOPE.SignAnything],
          });

          if(ipfsCid === process.env.NEXT_PUBLIC_DCA_TOOL_IPFS_CID) {
            await litContracts.addPermittedAction({
              ipfsId: process.env.NEXT_PUBLIC_DCA_POLICY_IPFS_CID!,
              pkpTokenId: agentPKP.tokenId,
              authMethodScopes: [AUTH_METHOD_SCOPE.SignAnything],
            });
          }

          console.log(`Added permission for ${ipfsCid} - Transaction hash: ${tx}`);
        } catch (error) {
          console.error(
            `Error adding permitted action for IPFS CID ${ipfsCid}:`,
            error
          );
          onStatusChange?.(`Failed to add permission for an action`, 'warning');
          // Continue with the next IPFS CID even if one fails
        }
      }
      onStatusChange?.('Action permissions added!', 'success');

    onStatusChange?.('Permission grant successful!', 'success');

    return;
  }, [
    agentPKP,
    appId,
    appInfo,
    sessionSigs,
    userPKP,
    parameters,
    versionInfo,
    updateParameters,
    onStatusChange,
    onError,
  ]);

  return {
    approveConsent,
    updateParameters,
  };
};
