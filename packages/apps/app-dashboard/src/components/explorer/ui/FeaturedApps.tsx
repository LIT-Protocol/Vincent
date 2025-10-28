import { App } from '@/types/developer-dashboard/appTypes';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/shared/ui/Logo';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';
import { useCallback } from 'react';

interface FeaturedAppCardProps {
  app: App;
  handleAppClick: (appId: number) => void;
}

interface FeaturedAppsProps {
  apps: App[];
  onNavigate?: (path: string) => void;
}

function FeaturedAppCard({ app, handleAppClick }: FeaturedAppCardProps) {
  return (
    <div
      onClick={() => handleAppClick(app.appId)}
      className="group relative overflow-hidden rounded-xl md:rounded-2xl border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all duration-300 cursor-pointer h-[300px] md:h-[400px]"
    >
      {/* Image at the top with fade effect */}
      <div className="absolute inset-0 z-0">
        {/* Gradient overlay that fades from solid color to transparent */}
        <div
          className="absolute inset-0 z-10"
          style={{
            background: `linear-gradient(to top, ${'rgba(255, 66, 5, 0.85)'} 0%, ${'rgba(255, 66, 5, 0.7)'} 15%, ${'rgba(255, 66, 5, 0.4)'} 30%, transparent 50%, transparent 100%)`,
          }}
        />

        {/* App logo/image */}
        <div className="absolute inset-0 flex items-start justify-center pt-12 opacity-60 group-hover:opacity-80 transition-opacity duration-300">
          <div className="w-48 h-48 rounded-2xl overflow-hidden">
            <Logo logo={app.logo} alt={`${app.name} logo`} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Content at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className={`text-2xl font-semibold ${theme.text} mb-2`} style={fonts.heading}>
              {app.name}
            </h3>
            <p className={`${theme.text} text-sm line-clamp-2 opacity-80`} style={fonts.body}>
              {app.description || 'No description available'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${theme.bg} ${theme.text} backdrop-blur-sm ${theme.cardBorder} border`}
            style={fonts.heading}
          >
            v{app.activeVersion}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${theme.bg} ${theme.text} backdrop-blur-sm ${theme.cardBorder} border`}
            style={fonts.heading}
          >
            {app.deploymentStatus === 'prod'
              ? 'LIVE'
              : app.deploymentStatus === 'test'
                ? 'BETA'
                : app.deploymentStatus?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 z-30" />
    </div>
  );
}

export function FeaturedApps({ apps, onNavigate }: FeaturedAppsProps) {
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

  const featuredAppIdsString = import.meta.env.VITE_FEATURED_APP_IDS;
  const featuredAppIds = featuredAppIdsString
    ? featuredAppIdsString.split(',').map((id: string) => id.trim())
    : [];

  // Filter apps to only include featured ones, in the order specified
  const featuredApps = featuredAppIds
    .map((appId: string) => {
      const found = apps.find((app: App) => String(app.appId) === String(appId));
      return found;
    })
    .filter((app: App | undefined): app is App => app !== undefined);

  if (featuredApps.length === 0) {
    return null;
  }

  // Determine grid layout based on number of apps
  const getGridClasses = (count: number) => {
    switch (count) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 md:grid-cols-2';
      case 3:
        return 'grid-cols-1 md:grid-cols-3';
      case 4:
        return 'grid-cols-1 md:grid-cols-2';
      default:
        return 'grid-cols-1 md:grid-cols-2';
    }
  };

  // For 5 apps, split into two rows (2 apps in first row, 3 in second)
  if (featuredApps.length === 5) {
    const firstRowApps = featuredApps.slice(0, 2);
    const secondRowApps = featuredApps.slice(2, 5);

    return (
      <div className="mb-8 md:mb-12">
        <h2
          className={`text-2xl md:text-3xl font-semibold ${theme.text} mb-4 md:mb-6`}
          style={fonts.heading}
        >
          Featured Apps
        </h2>
        <div className="space-y-6">
          {/* First row: 2 apps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {firstRowApps.map((app: App) => (
              <FeaturedAppCard key={app.appId} app={app} handleAppClick={handleAppClick} />
            ))}
          </div>
          {/* Second row: 3 apps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {secondRowApps.map((app: App) => (
              <FeaturedAppCard key={app.appId} app={app} handleAppClick={handleAppClick} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 md:mb-12">
      <h2
        className={`text-2xl md:text-3xl font-semibold ${theme.text} mb-4 md:mb-6`}
        style={fonts.heading}
      >
        Featured Apps
      </h2>
      <div className={`grid ${getGridClasses(featuredApps.length)} gap-6`}>
        {featuredApps.map((app: App) => (
          <FeaturedAppCard key={app.appId} app={app} handleAppClick={handleAppClick} />
        ))}
      </div>
    </div>
  );
}
