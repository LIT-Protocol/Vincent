import { useParams } from 'react-router-dom';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import Loading from '@/components/shared/ui/Loading';
import { AppVersionDetailView } from '@/components/developer-dashboard/app/views/AppVersionDetailView';
import { useBlockchainAppData } from '@/hooks/useBlockchainAppData';
import { useBlockchainAppVersionData } from '@/hooks/useBlockchainAppVersionData';

export function AppVersionDetailWrapper() {
  const { appId, versionId } = useParams<{ appId: string; versionId: string }>();

  // Fetch app data from API
  const {
    data: app,
    isLoading: appLoading,
    isError: appError,
  } = vincentApiClient.useGetAppQuery({ appId: Number(appId) });

  // Fetch app versions from API
  const { isLoading: versionsLoading, isError: versionsError } =
    vincentApiClient.useGetAppVersionsQuery({ appId: Number(appId) });

  // Fetch specific version data from API
  const {
    data: versionData,
    isLoading: versionLoading,
    isError: versionError,
  } = vincentApiClient.useGetAppVersionQuery({ appId: Number(appId), version: Number(versionId) });

  // Fetch version abilities from API
  const {
    data: versionAbilities,
    isLoading: versionAbilitiesLoading,
    isError: versionAbilitiesError,
  } = vincentApiClient.useListAppVersionAbilitiesQuery({
    appId: Number(appId),
    version: Number(versionId),
  });

  const { blockchainAppData, blockchainAppError, blockchainAppLoading } = useBlockchainAppData(
    Number(appId),
  );

  // Fetch blockchain app and version data
  const {
    blockchainAppVersion,
    blockchainAppVersionError,
    blockchainAppVersionLoading,
    refetch: refetchBlockchainAppVersionData,
  } = useBlockchainAppVersionData(Number(appId), Number(versionId));

  // Loading states first
  if (
    appLoading ||
    versionsLoading ||
    versionLoading ||
    versionAbilitiesLoading ||
    blockchainAppLoading ||
    blockchainAppVersionLoading
  )
    return <Loading />;

  // Combined error states
  if (appError) return <StatusMessage message="Failed to load app" type="error" />;
  if (versionsError) return <StatusMessage message="Failed to load app versions" type="error" />;
  if (blockchainAppError)
    return <StatusMessage message="Failed to load on-chain app data" type="error" />;
  if (blockchainAppVersionError)
    return <StatusMessage message="Failed to load on-chain app version data" type="error" />;
  if (versionError) return <StatusMessage message="Failed to load version data" type="error" />;
  if (versionAbilitiesError)
    return <StatusMessage message="Failed to load version abilities" type="error" />;
  if (!app) return <StatusMessage message={`App ${appId} not found`} type="error" />;
  if (!versionData)
    return <StatusMessage message={`Version ${versionId} not found`} type="error" />;

  return (
    <AppVersionDetailView
      app={app}
      versionData={versionData}
      versionAbilities={versionAbilities || []}
      blockchainAppVersion={blockchainAppVersion}
      blockchainAppData={blockchainAppData}
      refetchBlockchainAppVersionData={refetchBlockchainAppVersionData}
    />
  );
}
