import { Helmet } from 'react-helmet';
import WithdrawForm from '@/components/withdraw/WithdrawForm';
import UserHeader from '@/components/layout/UserHeader';
import useReadAuthInfo from '@/components/consent/hooks/useAuthInfo';
import { useAuthGuard } from '@/components/user/AuthGuard';
import Loading from '@/components/consent/components/Loading';

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
        <Loading copy="Loading..." />
      ) : (
        <WithdrawForm
          sessionSigs={sessionSigs!}
          agentPKP={authInfo!.agentPKP!}
          userPKP={authInfo!.userPKP!}
        />
      )}
    </>
  );
}

export default Withdraw;
