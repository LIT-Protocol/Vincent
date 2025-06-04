import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

import DashboardScreen from '@/components/app-dashboard/Dashboard';
import ConnectWalletScreen from '@/components/app-dashboard/ConnectWallet';
import CreateAppScreen from '@/components/app-dashboard/CreateApp';
import Loading from '@/layout/app-dashboard/Loading';
import { vincentApiClient } from '@/components/app-dashboard/mock-forms/vincentApiClient';

function AppHome() {
  const [hasApp, setHasApp] = useState<boolean>(false);
  const [app, setApp] = useState<any[] | null>(null); // Use any[] instead of AppView[] for API data
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedForApps, setHasCheckedForApps] = useState(false); // Track if we've checked for apps

  const { address, isConnected } = useAccount();

  // Use the API endpoint instead of on-chain
  const {
    data: apiApps,
    error: apiError,
    isLoading: apiIsLoading,
    isFetching,
  } = vincentApiClient.useListAppsQuery();

  console.log('🚀 Dashboard: API Hook Status:');
  console.log('  - isLoading:', apiIsLoading);
  console.log('  - isFetching:', isFetching);
  console.log('  - error:', apiError);
  console.log('  - data:', apiApps);

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
        console.log('🔍 Dashboard: Processing API data...');
        console.log('📱 Dashboard: Connected address:', address);
        console.log('📊 Dashboard: Raw API apps data (type):', typeof apiApps);
        console.log('📊 Dashboard: Raw API apps data (Array.isArray):', Array.isArray(apiApps));
        console.log('📊 Dashboard: Raw API apps data (length):', apiApps?.length);
        console.log('📊 Dashboard: Raw API apps data (full):', JSON.stringify(apiApps, null, 2));
        console.log('❌ Dashboard: API error:', apiError);

        if (apiError) {
          console.error('❌ Dashboard: Error fetching apps from API:', apiError);
          setHasApp(false);
          setApp(null);
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

          if (userApps.length > 0) {
            setApp(userApps);
            setHasApp(true);
            console.log('🎉 Dashboard: User has apps, showing dashboard');
          } else {
            setHasApp(false);
            setApp(null);
            console.log('📭 Dashboard: No apps found for user');
          }
        } else {
          setHasApp(false);
          setApp(null);
          console.log('📭 Dashboard: No apps returned from API (apiApps is null/undefined/empty)');
        }
      } catch (error) {
        console.error('💥 Dashboard: Error processing app data:', error);
        setHasApp(false);
        setApp(null);
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

  return hasApp ? <DashboardScreen vincentApp={app!} /> : <CreateAppScreen />;
}

export default AppHome;
