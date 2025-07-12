import { useState, useEffect, useCallback } from 'react';
import { getAppVersion, getAppById, AppVersion, App } from '@lit-protocol/vincent-contracts-sdk';
import { readOnlySigner } from '@/utils/developer-dashboard/readOnlySigner';

export function useBlockchainAppVersionData(
  appId: string | undefined,
  versionId: string | undefined,
) {
  const [blockchainAppVersion, setBlockchainAppVersion] = useState<AppVersion | null>(null);
  const [blockchainAppVersionError, setBlockchainAppVersionError] = useState<string | null>(null);
  const [blockchainAppVersionLoading, setBlockchainAppVersionLoading] = useState(true);
  const [blockchainAppData, setBlockchainAppData] = useState<App | null>(null);
  const [isAppRegistered, setIsAppRegistered] = useState(false);

  const fetchBlockchainAppVersionData = useCallback(async () => {
    if (!appId || !versionId) return;

    setBlockchainAppVersionLoading(true);
    setBlockchainAppVersionError(null);

    // First, try to fetch the app data to determine registration status
    try {
      await getAppById({
        signer: readOnlySigner,
        args: { appId: appId.toString() },
      });
      setIsAppRegistered(true);
    } catch (error: any) {
      if (error?.message?.includes('AppNotRegistered')) {
        setIsAppRegistered(false);
      } else {
        setBlockchainAppVersionError('Failed to fetch app data');
        setBlockchainAppVersionLoading(false);
        return; // Don't continue if real error
      }
    }

    // Then, try to fetch the app version data
    try {
      const appVersionResult = await getAppVersion({
        signer: readOnlySigner,
        args: {
          appId: appId.toString(),
          version: versionId.toString(),
        },
      });
      setBlockchainAppVersion(appVersionResult.appVersion);
      setBlockchainAppData(appVersionResult.app);
      setBlockchainAppVersionError(null);
    } catch (error: any) {
      if (
        error?.message?.includes('AppVersionNotRegistered') ||
        error?.message?.includes('AppNotRegistered')
      ) {
        setBlockchainAppVersion(null);
        setBlockchainAppData(null);
        setBlockchainAppVersionError(null);
      } else {
        setBlockchainAppVersionError('Failed to fetch app version data');
        setBlockchainAppVersion(null);
        setBlockchainAppData(null);
      }
    } finally {
      setBlockchainAppVersionLoading(false);
    }
  }, [appId, versionId]);

  useEffect(() => {
    if (!appId || !versionId) {
      setBlockchainAppVersion(null);
      setBlockchainAppData(null);
      setBlockchainAppVersionError(null);
      setBlockchainAppVersionLoading(false);
      setIsAppRegistered(false);
      return;
    }

    fetchBlockchainAppVersionData();
  }, [appId, versionId, fetchBlockchainAppVersionData]);

  const refetch = useCallback(() => {
    fetchBlockchainAppVersionData();
  }, [fetchBlockchainAppVersionData]);

  return {
    blockchainAppVersion,
    blockchainAppVersionError,
    blockchainAppVersionLoading,
    blockchainAppData,
    isAppRegistered,
    refetch,
  };
}
