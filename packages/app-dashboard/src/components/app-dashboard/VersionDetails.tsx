import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/app-dashboard/ui/card';
import { vincentApiClient } from '@/components/app-dashboard/mock-forms/vincentApiClient';

interface VersionDetailsProps {
  appId: number;
  version: number;
  appName?: string;
}

export function VersionDetails({ appId, version, appName }: VersionDetailsProps) {
  const {
    data: versionData,
    error,
    isLoading,
  } = vincentApiClient.useGetAppVersionQuery({ appId, version }, { skip: !appId || !version });

  console.log('VersionDetails - API response:', versionData);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
        <span className="ml-2 text-gray-600">Loading version details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Version</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">Failed to load version {version} details.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!versionData) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Version Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Version {version} not found for this app.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            {appName} - Version {version}
          </h1>
          <p className="text-gray-600 mt-2">Version details and associated tools</p>
        </div>
      </div>

      {(versionData as any).changes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Version Changes</CardTitle>
            <CardDescription className="text-gray-700">What's new in this version</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 rounded-lg border">
              <p className="text-gray-900 text-sm whitespace-pre-wrap">
                {(versionData as any).changes}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Associated Tools</CardTitle>
          <CardDescription className="text-gray-700">
            Tools included in this version
          </CardDescription>
        </CardHeader>
        <CardContent>
          {versionData.tools && versionData.tools.length > 0 ? (
            <div className="space-y-2">
              {versionData.tools.map((tool: any, index: number) => {
                return (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                    <div className="font-medium text-gray-900">Tool {index + 1}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {typeof tool === 'string' ? tool : String(JSON.stringify(tool, null, 2))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-lg mb-2">📦</div>
              <p className="text-gray-600">No tools associated with this version</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
