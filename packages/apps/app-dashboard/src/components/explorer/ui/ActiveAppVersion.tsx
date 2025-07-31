import { TabsContent } from '@/components/shared/ui/tabs';
import { Database, Layers, Tag } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { explorerTheme } from '@/utils/explorer/theme';
import { getVersionStatusColor } from '@/utils/explorer/getStatusColor';
import { App, AppVersion, AppVersionAbility } from '@/types/developer-dashboard/appTypes';
import { AbilityInfoWrapper } from '../wrappers/ui/AbilityInfoWrapper';

export function ActiveAppVersion({
  versions,
  versionAbilities,
  app,
}: {
  versions: AppVersion[];
  versionAbilities: AppVersionAbility[];
  app: App;
}) {
  const { isDark } = useTheme();
  const theme = explorerTheme(isDark);

  const activeVersion = versions.find((v) => v.version === app.activeVersion);

  const activeVersionAbilities = versionAbilities.filter(
    (ability) => ability.appVersion === app.activeVersion,
  );

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

          {/* Version Abilities*/}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Layers className={`w-4 h-4 ${theme.iconColorMuted}`} />
              <span className={`text-sm font-light ${theme.textMuted}`}>
                Integrated Abilities ({activeVersionAbilities.length})
              </span>
            </div>

            {activeVersionAbilities.length > 0 ? (
              <div className="space-y-3">
                {activeVersionAbilities.map((ability) => {
                  return (
                    <AbilityInfoWrapper
                      appVersionAbility={ability}
                      abilityPackageName={ability.abilityPackageName}
                    />
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
                  No abilities configured for this version
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
