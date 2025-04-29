import { Helmet } from 'react-helmet';
import ConsentView from '@/components/consent/pages/index';
import { wrap } from '@/utils/components';
import { UserProviders } from '@/providers';
import UserLayout from '@/components/layout/UserLayout';

export function Dashboard() {
  return (
    <div className="w-full">
      <Helmet>
        <title>Vincent | User Dashboard</title>
        <meta name="description" content="View and manage your Vincent applications" />
      </Helmet>
      <ConsentView />
    </div>
  );
}

const UserDashboardPage = () => {
  const handleSignOut = (ConsentView as any).handleSignOut;
  const WrappedDashboard = wrap(Dashboard, [...UserProviders]);

  return (
    <UserLayout onSignOut={handleSignOut}>
      <WrappedDashboard />
    </UserLayout>
  );
};

export default UserDashboardPage;
