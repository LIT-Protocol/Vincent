import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';

interface AddressCheckResult {
  isAuthorized: boolean | null; // null = still checking, false = unauthorized, true = authorized
  isChecking: boolean;
}

/**
 * Checks if the user's PKP address is the same as the app's manager address.
 * Returns authorization status and handles redirect for unauthorized access.
 * Fetches the app data based on the current route.
 */
export function useAppAddressCheck(): AddressCheckResult {
  const { appId } = useParams<{ appId: string }>();
  const { authInfo, isProcessing: authLoading } = useReadAuthInfo();
  const address = authInfo?.userPKP?.ethAddress;

  // Fetch app data
  const {
    data: app,
    isLoading: appLoading,
    isError: appError,
  } = vincentApiClient.useGetAppQuery({ appId: Number(appId) }, { skip: !appId });

  const [result, setResult] = useState<AddressCheckResult>({
    isAuthorized: null,
    isChecking: true,
  });

  useEffect(() => {
    // If no appId, no authorization needed
    if (!appId) {
      setResult({
        isAuthorized: true,
        isChecking: false,
      });
      return;
    }

    // Wait for both auth info and app data to load
    if (authLoading || appLoading) {
      setResult({ isAuthorized: null, isChecking: true });
      return;
    }

    // Check for errors or missing data
    if (appError || !app) {
      setResult({ isAuthorized: false, isChecking: false });
      return;
    }

    // If auth loading is done but no address, user is not authenticated
    if (!address) {
      setResult({ isAuthorized: false, isChecking: false });
      return;
    }

    // IMPORTANT: Ensure we're checking the right app
    // If the app data doesn't match the current route ID, wait for correct data
    if (app?.appId?.toString() !== appId) {
      setResult({ isAuthorized: null, isChecking: true });
      return;
    }

    // Authorization check - both address and app data are available
    const isAuthorized = app.managerAddress.toLowerCase() === address.toLowerCase();

    setResult({ isAuthorized, isChecking: false });
  }, [app, appLoading, appError, address, appId, authLoading]);

  return result;
}
