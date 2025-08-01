import { useNavigate } from 'react-router-dom';
import { App } from '@/types/developer-dashboard/appTypes';
import { useTheme } from '@/providers/ThemeProvider';
import { theme } from '../connect/ui/theme';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Logo } from '@/components/shared/ui/Logo';
import { ExternalLink, Package } from 'lucide-react';

type PermittedAppsPageProps = {
  apps: App[];
};

export function PermittedAppsPage({ apps }: PermittedAppsPageProps) {
  const { isDark } = useTheme();
  const themeStyles = theme(isDark);
  const navigate = useNavigate();

  const handleAppClick = (appId: string) => {
    navigate(`/user/appId/${appId}`);
  };

  if (apps.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="text-center max-w-md mx-auto px-6">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${themeStyles.itemBg} ${themeStyles.cardBorder} border mb-6`}
          >
            <Package className={`w-8 h-8 ${themeStyles.textMuted}`} />
          </div>
          <h3 className={`text-xl font-semibold mb-2 ${themeStyles.text}`}>
            No applications found
          </h3>
          <p className={`text-sm ${themeStyles.textMuted} leading-relaxed`}>
            You haven't granted permissions to any applications yet. Once you authorize apps,
            they'll appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-start px-3 sm:px-6">
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((app) => (
          <Card
            key={app.appId}
            className={`py-0 gap-0 backdrop-blur-xl ${themeStyles.cardBg} border ${themeStyles.cardBorder} ${themeStyles.cardHoverBorder} cursor-pointer transition-all duration-200 hover:shadow-lg`}
            onClick={() => handleAppClick(app.appId.toString())}
            style={{ height: 'fit-content' }}
          >
            <CardContent className="p-3">
              <div className="flex flex-col gap-2">
                {/* Logo and Title Row */}
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <Logo
                      logo={app.logo}
                      alt={`${app.name} logo`}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold ${themeStyles.text} truncate`}>{app.name}</h3>
                  </div>
                  <ExternalLink className={`w-4 h-4 ${themeStyles.textSubtle} flex-shrink-0`} />
                </div>

                {/* Description */}
                {app.description && (
                  <p className={`text-sm ${themeStyles.textMuted} line-clamp-2`}>
                    {app.description}
                  </p>
                )}

                {/* App ID and Version */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${themeStyles.textSubtle}`}>App ID: {app.appId}</span>
                  {app.activeVersion && (
                    <span
                      className={`px-2 py-1 rounded text-xs ${themeStyles.itemBg} ${themeStyles.textMuted}`}
                    >
                      v{app.activeVersion}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
