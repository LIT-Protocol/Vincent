import { useNavigate } from 'react-router-dom';
import { App } from "@/types/developer-dashboard/appTypes";
import { useTheme } from '@/providers/ThemeProvider';
import { theme } from '../consent/ui/theme';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Logo } from '@/components/shared/ui/Logo';
import { ExternalLink } from 'lucide-react';

type PermittedAppsPageProps = {
    apps: App[];
}

export function PermittedAppsPage({ apps }: PermittedAppsPageProps) {
  const { isDark } = useTheme();
  const themeStyles = theme(isDark);
  const navigate = useNavigate();

  const handleAppClick = (appId: string) => {
    navigate(`/user/appId/${appId}`);
  };

  if (apps.length === 0) {
    return (
      <div className={`text-center py-12 ${themeStyles.textMuted}`}>
        <p>No permitted apps found</p>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-start pl-6">
      <div className="w-full" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        columnGap: '1.5rem',
        rowGap: '1.5rem',
        alignItems: 'start'
      }}>
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
                      <h3 className={`font-semibold ${themeStyles.text} truncate`}>
                        {app.name}
                      </h3>
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
                    <span className={`text-xs ${themeStyles.textSubtle}`}>
                      App ID: {app.appId}
                    </span>
                    {app.activeVersion && (
                      <span className={`px-2 py-1 rounded text-xs ${themeStyles.itemBg} ${themeStyles.textMuted}`}>
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