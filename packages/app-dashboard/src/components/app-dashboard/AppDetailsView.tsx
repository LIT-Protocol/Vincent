interface AppDetailsViewProps {
  selectedApp: any;
  onOpenModal: (contentType: string) => void;
}

export function AppDetailsView({ selectedApp, onOpenModal }: AppDetailsViewProps) {
  // Filter out unnecessary fields and format dates
  const filteredApp: [string, any][] = Object.entries(selectedApp)
    .filter(
      ([key]) => !['_id', '__v', 'logo', 'managerAddress', 'name', 'description'].includes(key),
    )
    .map((entry: [string, any]) => {
      const [key, value] = entry;
      if (key === 'createdAt' || key === 'updatedAt') {
        return [key, new Date(value as string).toLocaleString()];
      }
      return [key, value];
    });

  const logoUrl = selectedApp.logo && selectedApp.logo.length >= 10 ? selectedApp.logo : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{selectedApp.name}</h1>
          <p className="text-gray-600 mt-2">{selectedApp.description}</p>
        </div>
        <div className="ml-6 flex-shrink-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="App logo"
              className="max-w-24 max-h-24 object-contain rounded-lg border shadow-sm bg-gray-50"
              onError={(e) => {
                e.currentTarget.src = '/logo.svg';
              }}
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
          <p className="text-gray-600 text-sm mt-1">
            Manage your application settings and versions
          </p>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onOpenModal('edit-app')}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit App
            </button>
            <button
              onClick={() => onOpenModal('create-app-version')}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Create App Version
            </button>
            <button
              onClick={() => onOpenModal('delete-app')}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-600 bg-white hover:bg-red-50 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
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
              {filteredApp.map((entry: [string, any]) => {
                const [key, value] = entry;
                return (
                  <div key={key} className="border-b border-gray-100 pb-3 last:border-b-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <span className="font-medium text-gray-600 text-sm uppercase tracking-wide">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <div className="mt-1 sm:mt-0 sm:text-right">
                        {Array.isArray(value) ? (
                          <div className="space-y-1">
                            {value.map((item, index) => (
                              <div key={index}>
                                <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm">
                                  {item}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : key === 'appUserUrl' ? (
                          <a
                            href={String(value)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            {String(value)}
                          </a>
                        ) : key === 'deploymentStatus' ? (
                          <span
                            className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                              value === 'prod'
                                ? 'bg-green-100 text-green-800'
                                : value === 'test'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {String(value).toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-gray-900 text-sm">{String(value)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
