import { Tool, ToolVersion } from '@/types/developer-dashboard/appTypes';
import { Badge } from '@/components/ui/badge';
import {
  GitCommit,
  User,
  Globe,
  Package,
  ExternalLink,
  Edit,
  Layers,
  Code,
  Trash2,
} from 'lucide-react';

interface ToolVersionDetailsViewProps {
  tool: Tool;
  version: ToolVersion;
  onOpenMutation: (mutationType: string) => void;
}

export function ToolVersionDetailsView({
  tool,
  version,
  onOpenMutation,
}: ToolVersionDetailsViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Version {version.version}</h1>
            {version.version === tool.activeVersion && (
              <Badge className="bg-green-100 text-green-800 border-green-200">Active Version</Badge>
            )}
          </div>
          {version.keywords && version.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {version.keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary">
                  {keyword}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onOpenMutation('edit-version')}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit Version
            </button>
            <button
              onClick={() => onOpenMutation('delete-version')}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-600 bg-white hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete Version
            </button>
          </div>
        </div>
      </div>

      {version.changes && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <GitCommit className="h-5 w-5" />
            Version Changes
          </h2>
          <p className="text-gray-700 whitespace-pre-wrap">{version.changes}</p>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Version Details</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Package Name</dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono">{version.packageName}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Version</dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono">{version.version}</dd>
          </div>
          {version.ipfsCid && (
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">IPFS CID</dt>
              <dd className="mt-1 text-xs text-gray-900 font-mono break-all bg-gray-50 p-2 rounded">
                {version.ipfsCid}
              </dd>
            </div>
          )}
        </div>
      </div>

      {version.author && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            Author Information
          </h2>
          <div className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{version.author.name}</dd>
            </div>
            {version.author.email && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <a
                    href={`mailto:${version.author.email}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {version.author.email}
                  </a>
                </dd>
              </div>
            )}
            {version.author.url && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Website</dt>
                <dd className="mt-1 text-sm">
                  <a
                    href={version.author.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                  >
                    {version.author.url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </dd>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {version.repository && version.repository.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Code className="h-5 w-5" />
              Repository
            </h2>
            <div className="space-y-2">
              {version.repository.map((repo, index) => (
                <div key={index}>
                  <a
                    href={repo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 text-sm"
                  >
                    {repo}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {version.homepage && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Homepage
            </h2>
            <a
              href={version.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 text-sm"
            >
              {version.homepage}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      {version.supportedPolicies && Object.keys(version.supportedPolicies).length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Supported Policies
          </h2>
          <div className="space-y-2">
            {Object.entries(version.supportedPolicies).map(([key, value]) => (
              <div
                key={key}
                className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded border"
              >
                {key}: {value}
              </div>
            ))}
          </div>
        </div>
      )}

      {version.dependencies && version.dependencies.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Dependencies
          </h2>
          <div className="space-y-2">
            {version.dependencies.map((dep) => (
              <div
                key={dep}
                className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded border"
              >
                {dep}
              </div>
            ))}
          </div>
        </div>
      )}

      {version.contributors && version.contributors.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            Contributors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {version.contributors.map((contributor, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="font-medium text-gray-900">{contributor.name}</div>
                {contributor.email && (
                  <div className="text-sm text-gray-600 mt-1">
                    <a
                      href={`mailto:${contributor.email}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {contributor.email}
                    </a>
                  </div>
                )}
                {contributor.url && (
                  <div className="text-sm mt-1">
                    <a
                      href={contributor.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                    >
                      {contributor.url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
