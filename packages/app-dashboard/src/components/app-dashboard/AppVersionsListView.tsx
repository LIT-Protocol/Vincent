import { useNavigate } from 'react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/app-dashboard/ui/card';

interface AppVersionsListViewProps {
  versions: any[];
  appName?: string;
  appId: number;
  latestVersion?: number;
  isLoading: boolean;
  error?: any;
}

export function AppVersionsListView({
  versions,
  appName,
  appId,
  latestVersion,
  isLoading,
  error,
}: AppVersionsListViewProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
        <span className="ml-2 text-gray-600">Loading versions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Versions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">Failed to load app versions.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleVersionClick = (version: number) => {
    navigate(`/appId/${appId}/version/${version}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{appName} - App Versions</h1>
          <p className="text-gray-600 mt-2">Manage and view all versions of your application</p>
        </div>
      </div>

      {versions && versions.length > 0 ? (
        <div className="space-y-4">
          {[...versions]
            .sort((a, b) => b.version - a.version)
            .map((version) => (
              <Card
                key={version.version}
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                onClick={() => handleVersionClick(version.version)}
              >
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center justify-between">
                    Version {version.version}
                    {version.version === latestVersion && (
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded text-sm">
                        Latest
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="text-gray-700">
                    Click to view version details and manage settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    {version.changes && (
                      <div className="border-b border-gray-100 pb-3 last:border-b-0">
                        <div className="flex flex-col sm:flex-row sm:justify-between">
                          <span className="font-medium text-gray-600 text-sm uppercase tracking-wide">
                            Changes
                          </span>
                          <div className="mt-1 sm:mt-0 sm:text-right">
                            <span className="text-gray-900 text-sm">{version.changes}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="border-b border-gray-100 pb-3 last:border-b-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <span className="font-medium text-gray-600 text-sm uppercase tracking-wide">
                          Tools Count
                        </span>
                        <div className="mt-1 sm:mt-0 sm:text-right">
                          <span className="text-gray-900 text-sm">
                            {version.tools ? version.tools.length : 0}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="border-b border-gray-100 pb-3 last:border-b-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <span className="font-medium text-gray-600 text-sm uppercase tracking-wide">
                          Status
                        </span>
                        <div className="mt-1 sm:mt-0 sm:text-right">
                          <span className="inline-block px-2 py-1 rounded text-sm font-medium bg-green-100 text-green-800">
                            ACTIVE
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📦</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Versions Found</h2>
          <p className="text-gray-600 mb-6">
            This app doesn't have any versions yet. Create your first version to get started.
          </p>
        </div>
      )}
    </div>
  );
}
