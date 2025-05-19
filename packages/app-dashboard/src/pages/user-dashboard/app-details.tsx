import { Helmet } from 'react-helmet';
import { useReadAuthInfo } from '@/hooks/user-dashboard/useAuthInfo';
import UserAuthenticatedConsentForm from '@/components/user-dashboard/consent/UserAuthenticatedConsentForm';
import UserHeader from '@/layout/user-dashboard/UserHeader';
import { useAuthGuard } from '@/components/user-dashboard/auth/AuthGuard';
import { useUrlRedirectUri } from '@/hooks/user-dashboard/useUrlRedirectUri';
import ConnectWithVincent from '@/layout/shared/ConnectWithVincent';
import ProtectedByLit from '@/layout/shared/ProtectedByLit';
import StatusMessage from '@/components/user-dashboard/consent/StatusMessage';

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
