import { useState, useEffect, useCallback } from 'react';
import { getAppVersion, AppVersion } from '@lit-protocol/vincent-contracts-sdk';
import { readOnlySigner } from '@/utils/developer-dashboard/readOnlySigner';

export function useBlockchainAppVersionData(
  appId: number | undefined,
  versionId: number | undefined,
) {
  const [blockchainAppVersion, setBlockchainAppVersion] = useState<AppVersion | null>(null);
  const [blockchainAppVersionError, setBlockchainAppVersionError] = useState<string | null>(null);
  const [blockchainAppVersionLoading, setBlockchainAppVersionLoading] = useState(true);

  const fetchBlockchainAppVersionData = useCallback(async () => {
    if (!appId || !versionId) {
      setBlockchainAppVersionError('App ID and Version ID are required');
      setBlockchainAppVersionLoading(false);
      return;
    }

    setBlockchainAppVersionLoading(true);
    setBlockchainAppVersionError(null);

    try {
      const appVersionResult = await getAppVersion({
        signer: readOnlySigner,
        args: {
          appId,
          version: versionId,
        },
      });

      if (appVersionResult === null) {
        // App or version not registered - this is fine
        setBlockchainAppVersion(null);
        setBlockchainAppVersionError(null);
      } else {
        setBlockchainAppVersion(appVersionResult.appVersion);
        setBlockchainAppVersionError(null);
      }
    } catch (error: any) {
      // All errors are real errors in contracts-sdk >= 1.0.0
      setBlockchainAppVersionError(`Failed to fetch app version data: ${error.message}`);
      setBlockchainAppVersion(null);
    } finally {
      setBlockchainAppVersionLoading(false);
    }
  }, [appId, versionId]);

  useEffect(() => {
    fetchBlockchainAppVersionData();
  }, [appId, versionId, fetchBlockchainAppVersionData]);

  const refetch = useCallback(() => {
    fetchBlockchainAppVersionData();
  }, [fetchBlockchainAppVersionData]);

  return {
    blockchainAppVersion,
    blockchainAppVersionError,
    blockchainAppVersionLoading,
    refetch,
  };
}
