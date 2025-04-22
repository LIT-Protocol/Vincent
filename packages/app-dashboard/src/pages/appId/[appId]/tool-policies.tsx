import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { formCompleteVincentAppForDev } from '@/services';
import { useAccount } from 'wagmi';
import { WithHeader } from '@/components/layout/Header';
import Loading from '@/components/layout/Loading';
import { AppView } from '@/services/types';
import ManageToolPoliciesScreen from '@/components/developer/dashboard/ManageToolPolicies';
import { wrap } from '@/utils/components';
import { AppProviders } from '@/providers';

export function ToolPolicies() {
  const params = useParams();
  const appIdParam = params.appId;
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const [dashboard, setDashboard] = useState<AppView | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAppData = useCallback(async () => {
    if (!address || !appIdParam) return;

    try {
      setIsLoading(true);
      const appData = await formCompleteVincentAppForDev(address);

      if (appData && appData.length > 0) {
        // Find the specific app by appId
        const app = appData.find(app => app.appId && app.appId.toString() === appIdParam);
        if (app) {
          setDashboard(app);
        } else {
          // If app not found, navigate back to dashboard
          navigate('/');
        }
      } else {
        // If no apps found, navigate back to dashboard
        navigate('/');
      }
    } catch (error) {
      console.error("Error loading app data:", error);
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  }, [address, appIdParam, navigate]);

  useEffect(() => {
    if (isConnected) {
      loadAppData();
    } else {
      navigate('/');
    }
  }, [isConnected, loadAppData, navigate]);

  const handleBack = () => {
    navigate(`/appId/${appIdParam}`);
  };

  if (!dashboard || isLoading) {
    return <Loading />;
  }

  return (
    <ManageToolPoliciesScreen
      onBack={handleBack}
      dashboard={dashboard}
    />
  );
}

const ToolPoliciesPage = wrap(WithHeader(ToolPolicies), AppProviders);
export default ToolPoliciesPage;
