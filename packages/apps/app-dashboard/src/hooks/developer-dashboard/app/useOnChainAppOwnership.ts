import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/developer-dashboard/useAuth';
import { getClient, App as ContractApp } from '@lit-protocol/vincent-contracts-sdk';
import { readOnlySigner } from '@/utils/developer-dashboard/readOnlySigner';

interface OnChainOwnershipResult {
  isOwner: boolean | null; // null = still checking, false = not owner, true = is owner
  existsOnChain: boolean | null; // null = still checking, false = doesn't exist, true = exists
  onChainApp: ContractApp | null;
  isChecking: boolean;
  error: Error | null;
}

/**
 * Checks if a user owns an app on-chain by querying the blockchain contracts.
 * This is the source of truth for app ownership.
 */
export function useOnChainAppOwnership(appId: number | undefined): OnChainOwnershipResult {
  const { authAddress: address, isLoading: authLoading } = useAuth();
  const [result, setResult] = useState<OnChainOwnershipResult>({
    isOwner: null,
    existsOnChain: null,
    onChainApp: null,
    isChecking: true,
    error: null,
  });

  useEffect(() => {
    if (!appId) {
      setResult({
        isOwner: false,
        existsOnChain: false,
        onChainApp: null,
        isChecking: false,
        error: null,
      });
      return;
    }

    if (authLoading) {
      setResult((prev) => ({ ...prev, isChecking: true }));
      return;
    }

    if (!address) {
      setResult({
        isOwner: false,
        existsOnChain: null,
        onChainApp: null,
        isChecking: false,
        error: null,
      });
      return;
    }

    const checkOnChainOwnership = async () => {
      setResult((prev) => ({ ...prev, isChecking: true, error: null }));

      try {
        const client = getClient({ signer: readOnlySigner });

        const onChainApp = await client.getAppById({ appId });
        if (!onChainApp) {
          // App doesn't exist on-chain
          setResult({
            isOwner: false,
            existsOnChain: false,
            onChainApp: null,
            isChecking: false,
            error: null,
          });
          return;
        }

        // App exists on-chain, check if user owns it
        const isOwner = onChainApp.manager.toLowerCase() === address.toLowerCase();

        setResult({
          isOwner,
          existsOnChain: true,
          onChainApp,
          isChecking: false,
          error: null,
        });
      } catch (err) {
        console.error('[useOnChainAppOwnership] Error checking on-chain ownership:', err);
        setResult({
          isOwner: false,
          existsOnChain: null,
          onChainApp: null,
          isChecking: false,
          error: err as Error,
        });
      }
    };

    checkOnChainOwnership();
  }, [appId, address, authLoading]);

  return result;
}
