import { Tool, ToolVersion } from '@/types/developer-dashboard/appTypes';
import { Badge } from '@/components/ui/badge';
import { Calendar, GitCommit, Package } from 'lucide-react';
import { UndeleteToolVersionButton } from '../wrappers/ui/UndeleteToolVersionButton';
import { formatDate } from '@/utils/developer-dashboard/formatDateAndTime';

interface ToolVersionsListViewProps {
  activeVersions: ToolVersion[];
  deletedVersions: ToolVersion[];
  tool: Tool;
  onVersionClick?: (version: string) => void;
}

export function ToolVersionsListView({
  tool,
  activeVersions,
  deletedVersions,
  onVersionClick,
}: ToolVersionsListViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Tool Versions</h1>
          <p className="text-gray-600 mt-2">
            All versions for <span className="font-mono">{tool.packageName}</span>
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Package className="h-3 w-3 mr-1" />
              Active: {tool.activeVersion}
            </Badge>
            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
              {activeVersions.length} version{activeVersions.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {activeVersions.map((version) => (
          <div
            key={version.version}
            className={`bg-white shadow rounded-lg border ${
              version.version === tool.activeVersion
                ? 'border-blue-200 ring-1 ring-blue-100'
                : 'border-gray-200 hover:border-gray-300'
            } transition-colors ${onVersionClick ? 'cursor-pointer hover:shadow-md' : ''}`}
            onClick={onVersionClick ? () => onVersionClick(version.version) : undefined}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <GitCommit className="h-5 w-5 text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Version {version.version}
                    </h3>
                  </div>
                  {version.version === tool.activeVersion && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  {formatDate(version.createdAt)}
                </div>
              </div>

              <div className="space-y-4">
                {version.changes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Changes</h4>
                    <p className="text-sm text-gray-600">{version.changes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {activeVersions.length === 0 && (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <GitCommit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No versions found</h3>
          <p className="text-gray-600">
            This tool doesn't have any versions yet. Create the first version to get started.
          </p>
        </div>
      )}

      {deletedVersions.length > 0 && (
        <div className="space-y-4">
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-600 mb-4">Deleted Tool Versions</h3>
            <div className="space-y-4">
              {deletedVersions.map((version) => (
                <div
                  key={version.version}
                  className="bg-white shadow rounded-lg border border-dashed border-gray-300"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <GitCommit className="h-5 w-5 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-500 line-through">
                            Version {version.version}
                          </h3>
                        </div>
                        <Badge className="bg-red-50 text-red-400 border-red-200">DELETED</Badge>
                        {version.version === tool.activeVersion && (
                          <Badge className="bg-gray-100 text-gray-500 border-gray-200">
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="h-4 w-4" />
                          {formatDate(version.createdAt)}
                        </div>
                        <div className="relative z-10 bg-white rounded-lg opacity-100">
                          <UndeleteToolVersionButton toolVersion={version} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {version.changes && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Changes</h4>
                          <p className="text-sm text-gray-400 line-through">{version.changes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
