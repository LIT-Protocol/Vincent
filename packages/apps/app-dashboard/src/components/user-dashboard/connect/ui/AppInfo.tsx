import { motion } from 'framer-motion';
import { ConnectInfoMap } from '@/hooks/user-dashboard/connect/useConnectInfo';
import { AbilityAccordion } from './AbilityAccordion';
import { PolicyFormRef } from './PolicyForm';
import { ThemeType } from './theme';

interface AppsAndVersionsProps {
  connectInfoMap: ConnectInfoMap;
  theme: ThemeType;
  isDark: boolean;
  formData: Record<string, any>;
  onFormChange: (abilityIpfsCid: string, policyIpfsCid: string, data: any) => void;
  onRegisterFormRef: (policyIpfsCid: string, ref: PolicyFormRef) => void;
}

export function AppsInfo({
  connectInfoMap,
  theme,
  isDark,
  formData,
  onFormChange,
  onRegisterFormRef,
}: AppsAndVersionsProps) {
  const appNames = Object.keys(connectInfoMap.versionsByApp);

  return (
    <>
      {appNames.map((appName, appIndex) => {
        const versions = connectInfoMap.versionsByApp[appName];
        const activeVersion = versions.find(
          (version) => version.version === connectInfoMap.app.activeVersion,
        );

        // If no active version, don't show this app (should never happen)
        if (!activeVersion) return null;

        return (
          <motion.div
            key={appName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: appIndex * 0.1 }}
            className="space-y-4"
          >
            {(() => {
              const versionKey = `${appName}-${activeVersion.version}`;
              const appVersionAbilities =
                connectInfoMap.appVersionAbilitiesByAppVersion[versionKey] || [];

              return (
                <>
                  {appVersionAbilities.map((ability) => {
                    const abilityKey = `${ability.abilityPackageName}-${ability.abilityVersion}`;
                    const policies =
                      connectInfoMap.supportedPoliciesByAbilityVersion[abilityKey] || [];

                    // Filter out policies that are in hiddenSupportedPolicies
                    const visiblePolicies = policies.filter((policy) => {
                      if (
                        !ability.hiddenSupportedPolicies ||
                        ability.hiddenSupportedPolicies.length === 0
                      ) {
                        return true; // Show all policies if no hidden policies specified
                      }
                      return !ability.hiddenSupportedPolicies.includes(policy.packageName);
                    });

                    const abilityVersions =
                      connectInfoMap.abilityVersionsByAppVersionAbility[abilityKey] || [];
                    const abilityVersion = abilityVersions[0];

                    return (
                      <AbilityAccordion
                        key={abilityKey}
                        ability={ability}
                        abilityVersion={abilityVersion}
                        policies={visiblePolicies}
                        connectInfoMap={connectInfoMap}
                        theme={theme}
                        isDark={isDark}
                        formData={formData}
                        onFormChange={onFormChange}
                        onRegisterFormRef={onRegisterFormRef}
                        abilityIpfsCid={abilityVersion.ipfsCid}
                        defaultExpanded={false} // All abilities start closed
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
