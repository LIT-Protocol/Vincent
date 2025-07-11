import { useState, useEffect, useCallback } from 'react';
import { getAppById, App } from '@lit-protocol/vincent-contracts-sdk';
import { readOnlySigner } from '@/utils/developer-dashboard/readOnlySigner';

export function useBlockchainAppData(appId: string | undefined) {
  const [blockchainAppData, setBlockchainAppData] = useState<App | null>(null);
  const [blockchainAppError, setBlockchainAppError] = useState<string | null>(null);
  const [blockchainAppLoading, setBlockchainAppLoading] = useState(true);

  const fetchBlockchainData = useCallback(async () => {
    if (!appId) return;

    setBlockchainAppLoading(true);
    setBlockchainAppError(null);

    try {
      const appResult = await getAppById({
        signer: readOnlySigner,
        args: { appId: appId.toString() },
      });
      setBlockchainAppData(appResult);
      setBlockchainAppError(null);
    } catch (error: any) {
      if (error?.message?.includes('AppNotRegistered')) {
        // App not published - this is fine
        setBlockchainAppData(null);
        setBlockchainAppError(null);
      } else {
        // Real error
        setBlockchainAppError('Failed to fetch on-chain app data');
        setBlockchainAppData(null);
      }
    } finally {
      setBlockchainAppLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    if (!appId) {
      setBlockchainAppData(null);
      setBlockchainAppError(null);
      setBlockchainAppLoading(false);
      return;
    }

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
