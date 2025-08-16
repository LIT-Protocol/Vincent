import { motion } from 'framer-motion';
import { ConnectInfoMap } from '@/hooks/user-dashboard/connect/useConnectInfo';
import { AbilityAccordion } from './AbilityAccordion';
import { PolicyFormRef } from './PolicyForm';
import { AbilityHeader } from './AbilityHeader';
import { theme } from './theme';

interface AppsAndVersionsProps {
  connectInfoMap: ConnectInfoMap;
  formData: Record<string, any>;
  onFormChange: (abilityIpfsCid: string, policyIpfsCid: string, data: any) => void;
  onRegisterFormRef: (policyIpfsCid: string, ref: PolicyFormRef) => void;
  selectedPolicies: Record<string, boolean>;
  onPolicySelectionChange: (
    abilityIpfsCid: string,
    policyIpfsCid: string,
    selected: boolean,
  ) => void;
}

export function AppsInfo({
  connectInfoMap,
  formData,
  onFormChange,
  onRegisterFormRef,
  selectedPolicies,
  onPolicySelectionChange,
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
            className="space-y-1"
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

                    // If no visible policies, render a simple card without accordion
                    if (visiblePolicies.length === 0) {
                      return (
                        <div
                          key={abilityKey}
                          className={`backdrop-blur-xl ${theme.cardBg} border ${theme.cardBorder} rounded-lg overflow-hidden`}
                        >
                          <div className="py-2 px-2 sm:py-2.5 sm:px-3">
                            <AbilityHeader
                              ability={ability}
                              abilityVersion={abilityVersion}
                              connectInfoMap={connectInfoMap}
                            />
                          </div>
                        </div>
                      );
                    }

                    // If there are visible policies, render the accordion
                    return (
                      <AbilityAccordion
                        key={abilityKey}
                        ability={ability}
                        abilityVersion={abilityVersion}
                        policies={visiblePolicies}
                        connectInfoMap={connectInfoMap}
                        formData={formData}
                        onFormChange={onFormChange}
                        onRegisterFormRef={onRegisterFormRef}
                        abilityIpfsCid={abilityVersion.ipfsCid}
                        defaultExpanded={false} // All abilities start closed
                        selectedPolicies={selectedPolicies}
                        onPolicySelectionChange={onPolicySelectionChange}
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
