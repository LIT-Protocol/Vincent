import { useState, useEffect, useCallback } from 'react';
import { ConnectInfoMap } from '@/hooks/user-dashboard/connect/useConnectInfo';
import { PermissionData } from '@lit-protocol/vincent-contracts-sdk';

export function useFormatUserPermissions(
  connectInfoMap: ConnectInfoMap,
  initialPermissionData?: PermissionData | null,
  targetVersion?: number,
) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [selectedPolicies, setSelectedPolicies] = useState<Record<string, boolean>>({});

  // Initialize formData and selectedPolicies
  useEffect(() => {
    const initialFormData: Record<string, any> = {};
    const initialSelectedPolicies: Record<string, boolean> = {};

    const appNames = Object.keys(connectInfoMap.versionsByApp);
    appNames.forEach((appName) => {
      const versions = connectInfoMap.versionsByApp[appName];
      const activeVersion = versions.find(
        (version) => version.version === (targetVersion || connectInfoMap.app.activeVersion),
      );

      if (activeVersion) {
        const versionKey = `${appName}-${activeVersion.version}`;
        const appVersionAbilities =
          connectInfoMap.appVersionAbilitiesByAppVersion[versionKey] || [];

        appVersionAbilities.forEach((ability) => {
          const abilityKey = `${ability.abilityPackageName}-${ability.abilityVersion}`;
          const policies = connectInfoMap.supportedPoliciesByAbilityVersion[abilityKey] || [];
          const abilityVersions =
            connectInfoMap.abilityVersionsByAppVersionAbility[abilityKey] || [];
          const abilityVersion = abilityVersions[0];

          if (abilityVersion) {
            initialFormData[abilityVersion.ipfsCid] = {};

            // Process all policies for this ability
            policies.forEach((policy) => {
              const isHidden = ability.hiddenSupportedPolicies?.includes(policy.packageName);
              
              // Skip hidden policies entirely - they should never be in formData or selectedPolicies
              if (isHidden) {
                return;
              }
              
              // Check if policy exists in initial permission data
              if (
                initialPermissionData &&
                initialPermissionData[abilityVersion.ipfsCid] &&
                initialPermissionData[abilityVersion.ipfsCid][policy.ipfsCid] !== undefined
              ) {
                const policyData = initialPermissionData[abilityVersion.ipfsCid][policy.ipfsCid];
                initialFormData[abilityVersion.ipfsCid][policy.ipfsCid] = policyData || {};
                
                // Policy exists in data, so it's selected
                initialSelectedPolicies[policy.ipfsCid] = true;
              } else {
                // Policy doesn't exist in data, so it's not selected
                initialSelectedPolicies[policy.ipfsCid] = false;
              }
            });
          }
        });
      }
    });

    setFormData(initialFormData);
    setSelectedPolicies(initialSelectedPolicies);
  }, [connectInfoMap, initialPermissionData, targetVersion]);

  const handleFormChange = useCallback(
    (abilityIpfsCid: string, policyIpfsCid: string, data: any) => {
      setFormData((prev) => ({
        ...prev,
        [abilityIpfsCid]: {
          ...prev[abilityIpfsCid],
          [policyIpfsCid]: data.formData,
        },
      }));
    },
    [],
  );

  const handlePolicySelectionChange = useCallback(
    (_abilityIpfsCid: string, policyIpfsCid: string, selected: boolean) => {
      setSelectedPolicies((prev) => ({
        ...prev,
        [policyIpfsCid]: selected,
      }));
    },
    [],
  );

  return {
    formData,
    handleFormChange,
    selectedPolicies,
    handlePolicySelectionChange,
  };
}
