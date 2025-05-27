import { Helmet } from 'react-helmet';
import ConsentView from '@/components/user-dashboard/consent/Consent';
import UserHeader from '@/layout/user-dashboard/UserHeader';
import ProtectedByLit from '@/layout/shared/ProtectedByLit';

export default function UserDashboard() {
  return (
    <>
      <Helmet>
        <title>Vincent | User Dashboard</title>
        <meta name="description" content="Sign in to Vincent" />
      </Helmet>
      <UserHeader title="User Dashboard" showButtons={false} />
      <div className="bg-white rounded-xl shadow-lg max-w-[550px] w-full mx-auto border border-gray-100 overflow-hidden">
        <div className="p-6">
          <ConsentView isUserDashboardFlow={true} />
        </div>
        <ProtectedByLit />
      </div>
    </>
  );
}
