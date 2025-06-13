import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useReadAuthInfo } from './useAuthInfo';
import { fetchUserApps } from '@/utils/user-dashboard/userAppsUtils';
import { AppDetails } from '@/types';

export function useUserSidebar() {
  const { authInfo, sessionSigs, isProcessing } = useReadAuthInfo();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [selectedView, setSelectedView] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<AppDetails | null>(null);
  const [apps, setApps] = useState<AppDetails[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState<boolean>(true);
  const [appsError, setAppsError] = useState<string | null>(null);

  // Unified loading state that combines auth processing and apps loading
  const isLoading = isProcessing || isLoadingApps;

  useEffect(() => {
    let isMounted = true;

    async function loadApps() {
      // If still processing auth, keep loading true
      if (isProcessing) {
        return;
      }

      // If no auth info, set loading to false
      if (!authInfo?.userPKP || !sessionSigs || !authInfo?.agentPKP) {
        if (isMounted) {
          setIsLoadingApps(false);
        }
        return;
      }

      // Auth is ready, start loading apps
      setIsLoadingApps(true);
      setAppsError(null); // Clear any previous errors

      const result = await fetchUserApps({
        userPKP: authInfo.userPKP,
        sessionSigs,
        agentPKP: authInfo.agentPKP,
      });

      if (isMounted) {
        if (result.error) {
          setAppsError(result.error);
        } else {
          setApps(result.apps);
          setAppsError(null);
        }
        setIsLoadingApps(false);
      }
    }

    loadApps();

    return () => {
      isMounted = false;
    };
  }, [authInfo?.userPKP, sessionSigs, authInfo?.agentPKP, isProcessing]);

  // Sync sidebar state with URL
  useEffect(() => {
    const pathname = location.pathname;

    if (pathname === '/user/dashboard' || pathname === '/user') {
      setSelectedView('user-dashboard');
      setSelectedApp(null);
    } else if (pathname === '/user/apps') {
      setSelectedView('my-apps');
      setSelectedApp(null);
      setExpandedMenus(new Set(['my-apps']));
    } else if (pathname === '/user/explorer') {
      setSelectedView('explorer');
      setSelectedApp(null);
    } else if (params.appId) {
      const app = apps.find((a) => a.id === params.appId);
      if (app) {
        setSelectedApp(app);
        setSelectedView('my-apps');
        setExpandedMenus(new Set(['my-apps']));
      }
    } else {
      setSelectedView(null);
      setSelectedApp(null);
    }
  }, [location.pathname, params.appId, apps]);

  // Auto-expand apps menu if user has apps and is on apps pages
  useEffect(() => {
    if (apps.length > 0 && (location.pathname.startsWith('/user/apps') || params.appId)) {
      setExpandedMenus((prev) => new Set([...prev, 'my-apps']));
    }
  }, [apps.length, location.pathname, params.appId]);

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

  // Handle menu selection/navigation
  const handleMenuSelection = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate],
  );

  // Handle app selection
  const handleAppSelection = useCallback(
    (app: AppDetails) => {
      navigate(`/user/appId/${app.id}`);
    },
    [navigate],
  );

  return {
    // State
    expandedMenus,
    selectedView,
    selectedApp,
    apps,
    isLoading,
    appsError,
    // Auth info (so other components don't need separate useReadAuthInfo calls)
    authInfo,
    sessionSigs,
    // Handlers
    onToggleMenu: handleToggleMenu,
    onMenuSelection: handleMenuSelection,
    onAppSelection: handleAppSelection,
  };
}
