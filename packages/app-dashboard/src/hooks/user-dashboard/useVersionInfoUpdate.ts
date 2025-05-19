import { useEffect, useRef } from 'react';
import { AppView, ContractVersionResult } from '@/types';

/**
 * Hook to handle automatic version info updates when permission status changes.
 * Ensures we fetch the latest version info when a user upgrades to the latest version.
 */
export const useVersionInfoUpdate = (
  permittedVersion: number | null,
  appInfo: AppView | null,
  isLoading: boolean,
  fetchVersionInfo: () => Promise<ContractVersionResult>,
) => {
  const prevPermittedVersionRef = useRef<number | null>(null);
  const hasFetchedForNullVersion = useRef<boolean>(false);
  const isCurrentlyFetching = useRef<boolean>(false);

  useEffect(() => {
    if (!appInfo) return;

    if (prevPermittedVersionRef.current !== permittedVersion) {
      if (permittedVersion === null) {
        hasFetchedForNullVersion.current = false;
      }

      prevPermittedVersionRef.current = permittedVersion;
    }

    if (permittedVersion !== null) return;

    if (!isLoading && !hasFetchedForNullVersion.current && !isCurrentlyFetching.current) {
      hasFetchedForNullVersion.current = true;
      isCurrentlyFetching.current = true;

      // Use an async IIFE to avoid async effect
      (async () => {
        try {
          await fetchVersionInfo();
        } catch (err) {
          console.error('Error fetching version info after upgrade:', err);
        } finally {
          isCurrentlyFetching.current = false;
        }
      })();
    }
  }, [permittedVersion, appInfo, isLoading, fetchVersionInfo]);
};
