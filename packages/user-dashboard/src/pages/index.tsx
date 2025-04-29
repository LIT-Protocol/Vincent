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
        <meta name="description" content="Sign in to Vincent" />
      </Helmet>
      <ConsentView />
    </div>
  );
}

const UserDashboardPage = () => {
  const WrappedDashboard = wrap(Dashboard, [...UserProviders]);

  return (
    <UserLayout>
      <WrappedDashboard />
    </UserLayout>
  );
};

export default UserDashboardPage;
