import { useState, useEffect, useCallback, useRef } from 'react';
import { getClient, App } from '@lit-protocol/vincent-contracts-sdk';
import { readOnlySigner } from '@/utils/developer-dashboard/readOnlySigner';

export function useBlockchainAppData(appId: number | undefined) {
  const [blockchainAppData, setBlockchainAppData] = useState<App | null>(null);
  const [blockchainAppError, setBlockchainAppError] = useState<string | null>(null);
  const [blockchainAppLoading, setBlockchainAppLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  const fetchBlockchainData = useCallback(
    async (isRefetch = false) => {
      if (!appId) {
        setBlockchainAppError('App ID is required');
        setBlockchainAppLoading(false);
        return;
      }

      // Only show loading spinner on initial load, not on refetch
      if (!isRefetch) {
        setBlockchainAppLoading(true);
      }
      setBlockchainAppError(null);

      try {
        const client = getClient({ signer: readOnlySigner });
        const appResult = await client.getAppById({ appId });

        if (appResult === null) {
          // App not published - this is fine
          setBlockchainAppData(null);
          setBlockchainAppError(null);
        } else {
          // Create new object/array references to ensure React detects the change
          const freshData = {
            ...appResult,
            delegateeAddresses: [...(appResult.delegateeAddresses || [])],
          };
          setBlockchainAppData(freshData);
          setBlockchainAppError(null);
        }
      } catch (error: any) {
        // All errors are real errors in contracts-sdk >= 1.0.0
        setBlockchainAppError(`Failed to fetch on-chain app data: ${error.message}`);
        setBlockchainAppData(null);
      } finally {
        setBlockchainAppLoading(false);
        hasLoadedOnce.current = true;
      }
    },
    [appId],
  );

  useEffect(() => {
    fetchBlockchainData(false);
  }, [appId, fetchBlockchainData]);

  const refetch = useCallback(async () => {
    await fetchBlockchainData(true);
  }, [fetchBlockchainData]);

  return {
    blockchainAppData,
    blockchainAppError,
    blockchainAppLoading,
    refetch,
  };
}
