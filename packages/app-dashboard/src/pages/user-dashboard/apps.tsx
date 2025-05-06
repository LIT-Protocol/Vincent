import { Helmet } from 'react-helmet';
import UserAppsView from '@/components/user/UserAppsView';
import { useReadAuthInfo } from '@/components/consent/hooks/useAuthInfo';
import UserHeader from '@/components/layout/UserHeader';
import { useAuthGuard } from '@/components/user/AuthGuard';
import StatusMessage from '@/components/consent/components/authForm/StatusMessage';

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
