import { Helmet } from 'react-helmet-async';
import UserAppsView from '@/components/user-dashboard/dashboard/UserAppsView';
import { useAuthGuard } from '@/components/user-dashboard/auth/AuthGuard';
import { useUserSidebar } from '@/hooks/user-dashboard/useUserSidebar';
import StatusMessage from '@/components/user-dashboard/consent/StatusMessage';

export default function AppsPage() {
  const authGuardElement = useAuthGuard();
  const { apps, isLoading, appsError, authInfo, sessionSigs } = useUserSidebar();

  // Show loading if authenticating or loading apps (but show errors immediately)
  if (authGuardElement || (isLoading && !appsError)) {
    return (
      <>
        <Helmet>
          <title>Vincent | My Applications</title>
          <meta name="description" content="View and manage your Vincent applications" />
        </Helmet>
        <StatusMessage message="Loading applications..." type="info" />
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
        <UserAppsView apps={apps} isLoading={isLoading} error={appsError || undefined} />
      </main>
    </>
  );
}
