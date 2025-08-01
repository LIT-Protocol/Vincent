import { Ability, AbilityVersion } from '@/types/developer-dashboard/appTypes';
import { Badge } from '@/components/shared/ui/badge';
import { Logo } from '@/components/shared/ui/Logo';
import { Edit, Plus, ArrowLeftRight, Trash2 } from 'lucide-react';

interface AbilityOverviewProps {
  ability: Ability;
  activeVersionData: AbilityVersion;
  onOpenMutation: (mutationType: string) => void;
}

export default function AbilityOverview({
  ability,
  activeVersionData,
  onOpenMutation,
}: AbilityOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{ability.packageName}</h1>
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
          {ability.logo && ability.logo.length >= 10 ? (
            <Logo
              logo={ability.logo}
              alt="Ability logo"
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
              onClick={() => onOpenMutation('edit-ability')}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit Ability
            </button>
            <button
              onClick={() => onOpenMutation('create-ability-version')}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Ability Version
            </button>
            <button
              onClick={() => onOpenMutation('change-ability-owner')}
              className="inline-flex items-center gap-2 px-4 py-2 border border-orange-200 rounded-lg text-sm font-medium text-orange-600 bg-white hover:bg-orange-50 transition-colors"
            >
              <ArrowLeftRight className="h-4 w-4" />
              Change Owner
            </button>
            <button
              onClick={() => onOpenMutation('delete-ability')}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-600 bg-white hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete Ability
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Ability Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Package Name</dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono">{ability.packageName}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Active Version</dt>
            <dd className="mt-1 text-sm text-gray-900">{ability.activeVersion || 'N/A'}</dd>
          </div>
          {activeVersionData.ipfsCid && (
            <div>
              <dt className="text-sm font-medium text-gray-500">IPFS CID</dt>
              <dd className="mt-1 text-xs text-gray-900 font-mono break-all">
                {activeVersionData.ipfsCid}
              </dd>
            </div>
          )}
          {ability.deploymentStatus && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Deployment Status</dt>
              <dd className="mt-1 text-sm text-gray-900">{ability.deploymentStatus}</dd>
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

      {activeVersionData?.supportedPolicies &&
        Object.keys(activeVersionData.supportedPolicies).length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Supported Policies</h2>
            <div className="space-y-2">
              {Object.entries(activeVersionData.supportedPolicies).map(([key, value]) => (
                <div
                  key={key}
                  className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded"
                >
                  {key}: {value}
                </div>
              ))}
            </div>
          </div>
        )}

      {activeVersionData?.dependencies && activeVersionData.dependencies.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Dependencies</h2>
          <div className="space-y-2">
            {activeVersionData.dependencies.map((dep: string) => (
              <div
                key={dep}
                className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded"
              >
                {dep}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeVersionData?.contributors && activeVersionData.contributors.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Contributors</h2>
          <div className="space-y-3">
            {activeVersionData.contributors.map((contributor: any, index: number) => (
              <div key={index} className="border-l-4 border-blue-200 pl-4">
                <div className="font-medium text-gray-900">{contributor.name}</div>
                {contributor.email && (
                  <div className="text-sm text-gray-600">{contributor.email}</div>
                )}
                {contributor.url && (
                  <div className="text-sm">
                    <a
                      href={contributor.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {contributor.url}
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
