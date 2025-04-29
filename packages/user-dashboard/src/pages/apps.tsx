import { Helmet } from 'react-helmet';
import { wrap } from '@/utils/components';
import { UserProviders } from '@/providers';
import UserLayout from '@/components/layout/UserLayout';
import UserAppsView from '@/components/user/UserAppsView';
import { useReadAuthInfo } from '@/components/consent/hooks/useAuthInfo';

export function AppsPage() {
  const { authInfo, sessionSigs } = useReadAuthInfo();

  return (
    <div className="w-full">
      <Helmet>
        <title>Vincent | My Applications</title>
        <meta name="description" content="View and manage your Vincent applications" />
      </Helmet>
      {authInfo?.userPKP && authInfo?.agentPKP && sessionSigs && (
        <UserAppsView
          userPKP={authInfo.userPKP}
          sessionSigs={sessionSigs}
          agentPKP={authInfo.agentPKP}
        />
      )}
    </div>
  );
}

const AppsPageWrapped = () => {
  const WrappedAppsPage = wrap(AppsPage, [...UserProviders]);

  return (
    <UserLayout>
      <WrappedAppsPage />
    </UserLayout>
  );
};

export default AppsPageWrapped;
