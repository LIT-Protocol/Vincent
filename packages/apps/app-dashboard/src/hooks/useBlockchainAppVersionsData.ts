import { useState, useEffect, useCallback } from 'react';
import { getClient, AppVersion } from '@lit-protocol/vincent-contracts-sdk';
import { readOnlySigner } from '@/utils/developer-dashboard/readOnlySigner';
import { AppVersion as ApiAppVersion } from '@/types/developer-dashboard/appTypes';

export function useBlockchainAppVersionsData(
  appId: number | undefined,
  versions: ApiAppVersion[] | undefined,
) {
  const [blockchainVersions, setBlockchainVersions] = useState<Record<number, AppVersion | null>>(
    {},
  );
  const [blockchainVersionsError, setBlockchainVersionsError] = useState<string | null>(null);
  const [blockchainVersionsLoading, setBlockchainVersionsLoading] = useState(true);

  const fetchBlockchainVersions = useCallback(async () => {
    if (!appId || !versions) {
      setBlockchainVersionsLoading(false);
      return;
    }

    setBlockchainVersionsLoading(true);
    setBlockchainVersionsError(null);

    try {
      const client = getClient({ signer: readOnlySigner });
      const versionData: Record<number, AppVersion | null> = {};

      for (const version of versions) {
        if (version.isDeleted) continue;

        try {
          const result = await client.getAppVersion({
            appId,
            version: version.version,
          });
          versionData[version.version] = result?.appVersion || null;
        } catch {
          versionData[version.version] = null;
        }
      }

      setBlockchainVersions(versionData);
      setBlockchainVersionsError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setBlockchainVersionsError(`Failed to fetch app versions data: ${message}`);
      setBlockchainVersions({});
    } finally {
      setBlockchainVersionsLoading(false);
    }
  }, [appId, versions]);

  useEffect(() => {
    fetchBlockchainVersions();
  }, [fetchBlockchainVersions]);

  const refetch = useCallback(() => {
    fetchBlockchainVersions();
  }, [fetchBlockchainVersions]);

  return {
    blockchainVersions,
    blockchainVersionsError,
    blockchainVersionsLoading,
    refetch,
  };
}
