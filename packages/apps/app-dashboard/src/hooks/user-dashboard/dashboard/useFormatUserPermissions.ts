import { useState, useEffect, useCallback } from 'react';
import { ConsentInfoMap } from '@/hooks/user-dashboard/consent/useConsentInfo';
import { PermissionData } from '@lit-protocol/vincent-contracts-sdk';

export function useFormatUserPermissions(
  consentInfoMap: ConsentInfoMap,
  initialPermissionData?: PermissionData | null,
) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Initialize formData with all policies (including hidden ones with empty values)
  useEffect(() => {
    const initialFormData: Record<string, any> = {};

    const appNames = Object.keys(consentInfoMap.versionsByApp);
    appNames.forEach((appName) => {
      const versions = consentInfoMap.versionsByApp[appName];
      const activeVersion = versions.find(
        (version) => version.version === consentInfoMap.app.activeVersion,
      );

      if (activeVersion) {
        const versionKey = `${appName}-${activeVersion.version}`;
        const appVersionTools = consentInfoMap.appVersionToolsByAppVersion[versionKey] || [];

        appVersionTools.forEach((tool) => {
          const toolKey = `${tool.toolPackageName}-${tool.toolVersion}`;
          const policies = consentInfoMap.supportedPoliciesByToolVersion[toolKey] || [];
          const toolVersions = consentInfoMap.toolVersionsByAppVersionTool[toolKey] || [];
          const toolVersion = toolVersions[0];

          if (toolVersion) {
            initialFormData[toolVersion.ipfsCid] = {};

            // Add all policies (including hidden ones) with empty values
            policies.forEach((policy) => {
              // Initialize with empty object
              initialFormData[toolVersion.ipfsCid][policy.ipfsCid] = {};

              // If we have initial permission data, use it to prepopulate
              if (
                initialPermissionData &&
                initialPermissionData[toolVersion.ipfsCid] &&
                initialPermissionData[toolVersion.ipfsCid][policy.ipfsCid]
              ) {
                initialFormData[toolVersion.ipfsCid][policy.ipfsCid] =
                  initialPermissionData[toolVersion.ipfsCid][policy.ipfsCid] || {};
              }
            });
          }
        });
      }
    });

    setFormData(initialFormData);
  }, [consentInfoMap, initialPermissionData]);

  const handleFormChange = useCallback((toolIpfsCid: string, policyIpfsCid: string, data: any) => {
    setFormData((prev) => ({
      ...prev,
      [toolIpfsCid]: {
        ...prev[toolIpfsCid],
        [policyIpfsCid]: data.formData,
      },
    }));
  }, []);

  return {
    formData,
    handleFormChange,
  };
}
