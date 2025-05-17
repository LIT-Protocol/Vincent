import { Helmet } from 'react-helmet';
import { useReadAuthInfo } from '@/components/consent/hooks/useAuthInfo';
import UserAuthenticatedConsentForm from '@/components/consent/components/UserAuthenticatedConsentForm';
import UserHeader from '@/components/layout/UserHeader';
import { useAuthGuard } from '@/components/user/AuthGuard';
import { useUrlRedirectUri } from '@/components/consent/hooks/useUrlRedirectUri';
import ConnectWithVincent from '@/components/layout/ConnectWithVincent';
import ProtectedByLit from '@/components/layout/ProtectedByLit';
import StatusMessage from '@/components/consent/components/authForm/StatusMessage';

export default function AppDetailsPage() {
  const { authInfo, sessionSigs } = useReadAuthInfo();
  const authGuardElement = useAuthGuard();
  const { redirectUri } = useUrlRedirectUri();

  return (
    <>
      <Helmet>
        <title>Vincent | App Details</title>
        <meta name="description" content="View and manage your app parameters" />
      </Helmet>

      {!redirectUri && (
        <UserHeader
          backButton={{
            to: '/user/apps',
            label: 'Back to Apps',
          }}
        />
      )}

      <div className="bg-white rounded-xl shadow-lg max-w-[550px] w-full mx-auto border border-gray-100 overflow-hidden">
        <ConnectWithVincent signout={redirectUri ? true : false} />
        <div className="p-6">
          {authGuardElement ? (
            <StatusMessage message="Loading..." type="info" />
          ) : authInfo?.userPKP && sessionSigs && authInfo?.agentPKP ? (
            <UserAuthenticatedConsentForm
              userPKP={authInfo.userPKP}
              sessionSigs={sessionSigs}
              agentPKP={authInfo.agentPKP}
            />
          ) : (
            <StatusMessage message="Authentication required" type="warning" />
          )}
        </div>
        <ProtectedByLit />
      </div>
    </>
  );
}
