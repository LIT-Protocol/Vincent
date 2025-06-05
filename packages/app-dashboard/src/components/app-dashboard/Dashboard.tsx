import { useEffect, useState, useCallback, useMemo } from 'react';
import { useErrorPopup } from '@/providers/ErrorPopup';
import { useAccount } from 'wagmi';
import { useNavigate, useLocation, useParams } from 'react-router';

import { CreateAppForm } from '@/components/app-dashboard/mock-forms/generic/AppForms';
import { CreateToolForm } from '@/components/app-dashboard/mock-forms/generic/ToolForms';
import { CreatePolicyForm } from '@/components/app-dashboard/mock-forms/generic/PolicyForms';
import {
  EditAppForm,
  DeleteAppForm,
  CreateAppVersionForm,
  EditAppVersionForm,
} from '@/components/app-dashboard/mock-forms/generic/AppForms';
import { AppVersionsListView } from '@/components/app-dashboard/AppVersionsListView';
import { VersionDetails } from '@/components/app-dashboard/VersionDetails';

import { AppsList, ToolsList, PoliciesList } from './ResourceLists';
import { Sidebar } from './Sidebar';
import { DashboardContent } from './DashboardContent';

import { vincentApiClient } from '@/components/app-dashboard/mock-forms/vincentApiClient';

// Form components mapping
const formComponents: {
  [key: string]: {
    component: React.ComponentType<{ appData?: any; hideHeader?: boolean }>;
    title: string;
    description: string;
  };
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
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [selectedAppView, setSelectedAppView] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<string | null>(null);
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const { address } = useAccount();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

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

  // Get app versions when an app is selected
  const {
    data: appVersions,
    error: versionsError,
    isLoading: isVersionsLoading,
  } = vincentApiClient.useGetAppVersionsQuery(
    { appId: parseInt(selectedApp?.appId || '0') },
    { skip: !selectedApp?.appId },
  );

  // Extract appId from URL parameters for direct access
  const urlAppId = params.appId;

  // Fetch app data when accessing URLs directly with appId
  const {
    data: currentAppData,
    error: currentAppError,
    isLoading: isCurrentAppLoading,
  } = vincentApiClient.useGetAppQuery({ appId: parseInt(urlAppId || '0') }, { skip: !urlAppId });

  // Initialize selectedApp from URL when accessing direct links
  useEffect(() => {
    // Don't initialize app state if we're on the dashboard route
    if (location.pathname === '/') return;

    // Only initialize if we have URL app ID, current app data, but no selected app yet
    if (urlAppId && currentAppData && !selectedApp) {
      setSelectedApp(currentAppData);

      // Determine initial view and menu state based on URL
      const pathname = location.pathname;
      const versionMatch = pathname.match(/\/version\/(\d+)/);
      const versionNumber = versionMatch ? versionMatch[1] : null;

      const initialMenus = new Set(['app', 'my-apps']);
      let initialView = 'app-details';

      if (pathname.includes('/versions')) {
        initialView = 'app-versions';
        initialMenus.add('app-versions');
      } else if (versionNumber) {
        initialView = `version-${versionNumber}`;
        initialMenus.add('app-versions');
      }

      setSelectedAppView(initialView);
      setExpandedMenus(initialMenus);
      setSelectedForm(null);
      setSelectedListView(null);
    }
  }, [urlAppId, currentAppData, location.pathname]);

  // Sync modal state with URL
  useEffect(() => {
    // Don't process URL changes if we're in the middle of closing or navigating
    if (isClosingModal || isNavigating) return;

    const pathname = location.pathname;

    // If we're on the dashboard route ('/'), don't try to reactivate app state
    if (pathname === '/') {
      // Close modal if we're not on a modal route and modal is currently open
      if (isModalOpen && !isClosingModal) {
        setIsModalOpen(false);
        setModalContent(null);
      }
      // Clear all app-related state when on dashboard (unless we're navigating to prevent race conditions)
      if (!isNavigating && (selectedApp || selectedAppView || selectedListView)) {
        setSelectedForm(null);
        setSelectedListView(null);
        setSelectedApp(null);
        setSelectedAppView(null);
        setExpandedMenus(new Set());
      }
      return;
    }

    // Handle category routes
    if (pathname === '/apps') {
      // Only update state if it's not already correct to prevent unnecessary re-renders
      if (selectedListView !== 'app' || selectedApp !== null || selectedAppView !== null) {
        setSelectedForm(null);
        setSelectedListView('app');
        setSelectedApp(null);
        setSelectedAppView(null);
        setExpandedMenus(new Set(['app', 'my-apps']));
      }
      return;
    }

    if (pathname === '/tools') {
      // Only update state if it's not already correct to prevent unnecessary re-renders
      if (selectedListView !== 'tool' || selectedApp !== null || selectedAppView !== null) {
        setSelectedForm(null);
        setSelectedListView('tool');
        setSelectedApp(null);
        setSelectedAppView(null);
        setExpandedMenus(new Set(['tool']));
      }
      return;
    }

    if (pathname === '/policies') {
      // Only update state if it's not already correct to prevent unnecessary re-renders
      if (selectedListView !== 'policy' || selectedApp !== null || selectedAppView !== null) {
        setSelectedForm(null);
        setSelectedListView('policy');
        setSelectedApp(null);
        setSelectedAppView(null);
        setExpandedMenus(new Set(['policy']));
      }
      return;
    }

    // Handle create form routes
    if (pathname === '/create-app') {
      if (
        selectedForm !== 'create-app' ||
        selectedApp !== null ||
        selectedAppView !== null ||
        selectedListView !== null
      ) {
        setSelectedForm('create-app');
        setSelectedListView(null);
        setSelectedApp(null);
        setSelectedAppView(null);
        setExpandedMenus(new Set(['app']));
      }
      return;
    }

    if (pathname === '/create-tool') {
      if (
        selectedForm !== 'create-tool' ||
        selectedApp !== null ||
        selectedAppView !== null ||
        selectedListView !== null
      ) {
        setSelectedForm('create-tool');
        setSelectedListView(null);
        setSelectedApp(null);
        setSelectedAppView(null);
        setExpandedMenus(new Set(['tool']));
      }
      return;
    }

    if (pathname === '/create-policy') {
      if (
        selectedForm !== 'create-policy' ||
        selectedApp !== null ||
        selectedAppView !== null ||
        selectedListView !== null
      ) {
        setSelectedForm('create-policy');
        setSelectedListView(null);
        setSelectedApp(null);
        setSelectedAppView(null);
        setExpandedMenus(new Set(['policy']));
      }
      return;
    }

    // Extract version info from URL if present
    const versionMatch = pathname.match(/\/version\/(\d+)/);
    const versionNumber = versionMatch ? versionMatch[1] : null;

    // Check if we're on a modal route
    if (pathname.includes('/edit') && urlAppId && currentAppData) {
      if (pathname.endsWith('/edit') && !pathname.includes('/version/')) {
        // Edit app modal
        setModalContent('edit-app');
        setIsModalOpen(true);
        if (selectedApp) setSelectedAppView('app-details');
      } else if (pathname.includes('/version/') && pathname.endsWith('/edit')) {
        // Edit version modal
        if (versionNumber) {
          setModalContent(`edit-version-${versionNumber}`);
          setIsModalOpen(true);
          if (selectedApp) setSelectedAppView(`version-${versionNumber}`);
        }
      }
    } else if (pathname.includes('/create-version') && urlAppId && currentAppData) {
      // Create version modal
      setModalContent('create-version');
      setIsModalOpen(true);
      if (selectedApp) setSelectedAppView('app-details');
    } else if (pathname.includes('/delete') && urlAppId && currentAppData) {
      // Delete app modal
      setModalContent('delete-app');
      setIsModalOpen(true);
      if (selectedApp) setSelectedAppView('app-details');
    } else if (pathname.includes('/versions') && urlAppId && currentAppData) {
      // App versions view
      if (selectedApp) {
        setSelectedAppView('app-versions');
        // Expand the app-versions menu to show individual versions
        setExpandedMenus((prev) => new Set([...prev, 'app-versions']));
      }
    } else if (versionNumber && urlAppId && currentAppData) {
      // Specific version view
      if (selectedApp) {
        setSelectedAppView(`version-${versionNumber}`);
        // Expand the app-versions menu to show individual versions
        setExpandedMenus((prev) => new Set([...prev, 'app-versions']));
      }
    } else {
      // Close modal if we're not on a modal route and modal is currently open
      if (isModalOpen && !isClosingModal) {
        setIsModalOpen(false);
        setModalContent(null);
      }
      // Set default view for app details (only if we have an app context and are not on dashboard)
      if (
        urlAppId &&
        currentAppData &&
        !pathname.includes('/version') &&
        !pathname.includes('/edit') &&
        !pathname.includes('/create') &&
        !pathname.includes('/delete')
      ) {
        if (selectedApp) setSelectedAppView('app-details');
      }
    }
  }, [location.pathname, isClosingModal, isNavigating, urlAppId, currentAppData]);

  // Handle modal actions
  const openModal = (contentType: string) => {
    if (!selectedApp) return;

    setModalContent(contentType);
    setIsModalOpen(true);

    // Navigate to appropriate modal URLs
    if (contentType === 'edit-app') {
      navigate(`/appId/${selectedApp.appId}/edit`);
    } else if (contentType === 'create-version') {
      navigate(`/appId/${selectedApp.appId}/create-version`);
    } else if (contentType === 'delete-app') {
      navigate(`/appId/${selectedApp.appId}/delete`);
    } else if (contentType.startsWith('edit-version-')) {
      const versionNumber = contentType.replace('edit-version-', '');
      navigate(`/appId/${selectedApp.appId}/version/${versionNumber}/edit`);
    }
  };

  const closeModal = () => {
    // Set flag to prevent useEffect from interfering
    setIsClosingModal(true);
    setIsModalOpen(false);
    setModalContent(null);

    // Navigate back to appropriate page based on current context
    if (selectedApp && selectedAppView) {
      if (selectedAppView.startsWith('version-')) {
        // If we were on a version page, go back to that version
        const versionNumber = selectedAppView.replace('version-', '');
        navigate(`/appId/${selectedApp.appId}/version/${versionNumber}`);
      } else if (selectedAppView === 'app-versions') {
        // If we were viewing versions list, go back to versions
        navigate(`/appId/${selectedApp.appId}/versions`);
      } else {
        // Otherwise go back to app details
        navigate(`/appId/${selectedApp.appId}`);
      }
    } else if (selectedApp) {
      // Default to app details if we have a selected app
      navigate(`/appId/${selectedApp.appId}`);
    } else {
      // Fall back to dashboard
      navigate('/');
    }

    // Reset the closing flag after navigation
    setTimeout(() => setIsClosingModal(false), 100);
  };

  // Handle keyboard events for modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isModalOpen && !isClosingModal) {
        closeModal();
      }
    };

    if (isModalOpen && !isClosingModal) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen, isClosingModal, closeModal]);

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
        // Opening a menu
        if (menuId === 'app-versions' && selectedApp) {
          // For app-specific submenus, keep parent menus open
          newSet.add('app');
          newSet.add('my-apps');
          newSet.add(menuId);
        } else {
          // For top-level menus, close others and open this one
          newSet.clear();
          newSet.add(menuId);
        }
      }
      return newSet;
    });
  };

  // Handle category clicks (show list view and ensure menu stays open)
  const handleCategoryClick = (categoryId: string) => {
    setIsNavigating(true);

    // Close other expanded menus and open the clicked one
    if (categoryId === 'app') {
      // For App category, also expand My Apps to show the apps list
      setExpandedMenus(new Set([categoryId, 'my-apps']));
    } else {
      setExpandedMenus(new Set([categoryId]));
    }

    // Automatically select the "My [Category]" view and highlight the corresponding submenu item
    setSelectedForm(null);
    setSelectedListView(categoryId);
    // Clear app selection when navigating back to categories
    setSelectedApp(null);
    setSelectedAppView(null);

    // Navigate to appropriate category routes
    if (categoryId === 'app') {
      navigate('/apps');
    } else if (categoryId === 'tool') {
      navigate('/tools');
    } else if (categoryId === 'policy') {
      navigate('/policies');
    }

    // Reset navigation flag after a brief delay
    setTimeout(() => setIsNavigating(false), 100);
  };

  // Handle app selection
  const handleAppSelection = (app: any) => {
    if (app) {
      setIsNavigating(true);
      setSelectedApp(app);
      setSelectedAppView('app-details'); // Default to app details view
      setSelectedForm(null);
      setSelectedListView(null);
      setExpandedMenus(new Set(['app', 'my-apps'])); // Keep both App menu and My Apps expanded when selecting an app
      // Navigate to app details route
      navigate(`/appId/${app.appId}`);
      setTimeout(() => setIsNavigating(false), 100);
    } else {
      // Going back to app list
      setIsNavigating(true);
      setSelectedApp(null);
      setSelectedAppView(null);
      setSelectedForm(null);
      setSelectedListView('app');
      setExpandedMenus(new Set(['app', 'my-apps']));
      // Navigate back to apps list
      navigate('/apps');
      setTimeout(() => setIsNavigating(false), 100);
    }
  };

  // Handle app view selection
  const handleAppViewSelection = (viewId: string) => {
    setSelectedAppView(viewId);

    // Navigate to appropriate routes based on the view
    if (selectedApp) {
      if (viewId === 'app-details') {
        navigate(`/appId/${selectedApp.appId}`);
      } else if (viewId === 'app-versions') {
        navigate(`/appId/${selectedApp.appId}/versions`);
      } else if (viewId.startsWith('version-')) {
        const versionNumber = viewId.replace('version-', '');
        navigate(`/appId/${selectedApp.appId}/version/${versionNumber}`);
      } else if (viewId.startsWith('edit-version-')) {
        const versionNumber = viewId.replace('edit-version-', '');
        navigate(`/appId/${selectedApp.appId}/version/${versionNumber}/edit`);
      }
    }
  };

  // Handle navigation and form selection
  const handleMenuSelection = (id: string) => {
    if (id === 'dashboard') {
      // Clear all app-related state first
      setIsNavigating(true);
      setSelectedForm(null);
      setSelectedListView(null);
      setSelectedApp(null);
      setSelectedAppView(null);
      setExpandedMenus(new Set()); // Close all dropdowns when going to dashboard

      // Navigate to dashboard
      navigate('/');
      setTimeout(() => setIsNavigating(false), 100);
    } else if (id === 'app' || id === 'tool' || id === 'policy') {
      // Use the dedicated category click handler
      handleCategoryClick(id);
    } else if (id === 'my-apps') {
      // Show apps list view and keep app menu expanded
      // Batch state updates to prevent race conditions
      setIsNavigating(true);
      setSelectedForm(null);
      setSelectedApp(null);
      setSelectedAppView(null);
      setSelectedListView('app');
      setExpandedMenus(new Set(['app', 'my-apps']));
      // Navigate to apps route
      navigate('/apps');
      // Reset navigation flag after a brief delay
      setTimeout(() => setIsNavigating(false), 100);
    } else if (id === 'my-tools') {
      // Show tools list view and keep tool menu expanded
      setIsNavigating(true);
      setSelectedForm(null);
      setSelectedListView('tool');
      setSelectedApp(null);
      setSelectedAppView(null);
      setExpandedMenus(new Set(['tool']));
      // Navigate to tools route
      navigate('/tools');
      setTimeout(() => setIsNavigating(false), 100);
    } else if (id === 'my-policies') {
      // Show policies list view and keep policy menu expanded
      setIsNavigating(true);
      setSelectedForm(null);
      setSelectedListView('policy');
      setSelectedApp(null);
      setSelectedAppView(null);
      setExpandedMenus(new Set(['policy']));
      // Navigate to policies route
      navigate('/policies');
      setTimeout(() => setIsNavigating(false), 100);
    } else if (formComponents[id]) {
      // Handle form selection - keep the appropriate menu expanded
      setSelectedForm(id);
      setSelectedListView(null);
      setSelectedApp(null);
      setSelectedAppView(null);

      // Navigate to appropriate creation routes
      if (id === 'create-app') {
        setExpandedMenus(new Set(['app']));
        navigate('/create-app');
      } else if (id === 'create-tool') {
        setExpandedMenus(new Set(['tool']));
        navigate('/create-tool');
      } else if (id === 'create-policy') {
        setExpandedMenus(new Set(['policy']));
        navigate('/create-policy');
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

  // Render app-specific content
  const renderAppContent = () => {
    if (!selectedApp) return null;

    // Handle version-specific views
    if (selectedAppView?.startsWith('version-')) {
      const versionNumber = parseInt(selectedAppView.replace('version-', ''));

      return (
        <div className="space-y-6">
          {/* Version Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {selectedApp.name} - Version {versionNumber}
              </h1>
            </div>
          </div>

          {/* Version Management Actions */}
          <div className="bg-white border rounded-lg">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-medium text-gray-900">Version Management</h3>
              <p className="text-gray-600 text-sm mt-1">Manage this specific version</p>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => openModal(`edit-version-${versionNumber}`)}
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
                  Edit Version
                </button>
              </div>
            </div>
          </div>

          {/* Version Details Component - without appName to avoid duplicate header */}
          <VersionDetails appId={parseInt(selectedApp.appId)} version={versionNumber} />
        </div>
      );
    }

    // Handle edit version views
    if (selectedAppView?.startsWith('edit-version-')) {
      const versionNumber = parseInt(selectedAppView.replace('edit-version-', ''));
      return (
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">Edit Version {versionNumber}</h1>
              <p className="text-gray-600 mt-2">
                Update version {versionNumber} of {selectedApp.name}
              </p>
            </div>
          </div>
          <EditAppVersionForm hideHeader={true} />
        </div>
      );
    }

    switch (selectedAppView) {
      case 'app-details': {
        // Use the rich app details component with action buttons
        const renderAppDetails = () => {
          // Filter out unnecessary fields and format dates
          const filteredApp: [string, any][] = Object.entries(selectedApp)
            .filter(
              ([key]) =>
                !['_id', '__v', 'logo', 'managerAddress', 'name', 'description'].includes(key),
            )
            .map((entry: [string, any]) => {
              const [key, value] = entry;
              if (key === 'createdAt' || key === 'updatedAt') {
                return [key, new Date(value as string).toLocaleString()];
              }
              return [key, value];
            });

          return (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900">{selectedApp.name}</h1>
                  <p className="text-gray-600 mt-2">{selectedApp.description}</p>
                </div>
                {selectedApp.logo && (
                  <div className="ml-6 flex-shrink-0">
                    <img
                      src={
                        selectedApp.logo.startsWith('data:')
                          ? selectedApp.logo
                          : `data:image/png;base64,${selectedApp.logo}`
                      }
                      alt="App logo"
                      className="w-16 h-16 rounded-lg border shadow-sm object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const errorDiv = document.createElement('div');
                        errorDiv.className =
                          'w-16 h-16 bg-gray-100 rounded-lg border flex items-center justify-center text-xs text-gray-500';
                        errorDiv.textContent = 'No Logo';
                        target.parentNode?.appendChild(errorDiv);
                      }}
                    />
                  </div>
                )}
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
                      onClick={() => openModal('edit-app')}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
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
                      onClick={() => openModal('create-version')}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
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
                      onClick={() => openModal('delete-app')}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-600 bg-white hover:bg-red-50 transition-colors"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
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
        };

        return renderAppDetails();
      }

      case 'app-versions':
        return (
          <AppVersionsListView
            versions={appVersions || []}
            appName={selectedApp.name}
            appId={parseInt(selectedApp.appId)}
            latestVersion={selectedApp.latestVersion}
            isLoading={isVersionsLoading}
            error={versionsError}
          />
        );

      default:
        return null;
    }
  };

  if (!dashboard || isRefetching) {
    return (
      <div className="flex h-screen">
        <Sidebar
          expandedMenus={expandedMenus}
          selectedForm={selectedForm}
          selectedListView={selectedListView}
          selectedApp={selectedApp}
          selectedAppView={selectedAppView}
          apps={filteredApps}
          onToggleMenu={toggleMenu}
          onCategoryClick={handleCategoryClick}
          onMenuSelection={handleMenuSelection}
          onAppSelection={handleAppSelection}
          onAppViewSelection={handleAppViewSelection}
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

  // Show loading if we're waiting for app data from direct URL access
  if (urlAppId && isCurrentAppLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar
          expandedMenus={expandedMenus}
          selectedForm={selectedForm}
          selectedListView={selectedListView}
          selectedApp={selectedApp}
          selectedAppView={selectedAppView}
          apps={filteredApps}
          onToggleMenu={toggleMenu}
          onCategoryClick={handleCategoryClick}
          onMenuSelection={handleMenuSelection}
          onAppSelection={handleAppSelection}
          onAppViewSelection={handleAppViewSelection}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex items-center justify-center h-[50vh]">
              <div className="space-y-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-sm text-gray-600">Loading app data...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if app data failed to load from direct URL access
  if (urlAppId && currentAppError) {
    return (
      <div className="flex h-screen">
        <Sidebar
          expandedMenus={expandedMenus}
          selectedForm={selectedForm}
          selectedListView={selectedListView}
          selectedApp={selectedApp}
          selectedAppView={selectedAppView}
          apps={filteredApps}
          onToggleMenu={toggleMenu}
          onCategoryClick={handleCategoryClick}
          onMenuSelection={handleMenuSelection}
          onAppSelection={handleAppSelection}
          onAppViewSelection={handleAppViewSelection}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex items-center justify-center h-[50vh]">
              <div className="space-y-4 text-center">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">App Not Found</h2>
                <p className="text-gray-600 mb-6">
                  Could not load app with ID {urlAppId}. The app may not exist or you may not have
                  access to it.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Dashboard
                </button>
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
        selectedApp={selectedApp}
        selectedAppView={selectedAppView}
        apps={filteredApps}
        onToggleMenu={toggleMenu}
        onCategoryClick={handleCategoryClick}
        onMenuSelection={handleMenuSelection}
        onAppSelection={handleAppSelection}
        onAppViewSelection={handleAppViewSelection}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div key={selectedForm || selectedListView || selectedApp?.appId || 'dashboard'}>
            {selectedForm && formComponents[selectedForm] ? (
              // Render selected form
              (() => {
                const FormComponent = formComponents[selectedForm].component;
                return <FormComponent appData={selectedApp} hideHeader={false} />;
              })()
            ) : selectedApp && selectedAppView ? (
              // Render app-specific content
              renderAppContent()
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
                    onAppClick={handleAppSelection}
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

      {/* Modal Overlay */}
      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {modalContent === 'edit-app' && 'Edit App'}
                {modalContent === 'create-version' && 'Create App Version'}
                {modalContent === 'delete-app' && 'Delete App'}
                {modalContent?.startsWith('edit-version-') &&
                  `Edit Version ${modalContent.replace('edit-version-', '')}`}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {modalContent === 'edit-app' && (
                <EditAppForm appData={selectedApp} hideHeader={true} />
              )}
              {modalContent === 'create-version' && (
                <CreateAppVersionForm appData={selectedApp} hideHeader={true} />
              )}
              {modalContent === 'delete-app' && (
                <DeleteAppForm appData={selectedApp} hideHeader={true} />
              )}
              {modalContent?.startsWith('edit-version-') && (
                <EditAppVersionForm hideHeader={true} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
