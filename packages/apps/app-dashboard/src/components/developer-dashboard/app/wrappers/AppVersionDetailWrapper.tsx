import { useParams } from 'react-router-dom';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { useAddressCheck } from '@/hooks/developer-dashboard/app/useAddressCheck';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import Loading from '@/components/layout/Loading';
import { AppVersionDetailView } from '@/components/developer-dashboard/app/views/AppVersionDetailView';
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

  // Fetch version tools from API
  const {
    data: versionTools,
    isLoading: versionToolsLoading,
    isError: versionToolsError,
  } = vincentApiClient.useListAppVersionToolsQuery({
    appId: Number(appId),
    version: Number(versionId),
  });

  // Fetch blockchain app and version data
  const {
    blockchainAppVersion,
    blockchainAppVersionError,
    blockchainAppVersionLoading,
    blockchainAppData,
    isAppRegistered,
    refetch: refetchBlockchainAppVersionData,
  } = useBlockchainAppVersionData(appId, versionId);

  useAddressCheck(app || null);

  // Loading states first
  if (
    appLoading ||
    versionsLoading ||
    versionLoading ||
    versionToolsLoading ||
    blockchainAppVersionLoading
  )
    return <Loading />;

  // Combined error states
  if (appError) return <StatusMessage message="Failed to load app" type="error" />;
  if (versionsError) return <StatusMessage message="Failed to load app versions" type="error" />;
  if (blockchainAppVersionError)
    return <StatusMessage message="Failed to load on-chain app version data" type="error" />;
  if (versionError) return <StatusMessage message="Failed to load version data" type="error" />;
  if (versionToolsError)
    return <StatusMessage message="Failed to load version tools" type="error" />;
  if (!app) return <StatusMessage message={`App ${appId} not found`} type="error" />;
  if (!versionData)
    return <StatusMessage message={`Version ${versionId} not found`} type="error" />;

  return (
    <AppVersionDetailView
      app={app}
      versionData={versionData}
      versionTools={versionTools || []}
      blockchainAppVersion={blockchainAppVersion}
      blockchainAppData={blockchainAppData}
      refetchBlockchainAppVersionData={refetchBlockchainAppVersionData}
      isAppRegistered={isAppRegistered}
    />
  );
}
