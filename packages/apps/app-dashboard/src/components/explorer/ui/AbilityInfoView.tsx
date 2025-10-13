import { ChevronDown, ChevronUp, Wrench } from 'lucide-react';
import { AppVersionAbility, Ability } from '@/types/developer-dashboard/appTypes';
import { AbilityVersionPoliciesWrapper } from '../wrappers/ui/AbilityVersionPolicyWrapper';
import { Logo } from '@/components/shared/ui/Logo';
import { useState } from 'react';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';

interface AbilityInfoViewProps {
  appVersionAbility: AppVersionAbility;
  ability: Ability;
}

export function AbilityInfoView({ appVersionAbility, ability }: AbilityInfoViewProps) {
  const [expandedAbility, setExpandedAbility] = useState<string | null>(null);

  const handleAbilityClick = (abilityPackageName: string) => {
    setExpandedAbility(expandedAbility === abilityPackageName ? null : abilityPackageName);
  };

  return (
    <div key={ability.packageName} className="space-y-3">
      {/* Clickable Ability Card */}
      <div
        className={`group/ability p-5 rounded-xl ${theme.itemBg} border ${theme.cardBorder} ${theme.cardHoverBorder} cursor-pointer transition-all duration-300`}
        onClick={() => handleAbilityClick(ability.packageName)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-10 h-10 rounded-lg ${theme.iconBg} border ${theme.iconBorder} ${theme.cardHoverBorder} transition-all duration-300 flex items-center justify-center overflow-hidden`}
            >
              {ability.logo ? (
                <Logo
                  logo={ability.logo}
                  alt={`${ability.title || ability.packageName} logo`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Wrench className={`w-4 h-4 ${theme.textMuted}`} />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className={`text-base font-medium ${theme.text}`} style={fonts.heading}>
                  {ability.title || ability.packageName}
                </p>
                <a
                  href={`https://www.npmjs.com/package/${ability.packageName}/v/${ability.activeVersion}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-75 transition-opacity"
                  title={`View ${ability.packageName} v${ability.activeVersion} on npm`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <img src="/npm.png" alt="npm" className="w-full h-full object-contain" />
                  </div>
                </a>
              </div>
              {ability.description && (
                <p className={`text-sm ${theme.textMuted} mt-1 leading-relaxed`} style={fonts.body}>
                  {ability.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {appVersionAbility.hiddenSupportedPolicies &&
              appVersionAbility.hiddenSupportedPolicies.length > 0 && (
                <span
                  className={`px-3 py-1 ${theme.itemBg} ${theme.textMuted} text-xs rounded-full border ${theme.cardBorder}`}
                  style={fonts.heading}
                >
                  {appVersionAbility.hiddenSupportedPolicies.length} Hidden Policies
                </span>
              )}
            <span
              className={`text-xs ${theme.textMuted} hover:${theme.text} ${theme.itemBg} ${theme.itemHoverBg} font-medium flex items-center gap-1 transition-all duration-300 px-2 py-1 rounded-md`}
              style={fonts.heading}
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
          className="ml-4 pl-4 border-l-2 animate-fadeIn"
          style={{ borderColor: theme.brandOrange }}
        >
          {appVersionAbility.abilityVersion ? (
            <AbilityVersionPoliciesWrapper appAbilityVersion={appVersionAbility} />
          ) : (
            <p className={`text-sm ${theme.textMuted}`} style={fonts.body}>
              No policy information available for this ability.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
