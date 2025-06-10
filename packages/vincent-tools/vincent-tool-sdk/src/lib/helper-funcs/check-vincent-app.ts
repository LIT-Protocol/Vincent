import { VincentToolMetadata } from './create-vincent-app';
import { getVincentApp } from './get-vincent-app';

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

  const { missingTools, missingPolicies } = await checkForMissingToolsAndPolicies({
    expectedToolsAndPolicies: vincentTools,
    receivedToolsAndPolicies: appData.appVersion.tools,
  });

  const { missingDelegatees } = await checkForMissingDelegatees({
    expectedDelegatees: vincentAppDelegatees,
    receivedDelegatees: appData.app.delegatees,
  });

  const allToolsAndPoliciesAvailable = missingTools.length === 0 && missingPolicies.length === 0;
  const allDelegateesAvailable = missingDelegatees.length === 0;
  const allRequirementsAvailable = allToolsAndPoliciesAvailable && allDelegateesAvailable;

  return {
    allRequirementsAvailable,
    allToolsAndPoliciesAvailable,
    allDelegateesAvailable,
    missingTools,
    missingPolicies,
    missingDelegatees,
    appVersionTools: appData.appVersion.tools,
    appDelegatees: appData.app.delegatees,
  };
};

const checkForMissingToolsAndPolicies = async ({
  expectedToolsAndPolicies,
  receivedToolsAndPolicies,
}: {
  expectedToolsAndPolicies: VincentToolMetadata[];
  receivedToolsAndPolicies: any;
}) => {
  const missingTools: string[] = [];
  const missingPolicies: { toolIpfsCid: string; policyIpfsCid: string }[] = [];

  for (const expected of expectedToolsAndPolicies) {
    // Find the corresponding tool in the app version
    const appTool = receivedToolsAndPolicies.find(
      (tool: any) => tool.toolIpfsCid === expected.ipfsCid,
    );

    if (!appTool) {
      missingTools.push(expected.ipfsCid);
      continue;
    }

    // Check if all policies for this tool are available
    for (const expectedPolicy of expected.policies) {
      const appPolicy = appTool.policies.find(
        (policy: any) => policy.policyIpfsCid === expectedPolicy.ipfsCid,
      );

      if (!appPolicy) {
        missingPolicies.push({
          toolIpfsCid: expected.ipfsCid,
          policyIpfsCid: expectedPolicy.ipfsCid,
        });
      }
    }
  }

  return {
    missingTools,
    missingPolicies,
  };
};

const checkForMissingDelegatees = async ({
  expectedDelegatees,
  receivedDelegatees,
}: {
  expectedDelegatees: string[];
  receivedDelegatees: string[];
}) => {
  const missingDelegatees: string[] = [];

  for (const expectedDelegatee of expectedDelegatees) {
    const appDelegatee = receivedDelegatees.find(
      (delegatee: string) => delegatee.toLowerCase() === expectedDelegatee.toLowerCase(),
    );

    if (!appDelegatee) {
      missingDelegatees.push(expectedDelegatee);
    }
  }

  return {
    missingDelegatees,
  };
};
