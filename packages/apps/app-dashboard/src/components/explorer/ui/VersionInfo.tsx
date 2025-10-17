import { AllAppVersions } from './AllAppVersions';
import { Tabs, TabsTrigger, TabsList } from '@/components/shared/ui/tabs';
import { App, AppVersion, AppVersionAbility } from '@/types/developer-dashboard/appTypes';
import { ActiveAppVersion } from './ActiveAppVersion';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';

interface VersionInfoProps {
  app: App;
  versions: AppVersion[];
  versionAbilities: AppVersionAbility[];
}

export function VersionInfo({ app, versions, versionAbilities }: VersionInfoProps) {
  return (
    versions.length > 0 && (
      <div className="group relative">
        <div
          className={`relative bg-white dark:bg-gray-950 border ${theme.cardBorder} rounded-xl md:rounded-2xl p-4 sm:p-6 ${theme.cardHoverBorder} transition-all duration-500`}
        >
          <Tabs defaultValue="active" className="w-full !items-start">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <h2
                className={`text-base sm:text-lg font-semibold ${theme.text}`}
                style={fonts.heading}
              >
                Version Information
              </h2>
            </div>

            <div className="mb-4 sm:mb-6">
              <TabsList
                className={`${theme.itemBg} border ${theme.cardBorder} rounded-full p-1 h-auto w-auto`}
              >
                <TabsTrigger
                  value="active"
                  className={`${theme.textMuted} hover:${theme.text} data-[state=active]:${theme.text} data-[state=active]:!bg-white data-[state=active]:dark:!bg-gray-800 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:${theme.cardBorder} rounded-full px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 text-xs sm:text-sm font-medium border-0 bg-transparent h-auto transition-all duration-300 focus:outline-none flex-1 sm:flex-initial`}
                  style={fonts.heading}
                >
                  Active Version
                </TabsTrigger>
                <TabsTrigger
                  value="all"
                  className={`${theme.textMuted} hover:${theme.text} data-[state=active]:${theme.text} data-[state=active]:!bg-white data-[state=active]:dark:!bg-gray-800 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:${theme.cardBorder} rounded-full px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 text-xs sm:text-sm font-medium border-0 bg-transparent h-auto transition-all duration-300 focus:outline-none flex-1 sm:flex-initial`}
                  style={fonts.heading}
                >
                  All Versions
                </TabsTrigger>
              </TabsList>
            </div>

            <ActiveAppVersion versions={versions} versionAbilities={versionAbilities} app={app} />
            <AllAppVersions versions={versions} app={app} />
          </Tabs>
        </div>
      </div>
    )
  );
}
