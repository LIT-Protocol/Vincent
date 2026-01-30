import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { theme, fonts } from '@/lib/themeClasses';

interface AbilityInfo {
  abilityPackageName: string;
  abilityVersion: string;
  isDeleted?: boolean;
  hiddenSupportedPolicies?: string[];
}

interface AbilityVersionData {
  supportedPolicies?: Record<string, string>;
}

interface PackageInstallCommandProps {
  versionAbilities: AbilityInfo[];
  abilityVersionsData: Record<string, AbilityVersionData>;
}

export function PackageInstallCommand({
  versionAbilities,
  abilityVersionsData,
}: PackageInstallCommandProps) {
  const [selectedPackageManager, setSelectedPackageManager] = useState<'npm' | 'yarn' | 'pnpm'>(
    'npm',
  );
  const [copiedCommand, setCopiedCommand] = useState(false);

  // Generate install command based on package manager
  const getInstallCommand = () => {
    if (!versionAbilities || versionAbilities.length === 0) return '';

    const packagesSet = new Set<string>();

    // Add abilities and their non-hidden policies
    versionAbilities
      .filter((ability) => !ability.isDeleted)
      .forEach((ability) => {
        // Add the ability package
        packagesSet.add(`${ability.abilityPackageName}@${ability.abilityVersion}`);

        // Get ability version data to find supported policies
        const abilityKey = `${ability.abilityPackageName}-${ability.abilityVersion}`;
        const abilityVersionData = abilityVersionsData[abilityKey];

        if (abilityVersionData?.supportedPolicies) {
          // Add non-hidden policies
          Object.entries(abilityVersionData.supportedPolicies).forEach(
            ([policyPackageName, policyVersion]) => {
              // Only add if not in hiddenSupportedPolicies list
              if (!ability.hiddenSupportedPolicies?.includes(policyPackageName)) {
                packagesSet.add(`${policyPackageName}@${policyVersion}`);
              }
            },
          );
        }
      });

    const packages = Array.from(packagesSet).join(' ');

    switch (selectedPackageManager) {
      case 'yarn':
        return `yarn add ${packages}`;
      case 'pnpm':
        return `pnpm add ${packages}`;
      default:
        return `npm install ${packages}`;
    }
  };

  const handleCopyCommand = async () => {
    const command = getInstallCommand();
    await navigator.clipboard.writeText(command);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  const activeAbilities = versionAbilities?.filter((ability) => !ability.isDeleted) || [];

  if (activeAbilities.length === 0) {
    return null;
  }

  return (
    <div className={`border ${theme.mainCardBorder} rounded-lg p-4 ${theme.itemBg}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h4 className={`text-sm font-semibold ${theme.text} mb-1`} style={fonts.heading}>
            Install Required Abilities & Policies
          </h4>
          <p className={`text-xs ${theme.textMuted}`} style={fonts.body}>
            You will need to install these packages to execute them on behalf of users.
          </p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {(['npm', 'yarn', 'pnpm'] as const).map((pm) => (
            <button
              key={pm}
              onClick={() => setSelectedPackageManager(pm)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectedPackageManager === pm
                  ? 'text-white'
                  : `${theme.text} hover:bg-gray-100 dark:hover:bg-gray-700`
              }`}
              style={
                selectedPackageManager === pm ? { backgroundColor: theme.brandOrange } : undefined
              }
            >
              {pm}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <code
          className={`flex-1 px-3 py-2 rounded text-sm font-mono ${theme.mainCard} border ${theme.cardBorder} ${theme.text}`}
        >
          {getInstallCommand()}
        </code>
        <button
          onClick={handleCopyCommand}
          className={`p-2 rounded transition-colors ${theme.itemBg} hover:bg-gray-100 dark:hover:bg-gray-700`}
          title="Copy command"
        >
          {copiedCommand ? (
            <Check className="w-4 h-4" style={{ color: theme.brandOrange }} />
          ) : (
            <Copy className="w-4 h-4" style={{ color: theme.textMuted }} />
          )}
        </button>
      </div>
    </div>
  );
}
