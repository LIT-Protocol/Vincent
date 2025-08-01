import { useState, useEffect, useCallback } from 'react';
import { ConnectInfoMap } from './useConnectInfo';

export function useConnectFormData(connectInfoMap: ConnectInfoMap) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Initialize formData with all policies (including hidden ones with empty values)
  useEffect(() => {
    const initialFormData: Record<string, any> = {};

    const appNames = Object.keys(connectInfoMap.versionsByApp);
    appNames.forEach((appName) => {
      const versions = connectInfoMap.versionsByApp[appName];
      const activeVersion = versions.find(
        (version) => version.version === connectInfoMap.app.activeVersion,
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

            // Add all policies (including hidden ones) with empty values
            policies.forEach((policy) => {
              initialFormData[abilityVersion.ipfsCid][policy.ipfsCid] = {};
            });
          }
        });
      }
    });

    setFormData(initialFormData);
  }, [connectInfoMap]);

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

  return {
    formData,
    handleFormChange,
  };
}
