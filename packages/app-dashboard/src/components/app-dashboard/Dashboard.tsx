import { useEffect, useState, useCallback, useMemo } from 'react';
import { useErrorPopup } from '@/providers/ErrorPopup';
import { useAccount } from 'wagmi';

import { CreateAppForm } from '@/components/app-dashboard/mock-forms/generic/AppForms';
import { CreateToolForm } from '@/components/app-dashboard/mock-forms/generic/ToolForms';
import { CreatePolicyForm } from '@/components/app-dashboard/mock-forms/generic/PolicyForms';

import { AppsList, ToolsList, PoliciesList } from './ResourceLists';
import { Sidebar } from './Sidebar';
import { DashboardContent } from './DashboardContent';

import { vincentApiClient } from '@/components/app-dashboard/mock-forms/vincentApiClient';

// Form components mapping
const formComponents: {
  [key: string]: { component: React.ComponentType; title: string; description: string };
} = {
  'create-app': {
    component: CreateAppForm,
    title: 'Create App',
    description: 'Create a new application',
  },
  'create-tool': {
    component: CreateToolForm,
    title: 'Create Tool',
    description: 'Create a new tool',
  },
  'create-policy': {
    component: CreatePolicyForm,
    title: 'Create Policy',
    description: 'Create a new policy',
  },
};

export default function DashboardScreen({ vincentApp }: { vincentApp: any[] }) {
  const [dashboard, setDashboard] = useState<any[]>([]);
  const [isRefetching, setIsRefetching] = useState(false);
  const [sortOption, setSortOption] = useState<string>('all');
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [selectedForm, setSelectedForm] = useState<string | null>(null);
  const [selectedListView, setSelectedListView] = useState<string | null>(null);
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

  // Handle menu expansion
  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        // If closing the menu, also clear any selected views related to that menu
        newSet.delete(menuId);
        if (selectedListView === menuId) {
          setSelectedListView(null);
        }
        if (
          selectedForm &&
          ((menuId === 'app' && selectedForm === 'create-app') ||
            (menuId === 'tool' && selectedForm === 'create-tool') ||
            (menuId === 'policy' && selectedForm === 'create-policy'))
        ) {
          setSelectedForm(null);
        }
      } else {
        // Opening a menu - close others and open this one
        newSet.clear();
        newSet.add(menuId);
      }
      return newSet;
    });
  };

  // Handle category clicks (show list view and ensure menu stays open)
  const handleCategoryClick = (categoryId: string) => {
    console.log('🎯 Category click:', categoryId);

    // Close other expanded menus and open the clicked one
    setExpandedMenus(new Set([categoryId]));

    // Automatically select the "My [Category]" view and highlight the corresponding submenu item
    setSelectedForm(null);
    setSelectedListView(categoryId);
  };

  // Handle navigation and form selection
  const handleMenuSelection = (id: string) => {
    console.log('🎯 Menu selection:', id);
    if (id === 'dashboard') {
      setSelectedForm(null);
      setSelectedListView(null);
      setExpandedMenus(new Set()); // Close all dropdowns when going to dashboard
    } else if (id === 'app' || id === 'tool' || id === 'policy') {
      // Use the dedicated category click handler
      handleCategoryClick(id);
    } else if (id === 'my-apps') {
      // Show apps list view and keep app menu expanded
      setSelectedForm(null);
      setSelectedListView('app');
      setExpandedMenus(new Set(['app']));
    } else if (id === 'my-tools') {
      // Show tools list view and keep tool menu expanded
      setSelectedForm(null);
      setSelectedListView('tool');
      setExpandedMenus(new Set(['tool']));
    } else if (id === 'my-policies') {
      // Show policies list view and keep policy menu expanded
      setSelectedForm(null);
      setSelectedListView('policy');
      setExpandedMenus(new Set(['policy']));
    } else if (formComponents[id]) {
      // Handle form selection - keep the appropriate menu expanded
      setSelectedForm(id);
      setSelectedListView(null);

      // Keep the parent menu expanded based on the form type
      if (id === 'create-app') {
        setExpandedMenus(new Set(['app']));
      } else if (id === 'create-tool') {
        setExpandedMenus(new Set(['tool']));
      } else if (id === 'create-policy') {
        setExpandedMenus(new Set(['policy']));
      }
    }
  };

  // Filter functions for each data type - memoized to prevent excessive re-computation
  const filteredApps = useMemo(() => {
    if (!address || !apiApps || apiApps.length === 0) return [];

    return apiApps.filter(
      (apiApp: any) => apiApp.managerAddress.toLowerCase() === address.toLowerCase(),
    );
  }, [apiApps, address]);

  const filteredTools = useMemo(() => {
    if (!address || toolsError || !allTools || allTools.length === 0) return [];

    return allTools.filter(
      (tool: any) => tool.authorWalletAddress.toLowerCase() === address.toLowerCase(),
    );
  }, [allTools, address, toolsError]);

  const filteredPolicies = useMemo(() => {
    if (!address || policiesError || !allPolicies || allPolicies.length === 0) return [];

    return allPolicies.filter(
      (policy: any) => policy.authorWalletAddress.toLowerCase() === address.toLowerCase(),
    );
  }, [allPolicies, address, policiesError]);

  useEffect(() => {
    if (vincentApp) {
      try {
        setDashboard(vincentApp);
      } catch (error) {
        console.error('Dashboard Error:', error);
        showError(
          error instanceof Error ? error.message : 'Error loading dashboard',
          'Dashboard Error',
        );
      } finally {
        setIsRefetching(false);
      }
    }
  }, [vincentApp, showError]);

  // Function to sort applications based on deployment status
  const getFilteredAppsForDashboard = useCallback(() => {
    const userApps = filteredApps;
    if (sortOption === 'all') {
      return userApps;
    }

    // Filter based on deployment status string (dev, test, prod)
    return userApps.filter((app) => app.deploymentStatus === sortOption);
  }, [filteredApps, sortOption]);

  if (!dashboard || isRefetching) {
    return (
      <div className="flex h-screen">
        <Sidebar
          expandedMenus={expandedMenus}
          selectedForm={selectedForm}
          selectedListView={selectedListView}
          onToggleMenu={toggleMenu}
          onCategoryClick={handleCategoryClick}
          onMenuSelection={handleMenuSelection}
        />

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
      <Sidebar
        expandedMenus={expandedMenus}
        selectedForm={selectedForm}
        selectedListView={selectedListView}
        onToggleMenu={toggleMenu}
        onCategoryClick={handleCategoryClick}
        onMenuSelection={handleMenuSelection}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div
            className="transition-all duration-300 ease-in-out opacity-0 animate-pulse"
            style={{
              opacity: 1,
              transform: 'translateY(0)',
              animation: 'none',
            }}
            key={selectedForm || selectedListView || 'dashboard'}
          >
            {selectedForm && formComponents[selectedForm] ? (
              // Render selected form
              (() => {
                const FormComponent = formComponents[selectedForm].component;
                return <FormComponent />;
              })()
            ) : selectedListView ? (
              // Render list views using the new components
              <div>
                {selectedListView === 'app' && (
                  <AppsList
                    apps={filteredAppsForDashboard}
                    isLoading={isApiLoading}
                    error={apiError}
                    sortOption={sortOption}
                    onSortChange={setSortOption}
                    onCreateClick={() => handleMenuSelection('create-app')}
                  />
                )}
                {selectedListView === 'tool' && (
                  <ToolsList
                    tools={filteredTools}
                    isLoading={toolsLoading}
                    error={toolsError}
                    onCreateClick={() => handleMenuSelection('create-tool')}
                  />
                )}
                {selectedListView === 'policy' && (
                  <PoliciesList
                    policies={filteredPolicies}
                    isLoading={policiesLoading}
                    error={policiesError}
                    onCreateClick={() => handleMenuSelection('create-policy')}
                  />
                )}
              </div>
            ) : (
              // Render dashboard using the new component
              <DashboardContent
                filteredAppsCount={filteredApps.length}
                filteredToolsCount={filteredTools.length}
                filteredPoliciesCount={filteredPolicies.length}
                onMenuSelection={handleMenuSelection}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
