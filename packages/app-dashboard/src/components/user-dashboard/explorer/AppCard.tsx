import { AppDetails } from '@/types';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/app-dashboard/ui/badge';
import { Users, ExternalLink, Calendar } from 'lucide-react';
import { AppLogo } from './AppLogo';

const getDeploymentStatusBadge = (status: number) => {
  switch (status) {
    case 2: // Production
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          Production
        </Badge>
      );
    case 1: // Testing
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          Testing
        </Badge>
      );
    case 0: // Development
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
          Development
        </Badge>
      );
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

interface AppCardProps {
  app: AppDetails;
  onAppClick: (appId: string) => void;
  onConnectApp: (e: React.MouseEvent, appId: string) => void;
  variant?: 'featured' | 'list';
}

export const AppCard = ({ app, onAppClick, onConnectApp, variant = 'list' }: AppCardProps) => {
  if (variant === 'featured') {
    return (
      <div
        onClick={() => onAppClick(app.id)}
        className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-gray-300 hover:-translate-y-1 flex flex-col h-full"
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <AppLogo app={app} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">{app.name}</h3>
                {getDeploymentStatusBadge(app.deploymentStatus)}
              </div>
              <p className="text-sm text-gray-600 font-medium">Application</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{app.description}</p>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>v{app.version}</span>
            </div>
            {app.updatedAt && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(app.updatedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => onConnectApp(e, app.id)}
            className="transition-colors"
          >
            Connect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onAppClick(app.id)}
      className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-gray-300 hover:bg-gray-50"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <AppLogo app={app} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">{app.name}</h3>
              {getDeploymentStatusBadge(app.deploymentStatus)}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <span>v{app.version}</span>
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
            onClick={(e) => onConnectApp(e, app.id)}
            className="transition-colors"
          >
            Connect
          </Button>
        </div>
      </div>
    </div>
  );
};
