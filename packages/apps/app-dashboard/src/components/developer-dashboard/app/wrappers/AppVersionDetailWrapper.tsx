import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { LIT_RPC } from '@lit-protocol/constants';
import { useParams } from 'react-router-dom';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { useAddressCheck } from '@/hooks/developer-dashboard/app/useAddressCheck';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import Loading from '@/components/layout/Loading';
import {
  getAppVersion,
  AppVersion as ContractAppVersion,
  getAppById,
  App as ContractApp,
} from '@lit-protocol/vincent-contracts-sdk';
import { AppVersionDetailView } from '@/components/developer-dashboard/app/views/AppVersionDetailView';

export function AppVersionDetailWrapper() {
  const { appId, versionId } = useParams<{ appId: string; versionId: string }>();

  // States for blockchain app data
  const [blockchainApp, setBlockchainApp] = useState<ContractApp | null>(null);
  const [blockchainAppVersion, setBlockchainAppVersion] = useState<ContractAppVersion | null>(null);
  const [blockchainAppError, setBlockchainAppError] = useState<string | null>(null);
  const [blockchainAppLoading, setBlockchainAppLoading] = useState(true);

  // Fetch app
  const {
    data: app,
    isLoading: appLoading,
    isError: appError,
  } = vincentApiClient.useGetAppQuery({ appId: Number(appId) });

  // Fetch app versions
  const { isLoading: versionsLoading, isError: versionsError } =
    vincentApiClient.useGetAppVersionsQuery({ appId: Number(appId) });

  // Fetch specific version data
  const {
    data: versionData,
    isLoading: versionLoading,
    isError: versionError,
  } = vincentApiClient.useGetAppVersionQuery({ appId: Number(appId), version: Number(versionId) });

  // Fetch version tools
  const {
    data: versionTools,
    isLoading: versionToolsLoading,
    isError: versionToolsError,
  } = vincentApiClient.useListAppVersionToolsQuery({
    appId: Number(appId),
    version: Number(versionId),
  });

  // Setup read-only provider for blockchain calls
  const provider = new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE);
  const readOnlySigner = new ethers.Wallet(ethers.Wallet.createRandom().privateKey, provider);

  useEffect(() => {
    if (!appId || !versionId) return;

    setBlockchainApp(null);
    setBlockchainAppLoading(true);
    setBlockchainAppError(null);

    const fetchBlockchainData = async () => {
      // First, try to fetch the app data
      try {
        const appResult = await getAppById({
          signer: readOnlySigner,
          args: { appId: appId.toString() },
        });
        setBlockchainApp(appResult);
      } catch (error: any) {
        if (error?.message?.includes('AppNotRegistered')) {
          setBlockchainApp(null);
        } else {
          setBlockchainAppError(
            error instanceof Error ? error.message : 'Failed to fetch app data',
          );
          return; // Don't continue if real error
        }
      }

      // Then, try to fetch the app version data
      try {
        const appVersionResult = await getAppVersion({
          signer: readOnlySigner,
          args: {
            appId: appId.toString(),
            version: versionId.toString(),
          },
        });
        setBlockchainAppVersion(appVersionResult.appVersion);
        setBlockchainAppError(null);
      } catch (error: any) {
        if (
          error?.message?.includes('AppVersionNotRegistered') ||
          error?.message?.includes('AppNotRegistered')
        ) {
          setBlockchainAppVersion(null);
          setBlockchainAppError(null);
        } else {
          setBlockchainAppError(
            error instanceof Error ? error.message : 'Failed to fetch app version data',
          );
          setBlockchainAppVersion(null);
        }
      }

      // Finally, update loading state
      setBlockchainAppLoading(false);
    };

    fetchBlockchainData();
  }, [appId]);

  useAddressCheck(app || null);

  // Loading states first
  if (
    appLoading ||
    versionsLoading ||
    versionLoading ||
    versionToolsLoading ||
    blockchainAppLoading
  )
    return <Loading />;

  // Combined error states
  if (appError) return <StatusMessage message="Failed to load app" type="error" />;
  if (versionsError) return <StatusMessage message="Failed to load app versions" type="error" />;
  if (blockchainAppError)
    return <StatusMessage message="Failed to load blockchain app data" type="error" />;
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
      blockchainApp={blockchainApp}
      blockchainAppVersion={blockchainAppVersion}
    />
  );
}
