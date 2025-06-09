import { LIT_NETWORK, RPC_URL_BY_NETWORK } from '@lit-protocol/constants';
import { ethers } from 'ethers';

import { getEnv } from './get-env';
import { VincentToolMetadata } from './create-vincent-app';

const VINCENT_APP_VIEW_CONTRACT_ABI = [
  'function getAppById(uint256 appId) view returns ((uint256 id, string name, string description, bool isDeleted, uint8 deploymentStatus, address manager, uint256 latestVersion, address[] delegatees, string[] authorizedRedirectUris) app)',
  'function getAppVersion(uint256 appId, uint256 version) view returns ((uint256 id, string name, string description, bool isDeleted, uint8 deploymentStatus, address manager, uint256 latestVersion, address[] delegatees, string[] authorizedRedirectUris) app, (uint256 version, bool enabled, uint256[] delegatedAgentPkpTokenIds, (string toolIpfsCid, (string policyIpfsCid, string[] parameterNames, uint8[] parameterTypes)[] policies)[] tools) appVersion)',
];

// TODO Should this handle when the App Version has more tools and policies than what's provided in vincentTools?
export const checkVincentApp = async ({
  appId,
  appVersion,
  vincentTools,
  vincentAppDelegatees,
}: {
  appId: number;
  appVersion: number;
  vincentTools: VincentToolMetadata[];
  vincentAppDelegatees: string[];
}) => {
  const appData = await getVincentApp({ appId, appVersion });
  const appVersionTools = appData.appVersion.tools;

  const missingTools: string[] = [];
  const missingPolicies: { toolIpfsCid: string; policyIpfsCid: string }[] = [];
  const missingDelegatees: string[] = [];

  // Check tools and policies
  for (const providedTool of vincentTools) {
    // Find the corresponding tool in the app version
    const appTool = appVersionTools.find((tool: any) => tool.toolIpfsCid === providedTool.ipfsCid);

    if (!appTool) {
      missingTools.push(providedTool.ipfsCid);
      continue;
    }

    // Check if all policies for this tool are available
    for (const providedPolicy of providedTool.policies) {
      const appPolicy = appTool.policies.find(
        (policy: any) => policy.policyIpfsCid === providedPolicy.ipfsCid,
      );

      if (!appPolicy) {
        missingPolicies.push({
          toolIpfsCid: providedTool.ipfsCid,
          policyIpfsCid: providedPolicy.ipfsCid,
        });
      }
    }
  }

  // Check delegatees
  for (const providedDelegatee of vincentAppDelegatees) {
    const appDelegatee = appData.app.delegatees.find(
      (delegatee: string) => delegatee.toLowerCase() === providedDelegatee.toLowerCase(),
    );

    if (!appDelegatee) {
      missingDelegatees.push(providedDelegatee);
    }
  }

  const allToolsAndPoliciesAvailable = missingTools.length === 0 && missingPolicies.length === 0;
  const allDelegateesAvailable = missingDelegatees.length === 0;
  const allRequirementsAvailable = allToolsAndPoliciesAvailable && allDelegateesAvailable;

  return {
    allToolsAndPoliciesAvailable,
    allDelegateesAvailable,
    allRequirementsAvailable,
    missingTools,
    missingPolicies,
    missingDelegatees,
    appVersionTools,
    appDelegatees: appData.app.delegatees,
  };
};

const getVincentApp = async ({ appId, appVersion }: { appId: number; appVersion: number }) => {
  const VINCENT_ADDRESS = getEnv('VINCENT_ADDRESS');
  if (VINCENT_ADDRESS === undefined) {
    throw new Error(
      `VINCENT_ADDRESS environment variable is not set. Please set it to the address of the Vincent contract.`,
    );
  }

  const provider = new ethers.providers.StaticJsonRpcProvider(
    RPC_URL_BY_NETWORK[LIT_NETWORK.Datil],
  );
  const vincentContract = new ethers.Contract(
    VINCENT_ADDRESS,
    VINCENT_APP_VIEW_CONTRACT_ABI,
    provider,
  );

  const result = await vincentContract.getAppVersion(appId, appVersion);
  return {
    app: result.app,
    appVersion: result.appVersion,
  };
};
