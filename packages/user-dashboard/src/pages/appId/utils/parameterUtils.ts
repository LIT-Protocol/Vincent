import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import {
  getUserRegistryContract,
  getUserViewRegistryContract,
} from '@/components/consent/utils/contracts';
import {
  checkAppPermissionStatus,
  verifyPermissionGrant,
} from '@/components/consent/utils/consentVerificationUtils';
import {
  sendTransaction,
  addPermittedActions,
} from '@/components/consent/utils/consentTransactionUtils';
import {
  identifyParametersToRemove,
  prepareParameterRemovalData,
  prepareParameterUpdateData,
} from '@/components/consent/utils/consentArrayUtils';
import { ShowStatusFn, ShowErrorWithStatusFn } from '../types';

/**
 * Handle form submission for updating parameters
 */
export const updateParametersForApp = async ({
  appId,
  agentPKP,
  userPKP,
  sessionSigs,
  parameters,
  versionInfo,
  litNodeClient,
  showStatus,
  showErrorWithStatus,
  onComplete,
}: {
  appId: string;
  agentPKP: any;
  userPKP: any;
  sessionSigs: any;
  parameters: any[];
  versionInfo: any;
  litNodeClient: any;
  showStatus: ShowStatusFn;
  showErrorWithStatus: ShowErrorWithStatusFn;
  onComplete: (success: boolean) => void;
}): Promise<{ success: boolean; message?: string }> => {
  if (!appId || !agentPKP || !userPKP || !sessionSigs || !versionInfo) {
    showErrorWithStatus('Missing required data for parameter update');
    onComplete(false);
    return { success: false, message: 'Missing required data for parameter update' };
  }

  showStatus('Preparing to update parameters...', 'info');

  try {
    // Initialize wallet
    showStatus('Initializing your PKP wallet...', 'info');
    const userPkpWallet = new PKPEthersWallet({
      controllerSessionSigs: sessionSigs,
      pkpPubKey: userPKP.publicKey,
      litNodeClient,
    });

    await userPkpWallet.init();

    // Connect wallet to the user registry contract
    const userRegistryContract = getUserRegistryContract();
    const connectedContract = userRegistryContract.connect(userPkpWallet);

    // Get permitted version
    const { permittedVersion } = await checkAppPermissionStatus(
      agentPKP.tokenId,
      appId,
      showStatus,
    );

    if (!permittedVersion) {
      showErrorWithStatus('You do not have permission to update parameters for this app.');
      onComplete(false);
      return { success: false, message: 'No permitted version found' };
    }

    // Verify that the permission grant is valid
    const verifiedVersion = await verifyPermissionGrant(
      agentPKP.tokenId,
      appId,
      permittedVersion,
      showStatus,
    );

    if (verifiedVersion === null) {
      showErrorWithStatus('Failed to verify permission grant.');
      onComplete(false);
      return { success: false, message: 'Permission verification failed' };
    }

    // Get existing parameters from contract
    const existingParameters = await fetchExistingParameters(agentPKP.tokenId, appId, showStatus);
    if (!existingParameters) {
      onComplete(false);
      return { success: false, message: 'Error fetching existing parameters' };
    }

    // Handle parameter removal
    const parametersToRemove = identifyParametersToRemove(existingParameters, parameters);

    if (parametersToRemove.length > 0) {
      showStatus('Removing cleared parameters...', 'info');

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
          showStatus,
          showErrorWithStatus,
        );

        showStatus('Waiting for removal transaction to be confirmed...', 'info');
        await removeTxResponse.wait(1);
        showStatus('Parameter removal transaction confirmed!', 'success');
      } catch (error) {
        console.error('Parameter removal failed:', error);
        showStatus('Failed to remove cleared parameters', 'warning');
        // Continue anyway, as we might still be able to update other parameters
      }
    }

    // Prepare parameter data
    showStatus('Preparing parameter data for contract...', 'info');
    const {
      toolIpfsCids,
      policyIpfsCids,
      policyParameterNames,
      policyParameterValues,
      hasParametersToSet,
    } = prepareParameterUpdateData(parameters, versionInfo);

    // Add permitted actions before setting parameters
    if (toolIpfsCids.length > 0 || policyIpfsCids.length > 0) {
      showStatus('Adding permitted actions...', 'info');
      try {
        const approvalResult = await addPermittedActions(
          userPkpWallet,
          agentPKP.tokenId,
          toolIpfsCids,
          policyIpfsCids.flat(),
          showStatus,
        );

        if (!approvalResult.success) {
          console.error('Failed to add permitted actions:', approvalResult.error);
          showStatus('Failed to add permitted actions', 'warning');
          // Continue anyway as we might still be able to update parameters
        }
      } catch (error) {
        console.error('Failed to add permitted actions:', error);
        showStatus('Failed to add permitted actions', 'warning');
        // Continue anyway as we might still be able to update parameters
      }
    }

    if (!hasParametersToSet) {
      showStatus('No parameters to update', 'success');
      onComplete(true);
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
      showStatus,
      showErrorWithStatus,
    );

    showStatus('Waiting for update transaction to be confirmed...', 'info');
    await txResponse.wait(1);
    showStatus('Parameter update transaction confirmed!', 'success');

    onComplete(true);
    return { success: true };
  } catch (error) {
    console.error('PARAMETER UPDATE PROCESS FAILED:', error);
    showStatus('Parameter update process failed', 'error');
    onComplete(false);
    return { success: false, message: 'Parameter update process failed' };
  }
};

/**
 * Fetch existing parameters for an app from the contract
 */
export const fetchExistingParameters = async (
  tokenId: string,
  appId: string,
  showStatus: ShowStatusFn,
): Promise<Array<{
  toolIndex: number;
  policyIndex: number;
  paramIndex: number;
  name: string;
  type: number;
  value: any;
}> | null> => {
  try {
    const existingParameters: Array<{
      toolIndex: number;
      policyIndex: number;
      paramIndex: number;
      name: string;
      type: number;
      value: any;
    }> = [];

    const userViewContract = getUserViewRegistryContract();
    const appIdNum = Number(appId);

    const toolsAndPolicies = await userViewContract.getAllToolsAndPoliciesForApp(tokenId, appIdNum);

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

    return existingParameters;
  } catch (error) {
    console.error('Error fetching existing parameters:', error);
    showStatus('Error fetching existing parameters', 'error');
    return null;
  }
};
