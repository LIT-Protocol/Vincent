import { Helmet } from 'react-helmet';
import ConsentView from '@/components/consent/pages/consent';
import UserHeader from '@/components/layout/UserHeader';
import ConnectWithVincent from '@/components/layout/ConnectWithVincent';
import ProtectedByLit from '@/components/layout/ProtectedByLit';

export default function UserDashboard() {
  return (
    <>
      <Helmet>
        <title>Vincent | User Dashboard</title>
        <meta name="description" content="Sign in to Vincent" />
      </Helmet>
      <UserHeader title="User Dashboard" showButtons={false} />
      <div className="bg-white rounded-xl shadow-lg max-w-[550px] w-full mx-auto border border-gray-100 overflow-hidden">
        <ConnectWithVincent />
        <div className="p-6">
          <ConsentView isUserDashboardFlow={true} />
        </div>
        <ProtectedByLit />
      </div>
    </>
  );
}
