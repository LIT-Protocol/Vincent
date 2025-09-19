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

export const useConnectInfo = (
  appId: string,
  versionsToFetch?: number[],
  useActiveVersion = true,
): ConnectInfoState => {
  const [isDataFetchingComplete, setIsDataFetchingComplete] = useState(false);
  const [currentlyFetchingVersions, setCurrentlyFetchingVersions] = useState<string>('');
  const versionsKey = versionsToFetch ? versionsToFetch.sort().join(',') : '';

  // Reset completion state when app changes
  useEffect(() => {
    setIsDataFetchingComplete(false);
    setCurrentlyFetchingVersions('');
    setFetchErrors([]);
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
  const [fetchErrors, setFetchErrors] = useState<string[]>([]);

  // Fetch all data when appVersions changes
  useEffect(() => {
    // Only proceed when both queries are done loading
    if (appLoading || appVersionsLoading) {
      return;
    }

    // If we're not using active version and versionsToFetch is not provided, wait
    if (!useActiveVersion && !versionsToFetch) {
      return;
    }

    if (!app || !appVersions || appVersions.length === 0) {
      // Only mark as complete if we have a valid appId but no data AND queries are done
      setIsDataFetchingComplete(true);
      return;
    }

    // Determine what versions we'll be fetching
    const targetVersionsKey = versionsToFetch
      ? versionsToFetch.sort().join(',')
      : app?.activeVersion?.toString() || '';

    // Check if we're already fetching or have fetched these versions
    if (currentlyFetchingVersions === targetVersionsKey) {
      return;
    }
    setIsDataFetchingComplete(false);
    setCurrentlyFetchingVersions(targetVersionsKey);

    const fetchAllData = async () => {
      try {
        // Step 1: Fetch version abilities in parallel
        const versionAbilitiesData: Record<string, AppVersionAbility[]> = {};
        const errors: string[] = [];

        // Only fetch abilities for specified versions or just the active version
        const versionsToProcess = versionsToFetch
          ? appVersions.filter((v) => versionsToFetch.includes(v.version))
          : appVersions.filter((v) => v.version === app?.activeVersion);

        // Parallelize version abilities fetching
        const versionAbilitiesPromises = versionsToProcess.map((version) => {
          const versionKey = `${appId}-${version.version}`;
          return triggerListAppVersionAbilities({
            appId: Number(appId),
            version: Number(version.version),
          })
            .unwrap()
            .then((data) => [versionKey, data || []] as const)
            .catch((error) => {
              console.error(`Failed to fetch abilities for version ${version.version}:`, error);
              return [versionKey, []] as const;
            });
        });

        const versionAbilitiesResults = await Promise.all(versionAbilitiesPromises);
        Object.assign(versionAbilitiesData, Object.fromEntries(versionAbilitiesResults));

        setVersionAbilitiesData(versionAbilitiesData);

        // Step 2: Fetch ability versions and parent abilities in parallel
        const abilityVersions: Record<string, AbilityVersion> = {};
        const abilities: Record<string, Ability> = {};

        // Collect all unique abilities to fetch
        const abilityFetchMap = new Map<string, { packageName: string; version: string }>();
        const parentAbilitySet = new Set<string>();

        for (const abilitiesList of Object.values(versionAbilitiesData)) {
          for (const ability of abilitiesList) {
            const abilityKey = `${ability.abilityPackageName}-${ability.abilityVersion}`;
            abilityFetchMap.set(abilityKey, {
              packageName: ability.abilityPackageName,
              version: ability.abilityVersion,
            });
            parentAbilitySet.add(ability.abilityPackageName);
          }
        }

        // Parallelize ability version fetching
        const abilityVersionPromises = Array.from(abilityFetchMap.entries()).map(
          ([abilityKey, { packageName, version }]) => {
            return triggerGetAbilityVersion({
              packageName,
              version,
            })
              .unwrap()
              .then((data) => [abilityKey, data] as const)
              .catch((error) => {
                console.error(`Failed to fetch ability version ${packageName}@${version}:`, error);
                // Report to Sentry without breaking the promise chain
                setTimeout(() => { throw error; }, 0);
                return [abilityKey, null] as const;
              });
          },
        );

        // Parallelize parent ability fetching
        const parentAbilityPromises = Array.from(parentAbilitySet).map((packageName) => {
          return triggerGetAbility({
            packageName,
          })
            .unwrap()
            .then((data) => [packageName, data] as const)
            .catch((error) => {
              console.error(`Failed to fetch ability ${packageName}:`, error);
              // Report to Sentry without breaking the promise chain
              setTimeout(() => { throw error; }, 0);
              return [packageName, null] as const;
            });
        });

        // Wait for all ability-related fetches to complete
        const [abilityVersionResults, parentAbilityResults] = await Promise.all([
          Promise.all(abilityVersionPromises),
          Promise.all(parentAbilityPromises),
        ]);

        // Process ability version results
        abilityVersionResults.forEach(([abilityKey, data]) => {
          if (data) {
            abilityVersions[abilityKey] = data;
          } else {
            const [packageName, version] = abilityKey.split('@');
            errors.push(`Failed to load ability version: ${packageName}@${version}`);
          }
        });

        // Process parent ability results
        parentAbilityResults.forEach(([packageName, data]) => {
          if (data) {
            abilities[packageName] = data;
          } else {
            errors.push(`Failed to load ability: ${packageName}`);
          }
        });

        setAbilityVersionsData(abilityVersions);
        setAbilitiesData(abilities);
        
        // Update errors if any abilities failed to load
        if (errors.length > 0) {
          setFetchErrors(prev => [...prev, ...errors]);
        }

        // Step 3: Fetch supported policies and parent policy info in parallel
        const supportedPoliciesData: Record<string, PolicyVersion[]> = {};
        const policies: Record<string, Policy> = {};

        // Collect all unique policies to fetch
        const policyFetchMap = new Map<string, { packageName: string; version: string }>();
        const parentPolicySet = new Set<string>();

        for (const abilityVersion of Object.values(abilityVersions)) {
          if (abilityVersion.supportedPolicies) {
            for (const [policyPackageName, policyVersion] of Object.entries(
              abilityVersion.supportedPolicies,
            )) {
              const policyKey = `${policyPackageName}-${policyVersion}`;
              policyFetchMap.set(policyKey, {
                packageName: policyPackageName,
                version: policyVersion,
              });
              parentPolicySet.add(policyPackageName);
            }
          }
        }

        // Parallelize policy version fetching
        const policyVersionPromises = Array.from(policyFetchMap.values()).map(
          ({ packageName, version }) => {
            return triggerGetPolicyVersion({
              packageName,
              version,
            })
              .unwrap()
              .then((data) => [packageName, version, data] as const)
              .catch((error) => {
                console.error(`Failed to fetch policy version ${packageName}@${version}:`, error);
                // Report to Sentry without breaking the promise chain
                setTimeout(() => { throw error; }, 0);
                return [packageName, version, null] as const;
              });
          },
        );

        // Parallelize parent policy fetching
        const parentPolicyPromises = Array.from(parentPolicySet).map((packageName) => {
          return triggerGetPolicy({
            packageName,
          })
            .unwrap()
            .then((data) => [packageName, data] as const)
            .catch((error) => {
              console.error(`Failed to fetch policy ${packageName}:`, error);
              // Report to Sentry without breaking the promise chain
              setTimeout(() => { throw error; }, 0);
              return [packageName, null] as const;
            });
        });

        // Wait for all policy-related fetches to complete
        const [policyVersionResults, parentPolicyResults] = await Promise.all([
          Promise.all(policyVersionPromises),
          Promise.all(parentPolicyPromises),
        ]);

        // Process policy results and group by ability
        for (const [abilityKey, abilityVersion] of Object.entries(abilityVersions)) {
          const abilityPolicies: PolicyVersion[] = [];

          if (abilityVersion.supportedPolicies) {
            for (const [policyPackageName, policyVersion] of Object.entries(
              abilityVersion.supportedPolicies,
            )) {
              const policyResult = policyVersionResults.find(
                ([pkgName, ver]) => pkgName === policyPackageName && ver === policyVersion,
              );
              if (policyResult && policyResult[2]) {
                abilityPolicies.push(policyResult[2]);
              } else if (policyResult && !policyResult[2]) {
                errors.push(`Failed to load policy version: ${policyPackageName}@${policyVersion}`);
              }
            }
          }

          supportedPoliciesData[abilityKey] = abilityPolicies;
        }

        // Process parent policy results
        parentPolicyResults.forEach(([packageName, data]) => {
          if (data) {
            policies[packageName] = data;
          } else {
            errors.push(`Failed to load policy: ${packageName}`);
          }
        });

        setSupportedPoliciesData(supportedPoliciesData);
        setPoliciesData(policies);
        
        // Update errors if any policies failed to load
        if (errors.length > 0) {
          setFetchErrors(prev => [...prev, ...errors]);
        }

        // Mark data fetching as complete
        setIsDataFetchingComplete(true);
      } catch (error) {
        console.error('Error fetching connect info:', error);
        // Still mark as complete even if there was an error
        setIsDataFetchingComplete(true);
      }
    };

    fetchAllData();
  }, [
    appVersions,
    appId,
    app,
    versionsKey,
    useActiveVersion,
    currentlyFetchingVersions,
    appLoading,
    appVersionsLoading,
    triggerListAppVersionAbilities,
    triggerGetAbilityVersion,
    triggerGetPolicyVersion,
    triggerGetAbility,
    triggerGetPolicy,
  ]);

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

  const hasError =
    appError ||
    appVersionsError ||
    abilitiesError ||
    abilityVersionsError ||
    policiesError ||
    abilitiesInfoError ||
    policiesInfoError ||
    (!appLoading && !app && isDataFetchingComplete);

  return {
    isLoading: !isDataFetchingComplete || (!useActiveVersion && !versionsToFetch),
    isError: hasError || fetchErrors.length > 0,
    errors: hasError ? ['App not found'] : fetchErrors,
    data: connectInfoMap,
  };
};
