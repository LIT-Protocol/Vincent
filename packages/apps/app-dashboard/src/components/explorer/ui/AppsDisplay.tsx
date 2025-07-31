import { Calendar, Search, Tag } from 'lucide-react';
import { App } from '@/types/developer-dashboard/appTypes';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/shared/ui/Logo';
import { getStatusColor } from '../../../utils/explorer/getStatusColor';
import { useTheme } from '@/providers/ThemeProvider';
import { explorerTheme } from '@/utils/explorer/theme';

export function AppsDisplay({ apps }: { apps: App[] }) {
  const { isDark } = useTheme();
  const theme = explorerTheme(isDark);
  const navigate = useNavigate();

  return (
    <div className="relative group">
      <div
        className={`absolute inset-0 ${theme.glowColor} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
      ></div>
      <div
        className={`relative ${theme.cardBg} backdrop-blur-xl border ${theme.cardBorder} rounded-2xl p-6 ${theme.cardHoverBorder} transition-all duration-500`}
      >
        {/* Table View */}
        <div className="space-y-4">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-medium text-gray-500">
            <div className="col-span-6">Application</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Version</div>
            <div className="col-span-2">Updated</div>
          </div>

          {/* Table Rows */}
          <div className="space-y-2">
            {apps.map((app) => (
              <div
                key={app.appId}
                className={`group/row grid grid-cols-12 gap-4 px-4 py-4 rounded-xl ${theme.itemBg} ${theme.itemHoverBg} border ${theme.itemBorder} ${theme.itemHoverBorder} cursor-pointer transition-all duration-300`}
                onClick={() => navigate(`/explorer/appId/${app.appId}`)}
              >
                {/* Application Info */}
                <div className="col-span-6 flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg overflow-hidden ${theme.iconBg} border ${theme.iconBorder} flex items-center justify-center flex-shrink-0`}
                  >
                    <Logo
                      logo={app.logo}
                      alt={`${app.name} logo`}
                      className="w-full h-full object-fill"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className={`font-medium ${theme.text} truncate`}>{app.name}</p>
                    <p className={`text-sm ${theme.textSubtle} truncate`}>
                      {app.description || 'No description'}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2 flex items-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(isDark, app.deploymentStatus)}`}
                  >
                    {app.deploymentStatus?.toUpperCase() || 'PROD'}
                  </span>
                </div>

                {/* Version */}
                <div className="col-span-2 flex items-center">
                  <div className="flex items-center gap-1">
                    <Tag className={`w-3 h-3 ${theme.iconColorMuted}`} />
                    <span className={`text-sm ${theme.text}`}>v{app.activeVersion}</span>
                  </div>
                </div>

                {/* Updated */}
                <div className="col-span-2 flex items-center">
                  <div className="flex items-center gap-1">
                    <Calendar className={`w-3 h-3 ${theme.iconColorMuted}`} />
                    <span className={`text-sm ${theme.textMuted}`}>
                      {new Date(app.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {apps.length === 0 && (
          <div className={`p-12 rounded-xl ${theme.itemBg} border ${theme.itemBorder} text-center`}>
            <Search
              className={`w-12 h-12 ${isDark ? 'text-white/20' : 'text-black/20'} mx-auto mb-4`}
            />
            <p className={`${theme.textSubtle} text-base mb-2`}>No applications found</p>
            <p className={`${theme.textSubtle} text-sm`}>
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
