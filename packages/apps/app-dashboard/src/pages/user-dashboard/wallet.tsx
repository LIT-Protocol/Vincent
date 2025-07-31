import { Helmet } from 'react-helmet-async';
import { WithdrawForm } from '@/components/user-dashboard/withdraw/WithdrawForm';
import { WithdrawFormSkeleton } from '@/components/user-dashboard/withdraw/WithdrawFormSkeleton';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { useAuthGuard } from '@/hooks/user-dashboard/connect/useAuthGuard';
import { theme } from '@/components/user-dashboard/connect/ui/theme';

export function Wallet() {
  const { authInfo, sessionSigs } = useReadAuthInfo();
  const authGuardElement = useAuthGuard();

  if (authGuardElement || !authInfo?.userPKP || !authInfo?.agentPKP || !sessionSigs) {
    return (
      <>
        <Helmet>
          <title>Vincent | Wallet</title>
          <meta name="description" content="Vincent Wallet Dashboard" />
        </Helmet>
        <div className={`w-full h-full flex items-center justify-center ${theme.bg}`}>
          <WithdrawFormSkeleton />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Vincent | Wallet</title>
        <meta name="description" content="Your Vincent wallet dashboard" />
      </Helmet>
      <div className={`w-full h-full flex items-center justify-center ${theme.bg}`}>
        <WithdrawForm
          sessionSigs={sessionSigs}
          agentPKP={authInfo.agentPKP}
          userPKP={authInfo.userPKP}
        />
      </div>
    </>
  );
}

export default Wallet;
