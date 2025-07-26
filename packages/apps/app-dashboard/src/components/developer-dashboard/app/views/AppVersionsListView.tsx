import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shared/ui/card';
import { Power, PowerOff } from 'lucide-react';
import { AppVersion } from '@/types/developer-dashboard/appTypes';
import { UndeleteAppVersionButton } from '../wrappers';

interface AppVersionsListViewProps {
  versions: AppVersion[];
  deletedVersions?: AppVersion[];
  activeVersion?: number;
  onVersionClick: (version: number) => void;
}

export function AppVersionsListView({
  versions,
  deletedVersions,
  activeVersion,
  onVersionClick,
}: AppVersionsListViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">App Versions</h1>
          <p className="text-gray-600 mt-2">Manage and view all versions of your application</p>
        </div>
      </div>

      {/* Active Versions Section */}
      {versions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-gray-500">
              <p>No app versions found.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {versions.map((version) => (
            <Card
              key={version.version}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onVersionClick(version.version)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">Version {version.version}</CardTitle>
                    {version.version === activeVersion && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {version.enabled ? (
                      <Power className="h-4 w-4 text-green-600" />
                    ) : (
                      <PowerOff className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm text-gray-500">
                      {version.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
                <CardDescription>
                  Created: {new Date(version.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Deleted Versions Section */}
      {deletedVersions && deletedVersions.length > 0 && (
        <div className="space-y-4">
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-600 mb-4">Deleted App Versions</h3>
            <div className="grid gap-4">
              {deletedVersions.map((version) => (
                <Card key={version.version} className="border-dashed">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg text-gray-600 line-through">
                          Version {version.version}
                        </CardTitle>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-400">
                          DELETED
                        </span>
                        {version.version === activeVersion && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2 text-gray-400">
                          {version.enabled ? (
                            <Power className="h-4 w-4" />
                          ) : (
                            <PowerOff className="h-4 w-4" />
                          )}
                          <span className="text-sm">
                            {version.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <div className="relative z-10 bg-white rounded-lg opacity-100">
                          <UndeleteAppVersionButton appVersion={version} />
                        </div>
                      </div>
                    </div>
                    <CardDescription className="text-gray-500 line-through">
                      Created: {new Date(version.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
