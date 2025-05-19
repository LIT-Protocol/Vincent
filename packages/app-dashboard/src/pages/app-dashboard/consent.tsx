import { Helmet } from 'react-helmet';
import ConsentView from '@/components/user-dashboard/consent/Consent';
import ConnectWithVincent from '@/layout/shared/ConnectWithVincent';
import ProtectedByLit from '@/layout/shared/ProtectedByLit';

export function Consent() {
  return (
    <>
      <Helmet>
        <title>Vincent | App Consent</title>
        <meta name="description" content="Review and provide consent for an application" />
      </Helmet>
      <div className="bg-white rounded-xl shadow-lg max-w-[550px] w-full mx-auto border border-gray-100 overflow-hidden">
        <ConnectWithVincent />
        <div className="p-6">
          <ConsentView isUserDashboardFlow={false} />
        </div>
        <ProtectedByLit />
      </div>
    </>
  );
}

export default Consent;
