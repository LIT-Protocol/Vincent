import { useCallback } from 'react';
import { IRelayPKP } from '@lit-protocol/types';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { AppView, VersionInfo, VersionParameter } from '../types';
import { connectLitClient, litNodeClient } from '../utils/lit';
import {
  getUserViewRegistryContract,
  getUserRegistryContract,
} from '../utils/contracts';
import { useParameterManagement } from './useParameterManagement';
import { isEmptyParameterValue } from '../utils/parameterDecoding';
import {
  prepareParameterRemovalData,
  prepareParameterUpdateData,
  identifyParametersToRemove,
  prepareVersionPermitData
} from '../utils/consentArrayUtils';
import {
  sendTransaction,
  addPermittedActions
} from '../utils/consentTransactionUtils';
import {
  checkAppPermissionStatus,
  verifyPermissionGrant
} from '../utils/consentVerificationUtils';

/**
 * Hook for managing application consent approval and parameter management in Lit Protocol
 * 
 * This hook provides functionality for:
 * - Approving consent for applications and specific versions
 * - Managing tool/policy parameters (adding, updating, removing)
 * - Handling blockchain transactions related to consent management
 * - Verifying permissions and parameter updates
 * - Managing PKP (Programmable Key Pair) wallets and signing
 * 
 * The hook handles multiple states of consent:
 * - Initial application consent approval
 * - Updating parameters for already consented applications
 * - Upgrading to new application versions
 * - Removing parameters that have been cleared
 * 
 * It also provides comprehensive status updates during the entire process
 * and handles error cases with user-friendly messaging.
 */

interface UseConsentApprovalProps {
  appId: string;
  appInfo: AppView;
  versionInfo: VersionInfo;
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
  useParameterManagement({
    appId,
    agentPKP,
    appInfo,
    onStatusChange: onStatusChange ?
      (message, type = 'info') => onStatusChange(message, type) :
      undefined,
  });

  /**
   * Helper function to initialize the PKP wallet and connect to contracts
   * @returns The wallet and connected registry contract
   */
  const initializeWallet = useCallback(async () => {
    onStatusChange?.('Initializing your PKP wallet...', 'info');

    await connectLitClient();

    // Create and initialize the wallet
    const userPkpWallet = new PKPEthersWallet({
      controllerSessionSigs: sessionSigs,
      pkpPubKey: userPKP.publicKey,
      litNodeClient: litNodeClient,
    });

    await userPkpWallet.init();

    // Connect wallet to the user registry contract
    const userRegistryContract = getUserRegistryContract();
    const connectedContract = userRegistryContract.connect(userPkpWallet);

    return {
      wallet: userPkpWallet,
      connectedContract,
    };
  }, [sessionSigs, userPKP, onStatusChange]);

  /**
   * Updates parameters for an existing app consent
   */
  const updateParameters = useCallback(async () => {
    if (!agentPKP || !appId || !appInfo || !versionInfo) {
      console.error('Missing required data for parameter update');
      throw new Error('Missing required data for parameter update');
    }

    onStatusChange?.('Preparing to update parameters...', 'info');

    const { connectedContract } = await initializeWallet();

    // Check for permitted version to ensure we use the correct version number
    const { isPermitted, permittedVersion } = await checkAppPermissionStatus(
      agentPKP.tokenId,
      appId,
      onStatusChange
    );

    // Use the correct version number - the one that's actually permitted, not the latest
    const versionToUse = isPermitted ? permittedVersion : Number(appInfo.latestVersion);

    // Fetch existing parameters
    let existingParameters: VersionParameter[] = [];
    try {
      const userViewContract = getUserViewRegistryContract();
      const appIdNum = Number(appId);

      const toolsAndPolicies = await userViewContract.getAllToolsAndPoliciesForApp(
        agentPKP.tokenId,
        appIdNum,
      );

      // Transform the contract data into the VersionParameter format
      toolsAndPolicies.forEach((tool: any, toolIndex: number) => {
        tool.policies.forEach((policy: any, policyIndex: number) => {
          policy.parameters.forEach((param: any, paramIndex: number) => {
            existingParameters.push({
              toolIndex,
              policyIndex,
              paramIndex,
              name: param.name,
              type: param.paramType,
              value: param.value,
            });
          });
        });
      });
    } catch (error) {
      onStatusChange?.('Error fetching existing parameters:', 'error');
      throw new Error('Error fetching existing parameters');
    }

    // Identify parameters that need to be removed
    const parametersToRemove = identifyParametersToRemove(existingParameters, parameters);

    // Check for parameters to remove
    if (parametersToRemove.length > 0) {
      onStatusChange?.('Removing cleared parameters...', 'info');

      // Prepare data for parameter removal
      const { filteredTools, filteredPolicies, filteredParams } =
        prepareParameterRemovalData(parametersToRemove, versionInfo);
      try {
        const removeArgs = [
          appId,
          agentPKP.tokenId,
          versionToUse,
          filteredTools,
          filteredPolicies,
          filteredParams,
        ];

        const removeTxResponse = await sendTransaction(
          connectedContract,
          'removeToolPolicyParameters',
          removeArgs,
          'Sending transaction to remove cleared parameters...',
          onStatusChange,
          onError
        );

        // Wait for the transaction to be mined
        onStatusChange?.('Waiting for removal transaction to be confirmed...', 'info');

        // Try to wait for confirmation with longer timeout
        await removeTxResponse.wait(1);

        onStatusChange?.('Parameter removal transaction confirmed!', 'success');

      } catch (error) {
        console.error('Parameter removal failed:', error);
        onStatusChange?.('Failed to remove cleared parameters', 'warning');
      }
    }

    // Prepare parameter data for the contract call
    onStatusChange?.('Preparing parameter data for contract...', 'info');

    // Get parameter update data
    const {
      toolIpfsCids,
      policyIpfsCids,
      policyParameterNames,
      policyParameterValues,
      hasParametersToSet
    } = prepareParameterUpdateData(parameters, versionInfo);

    // Skip setToolPolicyParameters if there are no parameters to set
    if (!hasParametersToSet) {
      onStatusChange?.('Parameter updates complete', 'success');
      return;
    }

    try {
      const updateArgs = [
        agentPKP.tokenId,
        appId,
        versionToUse, // Use the correct version that's actually permitted
        toolIpfsCids,
        policyIpfsCids,
        policyParameterNames,
        policyParameterValues,
      ];

      const txResponse = await sendTransaction(
        connectedContract,
        'setToolPolicyParameters',
        updateArgs,
        'Sending transaction to update parameters...',
        onStatusChange,
        onError
      );

      onStatusChange?.('Waiting for update transaction to be confirmed...', 'info');

      // Try to wait for confirmation with longer timeout
      await txResponse.wait(1);

      onStatusChange?.('Parameter update transaction confirmed!', 'success');

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
    parameters,
    versionInfo,
    initializeWallet,
    onStatusChange,
    onError,
  ]);

  /**
   * Main consent approval function
   */
  const approveConsent = useCallback(async () => {
    if (!agentPKP || !appId || !appInfo || !versionInfo) {
      console.error('Missing required data for consent approval');
      throw new Error('Missing required data for consent approval');
    }

    // Check if app version is already permitted
    const { isPermitted, permittedVersion } = await checkAppPermissionStatus(
      agentPKP.tokenId,
      appId,
      onStatusChange
    );

    // If the same version is already permitted, just update parameters
    if (isPermitted && permittedVersion === Number(appInfo.latestVersion)) {
      return await updateParameters();
    }

    // Now proceed with permitting the new version
    onStatusChange?.(
      `Permitting version ${Number(appInfo.latestVersion)}...`,
      'info',
    );

    // Initialize wallet and get contract
    const { wallet, connectedContract } = await initializeWallet();

    // Prepare the version permit data using utility function
    const {
      toolIpfsCids,
      toolPolicies,
      toolPolicyParameterNames,
    } = prepareVersionPermitData(versionInfo, parameters);

    // Use the parameter update utility to get formatted parameter values
    const {
      policyParameterValues,
    } = prepareParameterUpdateData(parameters, versionInfo);

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
      // Send the transaction, use txResponse to wait for confirmation (and readability)
      const txResponse = await sendTransaction(
        connectedContract,
        'permitAppVersion',
        permitArgs,
        'Sending permission transaction...',
        onStatusChange,
        onError
      );

      await txResponse.wait(1);

      // Verify the permitted version after the transaction
      await verifyPermissionGrant(
        agentPKP.tokenId,
        appId,
        Number(appInfo.latestVersion),
        onStatusChange
      );

      // Add permitted actions for the tools
      await addPermittedActions(
        wallet,
        agentPKP.tokenId,
        toolIpfsCids,
        onStatusChange
      );

      onStatusChange?.('Permission grant successful!', 'success');
    } catch (error) {
      onStatusChange?.('Permission grant failed!', 'error');
      throw error;
    }
  }, [
    agentPKP,
    appId,
    appInfo,
    parameters,
    versionInfo,
    initializeWallet,
    updateParameters,
    onStatusChange,
    onError,
  ]);

  return {
    approveConsent,
    updateParameters,
  };
};
