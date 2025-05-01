import { Helmet } from 'react-helmet';
import UserAppsView from '@/components/user/UserAppsView';
import { useReadAuthInfo } from '@/components/consent/hooks/useAuthInfo';
import UserHeader from '@/components/layout/UserHeader';
import { useAuthGuard } from '@/components/user/AuthGuard';

export default function AppsPage() {
  const { authInfo, sessionSigs } = useReadAuthInfo();
  const authGuardElement = useAuthGuard();

  if (authGuardElement) {
    return authGuardElement;
  }

  return (
    <>
      <Helmet>
        <title>Vincent | My Applications</title>
        <meta name="description" content="View and manage your Vincent applications" />
      </Helmet>

      <UserHeader title="My Applications" />

      <UserAppsView
        userPKP={authInfo!.userPKP!}
        sessionSigs={sessionSigs!}
        agentPKP={authInfo!.agentPKP!}
      />
    </>
  );
}
