import { TabsContent } from '@/components/shared/ui/tabs';
import { Database, Layers } from 'lucide-react';
import { App, AppVersion, AppVersionAbility } from '@/types/developer-dashboard/appTypes';
import { AbilityInfoWrapper } from '../wrappers/ui/AbilityInfoWrapper';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';

export function ActiveAppVersion({
  versions,
  versionAbilities,
  app,
}: {
  versions: AppVersion[];
  versionAbilities: AppVersionAbility[];
  app: App;
}) {
  const activeVersion = versions.find((v) => v.version === app.activeVersion);

  const activeVersionAbilities = versionAbilities.filter(
    (ability) => ability.appVersion === app.activeVersion,
  );

  return (
    <TabsContent value="active" className="mt-0">
      {/* Active Version View */}
      {activeVersion ? (
        <div className="space-y-6">
          {/* Version Abilities*/}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Layers className={`w-4 h-4 ${theme.textMuted}`} />
              <span className={`text-sm font-medium ${theme.textMuted}`} style={fonts.heading}>
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
                className={`p-8 rounded-xl ${theme.itemBg} border ${theme.cardBorder} text-center`}
              >
                <Database className={`w-10 h-10 ${theme.textMuted} mx-auto mb-3`} />
                <p className={`${theme.textMuted} text-sm`} style={fonts.body}>
                  No abilities configured for this version
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={`p-8 rounded-xl ${theme.itemBg} border ${theme.cardBorder} text-center`}>
          <p className={`${theme.textMuted} text-sm`} style={fonts.body}>
            No active version found
          </p>
        </div>
      )}
    </TabsContent>
  );
}
