import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/shared/ui/card';
import { ConsentInfoMap } from '@/hooks/user-dashboard/consent/useConsentInfo';
import { ToolHeader } from '@/components/user-dashboard/consent/ui/ToolHeader';
import { RequiredPolicies } from '@/components/user-dashboard/consent/ui/RequiredPolicies';
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
          >
            <Card className={`backdrop-blur-xl ${theme.cardBg} border ${theme.cardBorder}`}>
              {/* Version Content */}
              <CardContent className="p-6">
                {(() => {
                  const versionKey = `${appName}-${version.version}`;
                  const appVersionTools =
                    consentInfoMap.appVersionToolsByAppVersion[versionKey] || [];

                  return (
                    <div className="space-y-6">
                      {appVersionTools.map((tool) => {
                        const toolKey = `${tool.toolPackageName}-${tool.toolVersion}`;
                        const policies =
                          consentInfoMap.supportedPoliciesByToolVersion[toolKey] || [];

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

                        const toolVersions =
                          consentInfoMap.toolVersionsByAppVersionTool[toolKey] || [];
                        const toolVersion = toolVersions[0];

                        return (
                          <div key={toolKey} className="space-y-4">
                            {/* Tool Header */}
                            <ToolHeader
                              tool={tool}
                              toolVersion={toolVersion}
                              consentInfoMap={consentInfoMap}
                              theme={theme}
                            />

                            {/* Required Policies */}
                            <RequiredPolicies
                              policies={visiblePolicies}
                              consentInfoMap={consentInfoMap}
                              theme={theme}
                              isDark={isDark}
                              formData={formData}
                              onFormChange={onFormChange}
                              onRegisterFormRef={onRegisterFormRef}
                              toolIpfsCid={toolVersion.ipfsCid}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </>
  );
}
