import { useState, useEffect, useCallback } from 'react';
import { getClient, App } from '@lit-protocol/vincent-contracts-sdk';
import { readOnlySigner } from '@/utils/developer-dashboard/readOnlySigner';

export function useBlockchainAppData(appId: number | undefined) {
  const [blockchainAppData, setBlockchainAppData] = useState<App | null>(null);
  const [blockchainAppError, setBlockchainAppError] = useState<string | null>(null);
  const [blockchainAppLoading, setBlockchainAppLoading] = useState(true);

  const fetchBlockchainData = useCallback(async () => {
    if (!appId) {
      setBlockchainAppError('App ID is required');
      setBlockchainAppLoading(false);
      return;
    }

    setBlockchainAppLoading(true);
    setBlockchainAppError(null);

    try {
      const client = getClient({ signer: readOnlySigner });
      const appResult = await client.getAppById({ appId });

      if (appResult === null) {
        // App not published - this is fine
        setBlockchainAppData(null);
        setBlockchainAppError(null);
      } else {
        setBlockchainAppData(appResult);
        setBlockchainAppError(null);
      }
    } catch (error: any) {
      // All errors are real errors in contracts-sdk >= 1.0.0
      setBlockchainAppError(`Failed to fetch on-chain app data: ${error.message}`);
      setBlockchainAppData(null);
    } finally {
      setBlockchainAppLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    fetchBlockchainData();
  }, [appId, fetchBlockchainData]);

  const refetch = useCallback(() => {
    fetchBlockchainData();
  }, [fetchBlockchainData]);

  return {
    blockchainAppData,
    blockchainAppError,
    blockchainAppLoading,
    refetch,
  };
}
