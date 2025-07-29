import { ChevronDown, ChevronUp, Wrench } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { explorerTheme } from '@/utils/explorer/theme';
import { AppVersionAbility, Ability } from '@/types/developer-dashboard/appTypes';
import { AbilityVersionPoliciesWrapper } from '../wrappers/ui/AbilityVersionPolicyWrapper';
import { useState } from 'react';

interface AbilityInfoViewProps {
  appVersionAbility: AppVersionAbility;
  ability: Ability;
}

export function AbilityInfoView({ appVersionAbility, ability }: AbilityInfoViewProps) {
  const { isDark } = useTheme();
  const theme = explorerTheme(isDark);
  const [expandedAbility, setExpandedAbility] = useState<string | null>(null);

  const handleAbilityClick = (abilityPackageName: string) => {
    setExpandedAbility(expandedAbility === abilityPackageName ? null : abilityPackageName);
  };

  return (
    <div key={ability.packageName} className="space-y-3">
      {/* Clickable Ability Card */}
      <div
        className={`group/ability p-5 rounded-xl ${theme.itemBg} ${theme.itemHoverBg} border ${theme.itemBorder} ${theme.itemHoverBorder} cursor-pointer transition-all duration-300`}
        onClick={() => handleAbilityClick(ability.packageName)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`p-2 rounded-lg ${theme.iconBg} border ${theme.itemBorder} group-hover/ability:${theme.itemHoverBorder} transition-all duration-300`}
            >
              <Wrench className={`w-4 h-4 ${theme.iconColorMuted}`} />
            </div>
            <div className="flex-1">
              <p className={`text-base font-light ${isDark ? 'text-white/90' : 'text-black/90'}`}>
                {ability.title || ability.packageName}
              </p>
              <p className={`text-xs ${theme.textSubtle}`}>
                {ability.packageName} v{ability.activeVersion}
              </p>
              {ability.description && (
                <p className={`text-sm ${theme.textMuted} mt-1 leading-relaxed`}>
                  {ability.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {appVersionAbility.hiddenSupportedPolicies &&
              appVersionAbility.hiddenSupportedPolicies.length > 0 && (
                <span
                  className={`px-3 py-1 ${theme.iconBg} ${isDark ? 'text-white/60' : 'text-black/60'} text-xs rounded-full border ${theme.iconBorder}`}
                >
                  {appVersionAbility.hiddenSupportedPolicies.length} Hidden Policies
                </span>
              )}
            <span
              className={`text-xs ${isDark ? 'text-white/70 hover:text-white bg-white/5 hover:bg-white/10' : 'text-black/70 hover:text-black bg-black/5 hover:bg-black/10'} font-medium flex items-center gap-1 transition-all duration-300 px-2 py-1 rounded-md`}
            >
              {expandedAbility === appVersionAbility.abilityPackageName ? (
                <>
                  Hide policies <ChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  Show policies <ChevronDown className="w-3 h-3" />
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Ability Policies - Show below the ability card when expanded */}
      {expandedAbility === appVersionAbility.abilityPackageName && (
        <div
          className={`ml-4 pl-4 border-l-2 ${isDark ? 'border-blue-400/30' : 'border-blue-600/30'} animate-fadeIn`}
        >
          {appVersionAbility.abilityVersion ? (
            <AbilityVersionPoliciesWrapper appAbilityVersion={appVersionAbility} />
          ) : (
            <p className={`text-sm ${theme.textMuted}`}>
              No policy information available for this ability.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
