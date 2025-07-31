import { motion } from 'framer-motion';
import { ConnectInfoMap } from '@/hooks/user-dashboard/connect/useConnectInfo';
import { AbilityAccordion } from '@/components/user-dashboard/connect/ui/AbilityAccordion';
import { PolicyFormRef } from '@/components/user-dashboard/connect/ui/PolicyForm';

interface AppsAndVersionsProps {
  connectInfoMap: ConnectInfoMap;
  formData: Record<string, any>;
  onFormChange: (abilityIpfsCid: string, policyIpfsCid: string, data: any) => void;
  onRegisterFormRef: (policyIpfsCid: string, ref: PolicyFormRef) => void;
  permittedVersion?: string; // Optional prop to specify a specific version to render
}

export function PermittedAppInfo({
  connectInfoMap,
  formData,
  onFormChange,
  onRegisterFormRef,
  permittedVersion,
}: AppsAndVersionsProps) {
  const appNames = Object.keys(connectInfoMap.versionsByApp);

  return (
    <>
      {appNames.map((appName, appIndex) => {
        const versions = connectInfoMap.versionsByApp[appName];

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
