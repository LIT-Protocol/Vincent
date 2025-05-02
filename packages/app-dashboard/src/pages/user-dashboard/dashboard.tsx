import { Helmet } from 'react-helmet';
import ConsentView from '@/components/consent/pages/consent';
import UserHeader from '@/components/layout/UserHeader';

export default function UserDashboard() {
  return (
    <>
      <Helmet>
        <title>Vincent | User Dashboard</title>
        <meta name="description" content="Sign in to Vincent" />
      </Helmet>
      <UserHeader title="User Dashboard" showButtons={false} />
      <ConsentView isUserDashboardFlow={true} />
    </>
  );
}
