import { App } from '@/types/developer-dashboard/appTypes';
import { AppDetail } from '@/components/developer-dashboard/ui/AppDetail';
import { Logo } from '@/components/shared/ui/Logo';
import { Edit, Plus, Trash2 } from 'lucide-react';

interface AppDetailsViewProps {
  selectedApp: App;
  onOpenMutation: (mutationType: string) => void;
}

export function AppDetailsView({ selectedApp, onOpenMutation }: AppDetailsViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{selectedApp.name}</h1>
          <p className="text-gray-600 mt-2">{selectedApp.description}</p>
        </div>
        <div className="ml-6 flex-shrink-0">
          {selectedApp.logo && selectedApp.logo.length >= 10 ? (
            <Logo
              logo={selectedApp.logo}
              alt="App logo"
              className="max-w-24 max-h-24 object-contain rounded-lg border shadow-sm bg-gray-50"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-100 rounded-lg border flex items-center justify-center">
              <img src="/logo.svg" alt="Vincent logo" className="w-8 h-8 opacity-50" />
            </div>
          )}
        </div>
      </div>

      {/* App Management Actions */}
      <div className="bg-white border rounded-lg">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-900">App Management</h3>
          <p className="text-gray-600 text-sm mt-1">Manage your application settings</p>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onOpenMutation('edit-app')}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit App
            </button>
            <button
              onClick={() => onOpenMutation('create-app-version')}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create App Version
            </button>
            <button
              onClick={() => onOpenMutation('delete-app')}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-600 bg-white hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete App
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white border rounded-lg">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-medium text-gray-900">App Information</h3>
            <p className="text-gray-600 text-sm mt-1">Application details</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
              <AppDetail label="App ID">
                <span className="text-gray-900 text-sm">{selectedApp.appId}</span>
              </AppDetail>

              <AppDetail label="Active Version">
                <span className="text-gray-900 text-sm">{selectedApp.activeVersion}</span>
              </AppDetail>

              {selectedApp.contactEmail && (
                <AppDetail label="Contact Email">
                  <span className="text-gray-900 text-sm">{selectedApp.contactEmail}</span>
                </AppDetail>
              )}

              {selectedApp.appUserUrl && (
                <AppDetail label="App User URL">
                  <a
                    href={selectedApp.appUserUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {selectedApp.appUserUrl}
                  </a>
                </AppDetail>
              )}

              {selectedApp.redirectUris && selectedApp.redirectUris.length > 0 && (
                <AppDetail label="Redirect URIs">
                  <div className="space-y-1">
                    {selectedApp.redirectUris.map((uri) => (
                      <div key={uri}>
                        <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm">
                          {uri}
                        </span>
                      </div>
                    ))}
                  </div>
                </AppDetail>
              )}

              {selectedApp.deploymentStatus && (
                <AppDetail label="Deployment Status">
                  <span
                    className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                      selectedApp.deploymentStatus === 'prod'
                        ? 'bg-green-100 text-green-800'
                        : selectedApp.deploymentStatus === 'test'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {selectedApp.deploymentStatus.toUpperCase()}
                  </span>
                </AppDetail>
              )}

              <AppDetail label="Created At">
                <span className="text-gray-900 text-sm">{selectedApp.createdAt}</span>
              </AppDetail>

              <AppDetail label="Updated At" isLast>
                <span className="text-gray-900 text-sm">{selectedApp.updatedAt}</span>
              </AppDetail>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
