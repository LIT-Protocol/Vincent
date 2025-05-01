import { Helmet } from 'react-helmet';
import ConsentView from '@/components/consent/pages/consent';

export default function UserDashboard() {
  return (
    <>
      <Helmet>
        <title>Vincent | User Dashboard</title>
        <meta name="description" content="Sign in to Vincent" />
      </Helmet>
      <ConsentView isUserDashboardFlow={true} />
    </>
  );
}
