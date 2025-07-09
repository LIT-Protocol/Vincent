import { useNavigate, useParams } from 'react-router-dom';
import { AppDetailsView } from '../views/AppDetailsView';
import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';

export function AppOverviewWrapper() {
  const { appId } = useParams<{ appId: string }>();

  // Fetching
  const {
    data: app,
    isLoading: appLoading,
    isError: appError,
  } = vincentApiClient.useGetAppQuery({ appId: Number(appId) });

  // Navigation
  const navigate = useNavigate();

  // Loading
  if (appLoading) return <Loading />;
  if (appError) return <StatusMessage message="Failed to load app" type="error" />;
  if (!app) return <StatusMessage message={`App ${appId} not found`} type="error" />;

  const handleOpenMutation = (mutationType: string) => {
    navigate(`/developer/appId/${appId}/${mutationType}`);
  };

  return <AppDetailsView selectedApp={app} onOpenMutation={handleOpenMutation} />;
}
