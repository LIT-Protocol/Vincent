import { TabsContent } from '@/components/shared/ui/tabs';
import { App, AppVersion } from '@/types/developer-dashboard/appTypes';
import { FileText } from 'lucide-react';
import { Tag } from 'lucide-react';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';

interface AllAppVersionsProps {
  versions: AppVersion[];
  app: App;
}

export function AllAppVersions({ versions, app }: AllAppVersionsProps) {
  // Sort versions to show active version first, then others
  const sortedVersions = [...versions].sort((a, b) => {
    if (a.version === app.activeVersion) return -1;
    if (b.version === app.activeVersion) return 1;
    return 0;
  });

  return (
    <TabsContent value="all" className="mt-0">
      {/* All Versions View */}
      <div className="space-y-3">
        {sortedVersions.map((version) => (
          <div
            key={version.version}
            className={`group/version p-5 rounded-xl ${theme.itemBg} ${theme.itemHoverBg} border ${theme.cardBorder} ${theme.cardHoverBorder} transition-all duration-300`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <Tag className={`w-4 h-4 ${theme.textMuted}`} />
                  <span className={`text-lg font-medium ${theme.text}`} style={fonts.heading}>
                    v{version.version}
                  </span>
                </div>
                {version.version === app.activeVersion && (
                  <span
                    className="px-3 py-1 text-white text-xs rounded-full font-semibold"
                    style={{ ...fonts.heading, backgroundColor: theme.brandOrange }}
                  >
                    ACTIVE
                  </span>
                )}
              </div>
            </div>

            {version.changes && (
              <div className={`mt-4 p-4 rounded-lg ${theme.itemBg} border ${theme.cardBorder}`}>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className={`w-3 h-3 ${theme.textMuted}`} />
                  <span className={`text-xs font-medium ${theme.textMuted}`} style={fonts.heading}>
                    Changes
                  </span>
                </div>
                <p className={`text-sm ${theme.textMuted} leading-relaxed`} style={fonts.body}>
                  {version.changes}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </TabsContent>
  );
}
