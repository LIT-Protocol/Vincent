import { App, AppVersion, AppVersionTool } from '@/types/developer-dashboard/appTypes';
import { Activity, Code, Database, ExternalLink } from 'lucide-react';
import { getStatusColor } from '../../../utils/explorer/getStatusColor';
import { Logo } from '@/components/shared/ui/Logo';
import { useTheme } from '@/contexts/ThemeContext';

export function AppHeader({
  app,
  versions,
  versionTools,
}: {
  app: App;
  versions: AppVersion[];
  versionTools: AppVersionTool[];
}) {
  const { isDark, theme } = useTheme();

  return (
    <div className="relative group">
      <div
        className={`absolute inset-0 ${theme.glowColor} rounded-2xl blur-xl group-hover:${theme.glowOpacity} transition-all duration-700`}
      ></div>
      <div
        className={`relative ${theme.cardBg} backdrop-blur-xl border ${theme.cardBorder} rounded-2xl p-8 ${theme.cardHoverBorder} transition-all duration-500`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
          {/* Logo with subtle glow */}
          <div className="relative group/logo">
            <div
              className={`absolute inset-0 ${theme.glowOpacity} rounded-xl blur-2xl opacity-0 group-hover/logo:opacity-100 transition-opacity duration-500`}
            ></div>
            <div
              className={`relative w-20 h-20 rounded-xl overflow-hidden ${theme.iconBg} border ${theme.iconBorder} flex items-center justify-center backdrop-blur-sm`}
            >
              <Logo
                logo={app.logo}
                alt={`${app.name} logo`}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* App Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-3">
              <h1
                className={`text-3xl sm:text-4xl font-light ${theme.text} tracking-tight transition-colors duration-500`}
              >
                {app.name}
              </h1>
              <span
                className={`px-4 py-1.5 rounded-full text-xs font-medium ${isDark ? 'text-white/90' : 'text-black/90'} border ${getStatusColor(isDark, app.deploymentStatus)} backdrop-blur-sm transition-all duration-300`}
              >
                {app.deploymentStatus?.toUpperCase()}
              </span>
            </div>
            <p
              className={`${theme.textMuted} text-base leading-relaxed transition-colors duration-500`}
            >
              {app.description}
            </p>

            {/* Quick Stats */}
            <div className="flex items-center gap-8 mt-6">
              <div className="flex items-center gap-2 group/stat">
                <Activity
                  className={`w-4 h-4 ${theme.iconColorMuted} group-hover/stat:${theme.iconColor} transition-colors duration-300`}
                />
                <span
                  className={`text-sm ${theme.textSubtle} group-hover/stat:${theme.textMuted} transition-colors duration-300`}
                >
                  {app.deploymentStatus?.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2 group/stat">
                <Code
                  className={`w-4 h-4 ${theme.iconColorMuted} group-hover/stat:${theme.iconColor} transition-colors duration-300`}
                />
                <span
                  className={`text-sm ${theme.textSubtle} group-hover/stat:${theme.textMuted} transition-colors duration-300`}
                >
                  {versions.length} Versions
                </span>
              </div>
              <div className="flex items-center gap-2 group/stat">
                <Database
                  className={`w-4 h-4 ${theme.iconColorMuted} group-hover/stat:${theme.iconColor} transition-colors duration-300`}
                />
                <span
                  className={`text-sm ${theme.textSubtle} group-hover/stat:${theme.textMuted} transition-colors duration-300`}
                >
                  {versionTools.length} Tools
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {app.appUserUrl && (
            <a
              href={app.appUserUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`group px-6 py-3 rounded-full ${theme.buttonBg} ${theme.accentHover} font-medium flex items-center gap-2 hover:scale-105 transition-all duration-300 no-underline`}
              style={{
                color: isDark ? 'black' : 'white',
                textDecoration: 'none',
              }}
            >
              Launch App
              <ExternalLink className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
