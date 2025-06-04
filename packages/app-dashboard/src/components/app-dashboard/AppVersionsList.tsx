import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/app-dashboard/ui/card';
import { vincentApiClient } from '@/components/app-dashboard/mock-forms/vincentApiClient';

// Type definition for a single app version (from API client)
interface AppVersion {
  _id: string;
  updatedAt: string;
  createdAt: string;
  appId: number;
  version: number;
  enabled: boolean;
  changes: string;
}

interface AppVersionsListProps {
  versions: AppVersion[];
  appName?: string;
  latestVersion?: number;
  isLoading?: boolean;
  error?: any;
  onVersionSelect?: (appId: number, version: number) => void;
}

export function AppVersionsList({
  versions,
  appName,
  latestVersion,
  isLoading,
  error,
  onVersionSelect,
}: AppVersionsListProps) {
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);

  // Debug logging to see the actual data structure
  console.log('🔍 AppVersionsList Debug:');
  console.log('  - versions (raw):', versions);
  console.log('  - versions type:', typeof versions);
  console.log('  - versions array length:', versions?.length);
  console.log('  - first version (if exists):', versions?.[0]);
  console.log('  - appName:', appName);
  console.log('  - latestVersion:', latestVersion);
  console.log('  - isLoading:', isLoading);
  console.log('  - error:', error);

  // Get detailed version information
  const {
    data: versionDetails,
    error: versionError,
    isLoading: isVersionLoading,
  } = vincentApiClient.useGetAppVersionQuery(
    { appId: selectedAppId!, version: selectedVersion! },
    { skip: !selectedAppId || !selectedVersion },
  );

  const handleVersionClick = (version: AppVersion) => {
    setSelectedVersion(version.version);
    setSelectedAppId(version.appId);
    // Notify parent component about the selected version
    onVersionSelect?.(version.appId, version.version);
  };

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
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load app versions</p>
      </div>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No versions found</p>
      </div>
    );
  }

  // Show version details if a version is selected
  if (selectedVersion && selectedAppId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Version Details</h1>
          <p className="text-gray-600 mt-2">
            Version {selectedVersion} of {appName}
          </p>
        </div>

        {isVersionLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span className="ml-2 text-gray-600">Loading version details...</span>
          </div>
        ) : versionError ? (
          <div className="text-center py-8">
            <p className="text-red-600">Failed to load version details</p>
          </div>
        ) : versionDetails ? (
          <div className="space-y-6">
            {/* Tools Information */}
            {versionDetails.tools && versionDetails.tools.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Associated Tools ({versionDetails.tools.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {versionDetails.tools.map((tool, index) => (
                      <div key={index} className="border border-gray-200 rounded p-4">
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">Package Name</span>
                            <span className="text-gray-900">{tool.toolPackageName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">Version</span>
                            <span className="text-gray-900">{tool.toolVersion}</span>
                          </div>
                          {tool.hiddenSupportedPolicies &&
                            tool.hiddenSupportedPolicies.length > 0 && (
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-600">Hidden Policies</span>
                                <div className="text-right">
                                  {tool.hiddenSupportedPolicies.map((policy, pIndex) => (
                                    <span
                                      key={pIndex}
                                      className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs mr-1 mb-1"
                                    >
                                      {policy}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Associated Tools</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-600">No tools associated with this version</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </div>
    );
  }

  // Sort versions by version number in descending order (latest first)
  const sortedVersions = [...versions].sort((a, b) => b.version - a.version);

  // Additional debug logging for sorted versions
  console.log('📊 Sorted versions:', sortedVersions);
  sortedVersions.forEach((version, index) => {
    console.log(`  Version ${index + 1}:`, {
      version: version.version,
      enabled: version.enabled,
      changes: version.changes,
      createdAt: version.createdAt,
      updatedAt: version.updatedAt,
      createdAtType: typeof version.createdAt,
      updatedAtType: typeof version.updatedAt,
      _id: version._id,
      appId: version.appId,
    });
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">App Versions</h1>
        <p className="text-gray-600 mt-2">
          All versions of {appName} - Click a version to view details
        </p>
      </div>

      <div className="space-y-4">
        {sortedVersions.map((version) => (
          <Card
            key={version.version}
            className="border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleVersionClick(version)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-gray-900">
                  Version {version.version}
                  {version.version === latestVersion && (
                    <span className="ml-2 inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                      Latest
                    </span>
                  )}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      version.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {version.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div>
                <h4 className="font-medium text-gray-700 text-sm mb-1">Changes</h4>
                <p className="text-gray-600 text-sm">
                  {version.changes || 'No changelog provided'}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
