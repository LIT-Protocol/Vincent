import {
  SquareStack,
  LayoutDashboard,
  Wrench,
  Shield,
  ChevronDown,
  BookOpen,
  Menu,
  ArrowLeft,
  Wallet,
  FileText,
  GitBranch,
} from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/shared/ui/button';
import { useState } from 'react';
import { vincentApiClient } from '@/components/app-dashboard/mock-forms/vincentApiClient';

interface SidebarProps {
  expandedMenus: Set<string>;
  selectedForm: string | null;
  selectedListView: string | null;
  selectedApp: any | null;
  selectedAppView: string | null;
  apps: any[];
  onToggleMenu: (menuId: string) => void;
  onCategoryClick: (categoryId: string) => void;
  onMenuSelection: (id: string) => void;
  onAppSelection: (app: any) => void;
  onAppViewSelection: (viewId: string) => void;
}

export function Sidebar({
  expandedMenus,
  selectedForm,
  selectedListView,
  selectedApp,
  selectedAppView,
  apps,
  onToggleMenu,
  onCategoryClick,
  onMenuSelection,
  onAppSelection,
  onAppViewSelection,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Get app versions for the selected app
  const { data: appVersions } = vincentApiClient.useGetAppVersionsQuery(
    { appId: parseInt(selectedApp?.appId || '0') },
    { skip: !selectedApp?.appId },
  );

  const appMenuItems = selectedApp
    ? [
        { id: 'app-details', label: 'App Details', icon: FileText },
        {
          id: 'app-versions',
          label: 'App Versions',
          icon: GitBranch,
          submenu:
            appVersions && appVersions.length > 0
              ? [...appVersions] // Create a copy before sorting
                  .sort((a: any, b: any) => b.version - a.version) // Sort by version descending
                  .map((version: any) => ({
                    id: `version-${version.version}`,
                    label: `Version ${version.version}${version.version === selectedApp.latestVersion ? ' (Latest)' : ''}`,
                  }))
              : [{ id: 'no-versions', label: 'No versions available' }],
        },
      ]
    : [];

  const handleAppViewNavigation = (viewId: string) => {
    onAppViewSelection(viewId);

    // If clicking App Versions, expand the dropdown to show individual versions (but don't close it if already open)
    if (viewId === 'app-versions' && !expandedMenus.has('app-versions')) {
      onToggleMenu('app-versions');
    }
  };

  const handleAppSubmenuNavigation = (submenuId: string) => {
    // Handle version selection specifically
    if (submenuId.startsWith('version-')) {
      const versionNumber = submenuId.replace('version-', '');
      // Set the app view to show this specific version
      onAppViewSelection(`version-${versionNumber}`);
    } else {
      onAppViewSelection(submenuId);
    }
  };

  // Build dynamic menu items with apps data
  const buildMenuItems = () => {
    return [
      { id: 'dashboard', label: 'Developer Dashboard', icon: LayoutDashboard },
      {
        id: 'app',
        label: 'App',
        icon: SquareStack,
        submenu: [
          {
            id: 'my-apps',
            label: 'My Apps',
            hasAppSubmenu: true,
            apps: apps || [],
          },
          { id: 'create-app', label: 'Create App' },
        ],
      },
      {
        id: 'tool',
        label: 'Tool',
        icon: Wrench,
        submenu: [
          { id: 'my-tools', label: 'My Tools' },
          { id: 'create-tool', label: 'Create Tool' },
        ],
      },
      {
        id: 'policy',
        label: 'Policy',
        icon: Shield,
        submenu: [
          { id: 'my-policies', label: 'My Policies' },
          { id: 'create-policy', label: 'Create Policy' },
        ],
      },
    ];
  };

  const menuItems = buildMenuItems();

  return (
    <div
      className={`${isCollapsed ? 'w-16' : 'w-80'} bg-white border-r border-gray-200 h-screen flex flex-col transition-all duration-300`}
    >
      {/* Header with toggle button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        {!isCollapsed && (
          <img src="/vincent-by-lit-logo.png" alt="Vincent" width={120} height={32} />
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;

            // Handle items with submenus
            if (item.submenu) {
              const isExpanded = expandedMenus.has(item.id);
              return (
                <div key={item.id}>
                  <button
                    className={`w-full flex items-center ${
                      isCollapsed ? 'justify-center' : 'justify-between'
                    } px-3 py-2 rounded-lg transition-all duration-200 ease-in-out ${
                      selectedListView === item.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    } focus:outline-none`}
                    onClick={() => {
                      onCategoryClick(item.id);
                      onToggleMenu(item.id);
                    }}
                    style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className="flex items-center flex-1">
                      <Icon className="h-5 w-5 flex-shrink-0 transition-transform duration-200" />
                      {!isCollapsed && <span className="ml-3">{item.label}</span>}
                    </div>
                    {!isCollapsed && (
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-300 ease-in-out ${
                          isExpanded ? 'rotate-0' : '-rotate-90'
                        }`}
                      />
                    )}
                  </button>
                  {!isCollapsed && (
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isExpanded ? 'max-h-[calc(100vh-200px)] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div
                        className="ml-8 mt-1 space-y-1 focus:outline-none overflow-y-auto max-h-[calc(100vh-250px)]"
                        style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                      >
                        {item.submenu.map((subItem) => (
                          <div key={subItem.id}>
                            <button
                              onClick={() => onMenuSelection(subItem.id)}
                              className={`w-full text-left px-4 py-2 text-sm rounded-lg transition-all duration-200 ease-in-out focus:outline-none ${
                                selectedForm === subItem.id ||
                                (subItem.id === 'my-apps' && selectedListView === 'app') ||
                                (subItem.id === 'my-tools' && selectedListView === 'tool') ||
                                (subItem.id === 'my-policies' && selectedListView === 'policy')
                                  ? 'bg-blue-50 text-blue-700 font-medium'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                              style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                            >
                              {subItem.label}
                            </button>

                            {/* Show apps list under My Apps */}
                            {subItem.hasAppSubmenu &&
                              subItem.apps &&
                              subItem.apps.length > 0 &&
                              expandedMenus.has('my-apps') && (
                                <div className="ml-4 mt-1 space-y-1">
                                  {subItem.apps.map((app) => (
                                    <div key={app.appId}>
                                      <button
                                        onClick={() => onAppSelection(app)}
                                        className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all duration-200 ease-in-out ${
                                          selectedApp?.appId === app.appId
                                            ? 'bg-blue-50 text-blue-700 font-medium'
                                            : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                      >
                                        <div className="truncate">
                                          <div className="font-medium">{app.name}</div>
                                          <div className="text-xs opacity-75">ID: {app.appId}</div>
                                        </div>
                                      </button>

                                      {/* Show app-specific menu directly below selected app */}
                                      {selectedApp?.appId === app.appId && (
                                        <div className="ml-4 mt-2 space-y-1">
                                          {appMenuItems.map((appItem) => {
                                            const AppIcon = appItem.icon;

                                            // Handle app items with submenus (like App Versions)
                                            if (appItem.submenu) {
                                              const isAppSubmenuExpanded = expandedMenus.has(
                                                appItem.id,
                                              );

                                              return (
                                                <div key={appItem.id}>
                                                  <button
                                                    onClick={() =>
                                                      handleAppViewNavigation(appItem.id)
                                                    }
                                                    className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                                                      selectedAppView === appItem.id
                                                        ? 'bg-blue-50 text-blue-700 font-medium'
                                                        : 'text-gray-700 hover:bg-gray-50'
                                                    }`}
                                                  >
                                                    <AppIcon className="h-3 w-3 flex-shrink-0" />
                                                    <span className="ml-2">{appItem.label}</span>
                                                  </button>
                                                  {isAppSubmenuExpanded && (
                                                    <div className="ml-6 mt-1 space-y-1">
                                                      {appItem.submenu.map((subMenuItem: any) => (
                                                        <button
                                                          key={subMenuItem.id}
                                                          onClick={() =>
                                                            handleAppSubmenuNavigation(
                                                              subMenuItem.id,
                                                            )
                                                          }
                                                          className={`w-full text-left px-4 py-2 text-xs rounded-lg transition-all duration-200 ease-in-out ${
                                                            selectedAppView === subMenuItem.id
                                                              ? 'bg-blue-50 text-blue-700 font-medium'
                                                              : 'text-gray-600 hover:bg-gray-50'
                                                          }`}
                                                        >
                                                          {subMenuItem.label}
                                                        </button>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            }

                                            // Handle regular app items (like App Details)
                                            return (
                                              <button
                                                key={appItem.id}
                                                onClick={() => handleAppViewNavigation(appItem.id)}
                                                className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-all duration-200 ease-in-out text-sm ${
                                                  selectedAppView === appItem.id
                                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                                    : 'text-gray-600 hover:bg-gray-50'
                                                }`}
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
                              )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // Handle regular items
            return (
              <button
                key={item.id}
                onClick={() => onMenuSelection(item.id)}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center' : ''
                } px-3 py-2 text-left rounded-lg transition-all duration-200 ease-in-out ${
                  item.id === 'dashboard' && !selectedForm && !selectedListView && !selectedApp
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0 transition-transform duration-200" />
                {!isCollapsed && <span className="ml-3">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Documentation Button - separate section */}
      <div className="px-4 pb-3">
        <button
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center' : ''
          } px-3 py-2 text-left text-gray-600 hover:text-gray-800 transition-colors rounded-lg`}
          onClick={() =>
            window.open('https://docs.heyvincent.ai/documents/Why_Vincent_.html', '_blank')
          }
          title={isCollapsed ? 'Documentation' : undefined}
        >
          <BookOpen className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && <span className="ml-3">Documentation</span>}
        </button>
      </div>

      {/* Wallet Connection Button at bottom */}
      <div className="p-4 border-t border-gray-200">
        <ConnectButton.Custom>
          {({ account, chain, openAccountModal, openConnectModal, mounted }) => {
            if (!mounted) {
              return null;
            }

            if (isCollapsed) {
              return (
                <button
                  onClick={account && chain ? openAccountModal : openConnectModal}
                  className="w-full h-10 bg-black hover:bg-gray-800 rounded-lg flex items-center justify-center transition-colors"
                  title={account && chain ? account.displayName : 'Connect Wallet'}
                >
                  <Wallet className="h-4 w-4 text-white" />
                </button>
              );
            }

            return (
              <Button
                onClick={account && chain ? openAccountModal : openConnectModal}
                variant="default"
                className="w-full"
              >
                {!account && !chain && 'Connect Wallet'}
                {account && chain && (
                  <div className="flex items-center gap-2 justify-center">
                    {account.displayName}
                    {account.displayBalance ? ` (${account.displayBalance})` : ''}
                  </div>
                )}
              </Button>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </div>
  );
}
