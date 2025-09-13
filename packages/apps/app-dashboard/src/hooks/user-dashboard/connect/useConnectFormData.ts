import { useState, useEffect, useCallback } from 'react';
import { ConnectInfoMap } from './useConnectInfo';

export function useConnectFormData(connectInfoMap: ConnectInfoMap) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [selectedPolicies, setSelectedPolicies] = useState<Record<string, boolean>>({});

  // Initialize formData and selectedPolicies with all policies
  useEffect(() => {
    const initialFormData: Record<string, any> = {};
    const initialSelectedPolicies: Record<string, boolean> = {};

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

            // Add all policies to form data
            policies.forEach((policy) => {
              initialFormData[abilityVersion.ipfsCid][policy.ipfsCid] = {};

              // Only add visible policies to selectedPolicies
              // Hidden policies are not shown in UI so they shouldn't be in selection state
              const isHidden = ability.hiddenSupportedPolicies?.includes(policy.packageName);

              if (!isHidden) {
                // Default visible policies to selected (checked)
                initialSelectedPolicies[policy.ipfsCid] = true;
              }
              // Hidden policies are not added to selectedPolicies at all
            });
          }
        });
      }
    });

    setFormData(initialFormData);
    setSelectedPolicies(initialSelectedPolicies);
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

  const handlePolicySelectionChange = useCallback(
    (_: string, policyIpfsCid: string, selected: boolean) => {
      setSelectedPolicies((prev) => ({
        ...prev,
        [policyIpfsCid]: selected,
      }));
    },
    [],
  );

  // Function to get filtered form data with only selected policies
  const getSelectedFormData = useCallback(() => {
    const filteredFormData: Record<string, any> = {};

    Object.keys(formData).forEach((abilityIpfsCid) => {
      const abilityData = formData[abilityIpfsCid];
      const filteredAbilityData: Record<string, any> = {};

      Object.keys(abilityData).forEach((policyIpfsCid) => {
        // Only include if policy exists in selectedPolicies (visible) AND is selected (true)
        // Hidden policies won't be in selectedPolicies at all
        if (policyIpfsCid in selectedPolicies && selectedPolicies[policyIpfsCid]) {
          // Include policy data if selected
          const policyData = abilityData[policyIpfsCid];

          // Process each field in the policy data
          if (policyData && typeof policyData === 'object' && Object.keys(policyData).length > 0) {
            const processedPolicyData: Record<string, any> = {};

            // For each field in the form data
            Object.keys(policyData).forEach((fieldName) => {
              const fieldValue = policyData[fieldName];
              // If field is empty string, null, or undefined, set to undefined
              if (fieldValue === '' || fieldValue === null || fieldValue === undefined) {
                processedPolicyData[fieldName] = undefined;
              } else {
                processedPolicyData[fieldName] = fieldValue;
              }
            });

            filteredAbilityData[policyIpfsCid] = processedPolicyData;
          } else {
            // If no form data or empty object, include empty object
            // The contract SDK will validate this against the policy schema
            filteredAbilityData[policyIpfsCid] = {};
          }
        }
        // If not selected or hidden, don't include the policy at all (omit it)
        // This is the only way to mark a policy as disabled
      });

      // Always include the ability, even if no policies are selected
      // This ensures all tools/abilities are permitted
      filteredFormData[abilityIpfsCid] = filteredAbilityData;
    });

    return filteredFormData;
  }, [formData, selectedPolicies]);

  return {
    formData,
    selectedPolicies,
    handleFormChange,
    handlePolicySelectionChange,
    getSelectedFormData,
  };
}
