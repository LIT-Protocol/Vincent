import { Helmet } from 'react-helmet';
import { useReadAuthInfo } from '@/components/consent/hooks/useAuthInfo';
import UserAuthenticatedConsentForm from '@/components/consent/components/UserAuthenticatedConsentForm';
import UserHeader from '@/components/layout/UserHeader';

export default function AppDetailsPage() {
  const { authInfo, sessionSigs } = useReadAuthInfo();

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

      <div className="w-full flex justify-center">
        <div className="w-[550px]">
          {authInfo?.userPKP && sessionSigs && (
            <UserAuthenticatedConsentForm
              userPKP={authInfo.userPKP}
              sessionSigs={sessionSigs}
              agentPKP={authInfo.agentPKP}
            />
          )}
        </div>
      </div>
    </>
  );
}
