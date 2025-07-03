import { App } from '@/types/developer-dashboard/appTypes';
import { Button } from '@/components/ui/button';
import { ExternalLink, Calendar } from 'lucide-react';
import { AppLogo } from './AppLogo';
import { useNavigate } from 'react-router';

interface AppCardProps {
  app: App;
}

export const AppCard = ({ app }: AppCardProps) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/explorer/appId/${app.appId}`)}
      className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-gray-300 hover:bg-gray-50"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <AppLogo app={app} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">{app.name}</h3>
              {app.deploymentStatus}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <span>v{app.activeVersion}</span>
              </div>
              {app.updatedAt && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
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
              className="shrink-0 text-gray-600 hover:text-gray-900"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/explorer/appId/${app.appId}`)}
            className="transition-colors"
          >
            Connect
          </Button>
        </div>
      </div>
    </div>
  );
};
