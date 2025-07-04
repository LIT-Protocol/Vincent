import { TabsContent } from '@/components/ui/tabs';
import { Database, Layers, Tag } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { getVersionStatusColor } from '@/utils/explorer/getStatusColor';
import { App, AppVersion, AppVersionTool } from '@/types/developer-dashboard/appTypes';
import { ToolInfoWrapper } from '../wrappers/ui/ToolInfoWrapper';

export function ActiveAppVersion({
  versions,
  versionTools,
  app,
}: {
  versions: AppVersion[];
  versionTools: AppVersionTool[];
  app: App;
}) {
  const { isDark, theme } = useTheme();

  const activeVersion = versions.find((v) => v.version === app.activeVersion);

  const activeVersionTools = versionTools.filter((tool) => tool.appVersion === app.activeVersion);

  return (
    <TabsContent value="active" className="mt-0">
      {/* Active Version View */}
      {activeVersion ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Tag className={`w-4 h-4 ${theme.iconColorMuted}`} />
              <span className={`text-2xl font-light ${theme.text}`}>v{activeVersion.version}</span>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'} border ${getVersionStatusColor(isDark, activeVersion.enabled)} backdrop-blur-sm`}
            >
              {activeVersion.enabled ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>

          {/* Version Tools */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Layers className={`w-4 h-4 ${theme.iconColorMuted}`} />
              <span className={`text-sm font-light ${theme.textMuted}`}>
                Integrated Tools ({activeVersionTools.length})
              </span>
            </div>

            {activeVersionTools.length > 0 ? (
              <div className="space-y-3">
                {activeVersionTools.map((tool) => {
                  return (
                    <ToolInfoWrapper appVersionTool={tool} toolPackageName={tool.toolPackageName} />
                  );
                })}
              </div>
            ) : (
              <div
                className={`p-8 rounded-xl ${theme.itemBg} border ${theme.itemBorder} text-center`}
              >
                <Database
                  className={`w-10 h-10 ${isDark ? 'text-white/20' : 'text-black/20'} mx-auto mb-3`}
                />
                <p className={`${theme.textSubtle} text-sm`}>
                  No tools configured for this version
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center">
          <p className={theme.textSubtle}>No active version found</p>
        </div>
      )}
    </TabsContent>
  );
}
