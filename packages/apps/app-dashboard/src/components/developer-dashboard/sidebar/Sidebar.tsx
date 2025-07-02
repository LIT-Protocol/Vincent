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
} from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/ui/button';
import { useState, useMemo, useEffect } from 'react';
import { AppList } from './AppList';
import { ToolList } from './ToolList';
import { PolicyList } from './PolicyList';

interface SidebarProps {
  expandedMenus: Set<string>;
  selectedForm: string | null;
  selectedListView: string | null;
  selectedApp: any | null;
  selectedAppView: string | null;
  selectedTool: any | null;
  selectedToolView: string | null;
  selectedPolicy: any | null;
  selectedPolicyView: string | null;
  apps: any[];
  tools: any[];
  policies: any[];
  isLoading: boolean;
  hasErrors: boolean;
  onToggleMenu: (menuId: string) => void;
  onCategoryClick: (categoryId: string) => void;
  onMenuSelection: (id: string) => void;
  onAppSelection: (app: any) => void;
  onAppViewSelection: (viewId: string) => void;
  onToolSelection: (tool: any) => void;
  onToolViewSelection: (viewId: string) => void;
  onPolicySelection: (policy: any) => void;
  onPolicyViewSelection: (viewId: string) => void;
}

export function Sidebar({
  expandedMenus,
  selectedForm,
  selectedListView,
  selectedApp,
  selectedAppView,
  selectedTool,
  selectedToolView,
  selectedPolicy,
  selectedPolicyView,
  apps,
  tools,
  policies,
  isLoading,
  hasErrors,
  onToggleMenu,
  onCategoryClick,
  onMenuSelection,
  onAppSelection,
  onAppViewSelection,
  onToolSelection,
  onToolViewSelection,
  onPolicySelection,
  onPolicyViewSelection,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Update main content margin when sidebar width changes
  useEffect(() => {
    const mainContent = document.querySelector('.main-content-area') as HTMLElement;
    if (mainContent) {
      mainContent.style.marginLeft = isCollapsed ? '64px' : '320px';
    }
  }, [isCollapsed]);

  // Memoize menu items to prevent unnecessary re-renders
  const menuItems = useMemo(
    () => [
      { id: 'dashboard', label: 'Developer Dashboard', icon: LayoutDashboard },
      {
        id: 'app',
        label: 'App',
        icon: SquareStack,
        submenu: [
          {
            id: 'my-apps',
            label: 'My Apps',
          },
          { id: 'create-app', label: 'Create App' },
        ],
      },
      {
        id: 'tool',
        label: 'Tool',
        icon: Wrench,
        submenu: [
          {
            id: 'my-tools',
            label: 'My Tools',
          },
          { id: 'create-tool', label: 'Create Tool' },
        ],
      },
      {
        id: 'policy',
        label: 'Policy',
        icon: Shield,
        submenu: [
          {
            id: 'my-policies',
            label: 'My Policies',
          },
          { id: 'create-policy', label: 'Create Policy' },
        ],
      },
    ],
    [],
  );

  return (
    <div
      className={`${isCollapsed ? 'w-16' : 'w-80'} bg-white border-r border-gray-200 h-screen flex flex-col transition-all duration-300 fixed top-0 left-0 z-40`}
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
        {/* Show loading state */}
        {isLoading && (
          <></> // Visually looks better than a loading spinner
        )}

        {/* Show error state */}
        {hasErrors && !isLoading && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm text-red-700">Error loading data. Please try again.</div>
          </div>
        )}

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
                    onClick={() => onCategoryClick(item.id)}
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
                            {subItem.id === 'my-apps' && expandedMenus.has('my-apps') && (
                              <AppList
                                apps={apps}
                                selectedApp={selectedApp}
                                selectedAppView={selectedAppView}
                                expandedMenus={expandedMenus}
                                onAppSelection={onAppSelection}
                                onAppViewSelection={onAppViewSelection}
                                onToggleMenu={onToggleMenu}
                              />
                            )}

                            {/* Show tools list under My Tools */}
                            {subItem.id === 'my-tools' && expandedMenus.has('my-tools') && (
                              <ToolList
                                tools={tools}
                                selectedTool={selectedTool}
                                selectedToolView={selectedToolView}
                                expandedMenus={expandedMenus}
                                onToolSelection={onToolSelection}
                                onToolViewSelection={onToolViewSelection}
                                onToggleMenu={onToggleMenu}
                              />
                            )}

                            {/* Show policies list under My Policies */}
                            {subItem.id === 'my-policies' && expandedMenus.has('my-policies') && (
                              <PolicyList
                                policies={policies}
                                selectedPolicy={selectedPolicy}
                                selectedPolicyView={selectedPolicyView}
                                expandedMenus={expandedMenus}
                                onPolicySelection={onPolicySelection}
                                onPolicyViewSelection={onPolicyViewSelection}
                                onToggleMenu={onToggleMenu}
                              />
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
                } px-3 py-2 text-left rounded-lg transition-all duration-200 ease-in-out focus:outline-none ${
                  item.id === 'dashboard' &&
                  !selectedForm &&
                  !selectedListView &&
                  !selectedApp &&
                  !selectedTool &&
                  !selectedPolicy
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
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
          } px-3 py-2 text-left text-gray-600 hover:text-gray-800 transition-colors rounded-lg focus:outline-none`}
          onClick={() =>
            window.open('https://docs.heyvincent.ai/documents/Getting_Started.html', '_blank')
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
