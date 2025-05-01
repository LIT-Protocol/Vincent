import { Helmet } from 'react-helmet';
import ConsentView from '@/components/consent/pages/userIndex';

export default function UserDashboard() {
  return (
    <>
      <Helmet>
        <title>Vincent | User Dashboard</title>
        <meta name="description" content="Sign in to Vincent" />
      </Helmet>
      <ConsentView />
    </>
  );
}
