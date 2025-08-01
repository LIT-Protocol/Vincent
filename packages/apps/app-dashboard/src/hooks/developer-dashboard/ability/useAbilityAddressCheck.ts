import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import useReadAuthInfo from '@/hooks/user-dashboard/useAuthInfo';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';

interface AddressCheckResult {
  isAuthorized: boolean | null; // null = still checking, false = unauthorized, true = authorized
  isChecking: boolean;
}

/**
 * Checks if the user's PKP address is the same as the ability's author address.
 * Returns authorization status and handles redirect for unauthorized access.
 * Fetches the ability data based on the current route.
 */
export function useAbilityAddressCheck(): AddressCheckResult {
  const { packageName } = useParams<{ packageName: string }>();
  const { authInfo, isProcessing: authLoading } = useReadAuthInfo();
  const address = authInfo?.agentPKP?.ethAddress;

  // Fetch ability data
  const {
    data: ability,
    isLoading: abilityLoading,
    isError: abilityError,
  } = vincentApiClient.useGetAbilityQuery(
    { packageName: packageName || '' },
    { skip: !packageName },
  );

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

    // Wait for both auth info and ability data to load
    if (authLoading || abilityLoading) {
      setResult({ isAuthorized: null, isChecking: true });
      return;
    }

    // Check for errors or missing data
    if (abilityError || !ability) {
      setResult({ isAuthorized: false, isChecking: false });
      return;
    }

    // If auth loading is done but no address, user is not authenticated
    if (!address) {
      setResult({ isAuthorized: false, isChecking: false });
      return;
    }

    // IMPORTANT: Ensure we're checking the right ability
    // If the ability data doesn't match the current route ID, wait for correct data
    if (ability?.packageName !== packageName) {
      setResult({ isAuthorized: null, isChecking: true });
      return;
    }

    // Authorization check - both address and ability data are available
    const isAuthorized = ability.authorWalletAddress.toLowerCase() === address.toLowerCase();

    setResult({ isAuthorized, isChecking: false });
  }, [ability, abilityLoading, abilityError, address, packageName, authLoading]);

  return result;
}
