import { ComponentProps, useState, useMemo, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useLocation, useNavigate, useParams } from 'react-router';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/app-dashboard/Sidebar';
import { vincentApiClient } from '@/components/app-dashboard/mock-forms/vincentApiClient';

function AppLayout({ children, className }: ComponentProps<'div'>) {
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

  // Filter apps like in the original Dashboard
  const filteredApps = useMemo(() => {
    if (!address || !apiApps || apiApps.length === 0) return [];
    return apiApps.filter(
      (apiApp: any) => apiApp.managerAddress.toLowerCase() === address.toLowerCase(),
    );
  }, [apiApps, address]);

  // Sync sidebar state with URL
  useEffect(() => {
    const pathname = location.pathname;

    if (pathname === '/') {
      setSelectedForm(null);
      setSelectedListView(null);
      setSelectedApp(null);
      setSelectedAppView(null);
    } else if (pathname === '/apps') {
      setSelectedForm(null);
      setSelectedListView('app');
      setSelectedApp(null);
      setSelectedAppView(null);
      setExpandedMenus(new Set(['app', 'my-apps']));
    } else if (pathname === '/tools') {
      setSelectedForm(null);
      setSelectedListView('tool');
      setSelectedApp(null);
      setSelectedAppView(null);
    } else if (pathname === '/policies') {
      setSelectedForm(null);
      setSelectedListView('policy');
      setSelectedApp(null);
      setSelectedAppView(null);
    } else if (pathname === '/create-app') {
      setSelectedForm('create-app');
      setSelectedListView(null);
      setSelectedApp(null);
      setSelectedAppView(null);
    } else if (pathname === '/create-tool') {
      setSelectedForm('create-tool');
      setSelectedListView(null);
      setSelectedApp(null);
      setSelectedAppView(null);
    } else if (pathname === '/create-policy') {
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
  const handleToggleMenu = (menuId: string) => {
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

  // Handle navigation
  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === 'app') {
      navigate('/apps');
    } else if (categoryId === 'tool') {
      navigate('/tools');
    } else if (categoryId === 'policy') {
      navigate('/policies');
    }
  };

  const handleMenuSelection = (id: string) => {
    if (id === 'dashboard') {
      navigate('/');
    } else if (id === 'my-apps') {
      navigate('/apps');
    } else if (id === 'my-tools') {
      navigate('/tools');
    } else if (id === 'my-policies') {
      navigate('/policies');
    } else if (id === 'create-app') {
      navigate('/create-app');
    } else if (id === 'create-tool') {
      navigate('/create-tool');
    } else if (id === 'create-policy') {
      navigate('/create-policy');
    }
  };

  const handleAppSelection = (app: any) => {
    if (app) {
      navigate(`/appId/${app.appId}`);
    } else {
      navigate('/apps');
    }
  };

  const handleAppViewSelection = (viewId: string) => {
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
  };

  return (
    <div className={cn('min-h-screen min-w-screen bg-gray-50 flex', className)}>
      {shouldShowSidebar && (
        <Sidebar
          expandedMenus={expandedMenus}
          selectedForm={selectedForm}
          selectedListView={selectedListView}
          selectedApp={selectedApp}
          selectedAppView={selectedAppView}
          apps={filteredApps}
          onToggleMenu={handleToggleMenu}
          onCategoryClick={handleCategoryClick}
          onMenuSelection={handleMenuSelection}
          onAppSelection={handleAppSelection}
          onAppViewSelection={handleAppViewSelection}
        />
      )}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}

export default AppLayout;
