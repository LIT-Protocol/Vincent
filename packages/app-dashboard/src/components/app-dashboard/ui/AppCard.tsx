import { ExternalLink } from 'lucide-react';
import { AppDetails } from '@/types';
import { Card, CardContent } from '@/components/app-dashboard/ui/card';

export interface AppCardProps {
  app: AppDetails;
  onClick: (appId: string) => void;
}

export function AppCard({ app, onClick }: AppCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-200 border-gray-200"
      onClick={() => onClick(app.id)}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-6">
          {/* App logo */}
          {app.logo && app.logo.length >= 10 ? (
            <img
              src={app.logo}
              alt={`${app.name} logo`}
              className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
              onError={(e) => {
                e.currentTarget.src = '/logo.svg';
              }}
            />
          ) : (
            <img
              src="/logo.svg"
              alt="Vincent logo"
              className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
            />
          )}

          {/* App info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-2xl font-semibold text-gray-900 truncate">{app.name}</h3>

              {/* Status and Version badges */}
              <div className="flex items-center gap-2">
                {app.version && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full font-medium">
                    v{app.version}
                  </span>
                )}
                <span
                  className={`px-3 py-1 text-sm rounded-full font-medium ${
                    app.deploymentStatus === 0
                      ? 'bg-amber-100 text-amber-800'
                      : app.deploymentStatus === 1
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                  }`}
                >
                  {app.deploymentStatus === 0
                    ? 'DEV'
                    : app.deploymentStatus === 1
                      ? 'TEST'
                      : 'PROD'}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-600 text-base leading-relaxed mb-3 line-clamp-2">
              {app.description || 'No description provided'}
            </p>

            {/* App URL */}
            {app.appUserUrl && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <ExternalLink className="h-4 w-4 flex-shrink-0" />
                <span className="truncate font-mono">{app.appUserUrl}</span>
              </div>
            )}
          </div>
        </div>

        {/* Version info message if needed */}
        {app.showInfo && app.infoMessage && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <strong>Version Update:</strong> {app.infoMessage}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
