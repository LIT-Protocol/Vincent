import { useCallback } from 'react';
import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { AppView, VersionInfo, VersionParameter, PolicyParameter } from '@/types';
import { litNodeClient } from '@/utils/user-dashboard/lit';
import {
  getUserViewRegistryContract,
  getUserRegistryContract,
} from '../../utils/user-dashboard/contracts';
import { useParameterManagement } from '@/hooks/user-dashboard/useParameterManagement';
import { isEmptyParameterValue } from '@/utils/shared/parameterDecoding';
import {
  prepareParameterRemovalData,
  prepareParameterUpdateData,
  identifyParametersToRemove,
  prepareVersionPermitData,
} from '@/utils/user-dashboard/consentArrayUtils';
import {
  sendTransaction,
  addPermittedActions,
} from '@/utils/user-dashboard/consentTransactionUtils';
import {
  checkAppPermissionStatus,
  verifyPermissionGrant,
} from '@/utils/user-dashboard/consentVerificationUtils';

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
  sessionSigs: SessionSigs;
  permittedVersion: number | null;
  onStatusChange?: (message: string, type: 'info' | 'warning' | 'success' | 'error') => void;
  onError?: (error: Error | unknown, title?: string, details?: string) => void;
}

interface ToolWithPolicies {
  toolIpfsCid: string;
  policies: PolicyWithParameters[];
}

interface PolicyWithParameters {
  policyIpfsCid: string;
  parameters: PolicyParameter[];
}

export const useConsentApproval = ({
  appId,
  appInfo,
  versionInfo,
  parameters,
  agentPKP,
  userPKP,
  sessionSigs,
  permittedVersion,
  onStatusChange,
  onError,
}: UseConsentApprovalProps) => {
  useParameterManagement({
    appId,
    agentPKP,
    appInfo,
    permittedVersion,
    onStatusChange: onStatusChange
      ? (message, type = 'info') => onStatusChange(message, type)
      : undefined,
  });

  /**
   * Helper function to initialize the PKP wallet and connect to contracts
   * @returns The wallet and connected registry contract
   */
  const initializeWallet = useCallback(async () => {
    onStatusChange?.('Initializing your PKP wallet...', 'info');

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
    try {
      if (!agentPKP || !appId || !appInfo || !versionInfo) {
        console.error('Missing required data for parameter update');
        return { success: false, message: 'Missing required data for parameter update' };
      }

      onStatusChange?.('Preparing to update parameters...', 'info');

      const { wallet, connectedContract } = await initializeWallet();
      const { permittedVersion } = await checkAppPermissionStatus(
        agentPKP.tokenId,
        appId,
        onStatusChange,
      );

      const existingParameters: VersionParameter[] = [];
      try {
        const userViewContract = getUserViewRegistryContract();
        const appIdNum = Number(appId);

        const toolsAndPolicies = await userViewContract.getAllToolsAndPoliciesForApp(
          agentPKP.tokenId,
          appIdNum,
        );

        toolsAndPolicies.forEach((tool: ToolWithPolicies, toolIndex: number) => {
          tool.policies.forEach((policy: PolicyWithParameters, policyIndex: number) => {
            policy.parameters.forEach((param: PolicyParameter, paramIndex: number) => {
              existingParameters.push({
                toolIndex,
                policyIndex,
                paramIndex,
                name: param.name,
                type: Number(param.type),
                value: param.value!,
              });
            });
          });
        });
      } catch (error: unknown) {
        console.error('Error fetching existing parameters:', error);
        onStatusChange?.('Error fetching existing parameters:', 'error');
        return { success: false, message: 'Error fetching existing parameters' };
      }

      const parametersToRemove = identifyParametersToRemove(existingParameters, parameters);

      if (parametersToRemove.length > 0) {
        onStatusChange?.('Removing cleared parameters...', 'info');

        const { filteredTools, filteredPolicies, filteredParams } = prepareParameterRemovalData(
          parametersToRemove,
          versionInfo,
        );
        try {
          const removeArgs = [
            appId,
            agentPKP.tokenId,
            permittedVersion,
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
          );

          onStatusChange?.('Waiting for removal transaction to be confirmed...', 'info');
          await removeTxResponse.wait(1);
          onStatusChange?.('Parameter removal transaction confirmed!', 'success');
        } catch (error) {
          console.error('Parameter removal failed:', error);
          onStatusChange?.('Failed to remove cleared parameters', 'warning');
          return { success: false, message: 'Failed to remove cleared parameters' };
        }
      }

      onStatusChange?.('Preparing parameter data for contract...', 'info');
      const {
        toolIpfsCids,
        policyIpfsCids,
        policyParameterNames,
        policyParameterValues,
        hasParametersToSet,
      } = prepareParameterUpdateData(parameters, versionInfo);

      // Ensure the tools and policies are checked as soon as we have a readable format of them
      const approvalResult = await addPermittedActions(
        wallet,
        agentPKP.tokenId,
        toolIpfsCids,
        policyIpfsCids.flat(),
        onStatusChange,
      );

      if (!approvalResult.success) {
        onStatusChange?.('Failed to add permitted actions', 'error');
        return {
          success: false,
          message:
            'Failed to add permitted actions. Please try again and contact support if the issue persists.',
        };
      }

      if (!hasParametersToSet) {
        onStatusChange?.('No parameters to update', 'success');
        return { success: true };
      }

      const updateArgs = [
        agentPKP.tokenId,
        appId,
        permittedVersion,
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
      );

      onStatusChange?.('Waiting for update transaction to be confirmed...', 'info');

      await txResponse.wait(1);
      onStatusChange?.('Parameter update transaction confirmed!', 'success');

      return { success: true };
    } catch (error) {
      console.error('PARAMETER UPDATE PROCESS FAILED:', error);
      onStatusChange?.('Parameter update process failed', 'error');
      return { success: false, message: 'Parameter update process failed' };
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
    try {
      if (!agentPKP || !appId || !appInfo || !versionInfo) {
        console.error('Missing required data for consent approval');
        return { success: false, message: 'Missing required data for consent approval' };
      }

      onStatusChange?.(`Permitting version ${Number(appInfo.latestVersion)}...`, 'info');

      const { wallet, connectedContract } = await initializeWallet();

      const { toolIpfsCids, policyIpfsCids, toolPolicyParameterNames } = prepareVersionPermitData(
        versionInfo,
        parameters,
      );

      const { policyParameterValues } = prepareParameterUpdateData(parameters, versionInfo);

      const filteredToolPolicyParameterNames = toolPolicyParameterNames.map(
        (toolParams, toolIndex) =>
          toolParams.map((policyParams, policyIndex) =>
            policyParams.filter((_paramName, paramIndex) => {
              const param = parameters.find(
                (p) =>
                  p.toolIndex === toolIndex &&
                  p.policyIndex === policyIndex &&
                  p.paramIndex === paramIndex,
              );

              if (!param || param.value === undefined) return false;

              return !isEmptyParameterValue(param.value, param.type);
            }),
          ),
      );

      const permitArgs = [
        agentPKP.tokenId,
        appId,
        Number(appInfo.latestVersion),
        toolIpfsCids,
        policyIpfsCids,
        filteredToolPolicyParameterNames,
        policyParameterValues,
      ];

      const txResponse = await sendTransaction(
        connectedContract,
        'permitAppVersion',
        permitArgs,
        'Sending permission transaction...',
        onStatusChange,
      );

      await txResponse.wait(1);

      await verifyPermissionGrant(
        agentPKP.tokenId,
        appId,
        Number(appInfo.latestVersion),
        onStatusChange,
      );

      // Add permitted actions for the tools
      const approvalResult = await addPermittedActions(
        wallet,
        agentPKP.tokenId,
        toolIpfsCids,
        policyIpfsCids.flat(),
        onStatusChange,
      );

      if (!approvalResult.success) {
        onStatusChange?.('Failed to add permitted actions', 'error');
        return {
          success: false,
          message:
            'Failed to add permitted actions. Please try again and contact suppport if the issue persists.',
        };
      }

      onStatusChange?.('Permission grant successful!', 'success');

      return { success: true };
    } catch (error: unknown) {
      console.error('Consent approval process failed:', error);
      onStatusChange?.('Consent approval process failed!', 'error');
      return { success: false, message: 'Consent approval process failed' };
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

  return {
    approveConsent,
    updateParameters,
  };
};
