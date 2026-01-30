import { Helmet } from 'react-helmet-async';
import { App, AppVersionAbility } from '@/types/developer-dashboard/appTypes';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { AppHeader } from '../ui/AppHeader';
import { AppInfo } from '../ui/AppInfo';
import { AbilityInfoView } from '../ui/AbilityInfoView';
import { theme, fonts } from '@/lib/themeClasses';
import { ExplorerNav } from '../ui/ExplorerNav';

interface AppInfoViewProps {
  app: App;
  versionAbilities: AppVersionAbility[];
}

export function AppInfoView({ app, versionAbilities }: AppInfoViewProps) {
  // Fetch full ability details for each app version ability
  const abilityPackageNames = versionAbilities.map((ava) => ava.abilityPackageName);
  const { data: abilities = [] } = vincentApiClient.useListAllAbilitiesQuery();

  // Filter abilities to only those in the app version
  const appAbilities = abilities.filter((ability) =>
    abilityPackageNames.includes(ability.packageName),
  );

  return (
    <>
      <Helmet>
        <title>{app.name} | Vincent Explorer</title>
        <meta name="description" content={app.description} />
      </Helmet>

      <div className="w-full relative">
        <ExplorerNav />

        {/* Content wrapper with top padding for fixed navbar */}
        <div className="pt-20 px-4 max-w-7xl mx-auto">
          {/* App Header */}
          <div className="mb-6">
            <AppHeader app={app} />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Abilities */}
            <div className="lg:col-span-2">
              <div className="group relative">
                <div
                  className={`relative bg-white dark:bg-gray-950 border ${theme.cardBorder} rounded-xl md:rounded-2xl p-4 sm:p-6 ${theme.cardHoverBorder} transition-all duration-500`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <h2
                      className={`text-base sm:text-lg font-semibold ${theme.text}`}
                      style={fonts.heading}
                    >
                      Capabilities
                    </h2>
                    <span
                      className="text-xs px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: `${theme.brandOrange}20`,
                        color: theme.brandOrange,
                      }}
                    >
                      {versionAbilities.length}
                    </span>
                  </div>

                  {versionAbilities.length > 0 ? (
                    <div className="space-y-3">
                      {versionAbilities.map((appVersionAbility) => {
                        const ability = appAbilities.find(
                          (a) => a.packageName === appVersionAbility.abilityPackageName,
                        );
                        if (!ability) return null;
                        return (
                          <AbilityInfoView
                            key={appVersionAbility.abilityPackageName}
                            appVersionAbility={appVersionAbility}
                            ability={ability}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      className={`p-8 rounded-xl ${theme.itemBg} border ${theme.cardBorder} text-center`}
                    >
                      <p className={`${theme.textMuted} text-sm`} style={fonts.body}>
                        No capabilities available for this app
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - App Info */}
            <div className="lg:col-span-1">
              <AppInfo app={app} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
