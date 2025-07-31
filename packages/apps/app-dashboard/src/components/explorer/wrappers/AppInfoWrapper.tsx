import { useParams } from 'react-router';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { AppInfoView } from '../views/AppInfoView';

export function AppInfoWrapper() {
  const { appId } = useParams<{ appId: string }>();

  // Fetch app data
  const {
    data: app,
    isLoading,
    isError,
  } = vincentApiClient.useGetAppQuery({ appId: Number(appId) });

  // Fetch app versions
  const {
    data: versions,
    isLoading: versionsLoading,
    isError: versionsError,
  } = vincentApiClient.useGetAppVersionsQuery({ appId: Number(appId) });

  // Fetch version abilities
  const {
    data: versionAbilities,
    isLoading: versionAbilitysLoading,
    isError: versionAbilitysError,
  } = vincentApiClient.useListAppVersionAbilitiesQuery(
    {
      appId: Number(appId),
      version: app?.activeVersion || 0,
    },
    {
      skip: !app?.activeVersion,
    },
  );

  if (isLoading || versionsLoading || versionAbilitysLoading) return <Loading />;
  if (isError) return <StatusMessage message="Failed to load app" type="error" />;
  if (versionsError) return <StatusMessage message="Failed to load app versions" type="error" />;
  if (versionAbilitysError)
    return <StatusMessage message="Failed to load version abilities" type="error" />;
  if (!app) return <StatusMessage message={`App ${appId} not found`} type="error" />;
  if (!versions) return <StatusMessage message={`App versions not found`} type="error" />;
  if (!versionAbilities)
    return <StatusMessage message={`Version abilities not found`} type="error" />;

  return <AppInfoView app={app} versions={versions} versionAbilities={versionAbilities} />;
}
