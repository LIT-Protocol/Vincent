import { App, AppVersion, AppVersionAbility } from '@/types/developer-dashboard/appTypes';
import { AppInfo } from '../ui/AppInfo';
import { AppHeader } from '../ui/AppHeader';
import { ExplorerNav } from '../ui/ExplorerNav';
import { VersionInfo } from '../ui/VersionInfo';
import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';
import { ArrowLeft } from 'lucide-react';

interface AppInfoViewProps {
  app: App;
  versions: AppVersion[];
  versionAbilities: AppVersionAbility[];
}

export function AppInfoView({ app, versions, versionAbilities }: AppInfoViewProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Filter out deleted AppVersionAbilities
  const activeVersionAbilities = versionAbilities.filter((ability) => !ability.isDeleted);

  // Fade in effect when component mounts
  useEffect(() => {
    const fromTransition = location.state?.fromTransition;
    if (fromTransition) {
      setTimeout(() => setShowContent(true), 100);
    } else {
      setShowContent(true);
    }
  }, [location.state]);

  // Transition helper for navigation
  const handleNavigateWithTransition = useCallback(
    (path: string) => {
      setIsTransitioning(true);
      setTimeout(() => {
        navigate(path, { state: { fromTransition: true } });
      }, 500);
    },
    [navigate],
  );

  return (
    <div className="w-full relative z-10">
      {/* Navigation */}
      <ExplorerNav onNavigate={handleNavigateWithTransition} />

      {/* Content with fade transition */}
      <div
        className={`transition-opacity duration-500 ${showContent && !isTransitioning ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Back Button and Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-20 sm:pt-24 pb-4 sm:pb-6">
          {/* Back Button */}
          <button
            onClick={() => handleNavigateWithTransition('/explorer/apps')}
            className={`inline-flex items-center gap-2 mb-4 sm:mb-6 px-3 py-2 rounded-lg ${theme.textMuted} hover:${theme.text} ${theme.itemBg} ${theme.itemHoverBg} transition-all duration-300`}
            style={fonts.heading}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Apps</span>
          </button>

          <AppHeader app={app} />
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-8 sm:pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Left Sidebar - App Info */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24">
                <AppInfo app={app} />
              </div>
            </div>

            {/* Main Content - Version Information */}
            <div className="lg:col-span-2">
              <VersionInfo
                versions={versions}
                versionAbilities={activeVersionAbilities}
                app={app}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
