import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

import DashboardScreen from '@/components/app-dashboard/Dashboard';
import ConnectWalletScreen from '@/components/app-dashboard/ConnectWallet';
import Loading from '@/layout/app-dashboard/Loading';
import { vincentApiClient } from '@/components/app-dashboard/mock-forms/vincentApiClient';

function AppHome() {
  const [app, setApp] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedForApps, setHasCheckedForApps] = useState(false);

  const { address, isConnected } = useAccount();

  // Use the API endpoint instead of on-chain
  const {
    data: apiApps,
    error: apiError,
    isLoading: apiIsLoading,
  } = vincentApiClient.useListAppsQuery();

  useEffect(() => {
    async function processApiData() {
      if (!isConnected || !address) {
        console.log('⚠️ Dashboard: Not connected or no address');
        setIsLoading(false);
        setHasCheckedForApps(true);
        return;
      }

      // Don't process data while API is still loading
      if (apiIsLoading) {
        console.log('⏳ Dashboard: API still loading, waiting...');
        return;
      }

      setIsLoading(true);

      try {
        if (apiError) {
          console.error('❌ Dashboard: Error fetching apps from API:', apiError);
          setApp([]);
          setHasCheckedForApps(true);
          return;
        }

        if (apiApps && apiApps.length > 0) {
          console.log('📋 Dashboard: Total apps from API:', apiApps.length);
          console.log('🔍 Dashboard: First app structure:', JSON.stringify(apiApps[0], null, 2));

          // Filter apps by manager address but keep the original API format
          const userApps = apiApps.filter((apiApp: any) => {
            const isUserApp =
              apiApp.managerAddress &&
              apiApp.managerAddress.toLowerCase() === address.toLowerCase();
            console.log(
              `🔎 Dashboard: App ${apiApp.appId} (${apiApp.name}) - Manager: ${apiApp.managerAddress}, Is User App: ${isUserApp}`,
            );
            return isUserApp;
          });

          console.log('✅ Dashboard: Filtered user apps (raw API format):', userApps);
          console.log('📊 Dashboard: User apps count:', userApps.length);

          setApp(userApps);
          console.log('🎉 Dashboard: Apps processed, showing dashboard');
        } else {
          setApp([]);
          console.log('📭 Dashboard: No apps returned from API (apiApps is null/undefined/empty)');
        }
      } catch (error) {
        console.error('💥 Dashboard: Error processing app data:', error);
        setApp([]);
      } finally {
        setIsLoading(false);
        setHasCheckedForApps(true);
        console.log('✅ Dashboard: Loading complete');
      }
    }

    processApiData();
  }, [apiApps, apiError, address, isConnected, apiIsLoading]);

  if (!isConnected) {
    return <ConnectWalletScreen />;
  }

  if (isLoading || !hasCheckedForApps || apiIsLoading) {
    return <Loading />;
  }

  return <DashboardScreen vincentApp={app || []} />;
}

export default AppHome;
