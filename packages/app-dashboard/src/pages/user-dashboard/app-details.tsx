import { Helmet } from 'react-helmet';
import { useReadAuthInfo } from '@/components/consent/hooks/useAuthInfo';
import UserAuthenticatedConsentForm from '@/components/consent/components/UserAuthenticatedConsentForm';
import UserHeader from '@/components/layout/UserHeader';
import { useAuthGuard } from '@/components/user/AuthGuard';

export default function AppDetailsPage() {
  const { authInfo, sessionSigs } = useReadAuthInfo();
  const authGuardElement = useAuthGuard();

  if (authGuardElement) {
    return authGuardElement;
  }

  return (
    <>
      <Helmet>
        <title>Vincent | App Details</title>
        <meta name="description" content="View and manage your app parameters" />
      </Helmet>

      <UserHeader
        backButton={{
          to: '/user/apps',
          label: 'Back to Apps',
        }}
      />

      <UserAuthenticatedConsentForm
        userPKP={authInfo!.userPKP!}
        sessionSigs={sessionSigs!}
        agentPKP={authInfo!.agentPKP!}
      />
    </>
  );
}
