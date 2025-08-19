import {
  AppVersionAbility,
  AppVersion,
  AbilityVersion,
  PolicyVersion,
  App,
  Ability,
  Policy,
} from '@/types/developer-dashboard/appTypes';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { useMemo, useEffect, useState } from 'react';

export type ConnectInfoMap = {
  app: App;
  versionsByApp: Record<string, AppVersion[]>;
  appVersionAbilitiesByAppVersion: Record<string, AppVersionAbility[]>;
  abilityVersionsByAppVersionAbility: Record<string, AbilityVersion[]>;
  supportedPoliciesByAbilityVersion: Record<string, PolicyVersion[]>;
  appVersionToSupportedPolicyIpfsCids: Record<string, string[]>;
  abilitiesByPackageName: Record<string, Ability>;
  policiesByPackageName: Record<string, Policy>;
};

export type ConnectInfoState = {
  isLoading: boolean;
  isError: boolean;
  errors: string[];
  data: ConnectInfoMap;
};

export const useConnectInfo = (appId: string): ConnectInfoState => {
  const [isDataFetchingComplete, setIsDataFetchingComplete] = useState(false);

  // Reset completion state when app changes
  useEffect(() => {
    setIsDataFetchingComplete(false);
  }, [appId]);

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
  const [triggerListAppVersionAbilities, { isError: abilitiesError }] =
    vincentApiClient.useLazyListAppVersionAbilitiesQuery();
  const [triggerGetAbilityVersion, { isError: abilityVersionsError }] =
    vincentApiClient.useLazyGetAbilityVersionQuery();
  const [triggerGetPolicyVersion, { isError: policiesError }] =
    vincentApiClient.useLazyGetPolicyVersionQuery();
  const [triggerGetAbility, { isError: abilitiesInfoError }] =
    vincentApiClient.useLazyGetAbilityQuery();
  const [triggerGetPolicy, { isError: policiesInfoError }] =
    vincentApiClient.useLazyGetPolicyQuery();

  const [versionAbilitiesData, setVersionAbilitiesData] = useState<
    Record<string, AppVersionAbility[]>
  >({});
  const [abilityVersionsData, setAbilityVersionsData] = useState<Record<string, AbilityVersion>>(
    {},
  );
  const [supportedPoliciesData, setSupportedPoliciesData] = useState<
    Record<string, PolicyVersion[]>
  >({});
  const [abilitiesData, setAbilitiesData] = useState<Record<string, Ability>>({});
  const [policiesData, setPoliciesData] = useState<Record<string, Policy>>({});

  // Fetch all data when appVersions changes
  useEffect(() => {
    // Only proceed when both queries are done loading
    if (appLoading || appVersionsLoading) {
      return;
    }

    if (!app || !appVersions || appVersions.length === 0) {
      // Only mark as complete if we have a valid appId but no data AND queries are done
      setIsDataFetchingComplete(true);
      return;
    }

    // Reset completion state when starting fetch
    setIsDataFetchingComplete(false);

    const fetchAllData = async () => {
      try {
        // Step 1: Fetch version abilities
        const versionAbilitiesData: Record<string, AppVersionAbility[]> = {};

        for (const version of appVersions) {
          const result = await triggerListAppVersionAbilities({
            appId: Number(appId),
            version: Number(version.version),
          });

          const versionKey = `${appId}-${version.version}`;
          versionAbilitiesData[versionKey] = result.data || [];
        }

        setVersionAbilitiesData(versionAbilitiesData);

        // Step 2: Fetch ability versions and parent abilities
        const abilityVersions: Record<string, AbilityVersion> = {};
        const abilities: Record<string, Ability> = {};

        for (const [_, abilitiesList] of Object.entries(versionAbilitiesData)) {
          for (const ability of abilitiesList) {
            const abilityVersionResult = await triggerGetAbilityVersion({
              packageName: ability.abilityPackageName,
              version: ability.abilityVersion,
            });

            const abilityKey = `${ability.abilityPackageName}-${ability.abilityVersion}`;
            if (abilityVersionResult.data) {
              abilityVersions[abilityKey] = abilityVersionResult.data;
            }

            // Fetch parent ability info if we haven't already
            if (!abilities[ability.abilityPackageName]) {
              const abilityResult = await triggerGetAbility({
                packageName: ability.abilityPackageName,
              });

              if (abilityResult.data) {
                abilities[ability.abilityPackageName] = abilityResult.data;
              }
            }
          }
        }

        setAbilityVersionsData(abilityVersions);
        setAbilitiesData(abilities);

        // Step 3: Fetch supported policies and parent policy info
        const supportedPoliciesData: Record<string, PolicyVersion[]> = {};
        const policies: Record<string, Policy> = {};

        for (const [abilityKey, abilityVersion] of Object.entries(abilityVersions)) {
          const abilityPolicies: PolicyVersion[] = [];

          if (abilityVersion.supportedPolicies) {
            for (const [policyPackageName, policyVersion] of Object.entries(
              abilityVersion.supportedPolicies,
            )) {
              const policyVersionResult = await triggerGetPolicyVersion({
                packageName: policyPackageName,
                version: policyVersion,
              });

              if (policyVersionResult.data) {
                abilityPolicies.push(policyVersionResult.data);
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

          supportedPoliciesData[abilityKey] = abilityPolicies;
        }

        setSupportedPoliciesData(supportedPoliciesData);
        setPoliciesData(policies);

        // Mark data fetching as complete
        setIsDataFetchingComplete(true);
      } catch (error) {
        console.error('Error fetching connect info:', error);
        // Still mark as complete even if there was an error
        setIsDataFetchingComplete(true);
      }
    };

    fetchAllData();
  }, [appVersions?.length, appId, app?.appId]);

  // Construct ConnectInfoMap from available data
  const connectInfoMap = useMemo((): ConnectInfoMap => {
    const versionsByApp: Record<string, AppVersion[]> = {
      [appId]: appVersions || [],
    };

    const appVersionAbilitiesByAppVersion: Record<string, AppVersionAbility[]> = {};
    (appVersions || []).forEach((version) => {
      const versionKey = `${appId}-${version.version}`;
      appVersionAbilitiesByAppVersion[versionKey] = versionAbilitiesData[versionKey] || [];
    });

    const abilityVersionsByAppVersionAbility: Record<string, AbilityVersion[]> = {};
    Object.entries(abilityVersionsData).forEach(([abilityKey, abilityVersion]) => {
      abilityVersionsByAppVersionAbility[abilityKey] = [abilityVersion];
    });

    const supportedPoliciesByAbilityVersion: Record<string, PolicyVersion[]> = {
      ...supportedPoliciesData,
    };

    // Compute mapping from app version to supported policy IPFS CIDs
    const appVersionToSupportedPolicyIpfsCids: Record<string, string[]> = {};

    (appVersions || []).forEach((version) => {
      const versionKey = `${appId}-${version.version}`;
      const ipfsCids: string[] = [];

      // Get abilities for this app version
      const abilities = versionAbilitiesData[versionKey] || [];

      abilities.forEach((ability) => {
        const abilityKey = `${ability.abilityPackageName}-${ability.abilityVersion}`;

        // Get supported policies for this ability
        const policies = supportedPoliciesData[abilityKey] || [];

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
      appVersionAbilitiesByAppVersion,
      abilityVersionsByAppVersionAbility,
      supportedPoliciesByAbilityVersion,
      appVersionToSupportedPolicyIpfsCids,
      abilitiesByPackageName: abilitiesData,
      policiesByPackageName: policiesData,
    };
  }, [
    appVersions,
    versionAbilitiesData,
    abilityVersionsData,
    supportedPoliciesData,
    appId,
    app,
    abilitiesData,
    policiesData,
  ]);

  return {
    isLoading: !isDataFetchingComplete,
    isError:
      appError ||
      appVersionsError ||
      abilitiesError ||
      abilityVersionsError ||
      policiesError ||
      abilitiesInfoError ||
      policiesInfoError ||
      (!appLoading && !app && isDataFetchingComplete),
    errors:
      appError || appVersionsError || (!appLoading && !app && isDataFetchingComplete)
        ? ['App not found']
        : [],
    data: connectInfoMap,
  };
};
