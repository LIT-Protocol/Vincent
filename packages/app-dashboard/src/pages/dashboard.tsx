import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

import DashboardScreen from '@/components/developer/Dashboard';
import { VincentContracts } from '@/services/contract/contracts';
import ConnectWalletScreen from '@/components/developer/ConnectWallet';
import CreateAppScreen from '@/components/developer/CreateApp';
import Loading from '@/components/layout/Loading';
import getApp from '@/api/app/get';
import { IAppDef } from '@/api/app/types';

function AppHome() {
  const [hasApp, setHasApp] = useState<boolean>(false);
  const [app, setApp] = useState<IAppDef[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { address, isConnected } = useAccount();

  useEffect(() => {
    async function checkAndFetchApp() {
      if (!address) return;
      setIsLoading(true);
      try {
        // Step 1: Get all app IDs associated with the manager address
        const contracts = new VincentContracts('datil');
        const appsWithVersions = await contracts.getAppsByManager(address);

        // Extract app IDs that aren't deleted
        const appIds = appsWithVersions
          .filter((appData: any) => !appData.app.isDeleted)
          .map((appData: any) => parseInt(appData.app.id.toString()));

        // Check if user has any non-deleted apps
        const exists = appIds.length > 0;

        if (exists) {
          // Step 2: Fetch detailed data for each app using the new get route
          const appDataPromises = appIds.map((appId: number) => getApp(appId));
          const appData = await Promise.all(appDataPromises);

          setApp(appData);
          setHasApp(true);
        } else {
          setHasApp(false);
          setApp(null);
        }
      } catch (error) {
        // Check if this is the NoAppsFoundForManager error
        if (
          error instanceof Error &&
          (error.message.includes('NoAppsFoundForManager') ||
            error.message.includes('call revert exception'))
        ) {
          setHasApp(false);
          setApp(null);
        } else {
          // Log other unexpected errors
          console.error('Error fetching app:', error);
          setHasApp(false);
          setApp(null);
        }
      } finally {
        setIsLoading(false);
      }
    }

    if (isConnected) {
      checkAndFetchApp();
    }
  }, [address, isConnected]);

  if (!isConnected) {
    return <ConnectWalletScreen />;
  }

  if (isLoading) {
    return <Loading />;
  }

  return hasApp ? <DashboardScreen vincentApp={app!} /> : <CreateAppScreen />;
}

export default AppHome;
