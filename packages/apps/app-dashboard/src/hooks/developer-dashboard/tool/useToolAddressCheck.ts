import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';

interface AddressCheckResult {
  isAuthorized: boolean | null; // null = still checking, false = unauthorized, true = authorized
  isChecking: boolean;
}

/**
 * Checks if the user's PKP address is the same as the tool's author address.
 * Returns authorization status and handles redirect for unauthorized access.
 * Fetches the tool data based on the current route.
 */
export function useToolAddressCheck(): AddressCheckResult {
  const { packageName } = useParams<{ packageName: string }>();
  const { authInfo, isProcessing: authLoading } = useReadAuthInfo();
  const address = authInfo?.agentPKP?.ethAddress;

  // Fetch tool data
  const {
    data: tool,
    isLoading: toolLoading,
    isError: toolError,
  } = vincentApiClient.useGetToolQuery({ packageName: packageName || '' }, { skip: !packageName });

  const [result, setResult] = useState<AddressCheckResult>({
    isAuthorized: null,
    isChecking: true,
  });

  useEffect(() => {
    // If no packageName, no authorization needed
    if (!packageName) {
      setResult({ isAuthorized: true, isChecking: false });
      return;
    }

    // Wait for both auth info and tool data to load
    if (authLoading || toolLoading) {
      setResult({ isAuthorized: null, isChecking: true });
      return;
    }

    // Check for errors or missing data
    if (toolError || !tool) {
      setResult({ isAuthorized: false, isChecking: false });
      return;
    }

    // If auth loading is done but no address, user is not authenticated
    if (!address) {
      setResult({ isAuthorized: false, isChecking: false });
      return;
    }

    // IMPORTANT: Ensure we're checking the right tool
    // If the tool data doesn't match the current route ID, wait for correct data
    if (tool?.packageName !== packageName) {
      setResult({ isAuthorized: null, isChecking: true });
      return;
    }

    // Authorization check - both address and tool data are available
    const isAuthorized = tool.authorWalletAddress.toLowerCase() === address.toLowerCase();

    setResult({ isAuthorized, isChecking: false });
  }, [tool, toolLoading, toolError, address, packageName, authLoading]);

  return result;
}
