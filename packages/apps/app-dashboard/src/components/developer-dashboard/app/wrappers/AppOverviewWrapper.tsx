import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppDetailsView } from '../views/AppDetailsView';
import Loading from '@/components/layout/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { getAppById, App as ContractApp } from '@lit-protocol/vincent-contracts-sdk';
import { ethers } from 'ethers';
import { LIT_RPC } from '@lit-protocol/constants';

export function AppOverviewWrapper() {
  const { appId } = useParams<{ appId: string }>();

  // States for blockchain app data
  const [blockchainAppData, setBlockchainAppData] = useState<ContractApp | null>(null);
  const [blockchainAppError, setBlockchainAppError] = useState<string | null>(null);
  const [blockchainAppLoading, setBlockchainAppLoading] = useState(true);

  // Fetching
  const {
    data: app,
    isLoading: appLoading,
    isError: appError,
  } = vincentApiClient.useGetAppQuery({ appId: Number(appId) });

  // Setup read-only provider for blockchain calls
  const provider = new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE);
  const readOnlySigner = new ethers.Wallet(ethers.Wallet.createRandom().privateKey, provider);

  useEffect(() => {
    if (!appId) return;

    setBlockchainAppData(null);
    setBlockchainAppLoading(true);
    setBlockchainAppError(null);

    const fetchBlockchainData = async () => {
      try {
        const appResult = await getAppById({
          signer: readOnlySigner,
          args: { appId: appId.toString() },
        });
        setBlockchainAppData(appResult); // Published = true
        setBlockchainAppError(null);
      } catch (error: any) {
        if (error?.message?.includes('AppNotRegistered')) {
          // App not published - this is fine
          setBlockchainAppData(null); // Published = false
          setBlockchainAppError(null);
        } else {
          // Real error
          setBlockchainAppError(
            error instanceof Error ? error.message : 'Failed to fetch app data',
          );
          setBlockchainAppData(null);
        }
      } finally {
        setBlockchainAppLoading(false);
      }
    };

    fetchBlockchainData();
  }, [appId]);

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
    />
  );
}
