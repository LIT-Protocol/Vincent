import { useNavigate } from 'react-router';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/shared/ui/Logo';
import { UndeleteAppButton } from '../wrappers';
import { App } from '@/types/developer-dashboard/appTypes';

interface AppsListViewProps {
  apps: App[];
  deletedApps: App[];
}

export function AppsListView({ apps, deletedApps }: AppsListViewProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {apps.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">No Apps Yet</h2>
          <p className="text-gray-600 mb-6">Create your first app to get started with Vincent.</p>
          <Button
            variant="outline"
            className="text-gray-700"
            onClick={() => navigate('/developer/create-app')}
          >
            <Plus className="h-4 w-4 mr-2 font-bold text-gray-700" />
            Create App
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {apps.map((app) => (
            <Card
              key={app.appId}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/developer/appId/${app.appId}`)}
            >
              <CardHeader>
                <CardTitle className="flex justify-between items-center text-gray-900">
                  <div className="flex items-center gap-3">
                    <Logo
                      logo={app.logo}
                      alt={`${app.name} logo`}
                      className="w-8 h-8 rounded-md object-cover flex-shrink-0"
                    />
                    <span>{app.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                      v{app.activeVersion}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 uppercase">
                      {app.deploymentStatus}
                    </span>
                  </div>
                </CardTitle>
                <CardDescription className="text-gray-700">{app.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-700">
                  <div>
                    <span className="font-medium">App ID:</span> {app.appId}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* Deleted Apps Section */}
      {deletedApps && deletedApps.length > 0 && (
        <div className="space-y-4">
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-600 mb-4">Deleted Apps</h3>
            <div className="grid grid-cols-1 gap-4">
              {deletedApps.map((app) => (
                <Card key={app.appId} className="border-dashed">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start text-gray-600">
                      <div className="flex items-center gap-3">
                        <Logo
                          logo={app.logo}
                          alt={`${app.name} logo`}
                          className="w-8 h-8 rounded-md object-cover flex-shrink-0 grayscale"
                        />
                        <span className="line-through">{app.name}</span>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-400">
                            DELETED
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                            v{app.activeVersion}
                          </span>
                        </div>
                        <div className="relative z-10 bg-white rounded-lg opacity-100">
                          <UndeleteAppButton app={app} />
                        </div>
                      </div>
                    </CardTitle>
                    <CardDescription className="text-gray-500 line-through">
                      {app.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-700">
                      <div>
                        <span className="font-medium">App ID:</span> {app.appId}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
