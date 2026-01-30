import { useState, useEffect, useCallback } from 'react';
import { getClient, AppVersion, App } from '@lit-protocol/vincent-contracts-sdk';
import { readOnlySigner } from '@/utils/developer-dashboard/readOnlySigner';

export interface BlockchainAppVersionData {
  app: App;
  versions: AppVersion[];
}

export function useBlockchainAppVersions(appId: number | undefined) {
  const [data, setData] = useState<BlockchainAppVersionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVersions = useCallback(async () => {
    if (!appId) {
      setError('App ID is required');
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const client = getClient({ signer: readOnlySigner });

      // First get the app to find out how many versions exist
      const appResult = await client.getAppById({ appId });

      if (appResult === null) {
        setError('App not found on-chain');
        setData(null);
        setIsLoading(false);
        return;
      }

      // Fetch all versions from 1 to latestVersion
      const versionPromises: Promise<{ appVersion: AppVersion } | null>[] = [];
      for (let v = 1; v <= appResult.latestVersion; v++) {
        versionPromises.push(client.getAppVersion({ appId, version: v }));
      }

      const versionResults = await Promise.all(versionPromises);

      // Filter out any nulls and extract the appVersion
      const versions = versionResults
        .filter((result): result is { appVersion: AppVersion } => result !== null)
        .map((result) => result.appVersion);

      setData({
        app: appResult,
        versions,
      });
      setError(null);
    } catch (err: any) {
      setError(`Failed to fetch app versions: ${err.message}`);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  return {
    data,
    error,
    isLoading,
    refetch: fetchVersions,
  };
}
