import { Wrench, Package } from 'lucide-react';

import { AppVersionAbility } from '@/types/developer-dashboard/appTypes';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';

interface AppVersionAbilitiesDisplayProps {
  abilities: AppVersionAbility[];
}

export function AppVersionAbilitiesDisplay({ abilities }: AppVersionAbilitiesDisplayProps) {
  // Filter out deleted abilities
  const activeAbilities = abilities.filter((ability) => !ability.isDeleted);

  if (activeAbilities.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className={`w-8 h-8 ${theme.textMuted} mx-auto mb-2`} />
        <p className={`${theme.textMuted}`} style={fonts.body}>
          No abilities assigned to this app version yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {activeAbilities.map((ability: AppVersionAbility) => {
        const npmUrl = `https://www.npmjs.com/package/${ability.abilityPackageName}/v/${ability.abilityVersion}`;

        return (
          <div
            key={ability.abilityPackageName}
            className={`${theme.itemBg} border ${theme.mainCardBorder} rounded-lg p-4 hover:shadow-md transition-all`}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${theme.brandOrange}1A` }}
              >
                <Wrench className="w-5 h-5" style={{ color: theme.brandOrange }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className={`font-semibold ${theme.text} truncate`} style={fonts.heading}>
                    {ability.abilityPackageName}
                  </h4>
                  <a
                    href={npmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 hover:opacity-80 transition-opacity"
                    title="View on NPM"
                  >
                    <img src="/npm.png" alt="NPM" className="h-3" />
                  </a>
                </div>
                <p className={`text-xs ${theme.textMuted} mt-1`} style={fonts.body}>
                  Version {ability.abilityVersion}
                </p>
                <p className={`text-xs ${theme.textSubtle} mt-1`} style={fonts.body}>
                  Added: {new Date(ability.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
