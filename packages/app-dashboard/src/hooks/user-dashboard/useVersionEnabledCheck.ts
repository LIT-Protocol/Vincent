import { useState, useEffect } from 'react';
import { getAppViewRegistryContract } from '../../utils/user-dashboard/contracts';
import { useUrlAppId } from './useUrlAppId';

/**
 * Hook to check whether an app version is enabled.
 * Automatically performs the check on mount.
 */
export const useVersionEnabledCheck = ({ versionNumber }: { versionNumber: number }) => {
  const { appId } = useUrlAppId();
  const [isVersionEnabled, setIsVersionEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    const checkVersionEnabled = async () => {
      if (!appId || Number(appId) === 0) {
        return;
      }

      try {
        const contract = getAppViewRegistryContract();
        const [, versionData] = await contract.getAppVersion(Number(appId), versionNumber);
        setIsVersionEnabled(versionData.enabled);
      } catch (err) {
        console.error('Error checking if version is enabled:', err);
        setIsVersionEnabled(null);
      }
    };

    checkVersionEnabled();
  }, [appId, versionNumber]);

  return { isVersionEnabled };
};
