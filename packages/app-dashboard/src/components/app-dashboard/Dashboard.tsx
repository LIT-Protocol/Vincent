import { useNavigate } from 'react-router';
import { AppView } from '@/services/types';
import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Plus,
  Home,
  Settings,
  User,
  LayoutDashboard,
  Wrench,
  Shield,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/app-dashboard/ui/card';
import { StatusFilterDropdown, FilterOption } from './ui/status-filter-dropdown';
import { useErrorPopup } from '@/providers/ErrorPopup';
import { StatusMessage } from '@/utils/shared/statusMessage';
import { useAccount } from 'wagmi';

import { vincentApiClient } from '@/components/app-dashboard/mock-forms/vincentApiClient';

// Deployment status names
const deploymentStatusNames = ['DEV', 'TEST', 'PROD'];

// Define filter options
const statusFilterOptions: FilterOption[] = [
  { id: 'all', label: 'All Applications' },
  { id: 'dev', label: 'DEV' },
  { id: 'test', label: 'TEST' },
  { id: 'prod', label: 'PROD' },
];

// Menu items with hierarchical structure
const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    id: 'app',
    label: 'App',
    icon: Plus,
    submenu: [{ id: 'create-app', label: 'Create App', route: '/create-app' }],
  },
  {
    id: 'tool',
    label: 'Tool',
    icon: Wrench,
    submenu: [{ id: 'create-tool', label: 'Create Tool', route: '/create-tool' }],
  },
  {
    id: 'policy',
    label: 'Policy',
    icon: Shield,
    submenu: [{ id: 'create-policy', label: 'Create Policy', route: '/create-policy' }],
  },
];

export default function DashboardScreen({ vincentApp }: { vincentApp: any[] }) {
  const [dashboard, setDashboard] = useState<any[]>([]);
  const [isRefetching, setIsRefetching] = useState(false);
  const [sortOption, setSortOption] = useState<string>('all');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'warning' | 'success' | 'error'>('info');
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [selectedListView, setSelectedListView] = useState<string | null>(null);
  const navigate = useNavigate();
  const { address } = useAccount();

  // Add the error popup hook
  const { showError } = useErrorPopup();

  // Use the same API pattern as app-details.tsx
  const {
    data: apiApps,
    error: apiError,
    isLoading: isApiLoading,
  } = vincentApiClient.useListAppsQuery();

  // Use the correct API hooks that actually exist
  const [getAllTools, { data: allTools, error: toolsError, isLoading: toolsLoading }] =
    vincentApiClient.useLazyListAllToolsQuery();
  const [getAllPolicies, { data: allPolicies, error: policiesError, isLoading: policiesLoading }] =
    vincentApiClient.useLazyListAllPoliciesQuery();

  // Automatically fetch tools and policies when component loads
  useEffect(() => {
    getAllTools();
    getAllPolicies();
  }, [getAllTools, getAllPolicies]);

  // Helper function to set status messages
  const showStatus = useCallback(
    (message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') => {
      setStatusMessage(message);
      setStatusType(type);
    },
    [],
  );

  // Create enhanced error function that shows both popup and status error
  const showErrorWithStatus = useCallback(
    (errorMessage: string, title?: string, details?: string) => {
      // Show error in popup
      showError(errorMessage, title || 'Error', details);
      // Also show in status message
      showStatus(errorMessage, 'error');
    },
    [showError, showStatus],
  );

  // Handle menu expansion
  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        newSet.delete(menuId);
      } else {
        newSet.add(menuId);
      }
      return newSet;
    });
  };

  // Handle category clicks (show list view and ensure menu stays open)
  const handleCategoryClick = (categoryId: string) => {
    console.log('🎯 Category click:', categoryId);
    // Ensure the menu is expanded
    setExpandedMenus((prev) => new Set([...prev, categoryId]));
    // Show the list view
    setSelectedListView(categoryId);
  };

  // Handle navigation and form selection
  const handleMenuSelection = (id: string, route?: string) => {
    console.log('🎯 Menu selection:', id);
    if (id === 'dashboard') {
      setSelectedListView(null);
    } else if (id === 'app' || id === 'tool' || id === 'policy') {
      // Use the dedicated category click handler
      handleCategoryClick(id);
    } else if (route) {
      // Navigate to dedicated route
      navigate(route);
    }
  };

  // Filter functions for each data type - memoized to prevent excessive re-computation
  const filteredApps = useMemo(() => {
    if (!address || !apiApps || apiApps.length === 0) return [];

    return apiApps.filter(
      (apiApp: any) =>
        apiApp.managerAddress && apiApp.managerAddress.toLowerCase() === address.toLowerCase(),
    );
  }, [apiApps, address]);

  const filteredTools = useMemo(() => {
    if (!address || toolsError || !allTools || allTools.length === 0) return [];

    return allTools.filter(
      (tool: any) =>
        tool.authorWalletAddress &&
        tool.authorWalletAddress.toLowerCase() === address.toLowerCase(),
    );
  }, [allTools, address, toolsError]);

  const filteredPolicies = useMemo(() => {
    if (!address || policiesError || !allPolicies || allPolicies.length === 0) return [];

    return allPolicies.filter(
      (policy: any) =>
        policy.authorWalletAddress &&
        policy.authorWalletAddress.toLowerCase() === address.toLowerCase(),
    );
  }, [allPolicies, address, policiesError]);

  useEffect(() => {
    if (vincentApp) {
      try {
        setDashboard(vincentApp);
      } catch (error) {
        console.error('Dashboard Error:', error);
        showErrorWithStatus(
          error instanceof Error ? error.message : 'Error loading dashboard',
          'Dashboard Error',
        );
      } finally {
        setIsRefetching(false);
      }
    }
  }, [vincentApp, showErrorWithStatus]);

  // Function to sort applications based on deployment status
  const getFilteredAppsForDashboard = useCallback(() => {
    const userApps = filteredApps;
    if (sortOption === 'all') {
      return userApps;
    }

    // Filter based on deployment status string (dev, test, prod)
    return userApps.filter((app) => app.deploymentStatus === sortOption);
  }, [filteredApps, sortOption]);

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper function to truncate address
  const truncateAddress = (address: string) => {
    if (!address) return 'N/A';
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  // Helper function to generate proper logo URL
  const getLogoUrl = (logo: string | undefined) => {
    if (!logo) return null;

    // If logo is just "image:1" or similar invalid values, return null
    if (logo === 'image:1' || logo.length < 10) return null;

    // If logo already starts with data:image, use it as-is
    if (logo.startsWith('data:image/')) {
      return logo;
    }

    // Otherwise, assume it's a base64 string and prefix it
    return `data:image/png;base64,${logo}`;
  };

  // List view components
  const renderAppsList = () => {
    const userApps = filteredApps;

    if (isApiLoading) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="ml-4">Loading apps...</p>
        </div>
      );
    }

    if (apiError) {
      return (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Error loading apps: {JSON.stringify(apiError)}</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Your Apps</h1>
          <div className="flex gap-3">
            <StatusFilterDropdown
              options={statusFilterOptions}
              selectedOptionId={sortOption}
              onChange={setSortOption}
            />
          </div>
        </div>

        {userApps.length === 0 ? (
          <div className="border rounded-lg p-8 text-center">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">No Apps Yet</h2>
            <p className="text-gray-600 mb-6">
              Create your first app to get started with Lit Protocol.
            </p>
            <Button
              variant="outline"
              className="text-gray-700"
              onClick={() => navigate('/create-app')}
            >
              <Plus className="h-4 w-4 mr-2 font-bold text-gray-700" />
              Create App
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {userApps.map((app, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/appId/${app.appId}`)}
              >
                <CardHeader>
                  <CardTitle className="flex justify-between items-center text-gray-900">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const logoUrl = getLogoUrl(app.logo);
                        return logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={`${app.name} logo`}
                            className="w-8 h-8 rounded-md object-cover flex-shrink-0"
                            onError={(e) => {
                              // Show fallback logo.svg if logo fails to load
                              e.currentTarget.src = '/logo.svg';
                            }}
                          />
                        ) : (
                          <img
                            src="/logo.svg"
                            alt="Vincent logo"
                            className="w-8 h-8 rounded-md object-cover flex-shrink-0"
                          />
                        );
                      })()}
                      <span>{app.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        v{app.activeVersion}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 uppercase">
                        {app.deploymentStatus}
                      </span>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-gray-700">{app.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-700">
                    <div>
                      <span className="font-medium">App ID:</span> {app.appId}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderToolsList = () => {
    const userTools = filteredTools;

    if (toolsLoading) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="ml-4">Loading tools...</p>
        </div>
      );
    }

    if (toolsError) {
      console.error('🔧 Tools API Error:', toolsError);
      return (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Error loading tools: {JSON.stringify(toolsError)}</p>
          <p className="text-gray-600 mb-4">You can still create tools using the forms below.</p>
          <Button onClick={() => navigate('/create-tool')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Tool
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Your Tools</h2>
        {userTools.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No tools found for your wallet address.</p>
            <Button onClick={() => navigate('/create-tool')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Tool
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {userTools.map((tool: any, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-gray-900">{tool.packageName}</CardTitle>
                  <CardDescription>
                    {tool.description || 'No description available'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600">
                    <p>Version: {tool.currentVersion || 'N/A'}</p>
                    <p>Owner: {truncateAddress(tool.authorWalletAddress)}</p>
                    <p>Created: {tool.createdAt ? formatDate(tool.createdAt) : 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderPoliciesList = () => {
    const userPolicies = filteredPolicies;

    if (policiesLoading) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="ml-4">Loading policies...</p>
        </div>
      );
    }

    if (policiesError) {
      console.error('🛡️ Policies API Error:', policiesError);
      return (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">
            Error loading policies: {JSON.stringify(policiesError)}
          </p>
          <p className="text-gray-600 mb-4">You can still create policies using the forms below.</p>
          <Button onClick={() => navigate('/create-policy')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Policy
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Your Policies</h2>
        {userPolicies.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No policies found for your wallet address.</p>
            <Button onClick={() => navigate('/create-policy')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Policy
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {userPolicies.map((policy: any, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-gray-900">{policy.packageName}</CardTitle>
                  <CardDescription>
                    {policy.description || 'No description available'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600">
                    <p>Version: {policy.currentVersion || 'N/A'}</p>
                    <p>Owner: {truncateAddress(policy.authorWalletAddress)}</p>
                    <p>Created: {policy.createdAt ? formatDate(policy.createdAt) : 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!dashboard || isRefetching) {
    return (
      <div className="flex h-screen">
        {/* Left Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-bold text-black mb-6">Vincent</h2>
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;

                // Handle items with submenus
                if (item.submenu) {
                  const isExpanded = expandedMenus.has(item.id);
                  return (
                    <div key={item.id}>
                      <div
                        className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors ${
                          selectedListView === item.id
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <button
                          className="flex items-center flex-1 text-left focus:outline-none"
                          onClick={() => handleCategoryClick(item.id)}
                          style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                        >
                          <Icon className="h-5 w-5 mr-3" />
                          {item.label}
                        </button>
                        <button
                          onClick={() => toggleMenu(item.id)}
                          className="p-1 hover:bg-gray-100 rounded focus:outline-none"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {isExpanded && (
                        <div
                          className="ml-8 mt-1 space-y-1 focus:outline-none"
                          style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                        >
                          {item.submenu.map((subItem) => (
                            <button
                              key={subItem.id}
                              onClick={() => handleMenuSelection(subItem.id, subItem.route)}
                              className={`w-full text-left px-4 py-2 text-sm rounded-lg transition-colors focus:outline-none ${
                                selectedListView === subItem.id
                                  ? 'bg-blue-50 text-blue-700 font-medium'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                              style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                            >
                              {subItem.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                // Handle regular items
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuSelection(item.id)}
                    className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${
                      item.id === 'dashboard' && !selectedListView
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex items-center justify-center h-[50vh]">
              <div className="space-y-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-sm text-gray-600">
                  {isRefetching ? 'Refreshing...' : 'Loading...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredAppsForDashboard = getFilteredAppsForDashboard();

  // Main dashboard view with sidebar layout
  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-bold text-black mb-6">Vincent</h2>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;

              // Handle items with submenus
              if (item.submenu) {
                const isExpanded = expandedMenus.has(item.id);
                return (
                  <div key={item.id}>
                    <div
                      className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors ${
                        selectedListView === item.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <button
                        className="flex items-center flex-1 text-left focus:outline-none"
                        onClick={() => handleCategoryClick(item.id)}
                        style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        {item.label}
                      </button>
                      <button
                        onClick={() => toggleMenu(item.id)}
                        className="p-1 hover:bg-gray-100 rounded focus:outline-none"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {isExpanded && (
                      <div
                        className="ml-8 mt-1 space-y-1 focus:outline-none"
                        style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                      >
                        {item.submenu.map((subItem) => (
                          <button
                            key={subItem.id}
                            onClick={() => handleMenuSelection(subItem.id, subItem.route)}
                            className={`w-full text-left px-4 py-2 text-sm rounded-lg transition-colors focus:outline-none ${
                              selectedListView === subItem.id
                                ? 'bg-blue-50 text-blue-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                            style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                          >
                            {subItem.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              // Handle regular items
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuSelection(item.id)}
                  className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${
                    item.id === 'dashboard' && !selectedListView
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {selectedListView ? (
            // Render list views
            <div>
              {selectedListView === 'app' && renderAppsList()}
              {selectedListView === 'tool' && renderToolsList()}
              {selectedListView === 'policy' && renderPoliciesList()}
            </div>
          ) : (
            // Render dashboard
            <div className="space-y-6">
              {/* Show status message at the top of the dashboard */}
              {statusMessage && <StatusMessage message={statusMessage} type={statusType} />}

              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              </div>

              {/* Navigation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Apps Card */}
                <Card
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-blue-200"
                  onClick={() => handleMenuSelection('app')}
                >
                  <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <Plus className="h-8 w-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900">Apps</CardTitle>
                    <CardDescription className="text-gray-600">
                      Manage your applications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {filteredApps.length}
                    </div>
                  </CardContent>
                </Card>

                {/* Tools Card */}
                <Card
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-green-200"
                  onClick={() => handleMenuSelection('tool')}
                >
                  <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <Wrench className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900">Tools</CardTitle>
                    <CardDescription className="text-gray-600">
                      Create and manage your tools
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      {filteredTools.length}
                    </div>
                  </CardContent>
                </Card>

                {/* Policies Card */}
                <Card
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-purple-200"
                  onClick={() => handleMenuSelection('policy')}
                >
                  <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                      <Shield className="h-8 w-8 text-purple-600" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900">Policies</CardTitle>
                    <CardDescription className="text-gray-600">
                      Define and manage access policies
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-2">
                      {filteredPolicies.length}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
