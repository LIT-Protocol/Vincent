import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useLocation, useNavigate, useParams } from 'react-router';
import { vincentApiClient } from '@/components/app-dashboard/mock-forms/vincentApiClient';

export function useAppSidebar() {
  const { address, isConnected } = useAccount();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  // Show sidebar only when wallet is connected
  const shouldShowSidebar = isConnected;

  // Sidebar state management
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [selectedForm, setSelectedForm] = useState<string | null>(null);
  const [selectedListView, setSelectedListView] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [selectedAppView, setSelectedAppView] = useState<string | null>(null);

  // Get apps data for sidebar (only if sidebar should be shown)
  const { data: apiApps } = vincentApiClient.useListAppsQuery(undefined, {
    skip: !shouldShowSidebar,
  });

  const filteredApps = useMemo(() => {
    if (!address || !apiApps || apiApps.length === 0) return [];
    return apiApps.filter(
      (apiApp: any) => apiApp.managerAddress.toLowerCase() === address.toLowerCase(),
    );
  }, [apiApps, address]);

  useEffect(() => {
    const pathname = location.pathname;

    if (pathname === '/developer') {
      setSelectedForm(null);
      setSelectedListView(null);
      setSelectedApp(null);
      setSelectedAppView(null);
    } else if (pathname === '/developer/apps') {
      setSelectedForm(null);
      setSelectedListView('app');
      setSelectedApp(null);
      setSelectedAppView(null);
      setExpandedMenus(new Set(['app', 'my-apps']));
    } else if (pathname === '/developer/tools') {
      setSelectedForm(null);
      setSelectedListView('tool');
      setSelectedApp(null);
      setSelectedAppView(null);
    } else if (pathname === '/developer/policies') {
      setSelectedForm(null);
      setSelectedListView('policy');
      setSelectedApp(null);
      setSelectedAppView(null);
    } else if (pathname === '/developer/create-app') {
      setSelectedForm('create-app');
      setSelectedListView(null);
      setSelectedApp(null);
      setSelectedAppView(null);
    } else if (pathname === '/developer/create-tool') {
      setSelectedForm('create-tool');
      setSelectedListView(null);
      setSelectedApp(null);
      setSelectedAppView(null);
    } else if (pathname === '/developer/create-policy') {
      setSelectedForm('create-policy');
      setSelectedListView(null);
      setSelectedApp(null);
      setSelectedAppView(null);
    } else if (params.appId) {
      // Handle app-specific routes using params
      const appId = parseInt(params.appId);
      const app = filteredApps.find((app) => app.appId === appId);
      setSelectedApp(app);

      // Expand the full navigation hierarchy
      const menusToExpand = new Set(['app', 'my-apps']);

      if (params.versionId) {
        // On a specific version page - expand all the way down
        setSelectedAppView(`version-${params.versionId}`);
        menusToExpand.add('app-versions');
      } else if (pathname.includes('/versions')) {
        // On the versions list page
        setSelectedAppView('app-versions');
        menusToExpand.add('app-versions');
      } else {
        // On the app details page
        setSelectedAppView('app-details');
      }

      setExpandedMenus(menusToExpand);
    }
  }, [location.pathname, params.appId, params.versionId, filteredApps]);

  // Handle menu toggle
  const handleToggleMenu = useCallback((menuId: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        newSet.delete(menuId);
      } else {
        newSet.add(menuId);
      }
      return newSet;
    });
  }, []);

  // Handle navigation
  const handleCategoryClick = useCallback(
    (categoryId: string) => {
      if (categoryId === 'app') {
        navigate('/developer/apps');
      } else if (categoryId === 'tool') {
        navigate('/developer/tools');
      } else if (categoryId === 'policy') {
        navigate('/developer/policies');
      }
    },
    [navigate],
  );

  const handleMenuSelection = useCallback(
    (id: string) => {
      if (id === 'dashboard') {
        navigate('/developer');
      } else if (id === 'my-apps') {
        navigate('/developer/apps');
      } else if (id === 'my-tools') {
        navigate('/developer/tools');
      } else if (id === 'my-policies') {
        navigate('/developer/policies');
      } else if (id === 'create-app') {
        navigate('/developer/create-app');
      } else if (id === 'create-tool') {
        navigate('/developer/create-tool');
      } else if (id === 'create-policy') {
        navigate('/developer/create-policy');
      }
    },
    [navigate],
  );

  const handleAppSelection = useCallback(
    (app: any) => {
      if (app) {
        navigate(`/appId/${app.appId}`);
      } else {
        navigate('/developer/apps');
      }
    },
    [navigate],
  );

  const handleAppViewSelection = useCallback(
    (viewId: string) => {
      if (selectedApp) {
        if (viewId === 'app-details') {
          navigate(`/appId/${selectedApp.appId}`);
        } else if (viewId === 'app-versions') {
          navigate(`/appId/${selectedApp.appId}/versions`);
        } else if (viewId.startsWith('version-')) {
          const versionNumber = viewId.replace('version-', '');
          navigate(`/appId/${selectedApp.appId}/version/${versionNumber}`);
        }
      }
    },
    [navigate, selectedApp],
  );

  return {
    // State
    shouldShowSidebar,
    expandedMenus,
    selectedForm,
    selectedListView,
    selectedApp,
    selectedAppView,
    apps: filteredApps,
    // Handlers
    onToggleMenu: handleToggleMenu,
    onCategoryClick: handleCategoryClick,
    onMenuSelection: handleMenuSelection,
    onAppSelection: handleAppSelection,
    onAppViewSelection: handleAppViewSelection,
  };
}
