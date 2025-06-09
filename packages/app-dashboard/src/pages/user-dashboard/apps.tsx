import { Helmet } from 'react-helmet';
import { useState, useEffect } from 'react';
import UserAppsView from '@/components/user-dashboard/dashboard/UserAppsView';
import { useReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import { useAuthGuard } from '@/components/user-dashboard/auth/AuthGuard';
import StatusMessage from '@/components/user-dashboard/consent/StatusMessage';
import { fetchUserApps } from '@/utils/user-dashboard/userAppsUtils';
import { AppDetails } from '@/types';
import Loading from '@/layout/app-dashboard/Loading';

export default function AppsPage() {
  const { authInfo, sessionSigs } = useReadAuthInfo();
  const authGuardElement = useAuthGuard();

  // Sidebar state management
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['app']));

  // User apps state
  const [apps, setApps] = useState<AppDetails[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState<boolean>(true);

  // Load user apps
  useEffect(() => {
    let isMounted = true;

    async function loadApps() {
      if (!authInfo?.userPKP || !sessionSigs || !authInfo?.agentPKP) {
        setIsLoadingApps(false);
        return;
      }

      setIsLoadingApps(true);

      const result = await fetchUserApps({
        userPKP: authInfo.userPKP,
        sessionSigs,
        agentPKP: authInfo.agentPKP,
      });

      if (isMounted) {
        if (!result.error) {
          setApps(result.apps);
        }
        setIsLoadingApps(false);
      }
    }

    loadApps();

    return () => {
      isMounted = false;
    };
  }, [authInfo?.userPKP, sessionSigs, authInfo?.agentPKP]);

  // Auto-expand apps menu if user has apps
  useEffect(() => {
    if (apps.length > 0 && !expandedMenus.has('my-apps')) {
      setExpandedMenus((prev) => new Set([...prev, 'my-apps']));
    }
  }, [apps.length, expandedMenus]);

  // Show loading if authenticating or loading apps data
  if (
    authGuardElement ||
    (authInfo?.userPKP && authInfo?.agentPKP && sessionSigs && isLoadingApps)
  ) {
    return (
      <>
        <Helmet>
          <title>Vincent | My Applications</title>
          <meta name="description" content="View and manage your Vincent applications" />
        </Helmet>
        <main className="p-8 flex items-center justify-center min-h-screen">
          <Loading />
        </main>
      </>
    );
  }

  // Show authentication required message
  if (!authInfo?.userPKP || !authInfo?.agentPKP || !sessionSigs) {
    return (
      <>
        <Helmet>
          <title>Vincent | My Applications</title>
          <meta name="description" content="View and manage your Vincent applications" />
        </Helmet>
        <main className="p-8 flex items-center justify-center min-h-screen">
          <StatusMessage message="Authentication required" type="warning" />
        </main>
      </>
    );
  }

  // Main apps content
  return (
    <>
      <Helmet>
        <title>Vincent | My Applications</title>
        <meta name="description" content="View and manage your Vincent applications" />
      </Helmet>

      <main className="p-8">
        <UserAppsView
          userPKP={authInfo.userPKP}
          sessionSigs={sessionSigs}
          agentPKP={authInfo.agentPKP}
        />
      </main>
    </>
  );
}
