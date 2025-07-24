import { Policy, PolicyVersion } from '@/types/developer-dashboard/appTypes';
import { Badge } from '@/components/shared/ui/badge';
import { Logo } from '@/components/shared/ui/Logo';
import { Edit, Plus, ArrowLeftRight, Trash2 } from 'lucide-react';

interface PolicyOverviewProps {
  policy: Policy;
  activeVersionData: PolicyVersion;
  onOpenMutation: (mutationType: string) => void;
}

export default function PolicyOverview({
  policy,
  activeVersionData,
  onOpenMutation,
}: PolicyOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{policy.packageName}</h1>
          <p className="text-gray-600 mt-2">{activeVersionData.description}</p>
          {activeVersionData?.keywords && activeVersionData.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {activeVersionData.keywords.map((keyword: string) => (
                <Badge key={keyword} variant="secondary">
                  {keyword}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="ml-6 flex-shrink-0">
          {policy.logo && policy.logo.length >= 10 ? (
            <Logo
              logo={policy.logo}
              alt="Policy logo"
              className="max-w-24 max-h-24 object-contain rounded-lg border shadow-sm bg-gray-50"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-100 rounded-lg border flex items-center justify-center">
              <img src="/logo.svg" alt="Vincent logo" className="w-8 h-8 opacity-50" />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onOpenMutation('edit-policy')}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit Policy
            </button>
            <button
              onClick={() => onOpenMutation('create-policy-version')}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Policy Version
            </button>
            <button
              onClick={() => onOpenMutation('change-policy-owner')}
              className="inline-flex items-center gap-2 px-4 py-2 border border-orange-200 rounded-lg text-sm font-medium text-orange-600 bg-white hover:bg-orange-50 transition-colors"
            >
              <ArrowLeftRight className="h-4 w-4" />
              Change Owner
            </button>
            <button
              onClick={() => onOpenMutation('delete-policy')}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-600 bg-white hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete Policy
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Policy Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Package Name</dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono">{policy.packageName}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Active Version</dt>
            <dd className="mt-1 text-sm text-gray-900">{policy.activeVersion || 'N/A'}</dd>
          </div>
          {activeVersionData.author && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Author</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {activeVersionData.author.name}
                {activeVersionData.author.email && (
                  <div className="text-xs text-gray-500">{activeVersionData.author.email}</div>
                )}
                {activeVersionData.author.url && (
                  <div className="text-xs">
                    <a
                      href={activeVersionData.author.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {activeVersionData.author.url}
                    </a>
                  </div>
                )}
              </dd>
            </div>
          )}
          {activeVersionData?.homepage && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Homepage</dt>
              <dd className="mt-1 text-sm">
                <a
                  href={activeVersionData.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  {activeVersionData.homepage}
                </a>
              </dd>
            </div>
          )}
          {activeVersionData?.repository && activeVersionData.repository.length > 0 && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Repository</dt>
              <dd className="mt-1 text-sm">
                {activeVersionData.repository.map((repo: string, index: number) => (
                  <div key={index}>
                    <a
                      href={repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {repo}
                    </a>
                  </div>
                ))}
              </dd>
            </div>
          )}
          {activeVersionData.ipfsCid && (
            <div>
              <dt className="text-sm font-medium text-gray-500">IPFS CID</dt>
              <dd className="mt-1 text-xs text-gray-900 font-mono break-all">
                {activeVersionData.ipfsCid}
              </dd>
            </div>
          )}
          {policy.deploymentStatus && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Deployment Status</dt>
              <dd className="mt-1 text-sm text-gray-900">{policy.deploymentStatus}</dd>
            </div>
          )}
        </div>
      </div>

      {activeVersionData?.changes && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Version Changes</h2>
          <p className="text-sm text-gray-700">{activeVersionData.changes}</p>
        </div>
      )}
    </div>
  );
}
