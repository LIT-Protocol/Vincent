import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router';
import { WithdrawForm } from '@/components/user-dashboard/withdraw/WithdrawForm';
import { WithdrawFormSkeleton } from '@/components/user-dashboard/withdraw/WithdrawFormSkeleton';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { useAuthGuard } from '@/hooks/user-dashboard/connect/useAuthGuard';
import { useAgentPkpForApp } from '@/hooks/user-dashboard/useAgentPkpForApp';

export function Wallet() {
  const { appId } = useParams();
  const { authInfo, sessionSigs } = useReadAuthInfo();
  const authGuardElement = useAuthGuard();

  const { agentPKP, loading: agentPKPLoading } = useAgentPkpForApp(
    authInfo?.userPKP?.ethAddress,
    appId ? Number(appId) : undefined,
  );

  if (authGuardElement || !authInfo?.userPKP || !sessionSigs || agentPKPLoading || !agentPKP) {
    return (
      <>
        <Helmet>
          <title>Vincent | Wallet</title>
          <meta name="description" content="Vincent Wallet Dashboard" />
        </Helmet>
        <div className="w-full h-full flex items-center justify-center">
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
      <div className="w-full h-full flex items-center justify-center">
        <WithdrawForm sessionSigs={sessionSigs} agentPKP={agentPKP} userPKP={authInfo.userPKP} />
      </div>
    </>
  );
}

export default Wallet;
