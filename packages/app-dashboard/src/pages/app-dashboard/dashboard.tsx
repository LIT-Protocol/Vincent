import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

import DashboardScreen from '@/components/developer/Dashboard';
import { formCompleteVincentAppForDev } from '@/services';
import { AppView } from '@/services/types';
import ConnectWalletScreen from '@/components/developer/ConnectWallet';
import CreateAppScreen from '@/components/developer/CreateApp';
import Loading from '@/components/layout/Loading';

function AppHome() {
  const [hasApp, setHasApp] = useState<boolean>(false);
  const [app, setApp] = useState<AppView[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { address, isConnected } = useAccount();

  useEffect(() => {
    async function checkAndFetchApp() {
      if (!address) return;
      setIsLoading(true);
      try {
        const appData = await formCompleteVincentAppForDev(address);
        const exists = appData && appData.length > 0;

        if (exists) {
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
