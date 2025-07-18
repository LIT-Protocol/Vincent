import {
  AppVersionTool,
  AppVersion,
  ToolVersion,
  PolicyVersion,
  App,
  Tool,
  Policy,
} from '@/types/developer-dashboard/appTypes';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { useMemo, useEffect, useState } from 'react';

export type ConsentInfoMap = {
  app: App;
  versionsByApp: Record<string, AppVersion[]>;
  appVersionToolsByAppVersion: Record<string, AppVersionTool[]>;
  toolVersionsByAppVersionTool: Record<string, ToolVersion[]>;
  supportedPoliciesByToolVersion: Record<string, PolicyVersion[]>;
  appVersionToSupportedPolicyIpfsCids: Record<string, string[]>;
  toolsByPackageName: Record<string, Tool>;
  policiesByPackageName: Record<string, Policy>;
};

export type ConsentInfoState = {
  isLoading: boolean;
  isError: boolean;
  errors: string[];
  data: ConsentInfoMap;
};

export const useConsentInfo = (appId: string): ConsentInfoState => {
  const [isDataFetchingComplete, setIsDataFetchingComplete] = useState(false);

  const {
    data: app,
    isFetching: appLoading,
    isError: appError,
  } = vincentApiClient.useGetAppQuery({ appId: Number(appId) });

  const {
    data: appVersions,
    isFetching: appVersionsLoading,
    isError: appVersionsError,
  } = vincentApiClient.useGetAppVersionsQuery({ appId: Number(appId) });

  // Use lazy queries with their built-in states
  const [triggerListAppVersionTools, { isFetching: toolsLoading, isError: toolsError }] =
    vincentApiClient.useLazyListAppVersionToolsQuery();
  const [triggerGetToolVersion, { isFetching: toolVersionsLoading, isError: toolVersionsError }] =
    vincentApiClient.useLazyGetToolVersionQuery();
  const [triggerGetPolicyVersion, { isFetching: policiesLoading, isError: policiesError }] =
    vincentApiClient.useLazyGetPolicyVersionQuery();
  const [triggerGetTool, { isFetching: toolsInfoLoading, isError: toolsInfoError }] =
    vincentApiClient.useLazyGetToolQuery();
  const [triggerGetPolicy, { isFetching: policiesInfoLoading, isError: policiesInfoError }] =
    vincentApiClient.useLazyGetPolicyQuery();

  const [versionToolsData, setVersionToolsData] = useState<Record<string, AppVersionTool[]>>({});
  const [toolVersionsData, setToolVersionsData] = useState<Record<string, ToolVersion>>({});
  const [supportedPoliciesData, setSupportedPoliciesData] = useState<
    Record<string, PolicyVersion[]>
  >({});
  const [toolsData, setToolsData] = useState<Record<string, Tool>>({});
  const [policiesData, setPoliciesData] = useState<Record<string, Policy>>({});

  // Fetch all data when appVersions changes
  useEffect(() => {
    if (!app || !appVersions || appVersions.length === 0) {
      // Mark data fetching as complete even if app/versions don't exist
      // This prevents infinite loading when app doesn't exist
      setIsDataFetchingComplete(true);
      return;
    }

    // Reset completion state when starting fetch
    setIsDataFetchingComplete(false);

    const fetchAllData = async () => {
      try {
        // Step 1: Fetch version tools
        const versionToolsData: Record<string, AppVersionTool[]> = {};

        for (const version of appVersions) {
          const result = await triggerListAppVersionTools({
            appId: Number(appId),
            version: Number(version.version),
          });

          const versionKey = `${appId}-${version.version}`;
          versionToolsData[versionKey] = result.data || [];
        }

        setVersionToolsData(versionToolsData);

        // Step 2: Fetch tool versions and parent tools
        const toolVersions: Record<string, ToolVersion> = {};
        const tools: Record<string, Tool> = {};

        for (const [_, toolsList] of Object.entries(versionToolsData)) {
          for (const tool of toolsList) {
            const toolVersionResult = await triggerGetToolVersion({
              packageName: tool.toolPackageName,
              version: tool.toolVersion,
            });

            const toolKey = `${tool.toolPackageName}-${tool.toolVersion}`;
            if (toolVersionResult.data) {
              toolVersions[toolKey] = toolVersionResult.data;
            }

            // Fetch parent tool info if we haven't already
            if (!tools[tool.toolPackageName]) {
              const toolResult = await triggerGetTool({
                packageName: tool.toolPackageName,
              });

              if (toolResult.data) {
                tools[tool.toolPackageName] = toolResult.data;
              }
            }
          }
        }

        setToolVersionsData(toolVersions);
        setToolsData(tools);

        // Step 3: Fetch supported policies and parent policy info
        const supportedPoliciesData: Record<string, PolicyVersion[]> = {};
        const policies: Record<string, Policy> = {};

        for (const [toolKey, toolVersion] of Object.entries(toolVersions)) {
          const toolPolicies: PolicyVersion[] = [];

          if (toolVersion.supportedPolicies) {
            for (const [policyPackageName, policyVersion] of Object.entries(
              toolVersion.supportedPolicies,
            )) {
              const policyVersionResult = await triggerGetPolicyVersion({
                packageName: policyPackageName,
                version: policyVersion,
              });

              if (policyVersionResult.data) {
                toolPolicies.push(policyVersionResult.data);
              }

              // Fetch parent policy info if we haven't already
              if (!policies[policyPackageName]) {
                const policyResult = await triggerGetPolicy({
                  packageName: policyPackageName,
                });

                if (policyResult.data) {
                  policies[policyPackageName] = policyResult.data;
                }
              }
            }
          }

          supportedPoliciesData[toolKey] = toolPolicies;
        }

        setSupportedPoliciesData(supportedPoliciesData);
        setPoliciesData(policies);

        // Mark data fetching as complete
        setIsDataFetchingComplete(true);
      } catch (error) {
        console.error('Error fetching consent info:', error);
        // Still mark as complete even if there was an error
        setIsDataFetchingComplete(true);
      }
    };

    fetchAllData();
  }, [appVersions, appId, app]);

  // Construct ConsentInfoMap from available data
  const consentInfoMap = useMemo((): ConsentInfoMap => {
    const versionsByApp: Record<string, AppVersion[]> = {
      [appId]: appVersions || [],
    };

    const appVersionToolsByAppVersion: Record<string, AppVersionTool[]> = {};
    (appVersions || []).forEach((version) => {
      const versionKey = `${appId}-${version.version}`;
      appVersionToolsByAppVersion[versionKey] = versionToolsData[versionKey] || [];
    });

    const toolVersionsByAppVersionTool: Record<string, ToolVersion[]> = {};
    Object.entries(toolVersionsData).forEach(([toolKey, toolVersion]) => {
      toolVersionsByAppVersionTool[toolKey] = [toolVersion];
    });

    const supportedPoliciesByToolVersion: Record<string, PolicyVersion[]> = {
      ...supportedPoliciesData,
    };

    // Compute mapping from app version to supported policy IPFS CIDs
    const appVersionToSupportedPolicyIpfsCids: Record<string, string[]> = {};

    (appVersions || []).forEach((version) => {
      const versionKey = `${appId}-${version.version}`;
      const ipfsCids: string[] = [];

      // Get tools for this app version
      const tools = versionToolsData[versionKey] || [];

      tools.forEach((tool) => {
        const toolKey = `${tool.toolPackageName}-${tool.toolVersion}`;

        // Get supported policies for this tool
        const policies = supportedPoliciesData[toolKey] || [];

        // Extract IPFS CIDs from each policy
        policies.forEach((policy) => {
          if (policy.ipfsCid) {
            ipfsCids.push(policy.ipfsCid);
          }
        });
      });

      // Remove duplicates
      appVersionToSupportedPolicyIpfsCids[versionKey] = [...new Set(ipfsCids)];
    });

    return {
      app: app || ({} as App),
      versionsByApp,
      appVersionToolsByAppVersion,
      toolVersionsByAppVersionTool,
      supportedPoliciesByToolVersion,
      appVersionToSupportedPolicyIpfsCids,
      toolsByPackageName: toolsData,
      policiesByPackageName: policiesData,
    };
  }, [
    appVersions,
    versionToolsData,
    toolVersionsData,
    supportedPoliciesData,
    appId,
    app,
    toolsData,
    policiesData,
  ]);

  const isLoadingValue =
    appLoading ||
    appVersionsLoading ||
    toolsLoading ||
    toolVersionsLoading ||
    policiesLoading ||
    toolsInfoLoading ||
    policiesInfoLoading ||
    !isDataFetchingComplete;

  return {
    isLoading: isLoadingValue,
    isError:
      appError ||
      appVersionsError ||
      toolsError ||
      toolVersionsError ||
      policiesError ||
      toolsInfoError ||
      policiesInfoError ||
      (!appLoading && !app && isDataFetchingComplete),
    errors:
      !appLoading && !app && isDataFetchingComplete
        ? ['App not found']
        : appVersionsError
          ? [`Failed to fetch app versions`]
          : [],
    data: consentInfoMap,
  };
};
