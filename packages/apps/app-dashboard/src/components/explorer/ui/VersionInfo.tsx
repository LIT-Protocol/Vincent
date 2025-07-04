import { AllAppVersions } from './AllAppVersions';
import { Tabs, TabsTrigger, TabsList } from '@/components/ui/tabs';
import { GitBranch } from 'lucide-react';
import { App, AppVersion, AppVersionTool } from '@/types/developer-dashboard/appTypes';
import { useTheme } from '@/contexts/ThemeContext';
import { ActiveAppVersion } from './ActiveAppVersion';

interface VersionInfoProps {
  app: App;
  versions: AppVersion[];
  versionTools: AppVersionTool[];
}

export function VersionInfo({ app, versions, versionTools }: VersionInfoProps) {
  const { theme } = useTheme();

  return (
    versions.length > 0 && (
      <div className="group relative">
        <div
          className={`absolute inset-0 ${theme.glowColor} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
        ></div>
        <div
          className={`relative ${theme.cardBg} backdrop-blur-xl border ${theme.cardBorder} rounded-2xl p-6 ${theme.cardHoverBorder} transition-all duration-500`}
        >
          <Tabs defaultValue="active" className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 w-full">
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className={`p-2 rounded-lg ${theme.iconBg} border ${theme.iconBorder}`}>
                  <GitBranch className={`w-5 h-5 ${theme.iconColor}`} />
                </div>
                <h2 className={`text-lg font-light ${theme.text} transition-colors duration-500`}>
                  Version Information
                </h2>
              </div>

              <div className="flex-shrink-0">
                <TabsList
                  className={`${theme.iconBg} border ${theme.iconBorder} rounded-full p-1 bg-transparent h-auto`}
                >
                  <TabsTrigger
                    value="active"
                    className={`${theme.textSubtle} hover:${theme.text} data-[state=active]:${theme.text} data-[state=active]:${theme.cardBg} rounded-full px-6 py-2 text-sm font-medium border-0 bg-transparent h-auto transition-all duration-300 focus:outline-none`}
                  >
                    Active Version
                  </TabsTrigger>
                  <TabsTrigger
                    value="all"
                    className={`${theme.textSubtle} hover:${theme.text} data-[state=active]:${theme.text} data-[state=active]:${theme.cardBg} rounded-full px-6 py-2 text-sm font-medium border-0 bg-transparent h-auto transition-all duration-300 focus:outline-none`}
                  >
                    All Versions
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <ActiveAppVersion versions={versions} versionTools={versionTools} app={app} />
            <AllAppVersions versions={versions} app={app} />
          </Tabs>
        </div>
      </div>
    )
  );
}
