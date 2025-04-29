import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { litNodeClient } from '@/components/consent/utils/lit';
import {
  getAppViewRegistryContract,
  getUserRegistryContract,
  getUserViewRegistryContract,
} from '@/components/consent/utils/contracts';
import {
  sendTransaction,
  addPermittedActions,
} from '@/components/consent/utils/consentTransactionUtils';
import { verifyPermissionGrant } from '@/components/consent/utils/consentVerificationUtils';
import {
  prepareVersionPermitData,
  prepareParameterUpdateData,
} from '@/components/consent/utils/consentArrayUtils';
import { VersionParameter } from '@/components/consent/types';
import { isEmptyParameterValue } from '@/components/consent/utils/parameterDecoding';
import { decodeParameterValue } from '@/components/consent/utils/parameterDecoding';

/**
 * Upgrades an application to the latest version
 * @param params Parameters for the upgrade
 * @returns Transaction response if successful
 */
export async function upgradeAppToLatestVersion(params: {
  appId: string;
  agentPKP: IRelayPKP;
  userPKP: IRelayPKP;
  sessionSigs: SessionSigs;
  currentVersion: number | null;
  latestVersion: number;
  onStatusChange?: (message: string, type: 'info' | 'warning' | 'success' | 'error') => void;
  onError?: (errorMessage: string, title?: string, details?: string) => void;
}) {
  const {
    appId,
    agentPKP,
    userPKP,
    sessionSigs,
    currentVersion,
    latestVersion,
    onStatusChange,
    onError,
  } = params;

  // Show status update if callback is provided
  const showStatus = (message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') => {
    onStatusChange?.(message, type);
  };

  // Show error if callback is provided
  const showError = (message: string, title?: string, details?: string) => {
    onError?.(message, title, details);
  };

  try {
    if (!agentPKP || !appId) {
      console.error('Missing required data for upgrade');
      return { success: false, message: 'Missing required data for upgrade' };
    }

    showStatus(`Permitting version ${Number(latestVersion)}...`, 'info');

    // Initialize wallet
    showStatus('Initializing your PKP wallet...', 'info');
    const userPkpWallet = new PKPEthersWallet({
      controllerSessionSigs: sessionSigs,
      pkpPubKey: userPKP.publicKey,
      litNodeClient: litNodeClient,
    });

    await userPkpWallet.init();

    // Connect wallet to the user registry contract
    const userRegistryContract = getUserRegistryContract();
    const connectedContract = userRegistryContract.connect(userPkpWallet);

    // Get app version details for both current and latest versions
    const appViewContract = getAppViewRegistryContract();

    // Fetch existing parameters from current version if available
    const existingParameters: VersionParameter[] = [];
    if (currentVersion !== null) {
      try {
        showStatus('Fetching existing parameters to carry over...', 'info');
        const userViewContract = getUserViewRegistryContract();
        const appIdNum = Number(appId);

        const toolsAndPolicies = await userViewContract.getAllToolsAndPoliciesForApp(
          agentPKP.tokenId,
          appIdNum,
        );

        // Process each tool
        toolsAndPolicies.forEach((tool: any, toolIndex: number) => {
          // Process each policy
          tool.policies.forEach((policy: any, policyIndex: number) => {
            // Process each parameter
            policy.parameters.forEach((param: any, paramIndex: number) => {
              // Make sure to properly decode the parameter value based on its type
              const decodedValue = decodeParameterValue(param.value, param.paramType);

              console.log(
                `Parameter ${param.name} (${param.paramType}): Raw value: ${param.value}, Decoded: ${decodedValue}`,
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

        showStatus(`Found ${existingParameters.length} parameters to carry over`, 'info');
      } catch (error) {
        console.error('Error fetching existing parameters:', error);
        showStatus('Could not fetch existing parameters, proceeding with upgrade', 'warning');
      }
    }

    // Fetch version details for the latest version
    const versionInfo = await appViewContract.getAppVersion(Number(appId), Number(latestVersion));

    // Use existing parameters for the upgrade if available
    const parameters = existingParameters;

    const { toolIpfsCids, policyIpfsCids, toolPolicyParameterNames } = prepareVersionPermitData(
      versionInfo,
      parameters,
    );

    const { policyParameterValues } = prepareParameterUpdateData(parameters, versionInfo);

    const filteredToolPolicyParameterNames = toolPolicyParameterNames.map((toolParams, toolIndex) =>
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
      Number(latestVersion),
      toolIpfsCids,
      policyIpfsCids,
      filteredToolPolicyParameterNames,
      policyParameterValues,
    ];

    const txResponse = await sendTransaction(
      connectedContract,
      'permitAppVersion',
      permitArgs,
      'Sending upgrade transaction...',
      onStatusChange,
      onError,
    );

    await txResponse.wait(1);

    await verifyPermissionGrant(agentPKP.tokenId, appId, Number(latestVersion), onStatusChange);

    // Add permitted actions for the tools
    const approvalResult = await addPermittedActions(
      userPkpWallet,
      agentPKP.tokenId,
      toolIpfsCids,
      policyIpfsCids.flat(),
      onStatusChange,
    );

    if (!approvalResult.success) {
      showError(
        'Failed to add permitted actions',
        'Transaction Error',
        'Please try again and contact support if the issue persists.',
      );
      return {
        success: false,
        message:
          'Failed to add permitted actions. Please try again and contact support if the issue persists.',
      };
    }

    showStatus('Permission grant successful with parameters carried over!', 'success');

    return { success: true };
  } catch (error: unknown) {
    console.error('Upgrade process failed:', error);
    showStatus('Upgrade process failed!', 'error');
    return { success: false, message: 'Upgrade process failed' };
  }
}
