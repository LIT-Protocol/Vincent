import { Helmet } from 'react-helmet';
import { useReadAuthInfo } from '@/components/consent/hooks/useAuthInfo';
import UserAuthenticatedConsentForm from '@/components/consent/components/UserAuthenticatedConsentForm';
import UserHeader from '@/components/layout/UserHeader';
import { useAuthGuard } from '@/components/user/AuthGuard';
import Loading from '@/components/consent/components/Loading';

export default function AppDetailsPage() {
  const { authInfo, sessionSigs } = useReadAuthInfo();
  const authGuardElement = useAuthGuard();

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

      {authGuardElement ? (
        <Loading copy="Loading..." />
      ) : (
        <UserAuthenticatedConsentForm
          userPKP={authInfo!.userPKP!}
          sessionSigs={sessionSigs!}
          agentPKP={authInfo!.agentPKP!}
        />
      )}
    </>
  );
}
