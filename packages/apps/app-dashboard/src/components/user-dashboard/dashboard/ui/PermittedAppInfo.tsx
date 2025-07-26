import { motion } from 'framer-motion';
import { ConsentInfoMap } from '@/hooks/user-dashboard/consent/useConsentInfo';
import { ToolAccordion } from '@/components/user-dashboard/consent/ui/ToolAccordion';
import { PolicyFormRef } from '@/components/user-dashboard/consent/ui/PolicyForm';
import { ThemeType } from '@/components/user-dashboard/consent/ui/theme';

interface AppsAndVersionsProps {
  consentInfoMap: ConsentInfoMap;
  theme: ThemeType;
  isDark: boolean;
  formData: Record<string, any>;
  onFormChange: (toolIpfsCid: string, policyIpfsCid: string, data: any) => void;
  onRegisterFormRef: (policyIpfsCid: string, ref: PolicyFormRef) => void;
  permittedVersion?: string; // Optional prop to specify a specific version to render
}

export function PermittedAppInfo({
  consentInfoMap,
  theme,
  isDark,
  formData,
  onFormChange,
  onRegisterFormRef,
  permittedVersion,
}: AppsAndVersionsProps) {
  const appNames = Object.keys(consentInfoMap.versionsByApp);

  return (
    <>
      {appNames.map((appName, appIndex) => {
        const versions = consentInfoMap.versionsByApp[appName];

        // Skip if no version to use
        if (!permittedVersion) return null;

        const version = versions.find(
          (version) => version.version.toString() === permittedVersion.toString(),
        );

        if (!version) return null;

        return (
          <motion.div
            key={appName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: appIndex * 0.1 }}
            className="space-y-4"
          >
            {(() => {
              const versionKey = `${appName}-${version.version}`;
              const appVersionTools = consentInfoMap.appVersionToolsByAppVersion[versionKey] || [];

              return (
                <>
                  {appVersionTools.map((tool) => {
                    const toolKey = `${tool.toolPackageName}-${tool.toolVersion}`;
                    const policies = consentInfoMap.supportedPoliciesByToolVersion[toolKey] || [];

                    // Filter out policies that are in hiddenSupportedPolicies
                    const visiblePolicies = policies.filter((policy) => {
                      if (
                        !tool.hiddenSupportedPolicies ||
                        tool.hiddenSupportedPolicies.length === 0
                      ) {
                        return true; // Show all policies if no hidden policies specified
                      }
                      return !tool.hiddenSupportedPolicies.includes(policy.packageName);
                    });

                    const toolVersions = consentInfoMap.toolVersionsByAppVersionTool[toolKey] || [];
                    const toolVersion = toolVersions[0];

                    return (
                      <ToolAccordion
                        key={toolKey}
                        tool={tool}
                        toolVersion={toolVersion}
                        policies={visiblePolicies}
                        consentInfoMap={consentInfoMap}
                        theme={theme}
                        isDark={isDark}
                        formData={formData}
                        onFormChange={onFormChange}
                        onRegisterFormRef={onRegisterFormRef}
                        toolIpfsCid={toolVersion.ipfsCid}
                        defaultExpanded={false} // All tools start closed
                      />
                    );
                  })}
                </>
              );
            })()}
          </motion.div>
        );
      })}
    </>
  );
}
