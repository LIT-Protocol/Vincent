import { App, AppVersion, AppVersionTool } from '@/types/developer-dashboard/appTypes';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { AppInfo } from '../ui/AppInfo';
import { AppHeader } from '../ui/AppHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { VersionInfo } from '../ui/VersionInfo';

interface AppInfoViewProps {
  app: App;
  versions: AppVersion[];
  versionTools: AppVersionTool[];
}

export function AppInfoView({ app, versions, versionTools }: AppInfoViewProps) {
  const { theme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen transition-colors duration-500 ${theme.bg}`}>
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header with Theme Toggle */}
        <div className="flex items-center justify-between">
          {/* Back Button */}
          <Button
            onClick={() => navigate('/explorer/apps')}
            className={`group flex items-center gap-2 ${theme.textMuted} hover:${theme.text} bg-transparent ${theme.buttonHover} border ${theme.cardBorder} ${theme.cardHoverBorder} transition-all duration-500 rounded-full px-4`}
          >
            <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
            Back to explorer
          </Button>
        </div>

        {/* Header Card */}
        <AppHeader app={app} versions={versions} versionTools={versionTools} />

        {/* Main Content Grid */}
        <AppInfo app={app} />

        {/* Version Information */}
        <VersionInfo versions={versions} versionTools={versionTools} app={app} />
      </div>
    </div>
  );
}
