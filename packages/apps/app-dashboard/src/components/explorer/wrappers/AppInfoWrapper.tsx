import { useParams } from 'react-router';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { AppInfoView } from '../views/AppInfoView';

export function AppInfoWrapper() {
  const { appId } = useParams<{ appId: string }>();

  const {
    data: app,
    isLoading,
    isError,
  } = vincentApiClient.useGetAppQuery({ appId: Number(appId) });

  if (isLoading) return <Loading />;
  if (isError) return <StatusMessage message="Failed to load app" type="error" />;
  if (!app) return <StatusMessage message={`App ${appId} not found`} type="error" />;

  return <AppInfoView app={app} />;
}
