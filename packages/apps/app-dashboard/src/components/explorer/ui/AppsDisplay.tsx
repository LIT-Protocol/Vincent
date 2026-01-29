import { Search } from 'lucide-react';
import { App } from '@/types/developer-dashboard/appTypes';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/shared/ui/Logo';
import { theme, fonts } from '@/lib/themeClasses';
import { useCallback } from 'react';

interface AppsDisplayProps {
  apps: App[];
  onNavigate?: (path: string) => void;
}

export function AppsDisplay({ apps, onNavigate }: AppsDisplayProps) {
  const navigate = useNavigate();

  const handleAppClick = useCallback(
    (appId: number) => {
      const path = `/explorer/appId/${appId}`;
      if (onNavigate) {
        onNavigate(path);
      } else {
        navigate(path);
      }
    },
    [navigate, onNavigate],
  );

  const getDisplayStatus = (status: string | undefined): string => {
    const normalizedStatus = status?.toLowerCase() || 'prod';
    switch (normalizedStatus) {
      case 'test':
        return 'BETA';
      case 'prod':
        return 'LIVE';
      default:
        return normalizedStatus.toUpperCase();
    }
  };

  return (
    <div className="relative">
      {apps.length === 0 ? (
        <div className={`p-12 rounded-xl ${theme.itemBg} border ${theme.cardBorder} text-center`}>
          <Search className={`w-12 h-12 ${theme.textMuted} mx-auto mb-4`} />
          <p className={`${theme.textMuted} text-base mb-2`} style={fonts.heading}>
            No applications found
          </p>
          <p className={`${theme.textSubtle} text-sm`} style={fonts.body}>
            Try adjusting your search or filter criteria
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {apps.map((app) => (
            <div
              key={app.appId}
              onClick={() => handleAppClick(app.appId)}
              className={`group relative rounded-xl md:rounded-2xl border ${theme.cardBorder} ${theme.cardHoverBorder} overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg bg-white dark:bg-gray-950`}
            >
              {/* App Logo/Image Header */}
              <div
                className={`relative h-24 md:h-32 ${theme.iconBg} border-b ${theme.cardBorder} flex items-center justify-center p-4 md:p-6`}
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg md:rounded-xl overflow-hidden">
                  <Logo
                    logo={app.logo}
                    alt={`${app.name} logo`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Card Content */}
              <div className="p-3 md:p-4">
                {/* App Name */}
                <h3
                  className={`text-base md:text-lg font-semibold ${theme.text} mb-1 md:mb-1.5 line-clamp-1`}
                  style={fonts.heading}
                >
                  {app.name}
                </h3>

                {/* Description */}
                <p
                  className={`text-xs md:text-sm ${theme.textMuted} mb-2 md:mb-3 line-clamp-2 min-h-[2rem] md:min-h-[2.5rem]`}
                  style={fonts.body}
                >
                  {app.description || 'No description available'}
                </p>

                {/* Metadata */}
                <div className="flex items-center justify-between gap-2 pt-2 md:pt-3 border-t border-gray-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-medium text-white"
                      style={{ ...fonts.heading, backgroundColor: theme.brandOrange }}
                    >
                      {getDisplayStatus(app.deploymentStatus)}
                    </span>
                    <span className={`text-xs ${theme.textMuted}`} style={fonts.body}>
                      v{app.activeVersion}
                    </span>
                  </div>
                  <span className={`text-xs ${theme.textSubtle}`} style={fonts.body}>
                    {new Date(app.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
