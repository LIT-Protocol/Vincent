import { Helmet } from 'react-helmet';
import UserAppsView from '@/components/user-dashboard/dashboard/UserAppsView';
import { useReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import UserHeader from '@/layout/user-dashboard/UserHeader';
import { useAuthGuard } from '@/components/user-dashboard/auth/AuthGuard';
import StatusMessage from '@/components/user-dashboard/consent/StatusMessage';

export default function AppsPage() {
  const { authInfo, sessionSigs } = useReadAuthInfo();
  const authGuardElement = useAuthGuard();

  return (
    <>
      <Helmet>
        <title>Vincent | My Applications</title>
        <meta name="description" content="View and manage your Vincent applications" />
      </Helmet>

      <UserHeader title="My Applications" />

      {authGuardElement ? (
        <StatusMessage message="Authenticating..." type="info" />
      ) : authInfo?.userPKP && authInfo?.agentPKP && sessionSigs ? (
        <UserAppsView
          userPKP={authInfo.userPKP}
          sessionSigs={sessionSigs}
          agentPKP={authInfo.agentPKP}
        />
      ) : (
        <StatusMessage message="Loading user data..." type="info" />
      )}
    </>
  );
}
