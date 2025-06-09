import WithdrawForm from '@/components/user-dashboard/withdraw/WithdrawForm';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { useAuthGuard } from '@/components/user-dashboard/auth/AuthGuard';
import StatusMessage from '@/components/user-dashboard/consent/StatusMessage';
import Loading from '@/layout/app-dashboard/Loading';

export function Withdraw() {
  const { authInfo, sessionSigs } = useReadAuthInfo();
  const authGuardElement = useAuthGuard();

  return (
    <>
      {authGuardElement ? (
        <div className="flex min-h-screen items-center justify-center">
          <Loading />
        </div>
      ) : authInfo?.userPKP && authInfo?.agentPKP && sessionSigs ? (
        <main className="p-8">
          <WithdrawForm
            sessionSigs={sessionSigs}
            agentPKP={authInfo.agentPKP}
            userPKP={authInfo.userPKP}
          />
        </main>
      ) : (
        <div className="flex min-h-screen items-center justify-center">
          <StatusMessage message="Authentication required" type="warning" />
        </div>
      )}
    </>
  );
}

export default Withdraw;
