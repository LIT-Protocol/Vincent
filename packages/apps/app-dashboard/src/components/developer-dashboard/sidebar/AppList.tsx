import { FileText, GitBranch } from 'lucide-react';
import { useMemo } from 'react';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { App, AppVersion } from '@/types/developer-dashboard/appTypes';

interface AppListProps {
  apps: App[];
  selectedApp: App | null;
  selectedAppView: string | null;
  expandedMenus: Set<string>;
  onAppSelection: (app: App) => void;
  onAppViewSelection: (viewId: string) => void;
  onToggleMenu: (menuId: string) => void;
}

export function AppList({
  apps,
  selectedApp,
  selectedAppView,
  expandedMenus,
  onAppSelection,
  onAppViewSelection,
  onToggleMenu,
}: AppListProps) {
  const {
    data: appVersions,
    isLoading: versionsLoading,
    error: versionsError,
  } = vincentApiClient.useGetAppVersionsQuery(
    { appId: selectedApp?.appId || 0 },
    { skip: !selectedApp?.appId },
  ); // FIXME: Sidebar-related patch, we don't want to fetch versions if no app is selected

  const sortedVersions = useMemo(() => {
    if (!appVersions || appVersions.length === 0) return [];
    // Filter out deleted versions and sort by version number (descending)
    return appVersions
      .filter((version: AppVersion) => !version.isDeleted)
      .sort((a: AppVersion, b: AppVersion) => b.version - a.version);
  }, [appVersions]);

  const appMenuItems = useMemo(() => {
    if (!selectedApp) return [];

    const baseMenuItems = [
      { id: 'app-details', label: 'App Details', icon: FileText },
      {
        id: 'app-versions',
        label: 'App Versions',
        icon: GitBranch,
        submenu:
          sortedVersions.length > 0
            ? sortedVersions.map((version) => ({
                id: `version-${version.version}`,
                label: `Version ${version.version}${version.version === selectedApp.activeVersion ? ' (Active)' : ''}`,
              }))
            : [{ id: 'no-versions', label: 'No versions available', disabled: true }],
      },
    ];

    return baseMenuItems;
  }, [selectedApp, sortedVersions]);

  const handleAppViewNavigation = (viewId: string) => {
    onAppViewSelection(viewId);
    if (viewId === 'app-versions' && !expandedMenus.has('app-versions')) {
      onToggleMenu('app-versions');
    }
  };

  const handleAppSubmenuNavigation = (submenuId: string) => {
    if (submenuId.startsWith('version-')) {
      // Handle version navigation (e.g., "version-1")
      const versionNumber = submenuId.replace('version-', '');
      onAppViewSelection(`version-${versionNumber}`);
    } else {
      onAppViewSelection(submenuId);
    }
  };

  if (!apps || apps.length === 0) {
    return <div className="ml-4 mt-1 px-3 py-2 text-xs text-gray-400">No apps found</div>;
  }

  return (
    <div className="ml-4 mt-1 space-y-1">
      {apps.map((app) => (
        <div key={app.appId}>
          <button
            onClick={() => onAppSelection(app)}
            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all duration-200 ease-in-out focus:outline-none ${
              selectedApp?.appId === app.appId
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
            style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
            aria-label={`Select app ${app.name}`}
            aria-pressed={selectedApp?.appId === app.appId}
          >
            <div className="truncate">
              <div className="font-medium">{app.name}</div>
              <div className="text-xs opacity-75">ID: {app.appId}</div>
            </div>
          </button>

          {selectedApp?.appId === app.appId && (
            <div className="ml-4 mt-2 space-y-1" role="group" aria-label="App actions">
              {/* Show menu items - always show basic items, handle versions separately */}
              {appMenuItems.map((appItem) => {
                const AppIcon = appItem.icon;

                if (appItem.submenu) {
                  const isAppSubmenuExpanded = expandedMenus.has(appItem.id);
                  const isVersionsMenu = appItem.id === 'app-versions';
                  const hasVersionsError = isVersionsMenu && !!versionsError;
                  const isVersionsLoading = isVersionsMenu && versionsLoading;

                  return (
                    <div key={appItem.id}>
                      <button
                        onClick={() => handleAppViewNavigation(appItem.id)}
                        disabled={hasVersionsError}
                        className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors focus:outline-none ${
                          hasVersionsError
                            ? 'text-gray-400 cursor-not-allowed'
                            : selectedAppView === appItem.id
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                        aria-label={appItem.label}
                        aria-expanded={isAppSubmenuExpanded}
                        aria-controls={`submenu-${appItem.id}`}
                      >
                        <AppIcon className="h-3 w-3 flex-shrink-0" />
                        <span className="ml-2">{appItem.label}</span>
                      </button>
                      {isAppSubmenuExpanded && (
                        <div
                          className="ml-6 mt-1 space-y-1"
                          id={`submenu-${appItem.id}`}
                          role="group"
                          aria-label="Version list"
                        >
                          {/* Show loading state for versions */}
                          {isVersionsLoading && (
                            <div className="px-4 py-2 text-xs text-gray-400">
                              Loading versions...
                            </div>
                          )}

                          {/* Show error state for versions */}
                          {hasVersionsError && (
                            <div className="px-4 py-2 text-xs text-red-500">
                              Error loading versions
                            </div>
                          )}

                          {/* Show version items when loaded or fallback */}
                          {appItem.submenu.map((subMenuItem: any) => {
                            // Don't show version items if loading/error for app-versions
                            if (isVersionsMenu && (isVersionsLoading || hasVersionsError)) {
                              return <></>;
                            }

                            return (
                              <button
                                key={subMenuItem.id}
                                onClick={() => handleAppSubmenuNavigation(subMenuItem.id)}
                                disabled={subMenuItem.disabled}
                                className={`w-full text-left px-4 py-2 text-xs rounded-lg transition-all duration-200 ease-in-out focus:outline-none ${
                                  subMenuItem.disabled
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : selectedAppView === subMenuItem.id
                                      ? 'bg-blue-50 text-blue-700 font-medium'
                                      : 'text-gray-600 hover:bg-gray-50'
                                }`}
                                style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                                aria-label={subMenuItem.label}
                                aria-pressed={
                                  !subMenuItem.disabled && selectedAppView === subMenuItem.id
                                }
                              >
                                {subMenuItem.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <button
                    key={appItem.id}
                    onClick={() => handleAppViewNavigation(appItem.id)}
                    className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-all duration-200 ease-in-out text-sm focus:outline-none ${
                      selectedAppView === appItem.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    aria-label={appItem.label}
                    aria-pressed={selectedAppView === appItem.id}
                  >
                    <AppIcon className="h-3 w-3 flex-shrink-0" />
                    <span className="ml-2">{appItem.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
