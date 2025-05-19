import { Helmet } from 'react-helmet';
import WithdrawForm from '@/components/user-dashboard/withdraw/WithdrawForm';
import UserHeader from '@/layout/user-dashboard/UserHeader';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { useAuthGuard } from '@/components/user-dashboard/auth/AuthGuard';
import StatusMessage from '@/components/user-dashboard/consent/StatusMessage';

export function Withdraw() {
  const { authInfo, sessionSigs } = useReadAuthInfo();
  const authGuardElement = useAuthGuard();

  return (
    <>
      <Helmet>
        <title>Vincent | Withdraw</title>
        <meta name="description" content="Withdraw your funds" />
      </Helmet>

      <UserHeader
        title="Withdraw"
        backButton={{
          to: '/user/apps',
          label: 'Back to Apps',
        }}
      />

      {authGuardElement ? (
        <StatusMessage message="Authenticating..." type="info" />
      ) : sessionSigs && authInfo?.agentPKP && authInfo?.userPKP ? (
        <WithdrawForm
          sessionSigs={sessionSigs}
          agentPKP={authInfo.agentPKP}
          userPKP={authInfo.userPKP}
        />
      ) : (
        <StatusMessage message="Authentication required" type="warning" />
      )}
    </>
  );
}

export default Withdraw;
