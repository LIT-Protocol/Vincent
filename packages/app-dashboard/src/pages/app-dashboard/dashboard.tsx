import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';

import DashboardScreen from '@/components/app-dashboard/Dashboard';
import ConnectWalletScreen from '@/components/app-dashboard/ConnectWallet';
import Loading from '@/layout/app-dashboard/Loading';
import { vincentApiClient } from '@/components/app-dashboard/mock-forms/vincentApiClient';
import { StatusMessage } from '@/utils/shared/statusMessage';
import type { AppDefRead } from '@/components/app-dashboard/mock-forms/vincentApiClient';

interface UseUserAppsReturn {
  userApps: AppDefRead[];
  isLoading: boolean;
  errorMessage: string;
}

function useUserApps(): UseUserAppsReturn {
  const [userApps, setUserApps] = useState<AppDefRead[]>([]);
  const [hasCheckedForApps, setHasCheckedForApps] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const { address, isConnected } = useAccount();

  const {
    data: apiApps,
    error: apiError,
    isLoading: apiIsLoading,
  } = vincentApiClient.useListAppsQuery();

  const processApiData = useCallback(async () => {
    if (!isConnected || !address) {
      setUserApps([]);
      setHasCheckedForApps(false);
      setErrorMessage('');
      return;
    }

    if (apiIsLoading) {
      return;
    }

    try {
      if (apiError) {
        setErrorMessage('Failed to load your apps. Please try refreshing the page.');
        setHasCheckedForApps(true);
        return;
      }

      if (!apiApps) {
        setUserApps([]);
        setHasCheckedForApps(true);
        return;
      }

      // Filter apps by manager address
      const filteredApps = apiApps.filter((apiApp: AppDefRead) => {
        return apiApp.managerAddress?.toLowerCase() === address.toLowerCase();
      });

      setUserApps(filteredApps);
    } catch (error) {
      setUserApps([]);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while loading your apps.',
      );
    } finally {
      setHasCheckedForApps(true);
    }
  }, [apiApps, apiError, address, isConnected, apiIsLoading]);

  useEffect(() => {
    processApiData();
  }, [processApiData]);

  const isLoading = useMemo(() => {
    if (!isConnected) return false;
    return apiIsLoading || !hasCheckedForApps;
  }, [isConnected, apiIsLoading, hasCheckedForApps]);

  return {
    userApps,
    isLoading,
    errorMessage,
  };
}

function AppHome() {
  const { isConnected } = useAccount();
  const { userApps, isLoading, errorMessage } = useUserApps();

  if (!isConnected) {
    return <ConnectWalletScreen />;
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      {errorMessage && <StatusMessage message={errorMessage} type="error" />}
      <DashboardScreen vincentApp={userApps} />
    </>
  );
}

export default AppHome;
