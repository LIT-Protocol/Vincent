import { App } from '@/types/developer-dashboard/appTypes';
import { Button } from '@/components/ui/button';
import { ExternalLink, Calendar } from 'lucide-react';
import { Logo } from '@/components/shared/ui/Logo';
import { ExplorerTheme } from '@/utils/explorer/theme';
import { useNavigate } from 'react-router';

interface AppCardProps {
  app: App;
  theme: ExplorerTheme;
}

export const AppCard = ({ app, theme }: AppCardProps) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/explorer/appId/${app.appId}`)}
      className={`group/card relative ${theme.cardBg} backdrop-blur-xl border ${theme.cardBorder} rounded-xl p-4 cursor-pointer transition-all duration-300 ${theme.cardHoverBorder} ${theme.itemHoverBg}`}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          {/* Logo with enhanced styling */}
          <div
            className={`relative w-12 h-12 rounded-xl overflow-hidden ${theme.iconBg} border ${theme.iconBorder} flex items-center justify-center backdrop-blur-sm`}
          >
            <Logo logo={app.logo} alt={`${app.name} logo`} className="w-full h-full object-cover" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3
                className={`font-light text-base ${theme.text} truncate transition-colors duration-300`}
              >
                {app.name}
              </h3>
              {app.deploymentStatus && (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${theme.textMuted} border ${theme.itemBorder} backdrop-blur-sm`}
                >
                  {app.deploymentStatus.toUpperCase()}
                </span>
              )}
            </div>
            <div
              className={`flex items-center gap-4 text-xs ${theme.textSubtle} transition-colors duration-300`}
            >
              <div className="flex items-center gap-1">
                <span>v{app.activeVersion}</span>
              </div>
              {app.updatedAt && (
                <div className="flex items-center gap-1">
                  <Calendar className={`w-3 h-3 ${theme.iconColorMuted}`} />
                  <span>{new Date(app.updatedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {app.appUserUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                window.open(app.appUserUrl, '_blank');
              }}
              className={`shrink-0 ${theme.iconColor} hover:${theme.text} ${theme.buttonHover} transition-all duration-300 opacity-0 group-hover/card:opacity-100`}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/explorer/appId/${app.appId}`)}
            className={`${theme.accentBg} ${theme.accentHover} border-0 transition-all duration-300 hover:scale-105`}
          >
            Connect
          </Button>
        </div>
      </div>
    </div>
  );
};
