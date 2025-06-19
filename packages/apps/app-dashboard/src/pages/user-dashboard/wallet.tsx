import { Helmet } from 'react-helmet-async';
import WithdrawForm from '@/components/user-dashboard/withdraw/WithdrawForm';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { useAuthGuard } from '@/components/user-dashboard/auth/AuthGuard';
import StatusMessage from '@/components/user-dashboard/consent/StatusMessage';

export function Withdraw() {
  const { authInfo, sessionSigs } = useReadAuthInfo();
  const authGuardElement = useAuthGuard();

  if (authGuardElement || !authInfo?.userPKP || !authInfo?.agentPKP || !sessionSigs) {
    return (
      <>
        <Helmet>
          <title>Vincent | Wallet</title>
          <meta name="description" content="Your Vincent wallet dashboard" />
        </Helmet>
        <StatusMessage message="Loading wallet..." type="info" />
      </>
    );
  }

  return (
    <>
      <main className="p-8">
        <WithdrawForm
          sessionSigs={sessionSigs}
          agentPKP={authInfo.agentPKP}
          userPKP={authInfo.userPKP}
        />
      </main>
    </>
  );
}

export default Withdraw;
