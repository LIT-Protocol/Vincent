import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { litNodeClient } from '@/components/consent/utils/lit';
import { getAppViewRegistryContract, getUserRegistryContract } from '@/components/consent/utils/contracts';
import { sendTransaction } from '@/components/consent/utils/consentTransactionUtils';

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
    onError 
  } = params;

  // Show status update if callback is provided
  const showStatus = (message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') => {
    onStatusChange?.(message, type);
  };

  // Show error if callback is provided
  const showError = (message: string, title?: string, details?: string) => {
    onError?.(message, title, details);
  };

  showStatus('Preparing to upgrade to latest version...', 'info');

  try {
    // Get app version details
    const appViewContract = getAppViewRegistryContract();
    
    // Fetch version details
    const versionDetails = await appViewContract.getAppVersionById(
      Number(appId),
      Number(latestVersion)
    );
    
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
    
    // Create empty arrays with the correct structure
    const toolIpfsCids: string[] = [];
    const policyIpfsCids: string[][] = [];
    const toolPolicyParameterNames: string[][][] = [];
    const policyParameterValues: Uint8Array[][][] = [];
    
    // Fill the arrays with data from versionDetails
    if (versionDetails && versionDetails.tools) {
      versionDetails.tools.forEach((tool: any, toolIndex: number) => {
        if (!tool) return;
        
        // Add tool IPFS CID
        toolIpfsCids[toolIndex] = tool.toolIpfsCid;
        
        // Initialize arrays for this tool
        policyIpfsCids[toolIndex] = [];
        toolPolicyParameterNames[toolIndex] = [];
        policyParameterValues[toolIndex] = [];
        
        // Process policies for this tool
        if (tool.policies && Array.isArray(tool.policies)) {
          tool.policies.forEach((policy: any, policyIndex: number) => {
            if (!policy) return;
            
            // Add policy IPFS CID
            policyIpfsCids[toolIndex][policyIndex] = policy.policyIpfsCid;
            
            // Initialize parameter names and values arrays
            toolPolicyParameterNames[toolIndex][policyIndex] = [];
            policyParameterValues[toolIndex][policyIndex] = [];
            
            // Add parameter names if any
            if (policy.parameterNames && Array.isArray(policy.parameterNames)) {
              policy.parameterNames.forEach((paramName: string) => {
                if (paramName) {
                  toolPolicyParameterNames[toolIndex][policyIndex].push(paramName);
                }
              });
            }
          });
        }
      });
    }
    
    // Prepare arguments for the permitAppVersion function
    const permitArgs = [
      agentPKP.tokenId,
      appId,
      Number(latestVersion),
      toolIpfsCids,
      policyIpfsCids,
      toolPolicyParameterNames,
      policyParameterValues
    ];
    
    // Send the transaction
    const tx = await sendTransaction(
      connectedContract,
      'permitAppVersion',
      permitArgs,
      `Sending transaction to upgrade from v${currentVersion} to v${latestVersion}...`,
      onStatusChange,
      onError
    );
    
    showStatus('Waiting for transaction confirmation...', 'info');
    await tx.wait(1);
    showStatus(`Successfully upgraded app to latest version (v${latestVersion})!`, 'success');
    
    return tx;
  } catch (error) {
    console.error('Error upgrading app:', error);
    if (error instanceof Error) {
      showError(`Failed to upgrade app: ${error.message}`, 'Transaction Error');
    } else {
      showError('Failed to upgrade app', 'Transaction Error');
    }
    throw error;
  }
} 