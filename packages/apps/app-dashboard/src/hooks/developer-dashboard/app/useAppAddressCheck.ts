import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useAuth } from '@/hooks/developer-dashboard/useAuth';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { readOnlySigner } from '@/utils/developer-dashboard/readOnlySigner';

interface AddressCheckResult {
  isAuthorized: boolean | null; // null = still checking, false = unauthorized, true = authorized
  isChecking: boolean;
}

/**
 * Checks if the user owns the app on-chain (source of truth).
 * Returns authorization status based on blockchain ownership.
 */
export function useAppAddressCheck(): AddressCheckResult {
  const { appId } = useParams<{ appId: string }>();
  const { authAddress: address, isLoading: authLoading } = useAuth();

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

    // Wait for auth to load
    if (authLoading) {
      setResult({ isAuthorized: null, isChecking: true });
      return;
    }

    // If auth loading is done but no address, user is not authenticated
    if (!address) {
      setResult({ isAuthorized: false, isChecking: false });
      return;
    }

    // Check on-chain ownership
    const checkOnChainOwnership = async () => {
      setResult({ isAuthorized: null, isChecking: true });

      try {
        const client = getClient({ signer: readOnlySigner });
        const onChainApp = await client.getAppById({ appId: Number(appId) });

        if (!onChainApp) {
          // App doesn't exist on-chain
          setResult({ isAuthorized: false, isChecking: false });
          return;
        }

        // Check if user owns it on-chain
        const isAuthorized = onChainApp.manager.toLowerCase() === address.toLowerCase();
        setResult({ isAuthorized, isChecking: false });
      } catch (error) {
        console.error('Error checking on-chain app ownership:', error);
        setResult({ isAuthorized: false, isChecking: false });
      }
    };

    checkOnChainOwnership();
  }, [appId, address, authLoading]);

  return result;
}
