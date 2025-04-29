import { useState, useEffect } from 'react';
import { getAppViewRegistryContract } from '../utils/contracts';
import { useUrlAppId } from './useUrlAppId';

/**
 * Hook to check whether an app version is enabled.
 * Automatically performs the check on mount.
 */
export const useVersionEnabledCheck = ({
  versionNumber,
  specificAppId,
}: {
  versionNumber: number;
  specificAppId?: string | number;
}) => {
  const { appId: urlAppId } = useUrlAppId();
  const appId = specificAppId || urlAppId;
  const [isVersionEnabled, setIsVersionEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    // Skip invalid inputs
    if (!appId || !versionNumber || versionNumber === 0) {
      setIsVersionEnabled(null);
      return;
    }

    const checkVersionEnabled = async () => {
      try {
        const contract = getAppViewRegistryContract();
        const [, versionData] = await contract.getAppVersion(Number(appId), versionNumber);
        setIsVersionEnabled(versionData.enabled);
      } catch (error: any) {
        // Handle AppVersionNotRegistered quietly
        if (error?.errorName !== 'AppVersionNotRegistered') {
          console.warn(`Version check error for app ${appId}, version ${versionNumber}`);
        }
        setIsVersionEnabled(null);
      }
    };

    checkVersionEnabled();
  }, [appId, versionNumber]);

  return { isVersionEnabled };
};
