import { useNavigate, useParams } from 'react-router-dom';
import { AppDetailsView } from '../views/AppDetailsView';
import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { useBlockchainAppData } from '@/hooks/useBlockchainAppData';

export function AppOverviewWrapper() {
  const { appId } = useParams<{ appId: string }>();

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
  } = useBlockchainAppData(Number(appId));

  // Navigation
  const navigate = useNavigate();

  // Loading
  if (appLoading || blockchainAppLoading) return <Loading />;

  // Combined error states
  if (appError || blockchainAppError)
    return <StatusMessage message="Failed to load app" type="error" />;
  if (!app) return <StatusMessage message={`App ${appId} not found`} type="error" />;

  const handleOpenMutation = (mutationType: string) => {
    navigate(`/developer/apps/appId/${appId}/${mutationType}`);
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
