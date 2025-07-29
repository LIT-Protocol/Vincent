import { TabsContent } from '@/components/shared/ui/tabs';
import { useTheme } from '@/providers/ThemeProvider';
import { explorerTheme } from '@/utils/explorer/theme';
import { App, AppVersion } from '@/types/developer-dashboard/appTypes';
import { getVersionStatusColor } from '@/utils/explorer/getStatusColor';
import { FileText } from 'lucide-react';
import { Tag } from 'lucide-react';

interface AllAppVersionsProps {
  versions: AppVersion[];
  app: App;
}

export function AllAppVersions({ versions, app }: AllAppVersionsProps) {
  const { isDark } = useTheme();
  const theme = explorerTheme(isDark);

  return (
    <TabsContent value="all" className="mt-0">
      {/* All Versions View */}
      <div className="space-y-3">
        {versions.map((version) => (
          <div
            key={version.version}
            className={`group/version p-5 rounded-xl ${theme.itemBg} ${theme.itemHoverBg} border ${theme.itemBorder} ${theme.itemHoverBorder} transition-all duration-300`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <Tag className={`w-4 h-4 ${theme.iconColorMuted}`} />
                  <span
                    className={`text-lg font-light ${isDark ? 'text-white/90' : 'text-black/90'}`}
                  >
                    v{version.version}
                  </span>
                </div>
                {version.version === app.activeVersion && (
                  <span
                    className={`px-3 py-1 ${isDark ? 'bg-white/10 text-white/80 border-white/20' : 'bg-black/10 text-black/80 border-black/20'} text-xs rounded-full border`}
                  >
                    ACTIVE
                  </span>
                )}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'text-white/70' : 'text-black/70'} border ${getVersionStatusColor(isDark, version.enabled)} backdrop-blur-sm`}
                >
                  {version.enabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
            </div>

            {version.changes && (
              <div className={`mt-4 p-4 rounded-lg ${theme.itemBg} border ${theme.itemBorder}`}>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className={`w-3 h-3 ${theme.iconColorMuted}`} />
                  <span className={`text-xs font-medium ${theme.textSubtle}`}>Changes</span>
                </div>
                <p className={`text-sm ${theme.textMuted} leading-relaxed`}>{version.changes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </TabsContent>
  );
}
