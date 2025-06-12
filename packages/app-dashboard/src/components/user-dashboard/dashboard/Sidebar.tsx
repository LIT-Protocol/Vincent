import {
  LayoutDashboard,
  Menu,
  ArrowLeft,
  Wallet,
  LogOut,
  Smartphone,
  ChevronDown,
  Compass,
  User,
  Copy,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { useState, useEffect } from 'react';
import { useClearAuthInfo, useReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { AppDetails } from '@/types';

interface UserSidebarProps {
  expandedMenus: Set<string>;
  selectedView: string | null;
  selectedApp: AppDetails | null;
  apps: AppDetails[];
  isLoading: boolean;
  appsError: string | null;
  onToggleMenu: (menuId: string) => void;
  onMenuSelection: (id: string) => void;
  onAppSelection: (app: AppDetails) => void;
}

export function UserSidebar({
  expandedMenus,
  selectedView,
  selectedApp,
  apps,
  isLoading,
  appsError,
  onToggleMenu,
  onMenuSelection,
  onAppSelection,
}: UserSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showWalletPopup, setShowWalletPopup] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const { clearAuthInfo } = useClearAuthInfo();
  const { authInfo } = useReadAuthInfo();

  // Update main content margin when sidebar width changes
  useEffect(() => {
    const mainContent = document.querySelector('.main-content-area') as HTMLElement;
    if (mainContent) {
      mainContent.style.marginLeft = isCollapsed ? '64px' : '320px';
    }
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleSignOut = async () => {
    try {
      await clearAuthInfo();
      onMenuSelection('/user');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleWalletClick = () => {
    onMenuSelection('/user/wallet');
  };

  const handleMyWalletClick = () => {
    setShowWalletPopup(!showWalletPopup);
  };

  const handleCopyAddress = async () => {
    const address = authInfo?.agentPKP?.ethAddress;
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy address:', err);
      }
    }
  };

  const handleAppClick = (app: AppDetails) => {
    onAppSelection(app);
  };

  // Build user-specific menu items
  const buildMenuItems = () => {
    return [
      {
        id: 'user-dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: '/user/dashboard',
        isActive: selectedView === 'user-dashboard',
      },
      {
        id: 'my-apps',
        label: 'My Apps',
        icon: Smartphone,
        path: '/user/apps',
        isActive: selectedView === 'my-apps',
        hasSubmenu: true,
        submenu: apps,
      },
      {
        id: 'explorer',
        label: 'Explorer',
        icon: Compass,
        path: '/user/explorer',
        isActive: selectedView === 'explorer',
      },
    ];
  };

  const menuItems = buildMenuItems();

  return (
    <div
      className={`${isCollapsed ? 'w-16' : 'w-80'} bg-white border-r border-gray-200 h-screen flex flex-col transition-all duration-300 relative`}
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

      <div className="flex-1 p-4 overflow-y-auto pb-48">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;

            // Handle items with submenus (like My Apps)
            if (item.hasSubmenu) {
              const isExpanded = expandedMenus.has(item.id);

              return (
                <div key={item.id}>
                  <button
                    className={`w-full flex items-center ${
                      isCollapsed ? 'justify-center' : 'justify-between'
                    } px-3 py-2 rounded-lg transition-all duration-200 ease-in-out ${
                      item.isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                    } focus:outline-none`}
                    onClick={() => {
                      onMenuSelection(item.path);
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

                  {/* Apps submenu */}
                  {!isCollapsed && (
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="ml-8 mt-1 space-y-1">
                        {isLoading ? (
                          <div className="px-4 py-2 text-xs text-gray-500">Loading apps...</div>
                        ) : appsError ? (
                          <div className="px-4 py-2 text-xs text-red-600">{appsError}</div>
                        ) : apps.length === 0 ? (
                          <div className="px-4 py-2 text-xs text-gray-500">No connected apps</div>
                        ) : (
                          apps.map((app) => {
                            const isSelected = selectedApp?.id === app.id;

                            // Helper function to render app logo
                            const renderAppLogo = () => {
                              if (app.logo) {
                                const logoSrc = app.logo.startsWith('data:')
                                  ? app.logo
                                  : `data:image/png;base64,${app.logo}`;

                                return (
                                  <img
                                    src={logoSrc}
                                    alt={`${app.name} logo`}
                                    className="w-6 h-6 rounded object-cover flex-shrink-0"
                                    onError={(e) => {
                                      e.currentTarget.src = '/logo.svg';
                                    }}
                                  />
                                );
                              }

                              return (
                                <img
                                  src="/logo.svg"
                                  alt="Vincent logo"
                                  className="w-6 h-6 rounded object-cover flex-shrink-0"
                                />
                              );
                            };

                            return (
                              <button
                                key={app.id}
                                onClick={() => handleAppClick(app)}
                                className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all duration-200 ease-in-out ${
                                  isSelected
                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                    : 'text-gray-500 hover:bg-gray-50'
                                }`}
                                style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                              >
                                <div className="flex items-center gap-3">
                                  {/* App Logo */}
                                  {renderAppLogo()}

                                  {/* App Info */}
                                  <div className="flex-1 min-w-0 truncate">
                                    <div className="font-medium">{app.name}</div>
                                    {app.version && (
                                      <div className="text-xs opacity-75">v{app.version}</div>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // Handle regular menu items
            return (
              <button
                key={item.id}
                onClick={() => onMenuSelection(item.path)}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center' : ''
                } px-3 py-2 text-left rounded-lg transition-all duration-200 ease-in-out ${
                  item.isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
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

      {/* Wallet Popup */}
      {showWalletPopup && !isCollapsed && (
        <div className="absolute bottom-[160px] left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">My Account EVM Address</h3>
            <button
              onClick={() => setShowWalletPopup(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          {authInfo?.agentPKP?.ethAddress ? (
            <>
              <div className="bg-gray-50 rounded p-2 mb-2">
                <code className="text-xs font-mono text-gray-800 break-all">
                  {authInfo.agentPKP.ethAddress}
                </code>
              </div>
              <button
                onClick={handleCopyAddress}
                className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                {copySuccess ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy Address
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-gray-600 mb-3">No wallet connected</p>
              <p className="text-xs text-gray-500">
                Please authenticate to view your wallet address
              </p>
            </div>
          )}
        </div>
      )}

      {/* Bottom action buttons - Fixed positioning */}
      <div
        className={`absolute bottom-0 left-0 ${isCollapsed ? 'w-16' : 'w-80'} p-4 border-t border-gray-200 bg-white space-y-2 transition-all duration-300`}
      >
        {/* My Wallet Button */}
        <Button
          variant="ghost"
          className={`w-full ${isCollapsed ? 'justify-center' : 'justify-start'} ${!authInfo?.agentPKP?.ethAddress ? 'opacity-60' : ''}`}
          onClick={handleMyWalletClick}
        >
          <User className={`h-4 w-4 ${!isCollapsed ? 'mr-2' : ''}`} />
          {!isCollapsed && 'My Account'}
        </Button>

        {/* Wallet Button */}
        <Button
          variant="ghost"
          className={`w-full ${isCollapsed ? 'justify-center' : 'justify-start'}`}
          onClick={handleWalletClick}
        >
          <Wallet className={`h-4 w-4 ${!isCollapsed ? 'mr-2' : ''}`} />
          {!isCollapsed && 'Wallet'}
        </Button>

        {/* Sign Out Button */}
        <Button
          variant="ghost"
          className={`w-full ${isCollapsed ? 'justify-center' : 'justify-start'} text-red-600 hover:bg-red-50`}
          onClick={handleSignOut}
        >
          <LogOut className={`h-4 w-4 ${!isCollapsed ? 'mr-2' : ''}`} />
          {!isCollapsed && 'Sign Out'}
        </Button>
      </div>
    </div>
  );
}
