import { ConnectInfoMap } from '@/hooks/user-dashboard/connect/useConnectInfo';

/**
 * Check if there are any configurable policies for a given version
 * @param connectInfoMap - The connect info map containing abilities and policies
 * @param permittedVersion - The version to check for configurable policies
 * @param appId - Optional app ID to check (if not provided, checks all apps)
 * @returns true if there are any visible/configurable policies, false otherwise
 */
export function hasConfigurablePolicies(
  connectInfoMap: ConnectInfoMap,
  permittedVersion: number | string,
  appId?: string,
): boolean {
  const appNames = appId ? [appId] : Object.keys(connectInfoMap.versionsByApp);

  for (const appName of appNames) {
    const versions = connectInfoMap.versionsByApp[appName];
    if (!versions) continue;

    const version = versions.find((v) => v.version.toString() === permittedVersion.toString());

    if (version) {
      const versionKey = `${appName}-${version.version}`;
      const appVersionAbilities = connectInfoMap.appVersionAbilitiesByAppVersion[versionKey] || [];

      for (const ability of appVersionAbilities) {
        const abilityKey = `${ability.abilityPackageName}-${ability.abilityVersion}`;
        const policies = connectInfoMap.supportedPoliciesByAbilityVersion[abilityKey] || [];

        // Filter visible policies (same logic as PermittedAppInfo)
        const visiblePolicies = policies.filter((policy) => {
          if (!ability.hiddenSupportedPolicies || ability.hiddenSupportedPolicies.length === 0) {
            return true;
          }
          return !ability.hiddenSupportedPolicies.includes(policy.packageName);
        });

        if (visiblePolicies.length > 0) {
          return true; // Found at least one configurable policy
        }
      }
    }
  }

  return false; // No configurable policies found
}
