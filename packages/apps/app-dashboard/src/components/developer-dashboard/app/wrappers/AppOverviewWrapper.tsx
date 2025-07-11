import { useNavigate, useParams } from 'react-router-dom';
import { AppDetailsView } from '../views/AppDetailsView';
import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { useBlockchainAppData } from '@/hooks/useBlockchainAppData';

export function AppOverviewWrapper() {
  const { appId } = useParams<{ appId: string }>();

  // Fetching app data from API
  const {
    data: app,
    isLoading: appLoading,
    isError: appError,
  } = vincentApiClient.useGetAppQuery({ appId: Number(appId) });

  // Fetching on-chain data
  const {
    blockchainAppData,
    blockchainAppError,
    blockchainAppLoading,
    refetch: refetchBlockchainData,
  } = useBlockchainAppData(appId);

  // Navigation
  const navigate = useNavigate();

  // Loading
  if (appLoading || blockchainAppLoading) return <Loading />;
  if (appError || blockchainAppError)
    return <StatusMessage message="Failed to load app" type="error" />;
  if (!app) return <StatusMessage message={`App ${appId} not found`} type="error" />;

  const handleOpenMutation = (mutationType: string) => {
    navigate(`/developer/appId/${appId}/${mutationType}`);
  };

  return (
    <AppDetailsView
      selectedApp={app}
      onOpenMutation={handleOpenMutation}
      blockchainAppData={blockchainAppData}
      refetchBlockchainData={refetchBlockchainData}
    />
  );
}
